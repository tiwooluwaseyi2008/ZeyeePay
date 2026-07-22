const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const FundingRequest = require('../models/FundingRequest');
const crypto = require('crypto');
const sendNotification = require('../utils/sendNotification');
const { validate, walletFundingRules } = require('../middleware/validate');

const PAYMENT_LINK = process.env.FLUTTERWAVE_PAYMENT_LINK || 'https://flutterwave.com/pay/ifcvkq6ojj6w';

// Generate unique reference
function generateReference() {
  return 'PS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Initiate funding - Returns payment link
router.post('/fund', protect, validate(walletFundingRules), async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum funding amount is ₦100' 
      });
    }

    const reference = generateReference();

    // Create funding request
    await FundingRequest.create({
      user: req.user.id,
      amount: Number(amount),
      reference,
      paymentMethod: 'flutterwave_link'
    });

    res.json({ 
      success: true, 
      data: { 
        reference,
        amount: Number(amount),
        paymentLink: PAYMENT_LINK,
        message: 'Click the payment link to complete your funding. Use the reference in the payment description.',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Fund wallet error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User confirms they've paid
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    const { reference } = req.body;

    console.log('Confirm payment - Reference:', reference, 'User:', req.user.id);

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    const existingRequest = await FundingRequest.findOne({ 
      reference, 
      user: req.user.id
    });

    if (!existingRequest) {
      return res.status(404).json({ success: false, message: 'Funding request not found.' });
    }

    if (existingRequest.status !== 'pending') {
      return res.json({ 
        success: true, 
        message: existingRequest.status === 'approved' 
          ? 'Your payment has been verified and wallet credited!' 
          : 'This request has already been processed.',
        data: { reference, status: existingRequest.status }
      });
    }

    // Check expiry
    if (existingRequest.expiresAt && existingRequest.expiresAt < new Date()) {
      existingRequest.status = 'rejected';
      await existingRequest.save();
      return res.status(400).json({ success: false, message: 'This funding request has expired.' });
    }

    // Notify admin
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        sendNotification.paymentConfirmationReceived(existingRequest, user);
        sendNotification.newFundingRequest(existingRequest, user);
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    res.json({ 
      success: true, 
      message: 'Payment confirmation received. Your wallet will be credited once payment is verified.',
      data: { reference, status: 'pending' }
    });
  } catch (error) {
    console.error('Confirm payment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's funding requests
router.get('/funding-requests', protect, async (req, res) => {
  try {
    const requests = await FundingRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get balance
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: { balance: user.walletBalance } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;