// server/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true });
    await User.collection.createIndex({ referralCode: 1 });
    
    // Transaction indexes
    await Transaction.collection.createIndex({ user: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ paymentReference: 1 });
    await Transaction.collection.createIndex({ status: 1 });
    await Transaction.collection.createIndex({ transactionType: 1 });
    
    // Service Price indexes
    await ServicePrice.collection.createIndex({ service: 1, network: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;