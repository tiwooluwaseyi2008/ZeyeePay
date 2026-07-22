const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const electricityService = require('../services/ElectricityService');

// Custom validation for meter verification
const verifyMeterRules = [
  require('express-validator').body('meterNumber')
    .trim()
    .notEmpty().withMessage('Meter number is required')
    .matches(/^\d{10,20}$/).withMessage('Meter number must be 10-20 digits'),
  require('express-validator').body('provider')
    .trim()
    .notEmpty().withMessage('Electricity provider is required')
];

// Custom validation for electricity payment
const payElectricityRules = [
  require('express-validator').body('meterNumber')
    .trim()
    .notEmpty().withMessage('Meter number is required')
    .matches(/^\d{10,20}$/).withMessage('Meter number must be 10-20 digits'),
  require('express-validator').body('provider')
    .trim()
    .notEmpty().withMessage('Provider is required'),
  require('express-validator').body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1000, max: 200000 }).withMessage('Amount must be between ₦1,000 and ₦200,000'),
  require('express-validator').body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^0[789][01]\d{8}$/).withMessage('Invalid Nigerian phone number')
];

const { validate } = require('../middleware/validate');

// Verify meter number - WITH VALIDATION
router.post('/verify', protect, validate(verifyMeterRules), async (req, res) => {
  try {
    const { meterNumber, provider, meterType } = req.body;

    console.log('Verify request:', { meterNumber, provider, meterType });

    const result = await electricityService.verifyMeter({
      meterNumber,
      provider,
      meterType: meterType || 'prepaid'
    });

    res.json({ 
      success: true, 
      data: {
        customerName: result.data.customerName,
        customerAddress: result.data.customerAddress,
        meterNumber: result.data.meterNumber,
        provider: result.data.provider
      }
    });
  } catch (error) {
    console.error('Verify meter error:', error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Meter verification failed' 
    });
  }
});

// Pay electricity bill - WITH VALIDATION
router.post('/pay', protect, validate(payElectricityRules), async (req, res) => {
  try {
    const { meterNumber, provider, amount, phone, meterType } = req.body;

    const result = await electricityService.pay({
      userId: req.user.id,
      meterNumber,
      provider,
      amount: Number(amount),
      phone,
      meterType: meterType || 'prepaid'
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Electricity payment error:', error.message);
    const statusCode = error.message.includes('Invalid') ? 400 : 
                       error.message.includes('Insufficient') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

module.exports = router;