const mongoose = require('mongoose');

const fundingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  reference: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'review'],
    default: 'pending'
  },
  reviewReason: {
    type: String,
    default: null
  },
  flutterwaveRef: {
    type: String,
    default: null
  },
  flutterwaveNarration: {
    type: String,
    default: null
  },
  webhookProcessed: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FundingRequest', fundingRequestSchema);