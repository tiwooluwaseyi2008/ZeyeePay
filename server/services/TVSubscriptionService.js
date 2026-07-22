const mongoose = require('mongoose');
const walletService = require('./WalletService');
const transactionService = require('./TransactionService');
const vtuProvider = require('./VtuProviderManager');
const ServicePrice = require('../models/ServicePrice');

class TVSubscriptionService {

  validate({ smartCardNumber, provider, packageId }) {
    if (!smartCardNumber || smartCardNumber.length < 10) {
      throw new Error('Invalid smart card number. Must be at least 10 digits');
    }
    if (!provider) {
      throw new Error('TV provider is required');
    }
    if (!packageId) {
      throw new Error('Package is required');
    }
  }

    async verifySmartCard(smartCardNumber, provider) {
    if (!smartCardNumber || smartCardNumber.length < 10) {
      throw new Error('Invalid smart card number. Must be at least 10 digits');
    }
    if (!provider) {
      throw new Error('Please select a TV provider');
    }

    console.log(`Verifying smart card: ${smartCardNumber} for ${provider}`);

    try {
      const result = await vtuProvider.verifySmartCard(smartCardNumber, provider);
      
      console.log('Verify result:', JSON.stringify(result));
      
      return {
        customerName: result.customerName || 'Customer',
        customerId: result.customerId || smartCardNumber,
        smartCardNumber,
        provider
      };
    } catch (error) {
      console.error('Smart card verification error:', error.message);
      throw new Error(error.message || 'Verification failed. Please check the smart card number and try again.');
    }
  }

    async getPackages(provider) {
    try {
      console.log(`Fetching TV packages for: ${provider}`);
      const packages = await vtuProvider.getTVPackages(provider);
      console.log(`Got ${packages.length} packages`);
      return packages;
    } catch (error) {
      console.error('Get packages error:', error.message);
      return [];
    }
  }

  async subscribe({ userId, smartCardNumber, provider, packageId }) {
    this.validate({ smartCardNumber, provider, packageId });

    // Find package price from database
    const tvPackage = await ServicePrice.findOne({ 
      planCode: packageId, 
      type: 'tv',
      isActive: true 
    });

    if (!tvPackage) {
      throw new Error('TV package not found');
    }

    const session = await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(async () => {
        await walletService.debit({
          userId,
          amount: tvPackage.price,
          description: `TV: ${tvPackage.network} ${tvPackage.planName}`,
          session
        });

        transaction = await transactionService.create({
          userId,
          type: 'tv_subscription',
          amount: tvPackage.price,
          service: provider.toLowerCase(),
          metadata: { 
            smartCardNumber, 
            provider, 
            packageId, 
            packageName: tvPackage.planName 
          },
          session
        });
      });

      try {
        const result = await this.callProviderWithTimeout({ 
          smartCardNumber, 
          provider, 
          packageCode: packageId 
        });

        if (result.success) {
          await transactionService.markSuccessful(transaction._id, {
            externalReference: result.reference,
            metadata: result
          });

          const balance = await walletService.getBalance(userId);
          return {
            success: true,
            message: 'TV subscription successful!',
            data: {
              reference: transaction.paymentReference,
              walletBalance: balance,
              provider: tvPackage.network,
              package: tvPackage.planName
            }
          };
        } else {
          throw new Error(result.message || 'Provider failed');
        }
      } catch (providerError) {
        await this.refund({ 
          userId, 
          amount: tvPackage.price, 
          transactionId: transaction._id, 
          error: providerError.message 
        });
        throw new Error(providerError.message || 'TV subscription failed. Wallet refunded.');
      }

    } finally {
      await session.endSession();
    }
  }

  async refund({ userId, amount, transactionId, error }) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await walletService.credit({ userId, amount, description: 'Refund: TV failed', session });
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
    return Promise.race([vtuProvider.subscribeTV(params), timeoutPromise]);
  }
}

module.exports = new TVSubscriptionService();