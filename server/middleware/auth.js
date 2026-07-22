const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please login.'
        });
    }

    try {
        // Check if token is blacklisted (user logged out)
        const blacklisted = await TokenBlacklist.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_12345');
        
        // Get user
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Contact support.'
            });
        }

        // Check email verification for transaction routes
        const sensitiveRoutes = [
            '/api/wallet/fund',
            '/api/data/purchase',
            '/api/airtime/purchase',
            '/api/tv/subscribe',
            '/api/electricity/pay'
        ];
        
        const isSensitiveRoute = sensitiveRoutes.some(route => 
            req.originalUrl.startsWith(route)
        );
        
        if (isSensitiveRoute && !req.user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address before making transactions.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};