const { body, param, query, validationResult } = require('express-validator');

// ==========================================
// VALIDATION HELPER
// ==========================================

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation failures
    console.warn('Validation failed:', {
      path: req.originalUrl,
      method: req.method,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
      body: req.body,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// ==========================================
// AUTH VALIDATION RULES
// ==========================================

const registerRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Last name can only contain letters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email is too long'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^0[789][01]\d{8}$/).withMessage('Please enter a valid Nigerian phone number (e.g., 08012345678)'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&#^()_+=\-~[\]{}|;:'",.<>\/\\]/).withMessage('Password must contain a special character')
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
];

const resetPasswordRules = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&#^()_+=\-~[\]{}|;:'",.<>\/\\]/).withMessage('Password must contain a special character')
];

// ==========================================
// DATA PURCHASE VALIDATION RULES
// ==========================================

const dataPurchaseRules = [
  body('network')
    .trim()
    .notEmpty().withMessage('Network is required')
    .isIn(['MTN', 'Airtel', 'Glo', '9mobile', 'mtn', 'airtel', 'glo', '9mobile'])
    .withMessage('Network must be MTN, Airtel, Glo, or 9mobile'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^0[789][01]\d{8}$/).withMessage('Invalid Nigerian phone number'),
  
  body('planId')
    .trim()
    .notEmpty().withMessage('Data plan is required')
    .isLength({ max: 100 }).withMessage('Invalid plan ID')
];

// ==========================================
// AIRTIME PURCHASE VALIDATION RULES
// ==========================================

const airtimePurchaseRules = [
  body('network')
    .trim()
    .notEmpty().withMessage('Network is required')
    .isIn(['MTN', 'Airtel', 'Glo', '9mobile', 'mtn', 'airtel', 'glo', '9mobile'])
    .withMessage('Network must be MTN, Airtel, Glo, or 9mobile'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^0[789][01]\d{8}$/).withMessage('Invalid Nigerian phone number'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 50, max: 200000 }).withMessage('Amount must be between ₦50 and ₦200,000')
];

// ==========================================
// TV SUBSCRIPTION VALIDATION RULES
// ==========================================

const tvSubscriptionRules = [
  body('provider')
    .trim()
    .notEmpty().withMessage('TV provider is required')
    .isIn(['DStv', 'GOtv', 'StarTimes', 'dstv', 'gotv', 'startimes'])
    .withMessage('Provider must be DStv, GOtv, or StarTimes'),
  
  body('smartCardNumber')
    .trim()
    .notEmpty().withMessage('Smart card number is required')
    .matches(/^\d{10,16}$/).withMessage('Smart card number must be 10-16 digits'),
  
  body('packageId')
    .trim()
    .notEmpty().withMessage('TV package is required')
];

// ==========================================
// ELECTRICITY VALIDATION RULES
// ==========================================

const electricityVerifyRules = [
  body('meterNumber')
    .trim()
    .notEmpty().withMessage('Meter number is required')
    .matches(/^\d{10,20}$/).withMessage('Meter number must be 10-20 digits'),
  
  body('provider')
    .trim()
    .notEmpty().withMessage('Provider is required')
];

const electricityPaymentRules = [
  body('meterNumber')
    .trim()
    .notEmpty().withMessage('Meter number is required')
    .matches(/^\d{10,20}$/).withMessage('Meter number must be 10-20 digits'),
  
  body('provider')
    .trim()
    .notEmpty().withMessage('Provider is required'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1000, max: 200000 }).withMessage('Amount must be between ₦1,000 and ₦200,000'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^0[789][01]\d{8}$/).withMessage('Invalid Nigerian phone number')
];

// ==========================================
// WALLET FUNDING VALIDATION RULES
// ==========================================

const walletFundingRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 100, max: 1000000 }).withMessage('Amount must be between ₦100 and ₦1,000,000')
];

const confirmPaymentRules = [
  body('reference')
    .trim()
    .notEmpty().withMessage('Reference is required')
    .isLength({ min: 5, max: 50 }).withMessage('Invalid reference')
];

// ==========================================
// PROFILE UPDATE VALIDATION RULES
// ==========================================

const profileUpdateRules = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Last name can only contain letters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^0[789][01]\d{8}$/).withMessage('Invalid Nigerian phone number')
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[@$!%*?&#^()_+=\-~[\]{}|;:'",.<>\/\\]/).withMessage('Password must contain a special character')
];

// ==========================================
// ADMIN VALIDATION RULES
// ==========================================

const creditDebitRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1, max: 10000000 }).withMessage('Amount must be between ₦1 and ₦10,000,000'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description too long')
];

// ==========================================
// SERVICE MANAGEMENT VALIDATION RULES
// ==========================================

const serviceRules = [
  body('type')
    .trim()
    .notEmpty().withMessage('Service type is required')
    .isIn(['data', 'airtime', 'tv', 'electricity']).withMessage('Invalid service type'),
  
  body('network')
    .trim()
    .notEmpty().withMessage('Network/Provider is required'),
  
  body('planName')
    .trim()
    .notEmpty().withMessage('Plan name is required')
    .isLength({ max: 100 }).withMessage('Plan name too long'),
  
  body('planCode')
    .trim()
    .notEmpty().withMessage('Plan code is required')
    .isLength({ max: 50 }).withMessage('Plan code too long'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0, max: 10000000 }).withMessage('Invalid price')
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  dataPurchaseRules,
  airtimePurchaseRules,
  tvSubscriptionRules,
  electricityVerifyRules,
  electricityPaymentRules,
  walletFundingRules,
  confirmPaymentRules,
  profileUpdateRules,
  changePasswordRules,
  creditDebitRules,
  serviceRules
};