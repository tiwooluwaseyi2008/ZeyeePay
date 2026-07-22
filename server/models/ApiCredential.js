// server/models/ApiCredential.js
const mongoose = require('mongoose');

const apiCredentialSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['vtpass', 'easyaccess', 'paystack', 'flutterwave'],
    required: true
  },
  apiKey: {
    type: String,
    required: true,
    encrypted: true
  },
  secretKey: {
    type: String,
    encrypted: true
  },
  publicKey: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTested: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ApiCredential', apiCredentialSchema);