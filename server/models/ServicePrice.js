const mongoose = require('mongoose');

const servicePriceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['data', 'airtime', 'tv', 'electricity'],
    required: true
  },
  network: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'monthly'
  },
  planName: {
    type: String,
    required: true
  },
  planCode: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  validity: {
    type: String,
    default: '30 Days'
  },
  discount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  description: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServicePrice', servicePriceSchema);