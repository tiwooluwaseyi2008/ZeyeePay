const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// Get transaction stats
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySpending, monthlySpending, totalTransactions, referralEarnings] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: req.user._id, status: 'successful', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: req.user._id, status: 'successful', createdAt: { $gte: firstOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({ user: req.user._id }),
      Transaction.aggregate([
        { $match: { user: req.user._id, transactionType: 'referral_earning', status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        todaySpending: todaySpending[0]?.total || 0,
        monthlySpending: monthlySpending[0]?.total || 0,
        totalTransactions,
        referralEarnings: referralEarnings[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recent transactions
router.get('/recent', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all transactions
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;