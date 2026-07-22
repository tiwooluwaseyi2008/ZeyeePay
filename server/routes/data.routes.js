const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, dataPurchaseRules } = require('../middleware/validate');
const ServicePrice = require('../models/ServicePrice');
const dataPurchaseService = require('../services/DataPurchaseService');
const transactionService = require('../services/TransactionService');

// Get available services
router.get('/services', protect, async (req, res) => {
  try {
    const { type, network } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    if (network) query.network = network;
    
    const services = await ServicePrice.find(query).sort({ network: 1, category: 1, price: 1 });
    
    const grouped = {};
    services.forEach(s => {
      const cat = s.category || 'monthly';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    const networks = [...new Set(services.map(s => s.network))];

    res.json({ success: true, data: { services, grouped, networks } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Purchase data WITH VALIDATION
router.post('/purchase', protect, validate(dataPurchaseRules), async (req, res) => {
  try {
    const result = await dataPurchaseService.purchase({
      userId: req.user.id,
      phone: req.body.phone,
      network: req.body.network,
      planId: req.body.planId
    });

    res.json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.message.includes('Invalid') ? 400 : 
                       error.message.includes('Insufficient') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// Get user transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await transactionService.getUserTransactions(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;