const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FundingRequest = require('../models/FundingRequest');
const WebhookLog = require('../models/WebhookLog');
const sendNotification = require('../utils/sendNotification');

// ==========================================
// WEBHOOK ENDPOINT
// ==========================================
router.post('/', async (req, res) => {
  const webhookId = new mongoose.Types.ObjectId();
  console.log('🔔 Flutterwave webhook received:', webhookId);

  // Always respond 200 immediately
  res.status(200).send('OK');

  // Process asynchronously
  try {
    await processWebhook(req, webhookId);
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    
    try {
      await WebhookLog.create({
        _id: webhookId,
        provider: 'flutterwave',
        event: req.body?.event,
        receivedAt: new Date(),
        payload: req.body,
        headers: { 'verif-hash': req.headers['verif-hash'] },
        processed: false,
        status: 'error',
        error: error.message
      });
    } catch (logError) {
      console.error('Failed to save error log:', logError.message);
    }
  }
});

// ==========================================
// WEBHOOK PROCESSOR
// ==========================================
async function processWebhook(req, webhookId) {
  // ==========================================
  // STEP 1: Verify webhook signature
  // ==========================================
  const secretHash = req.headers['verif-hash'];
  const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  
  if (!expectedHash) {
    console.error('❌ FLUTTERWAVE_WEBHOOK_SECRET not configured');
    await saveWebhookLog(webhookId, req, null, 'error', 'Missing webhook secret');
    return;
  }
  
  if (secretHash !== expectedHash) {
    console.warn('⚠️ Invalid Flutterwave webhook signature');
    await saveWebhookLog(webhookId, req, null, 'failed', 'Invalid signature');
    return;
  }

  // ==========================================
  // STEP 2: Parse and validate event
  // ==========================================
  const event = req.body;
  
  if (!event || !event.data) {
    console.warn('⚠️ Invalid webhook payload structure');
    await saveWebhookLog(webhookId, req, null, 'failed', 'Invalid payload');
    return;
  }

  const data = event.data;

  // Verify payment is successful
  if (event.event !== 'charge.completed' || data.status !== 'successful') {
    await saveWebhookLog(webhookId, req, null, 'ignored', `Event: ${event.event}, Status: ${data.status}`);
    return;
  }

  // Verify currency
  if (data.currency && data.currency !== 'NGN') {
    console.log('❌ Non-NGN payment ignored:', data.currency);
    await saveWebhookLog(webhookId, req, null, 'ignored', `Non-NGN: ${data.currency}`);
    return;
  }

  // Validate amount
  const paidAmount = Number(data.amount);
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    console.log('❌ Invalid payment amount:', data.amount);
    await saveWebhookLog(webhookId, req, null, 'failed', `Invalid amount: ${data.amount}`);
    return;
  }

  const flwId = data.id;
  const narration = data.narration || '';
  
  // ✅ FIX: Use tx_ref for reference matching (Flutterwave's official field)
  const reference = data.tx_ref || null;
  
  // Fallback: Try to extract from narration if tx_ref is missing
  let fallbackRef = null;
  if (!reference) {
    const refMatch = narration.match(/\bPS-[A-Z0-9]+\b/);
    fallbackRef = refMatch ? refMatch[0] : null;
    console.log('⚠️ No tx_ref, using narration fallback:', fallbackRef);
  }

  const matchReference = reference || fallbackRef;

  console.log('💰 Payment received:', { 
    amount: paidAmount, 
    flwId, 
    txRef: reference,
    matchRef: matchReference,
    narration: narration.substring(0, 50) 
  });

  // ==========================================
  // STEP 3: Check for duplicates
  // ==========================================
  const existingTransaction = await Transaction.findOne({
    'metadata.flutterwaveId': flwId,
    status: 'successful'
  });

  if (existingTransaction) {
    console.log('⚠️ Duplicate Flutterwave ID:', flwId);
    await saveWebhookLog(webhookId, req, existingTransaction.paymentReference, 'duplicate', `Duplicate: ${flwId}`);
    return;
  }

  // ==========================================
  // STEP 4: Find matching funding request
  // ==========================================
  let fundingRequest = null;
  let matchMethod = null;

  // Try exact reference match first
  if (matchReference) {
    fundingRequest = await FundingRequest.findOne({ 
      reference: matchReference, 
      status: 'pending' 
    });
    
    if (fundingRequest) {
      matchMethod = 'reference';
      console.log('✅ Matched by reference:', matchReference);
    }
  }

  // Fallback: Match by amount (exact only, no tolerance)
  if (!fundingRequest) {
    const exactMatches = await FundingRequest.find({
      amount: paidAmount,
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (exactMatches.length === 1) {
      fundingRequest = exactMatches[0];
      matchMethod = 'amount_exact';
      console.log('✅ Matched by exact amount:', paidAmount);
    } else if (exactMatches.length > 1) {
      // Multiple exact matches - try to find unprocessed one
      const unprocessed = [];
      for (const fr of exactMatches) {
        if (fr.webhookProcessed) continue;
        const alreadyFunded = await Transaction.findOne({ 
          paymentReference: fr.reference, 
          status: 'successful' 
        });
        if (!alreadyFunded) unprocessed.push(fr);
      }

      if (unprocessed.length === 1) {
        fundingRequest = unprocessed[0];
        matchMethod = 'amount_exact_single_remaining';
        console.log('✅ One unprocessed exact match:', fundingRequest.reference);
      } else if (unprocessed.length > 1) {
        // Ambiguous - mark all for review
        for (const fr of unprocessed) {
          fr.status = 'review';
          fr.reviewReason = `Ambiguous payment: ₦${paidAmount}. ${unprocessed.length} pending requests. Flutterwave ID: ${flwId}`;
          fr.flutterwaveRef = flwId?.toString();
          fr.flutterwaveNarration = narration;
          await fr.save();
        }
        console.log(`⚠️ ${unprocessed.length} ambiguous requests → Review`);
        await saveWebhookLog(webhookId, req, null, 'review', `Ambiguous: ${unprocessed.length} matches`);
        return;
      }
    }

    if (!fundingRequest) {
      console.log('❌ No pending request found for ₦' + paidAmount);
      await saveWebhookLog(webhookId, req, null, 'unmatched', `No match for ₦${paidAmount}`);
      return;
    }
  }

  // ==========================================
  // STEP 5: Validate amount match
  // ==========================================
  const expectedAmount = Number(fundingRequest.amount);

  // Check for overpayment (>10% more)
  if (paidAmount > expectedAmount * 1.1) {
    fundingRequest.status = 'review';
    fundingRequest.reviewReason = `Overpayment: Expected ₦${expectedAmount}, Received ₦${paidAmount}`;
    fundingRequest.flutterwaveRef = flwId?.toString();
    fundingRequest.flutterwaveNarration = narration;
    await fundingRequest.save();
    
    console.log('📋 Overpayment → Review:', fundingRequest.reference);
    await saveWebhookLog(webhookId, req, fundingRequest.reference, 'review', `Overpayment: ₦${paidAmount} vs ₦${expectedAmount}`);
    return;
  }

  // ✅ FIX: Check for underpayment (any amount less than expected)
  if (paidAmount < expectedAmount) {
    fundingRequest.status = 'review';
    fundingRequest.reviewReason = `Underpayment: Expected ₦${expectedAmount}, Received ₦${paidAmount}`;
    fundingRequest.flutterwaveRef = flwId?.toString();
    fundingRequest.flutterwaveNarration = narration;
    await fundingRequest.save();
    
    console.log('📋 Underpayment → Review:', fundingRequest.reference);
    await saveWebhookLog(webhookId, req, fundingRequest.reference, 'review', `Underpayment: ₦${paidAmount} vs ₦${expectedAmount}`);
    return;
  }

  // ==========================================
  // STEP 6: Atomic approval with transaction
  // ==========================================
  let approvedUser = null;
  let approvedRequest = null;
  let oldBalance = 0;
  let newBalance = 0;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Re-fetch within transaction to lock the document
    const lockedRequest = await FundingRequest.findById(fundingRequest._id)
      .session(session)
      .maxTimeMS(5000);

    if (!lockedRequest || lockedRequest.status !== 'pending' || lockedRequest.webhookProcessed) {
      console.log('⚠️ Request no longer pending or already processed');
      await session.abortTransaction();
      await saveWebhookLog(webhookId, req, fundingRequest.reference, 'ignored', 'Already processed');
      return;
    }

    // Double-check for duplicate transaction
    const existingTx = await Transaction.findOne({
      $or: [
        { paymentReference: lockedRequest.reference, status: 'successful' },
        { 'metadata.flutterwaveId': flwId, status: 'successful' }
      ]
    }).session(session);

    if (existingTx) {
      console.log('⚠️ Transaction already exists');
      await session.abortTransaction();
      await saveWebhookLog(webhookId, req, lockedRequest.reference, 'duplicate', 'Transaction exists');
      return;
    }

    // ✅ FIX: Credit the ACTUAL paid amount, not expected amount
    const creditAmount = paidAmount;

    // Atomic wallet update
    const updatedUser = await User.findOneAndUpdate(
      { _id: lockedRequest.user },
      { $inc: { walletBalance: creditAmount } },
      { new: true, session, maxTimeMS: 5000 }
    );

    if (!updatedUser) {
      throw new Error(`User not found: ${lockedRequest.user}`);
    }

    oldBalance = updatedUser.walletBalance - creditAmount;
    newBalance = updatedUser.walletBalance;

    // Update funding request
    lockedRequest.status = 'approved';
    lockedRequest.approvedAt = new Date();
    lockedRequest.flutterwaveRef = flwId?.toString();
    lockedRequest.flutterwaveNarration = narration;
    lockedRequest.webhookProcessed = true;
    lockedRequest.actualPaidAmount = paidAmount; // Track actual amount paid
    await lockedRequest.save({ session });

    // Create transaction record
    const paymentNote = paidAmount !== expectedAmount
      ? ` (Paid ₦${paidAmount})`
      : '';

    await Transaction.create([{
      user: lockedRequest.user,
      transactionType: 'wallet_funding',
      amount: creditAmount, // ✅ Actual paid amount
      totalAmount: creditAmount,
      status: 'successful',
      paymentMethod: 'flutterwave',
      paymentReference: lockedRequest.reference,
      description: `Wallet funding via Flutterwave${paymentNote}`,
      completedAt: new Date(),
      metadata: {
        flutterwaveId: flwId,
        matchedBy: matchMethod,
        paidAmount: paidAmount,
        expectedAmount: expectedAmount,
        currency: data.currency || 'NGN',
        narration,
        txRef: reference
      }
    }], { session });

    await session.commitTransaction();

    approvedUser = updatedUser;
    approvedRequest = lockedRequest;

    console.log(`✅ APPROVED: ₦${creditAmount} for ${approvedUser.email}`);
    console.log(`   Balance: ₦${oldBalance} → ₦${newBalance}`);

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Transaction failed:', error.message);
    throw error; // Re-throw to be caught by outer handler
  } finally {
    await session.endSession();
  }

  // ==========================================
  // STEP 7: Send notification (outside transaction)
  // ==========================================
  if (approvedUser && approvedRequest) {
    try {
      await sendNotification.fundingApproved(approvedRequest, approvedUser);
    } catch (err) {
      console.error('⚠️ Notification failed (non-critical):', err.message);
      // Don't throw - funding is already complete
    }

    await saveWebhookLog(webhookId, req, approvedRequest.reference, 'processed', `₦${paidAmount} credited`);
  }
}

// ==========================================
// HELPER: Save webhook log
// ==========================================
async function saveWebhookLog(webhookId, req, paymentReference, status, error) {
  try {
    await WebhookLog.create({
      _id: webhookId,
      provider: 'flutterwave',
      event: req.body?.event,
      receivedAt: new Date(),
      payload: req.body,
      headers: { 'verif-hash': req.headers['verif-hash'] },
      processed: status === 'processed',
      paymentReference,
      flutterwaveId: req.body?.data?.id,
      amount: req.body?.data?.amount ? Number(req.body.data.amount) : null,
      status,
      error
    });
  } catch (logError) {
    console.error('Failed to save webhook log:', logError.message);
  }
}

module.exports = router;