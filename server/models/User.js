const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referralCode: String,
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Generate unique userId before saving
userSchema.pre('save', async function(next) {
    if (!this.userId) {
        // Generate PSVTU + year + random 6 digits
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(100000 + Math.random() * 900000);
        this.userId = `PSVTU${year}${random}`;
        
        // Make sure it's unique
        const existingUser = await mongoose.model('User').findOne({ userId: this.userId });
        if (existingUser) {
            // Try again with different random number
            const newRandom = Math.floor(100000 + Math.random() * 900000);
            this.userId = `PSVTU${year}${newRandom}`;
        }
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id, userId: this.userId, role: this.role },
        process.env.JWT_SECRET || 'default_secret_key_12345',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);