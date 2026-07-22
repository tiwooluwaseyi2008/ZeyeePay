// server/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionType: {
        type: String,
        enum: [
            'wallet_funding',
            'data_purchase',
            'airtime_purchase',
            'tv_subscription',
            'electricity_bill',
            'wallet_debit',
            'wallet_credit',
            'refund'
        ],
        required: true
    },
    service: {
    type: String,
    default: null
},
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    fee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'successful', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'paystack', 'flutterwave', 'monnify', 'bank_transfer'],
        default: 'wallet'
    },
    paymentReference: {
    type: String,
    unique: true,
    sparse: true  // Allows null values
    },
    externalReference: String,
    recipientPhone: String,
    recipientMeterNumber: String,
    recipientSmartCard: String,
    dataPlan: String,
    tvPackage: String,
    electricityProvider: String,
    description: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    completedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});


// Add at the bottom of the schema, before module.exports
transactionSchema.index({ paymentReference: 1, transactionType: 1 }, { unique: true, sparse: true });
transactionSchema.index({ 'metadata.flutterwaveId': 1 }, { unique: true, sparse: true });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);