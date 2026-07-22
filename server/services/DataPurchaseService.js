const mongoose = require('mongoose');
const walletService = require('./WalletService');
const transactionService = require('./TransactionService');
const vtuProvider = require('./VtuProviderManager');
const ServicePrice = require('../models/ServicePrice');

const VALID_NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE', 'mtn', 'airtel', 'glo', '9mobile'];
const PHONE_REGEX = /^0[789][01]\d{8}$/;

class DataPurchaseService {

  validate({ phone, network, planId }) {
    if (!phone || !PHONE_REGEX.test(phone)) {
      throw new Error('Invalid phone number');
    }
    if (!network || !VALID_NETWORKS.includes(network)) {
      throw new Error('Invalid network');
    }
    if (!planId) {
      throw new Error('Plan ID is required');
    }
  }

  async purchase({ userId, phone, network, planId }) {
    this.validate({ phone, network, planId });

    const plan = await ServicePrice.findOne({ 
      planCode: planId, 
      type: 'data',
      isActive: true 
    });

    if (!plan) {
      throw new Error('Data plan not found or inactive');
    }

    if (plan.network.toUpperCase() !== network.toUpperCase()) {
      throw new Error(`Plan ${plan.planName} is not available for ${network}`);
    }

    const session = await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(async () => {
        await walletService.debit({
          userId,
          amount: plan.price,
          description: `Data: ${plan.planName} for ${phone}`,
          session
        });

        transaction = await transactionService.create({
          userId,
          type: 'data_purchase',
          amount: plan.price,
          service: network.toLowerCase(),
          metadata: { phone, network, planId, planName: plan.planName },
          session
        });
      });

      // Call provider outside transaction
      try {
        const result = await this.callProviderWithTimeout({ phone, network, planCode: planId });

        // ClubKonnect: ORDER_RECEIVED (100) = SUCCESS
        if (result.success) {
          await transactionService.markSuccessful(transaction._id, {
            externalReference: result.reference,
            metadata: result
          });

          const balance = await walletService.getBalance(userId);
          return {
            success: true,
            message: 'Data purchase successful!',
            data: {
              reference: transaction.paymentReference,
              walletBalance: balance,
              plan: plan.planName,
              phone
            }
          };
        } else {
          throw new Error(result.message || 'Provider failed');
        }
      } catch (providerError) {
        // Refund on provider failure
        await this.refund({ userId, amount: plan.price, transactionId: transaction._id, error: providerError.message });
        throw new Error(providerError.message || 'Data purchase failed. Wallet refunded.');
      }

    } finally {
      await session.endSession();
    }
  }

  async refund({ userId, amount, transactionId, error }) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await walletService.credit({ userId, amount, description: 'Refund: Data failed', session });
        await transactionService.markFailed(transactionId, { error }, session);
      });
    } finally {
      await session.endSession();
    }
  }

  async callProviderWithTimeout(params, timeoutMs = 30000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Provider timeout')), timeoutMs);
    });
    return Promise.race([vtuProvider.buyData(params), timeoutPromise]);
  }
}

module.exports = new DataPurchaseService();