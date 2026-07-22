const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// ==========================================
// RATE LIMITING
// ==========================================

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  }
});

// Strict rate limiter for auth routes (10 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict limiter for sensitive operations (5 per hour)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many attempts for this operation. Please try again later.'
  }
});

// ==========================================
// HELMET SECURITY HEADERS
// ==========================================

const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL || "http://localhost:3000",
        "https://api.paystack.co",
        "https://www.nellobytesystems.com"
      ],
      frameSrc: ["'self'", "https://checkout.paystack.co"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Enable HSTS (force HTTPS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Control DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },
  
  // Disable IE downloads
  ieNoOpen: true,
  
  // Cross-origin permissions
  crossDomain: false,
  
  // Referrer policy
  referrerPolicy: {
    policy: 'same-origin'
  },
  
  // Permit cross-origin for fonts and images
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// ==========================================
// DATA SANITIZATION
// ==========================================

// Prevent NoSQL injection
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potential NoSQL injection in ${key}`);
  }
});

// ==========================================
// XSS PREVENTION
// ==========================================

const preventXSS = xss();

// ==========================================
// CUSTOM SECURITY HEADERS
// ==========================================

const securityHeaders = (req, res, next) => {
  // Prevent browsers from incorrectly detecting non-scripts
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent reflected XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control what information is sent in referrer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  helmetConfig,
  sanitizeData,
  preventXSS,
  securityHeaders
};