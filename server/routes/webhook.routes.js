const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const paystack = require('../services/paystack');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// IMPORTANT: Signature verification must use RAW body
router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookId = `webhook_${Date.now()}`;
  
  try {
    // 1. VERIFY SIGNATURE FIRST (using raw buffer, NOT JSON.stringify)
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.body)  // req.body is a Buffer - hash it directly
      .digest('hex');

    if (hash !== signature) {
      console.warn(`[${webhookId}] ⚠️ Invalid signature`);
      return res.status(401).send('Invalid signature');
    }

    // 2. Parse JSON AFTER signature verification
    const event = JSON.parse(req.body.toString());
    console.log(`[${webhookId}] 📩 Event received:`, event.event);

    // 3. Only process charge.success events
    if (event.event !== 'charge.success') {
      return res.status(200).send('Event ignored');
    }

    const { reference, amount, customer, metadata } = event.data;
    const userId = metadata?.userId;

    // 4. Find existing pending transaction
    const pendingTx = await Transaction.findOne({ 
      paymentReference: reference 
    });

    if (!pendingTx) {
      console.error(`[${webhookId}] ❌ No pending transaction found for:`, reference);
      return res.status(404).send('Transaction not found');
    }

    // 5. Check if already processed (idempotency)
    if (pendingTx.status === 'successful') {
      console.log(`[${webhookId}] ⚠️ Already processed:`, reference);
      return res.status(200).send('Already processed');
    }

    // 6. Verify with Paystack
    const verification = await paystack.verifyPayment(reference);

    if (!verification.success) {
      pendingTx.status = 'failed';
      pendingTx.metadata = {
        ...pendingTx.metadata,
        gatewayResponse: verification.gatewayResponse,
        webhookFailedAt: new Date()
      };
      await pendingTx.save();
      console.log(`[${webhookId}] ❌ Payment failed:`, verification.gatewayResponse);
      return res.status(200).send('Payment failed');
    }

    // 7. Validate currency
    if (verification.currency !== 'NGN') {
      console.error(`[${webhookId}] ❌ Invalid currency:`, verification.currency);
      return res.status(200).send('Invalid currency');
    }

    // 8. Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`[${webhookId}] ❌ User not found:`, userId);
      return res.status(404).send('User not found');
    }

    // 9. Validate email
    if (verification.email.toLowerCase() !== user.email.toLowerCase()) {
      console.error(`[${webhookId}] ❌ Email mismatch:`, verification.email, user.email);
      return res.status(200).send('Email mismatch');
    }

    // 10. Validate amount
    if (verification.amount !== pendingTx.amount) {
      console.error(`[${webhookId}] ❌ Amount mismatch. Expected: ${pendingTx.amount}, Got: ${verification.amount}`);
      return res.status(200).send('Amount mismatch');
    }

    // 11. ATOMIC DATABASE TRANSACTION
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Atomic wallet increment (prevents race conditions)
        await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: verification.amount } },
          { session }
        );

        // Update transaction - preserve original metadata
        pendingTx.status = 'successful';
        pendingTx.completedAt = new Date();
        pendingTx.metadata = {
          ...pendingTx.metadata,  // Preserve original metadata (plan, phone, network, etc.)
          channel: verification.channel,
          gatewayResponse: verification.gatewayResponse,
          fees: verification.fees,
          paidAt: verification.paidAt,
          authorization: verification.authorization,
          webhookProcessed: true,
          webhookId,
          processedAt: new Date()
        };
        await pendingTx.save({ session });
      });

      await session.endSession();
      
      console.log(`[${webhookId}] ✅ Wallet credited: ${user.email} +₦${verification.amount} (Ref: ${reference})`);
      res.status(200).send('Webhook processed');

    } catch (txError) {
      await session.endSession();
      console.error(`[${webhookId}] ❌ Transaction failed:`, txError);
      
      // Rollback status
      pendingTx.status = 'failed';
      pendingTx.metadata = {
        ...pendingTx.metadata,
        error: txError.message,
        webhookId
      };
      await pendingTx.save();
      
      res.status(500).send('Transaction failed');
    }

  } catch (error) {
    console.error(`[${webhookId}] ❌ Webhook error:`, error);
    res.status(500).send('Webhook error');
  }
});

module.exports = router;