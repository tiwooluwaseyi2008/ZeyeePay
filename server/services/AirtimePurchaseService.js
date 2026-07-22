const mongoose = require('mongoose');
const walletService = require('./WalletService');
const transactionService = require('./TransactionService');
const vtuProvider = require('./VtuProviderManager');

const VALID_NETWORKS = ['MTN', 'AIRTEL', 'GLO', '9MOBILE', 'mtn', 'airtel', 'glo', '9mobile'];
const PHONE_REGEX = /^0[789][01]\d{8}$/;

class AirtimePurchaseService {

  validate({ phone, network, amount }) {
    if (!phone || !PHONE_REGEX.test(phone)) {
      throw new Error('Invalid phone number');
    }
    if (!network || !VALID_NETWORKS.includes(network)) {
      throw new Error('Invalid network');
    }
    if (!amount || amount < 50 || amount > 50000) {
      throw new Error('Amount must be between ₦50 and ₦50,000');
    }
  }

  async purchase({ userId, phone, network, amount }) {
    this.validate({ phone, network, amount });

    const session = await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(async () => {
        await walletService.debit({
          userId,
          amount: Number(amount),
          description: `Airtime: ₦${amount} for ${phone}`,
          session
        });

        transaction = await transactionService.create({
          userId,
          type: 'airtime_purchase',
          amount: Number(amount),
          service: network.toLowerCase(),
          metadata: { phone, network, amount },
          session
        });
      });

      try {
        const result = await this.callProviderWithTimeout({ phone, network, amount });

        if (result.success) {
          await transactionService.markSuccessful(transaction._id, {
            externalReference: result.reference,
            metadata: result
          });

          const balance = await walletService.getBalance(userId);
          return {
            success: true,
            message: 'Airtime purchase successful!',
            data: {
              reference: transaction.paymentReference,
              walletBalance: balance,
              amount: Number(amount),
              phone
            }
          };
        } else {
          throw new Error(result.message || 'Provider failed');
        }
      } catch (providerError) {
        await this.refund({ userId, amount, transactionId: transaction._id, error: providerError.message });
        throw new Error(providerError.message || 'Airtime purchase failed. Refunded.');
      }

    } finally {
      await session.endSession();
    }
  }

  async refund({ userId, amount, transactionId, error }) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await walletService.credit({ userId, amount, description: 'Refund: Airtime failed', session });
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
    return Promise.race([vtuProvider.buyAirtime(params), timeoutPromise]);
  }
}

module.exports = new AirtimePurchaseService();