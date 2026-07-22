const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const paystack = require('../services/paystack');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// NOTE: express.raw() is applied in server.js before this router
// req.body is already a Buffer here

router.post('/', async (req, res) => {
    const webhookId = `paystack_${Date.now()}`;

    try {
        // 1. Verify signature using RAW buffer
        const signature = req.headers['x-paystack-signature'];
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(req.body)  // Raw buffer
            .digest('hex');

        if (hash !== signature) {
            console.warn(`[${webhookId}] Invalid Paystack signature`);
            return res.status(401).send('Invalid signature');
        }

        // 2. Parse JSON AFTER verification
        const event = JSON.parse(req.body.toString());
        console.log(`[${webhookId}] Paystack event:`, event.event);

        // 3. Only process charge.success
        if (event.event !== 'charge.success') {
            return res.status(200).send('Event ignored');
        }

        const { reference } = event.data;

        // 4. Prevent duplicate processing
        const existingTx = await Transaction.findOne({
            paymentReference: reference,
            status: 'successful'
        });

        if (existingTx) {
            console.log(`[${webhookId}] Already processed:`, reference);
            return res.status(200).send('Already processed');
        }

        // 5. Verify with Paystack
        const verification = await paystack.verifyPayment(reference);

        if (!verification.success) {
            await Transaction.findOneAndUpdate(
                { paymentReference: reference },
                { status: 'failed' }
            );
            return res.status(200).send('Payment failed');
        }

        // 6. Validate currency
        if (verification.currency !== 'NGN') {
            return res.status(200).send('Invalid currency');
        }

        // 7. Find pending transaction
        const pendingTx = await Transaction.findOne({ paymentReference: reference });
        if (!pendingTx) {
            console.error(`[${webhookId}] No pending tx:`, reference);
            return res.status(404).send('Transaction not found');
        }

        // 8. Find user
        const user = await User.findById(pendingTx.user);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // 9. Validate email
        if (verification.email !== user.email) {
            return res.status(200).send('Email mismatch');
        }

        // 10. Validate amount
        if (verification.amount !== pendingTx.amount) {
            return res.status(200).send('Amount mismatch');
        }

        // 11. Atomic wallet credit + transaction update
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                await User.findByIdAndUpdate(
                    user._id,
                    { $inc: { walletBalance: verification.amount } },
                    { session }
                );

                pendingTx.status = 'successful';
                pendingTx.completedAt = new Date();
                pendingTx.metadata = {
                    ...pendingTx.metadata,
                    channel: verification.channel,
                    fees: verification.fees,
                    paidAt: verification.paidAt,
                    webhookId,
                    processedAt: new Date()
                };
                await pendingTx.save({ session });
            });

            console.log(`[${webhookId}] ✅ Credited: ${user.email} +₦${verification.amount}`);
            res.status(200).send('Webhook processed');

        } finally {
            await session.endSession();
        }

    } catch (error) {
        console.error(`[${webhookId}] Error:`, error);
        res.status(500).send('Webhook error');
    }
});

module.exports = router;