const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const iacafe = require('../services/IACafeService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const walletService = require('../services/WalletService');
const transactionService = require('../services/TransactionService');

// IA Cafe sends JSON body (not raw)

router.post('/', async (req, res) => {
    const webhookId = `iacafe_${Date.now()}`;

    try {
        // 1. Verify signature
        const signature = req.headers['x-signature'] || req.headers['x-iacafe-signature'];
        
        if (signature) {
            const isValid = iacafe.verifyWebhookSignature(req.body, signature);
            if (!isValid) {
                console.warn(`[${webhookId}] Invalid IA Cafe signature`);
                return res.status(401).send('Invalid signature');
            }
        }

        const event = req.body;
        console.log(`[${webhookId}] IA Cafe event:`, event.type || event.event);

        // 2. Handle different event types
        switch (event.type || event.event) {

            case 'transaction.completed':
            case 'transaction.status_changed':
            case 'data.purchase.completed':
            case 'airtime.purchase.completed':
                await handleTransactionCompleted(event, webhookId);
                break;

            case 'transaction.failed':
            case 'data.purchase.failed':
            case 'airtime.purchase.failed':
                await handleTransactionFailed(event, webhookId);
                break;

            default:
                console.log(`[${webhookId}] Unhandled event:`, event.type);
        }

        res.status(200).send('Webhook received');

    } catch (error) {
        console.error(`[${webhookId}] Error:`, error);
        res.status(500).send('Webhook error');
    }
});

/**
 * Handle successful VTU transaction
 */
async function handleTransactionCompleted(event, webhookId) {
    const reference = event.reference || event.transaction_id;

    // Prevent duplicate
    const existingTx = await Transaction.findOne({
        $or: [
            { paymentReference: reference },
            { externalReference: reference }
        ],
        status: 'successful'
    });

    if (existingTx) {
        console.log(`[${webhookId}] Already processed:`, reference);
        return;
    }

    // Update transaction to successful
    await Transaction.findOneAndUpdate(
        {
            $or: [
                { paymentReference: reference },
                { externalReference: reference }
            ]
        },
        {
            status: 'successful',
            externalReference: reference,
            completedAt: new Date(),
            $set: {
                'metadata.webhookProcessed': true,
                'metadata.webhookId': webhookId,
                'metadata.processedAt': new Date()
            }
        }
    );

    console.log(`[${webhookId}] ✅ Transaction completed:`, reference);
}

/**
 * Handle failed VTU transaction - Refund wallet
 */
async function handleTransactionFailed(event, webhookId) {
    const reference = event.reference || event.transaction_id;

    const transaction = await Transaction.findOne({
        $or: [
            { paymentReference: reference },
            { externalReference: reference }
        ]
    });

    if (!transaction) {
        console.log(`[${webhookId}] Transaction not found:`, reference);
        return;
    }

    if (transaction.status === 'failed' || transaction.status === 'refunded') {
        console.log(`[${webhookId}] Already handled:`, reference);
        return;
    }

    // Refund wallet
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            await walletService.credit({
                userId: transaction.user,
                amount: transaction.amount,
                description: `Refund: ${transaction.description}`,
                session
            });

            await transactionService.markFailed(transaction._id, {
                error: event.message || 'Provider failed',
                metadata: { webhookId, refunded: true }
            }, session);
        });

        console.log(`[${webhookId}] ✅ Refunded: ${transaction.user} +₦${transaction.amount}`);
    } finally {
        await session.endSession();
    }
}

module.exports = router;