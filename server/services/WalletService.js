const mongoose = require('mongoose');
const User = require('../models/User');

class WalletService {
  
  /**
   * Debit wallet - Atomic operation
   * Returns updated user or throws error
   */
  async debit({ userId, amount, description, session }) {
    const options = session ? { session } : {};
    
    // Atomic debit with balance check
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        walletBalance: { $gte: amount }  // Only debit if sufficient balance
      },
      {
        $inc: { walletBalance: -amount }  // Atomic increment
      },
      {
        new: true,
        ...options
      }
    );

    if (!user) {
      throw new Error('Insufficient wallet balance');
    }

    console.log(`💰 Debited ₦${amount} from ${user.email}. Balance: ₦${user.walletBalance}`);
    return user;
  }

  /**
   * Credit wallet - Atomic operation
   */
  async credit({ userId, amount, description, session }) {
    const options = session ? { session } : {};
    
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { walletBalance: amount }  // Atomic increment
      },
      {
        new: true,
        ...options
      }
    );

    if (!user) {
      throw new Error('User not found');
    }

    console.log(`💰 Credited ₦${amount} to ${user.email}. Balance: ₦${user.walletBalance}`);
    return user;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId) {
    const user = await User.findById(userId).select('walletBalance');
    return user?.walletBalance || 0;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId, amount) {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }
}

// Singleton
module.exports = new WalletService();