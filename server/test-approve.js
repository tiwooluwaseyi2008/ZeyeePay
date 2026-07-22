require('dotenv').config();
const mongoose = require('mongoose');
const FundingRequest = require('./models/FundingRequest');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the MOST RECENT pending funding request
    const request = await FundingRequest.findOne({ status: 'pending' }).sort({ createdAt: -1 });
    
    if (!request) {
      console.log('No pending funding requests found');
      process.exit(0);
    }

    console.log('Found pending request:');
    console.log('ID:', request._id);
    console.log('User ID:', request.user);
    console.log('Amount:', request.amount);
    console.log('Reference:', request.reference);

    // Find the user
    const user = await User.findById(request.user);
    
    if (!user) {
      console.log('ERROR: User not found. User ID in request:', request.user);
      console.log('This user ID might be invalid. Let me find the correct user...');
      const users = await User.find().limit(3);
      users.forEach(u => console.log('Available user:', u._id, u.firstName, u.email));
      process.exit(1);
    }

    console.log('User found:', user.firstName, user.email);

    // Credit wallet
    const oldBalance = user.walletBalance;
    user.walletBalance += request.amount;
    await user.save();
    console.log('Wallet updated:', oldBalance, '→', user.walletBalance);

    // Update request
    request.status = 'approved';
    request.approvedAt = new Date();
    await request.save();

    // CREATE TRANSACTION
    const transaction = await Transaction.create({
      user: request.user,
      transactionType: 'wallet_funding',
      amount: request.amount,
      totalAmount: request.amount,
      status: 'successful',
      paymentMethod: 'bank_transfer',
      paymentReference: request.reference,
      description: 'Manual bank transfer',
      completedAt: new Date()
    });

    console.log('✅ Transaction created:', transaction._id);

    // Verify
    const count = await Transaction.countDocuments();
    console.log('Total transactions now:', count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
};

test();