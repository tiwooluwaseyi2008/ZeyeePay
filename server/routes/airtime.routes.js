const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, airtimePurchaseRules } = require('../middleware/validate');
const airtimeService = require('../services/AirtimePurchaseService');

router.post('/purchase', protect, validate(airtimePurchaseRules), async (req, res) => {
  try {
    const result = await airtimeService.purchase({
      userId: req.user.id,
      phone: req.body.phone,
      network: req.body.network,
      amount: req.body.amount
    });
    res.json({ success: true, ...result });
  } catch (error) {
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

module.exports = router;