const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const TokenBlacklist = require('../models/TokenBlacklist');
const { protect } = require('../middleware/auth');
const { 
  validate, 
  registerRules, 
  loginRules, 
  forgotPasswordRules, 
  resetPasswordRules 
} = require('../middleware/validate');

// ==========================================
// REGISTER
// ==========================================
router.post('/register', validate(registerRules), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or phone already exists' 
      });
    }

    // Create user as unverified
    const user = await User.create({ 
      firstName, lastName, email, phone, password,
      isEmailVerified: false 
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - PaySwift VTU',
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`
      });
    } catch (emailError) {
      console.error('Verification email failed:', emailError.message);
    }

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      token,
      user: {
        id: user._id, firstName, lastName, email, phone,
        walletBalance: user.walletBalance, role: user.role,
        isEmailVerified: false
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post('/login', validate(loginRules), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    const token = user.getSignedJwtToken();
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email, phone: user.phone, walletBalance: user.walletBalance, role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// FORGOT PASSWORD
// ==========================================
router.post('/forgot-password', validate(forgotPasswordRules), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - PaySwift VTU',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 10 minutes.</p>`
      });
    } catch (emailError) {
      console.error('Email failed:', emailError.message);
    }

    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// RESET PASSWORD
// ==========================================
router.put('/reset-password/:token', validate(resetPasswordRules), async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.getSignedJwtToken();
    res.json({ success: true, message: 'Password reset successful', token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// VERIFY EMAIL
// ==========================================
router.get('/verify-email/:token', async (req, res) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification link. Please request a new one.' 
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    const token = user.getSignedJwtToken();

    res.json({ 
      success: true, 
      message: 'Email verified successfully! You can now use all features.',
      token,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone, walletBalance: user.walletBalance,
        role: user.role, isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// RESEND VERIFICATION EMAIL
// ==========================================
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already verified' 
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email - PaySwift VTU',
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`
      });
    } catch (emailError) {
      console.error('Resend email failed:', emailError.message);
    }

    res.json({ success: true, message: 'Verification email resent. Please check your inbox.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==========================================
// LOGOUT
// ==========================================
router.post('/logout', protect, async (req, res) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      await TokenBlacklist.create({ token, user: req.user.id });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;