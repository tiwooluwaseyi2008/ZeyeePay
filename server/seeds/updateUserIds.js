const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const User = require('../models/User');

const updateUserIds = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payswift_vtu';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    // Find all users without userId
    const users = await User.find({ userId: { $exists: false } });
    console.log(`Found ${users.length} users without userId\n`);

    for (const user of users) {
      const year = new Date(user.createdAt || Date.now()).getFullYear().toString().slice(-2);
      const random = Math.floor(100000 + Math.random() * 900000);
      let newUserId = `PSVTU${year}${random}`;
      
      // Check if this userId already exists
      const existing = await User.findOne({ userId: newUserId });
      if (existing) {
        const newRandom = Math.floor(100000 + Math.random() * 900000);
        newUserId = `PSVTU${year}${newRandom}`;
      }
      
      user.userId = newUserId;
      await user.save();
      console.log(`✅ ${user.firstName} ${user.lastName} → ${newUserId}`);
    }

    console.log(`\n✅ Updated ${users.length} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

updateUserIds();