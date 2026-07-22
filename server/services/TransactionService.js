const crypto = require('crypto');
const Transaction = require('../models/Transaction');

class TransactionService {

  /**
   * Generate unique reference
   */
  generateReference(prefix = 'TXN') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  /**
   * Create pending transaction
   */
  async create({ userId, type, amount, service, metadata = {}, session }) {
    const options = session ? { session } : {};
    const reference = this.generateReference(type.toUpperCase());
    
    const transaction = await Transaction.create([{
      user: userId,
      transactionType: type,
      amount,
      totalAmount: amount,
      status: 'pending',
      service,
      paymentReference: reference,
      metadata: {
        ...metadata,
        createdAt: new Date()
      }
    }], options);

    return transaction[0];
  }

  /**
   * Mark transaction as successful
   */
  async markSuccessful(transactionId, { externalReference, metadata = {}, session } = {}) {
    const options = session ? { session } : {};
    
    return Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: 'successful',
        externalReference,
        completedAt: new Date(),
        $set: { 
          'metadata.providerResponse': metadata,
          'metadata.completedAt': new Date()
        }
      },
      { new: true, ...options }
    );
  }

  /**
   * Mark transaction as failed
   */
  async markFailed(transactionId, { error, metadata = {}, session } = {}) {
    const options = session ? { session } : {};
    
    return Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: 'failed',
        $set: {
          'metadata.error': error?.message || error,
          'metadata.failedAt': new Date(),
          ...metadata
        }
      },
      { new: true, ...options }
    );
  }

  /**
   * Get transaction by reference
   */
  async getByReference(reference) {
    return Transaction.findOne({ paymentReference: reference });
  }

  /**
   * Get user transactions
   */
  async getUserTransactions(userId, { limit = 20, page = 1 } = {}) {
    return Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }
}

module.exports = new TransactionService();