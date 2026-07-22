const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const tvService = require('../services/TVSubscriptionService');

// Custom validation for TV verify (smartCardNumber + provider)
const verifyTVRules = [
  require('express-validator').body('smartCardNumber')
    .trim()
    .notEmpty().withMessage('Smart card number is required')
    .matches(/^\d{10,16}$/).withMessage('Smart card number must be 10-16 digits'),
  require('express-validator').body('provider')
    .trim()
    .notEmpty().withMessage('TV provider is required')
    .isIn(['DStv', 'GOtv', 'StarTimes', 'dstv', 'gotv', 'startimes'])
    .withMessage('Provider must be DStv, GOtv, or StarTimes')
];

// Custom validation for TV subscribe
const subscribeTVRules = [
  require('express-validator').body('smartCardNumber')
    .trim()
    .notEmpty().withMessage('Smart card number is required')
    .matches(/^\d{10,16}$/).withMessage('Smart card number must be 10-16 digits'),
  require('express-validator').body('provider')
    .trim()
    .notEmpty().withMessage('TV provider is required')
    .isIn(['DStv', 'GOtv', 'StarTimes', 'dstv', 'gotv', 'startimes'])
    .withMessage('Provider must be DStv, GOtv, or StarTimes'),
  require('express-validator').body('packageId')
    .trim()
    .notEmpty().withMessage('Package is required')
];

const { validate } = require('../middleware/validate');

// Get TV packages from provider
router.get('/packages/:provider', protect, async (req, res) => {
  try {
    const packages = await tvService.getPackages(req.params.provider);
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify smart card number - WITH VALIDATION
router.post('/verify', protect, validate(verifyTVRules), async (req, res) => {
  try {
    const { smartCardNumber, provider } = req.body;

    console.log('TV verify request:', { smartCardNumber, provider });

    const result = await tvService.verifySmartCard(smartCardNumber, provider);

    res.json({ 
      success: true, 
      data: {
        customerName: result.customerName,
        customerId: result.customerId,
        smartCardNumber: result.smartCardNumber,
        provider: result.provider
      }
    });
  } catch (error) {
    console.error('TV verify error:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Smart card verification failed' });
  }
});

// Subscribe TV - WITH VALIDATION
router.post('/subscribe', protect, validate(subscribeTVRules), async (req, res) => {
  try {
    const { smartCardNumber, provider, packageId } = req.body;

    const result = await tvService.subscribe({
      userId: req.user.id,
      smartCardNumber,
      provider,
      packageId
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('TV subscribe error:', error.message);
    const statusCode = error.message.includes('Invalid') ? 400 : 
                       error.message.includes('Insufficient') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

module.exports = router;