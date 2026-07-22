const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  provider: {
    type: String,
    default: 'flutterwave'
  },
  event: String,
  receivedAt: {
    type: Date,
    default: Date.now
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  headers: {
    type: mongoose.Schema.Types.Mixed
  },
  processed: {
    type: Boolean,
    default: false
  },
  paymentReference: String,
  flutterwaveId: String,
  amount: Number,
  status: {
    type: String,
    enum: ['processed', 'ignored', 'failed', 'duplicate', 'review', 'overpaid'],
    default: 'ignored'
  }
}, { timestamps: true });

webhookLogSchema.index({ receivedAt: -1 });
webhookLogSchema.index({ paymentReference: 1 });
webhookLogSchema.index({ flutterwaveId: 1 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);