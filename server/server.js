const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import security middleware
const { 
  apiLimiter, 
  authLimiter, 
  sensitiveLimiter, 
  helmetConfig, 
  sanitizeData, 
  preventXSS, 
  securityHeaders 
} = require('./middleware/security');

const app = express();

// ==========================================
// 1. TRUST PROXY (Required for rate limiting behind proxy)
// ==========================================
app.set('trust proxy', 1);

// ==========================================
// 2. HELMET - Security headers (FIRST)
// ==========================================
app.use(helmetConfig);

// ==========================================
// 3. CUSTOM SECURITY HEADERS
// ==========================================
app.use(securityHeaders);

// ==========================================
// 4. CORS - Restrict to your domain
// ==========================================
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000'
].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}));

// ==========================================
// 5. RATE LIMITING
// ==========================================
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/wallet/fund', sensitiveLimiter);

// ==========================================
// 6. DATA SANITIZATION & XSS PREVENTION
// ==========================================
app.use(sanitizeData);
app.use(preventXSS);

// ==========================================
// 7. WEBHOOK ROUTES (Before body parsers - NEEDS RAW BODY)
// ==========================================
const paystackWebhook = require('./routes/webhook.paystack');
const iacafeWebhook = require('./routes/webhook.iacafe');
const flutterwaveWebhook = require('./routes/webhook.flutterwave');

// Paystack needs RAW body for signature verification (must be first)
app.use('/api/webhooks/paystack', express.raw({ type: 'application/json' }), paystackWebhook);

// Other webhooks use JSON
app.use('/api/webhooks/flutterwave', express.json({ limit: '100kb' }), flutterwaveWebhook);
app.use('/api/webhooks/iacafe', express.json({ limit: '100kb' }), iacafeWebhook);

// ==========================================
// 8. BODY PARSERS (With size limits)
// ==========================================
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb' 
}));

app.use(cookieParser());

// ==========================================
// 9. LOGGING
// ==========================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
  }));
}

// ==========================================
// 10. REQUEST TIMESTAMP
// ==========================================
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ==========================================
// 11. ROUTES
// ==========================================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const dataRoutes = require('./routes/data.routes');
const airtimeRoutes = require('./routes/airtime.routes');
const tvRoutes = require('./routes/tv.routes');
const electricityRoutes = require('./routes/electricity.routes');
const transactionRoutes = require('./routes/transaction.routes');
const walletRoutes = require('./routes/wallet.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/airtime', airtimeRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ZeyeeSub VTU API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==========================================
// 12. 404 HANDLER
// ==========================================
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// ==========================================
// 13. GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error('ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed'
    });
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code 
    })
  });
});

// ==========================================
// 14. DATABASE CONNECTION & SERVER START
// ==========================================
const startServer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const mongooseOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000
    };

    // ✅ FIXED: Only ONE connect call
    await mongoose.connect(mongoURI, mongooseOptions);
    console.log('✅ MongoDB Connected Successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`✅ ZeyeeSub VTU Server Running`);
      console.log(`✅ Port: ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ API: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ==========================================
// 15. PROCESS EVENT HANDLERS
// ==========================================
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥', err.name, err.message);
  // Don't exit immediately in production - let the process continue
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥', err.name, err.message);
  process.exit(1); // Always exit on uncaught exception
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('💤 MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT RECEIVED. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('💤 MongoDB connection closed.');
    process.exit(0);
  });
});

startServer();

module.exports = app;
