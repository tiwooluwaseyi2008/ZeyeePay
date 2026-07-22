const mongoose = require('mongoose');
const walletService = require('./WalletService');
const transactionService = require('./TransactionService');
const vtuProvider = require('./VtuProviderManager');

class ElectricityService {

  validate({ meterNumber, provider, amount, phone }) {
    if (!meterNumber || meterNumber.length < 10) {
      throw new Error('Invalid meter number');
    }
    if (!provider) {
      throw new Error('Electricity provider is required');
    }
    if (amount && amount < 1000) {
      throw new Error('Minimum amount is ₦1,000');
    }
    if (phone && !/^0[789][01]\d{8}$/.test(phone)) {
      throw new Error('Invalid phone number');
    }
  }

  /**
   * Verify meter number
   */
    async verifyMeter({ meterNumber, provider, meterType = 'prepaid' }) {
    // Validate inputs
    if (!meterNumber || meterNumber.length < 10) {
      throw new Error('Invalid meter number. Must be at least 10 digits');
    }
    if (!provider) {
      throw new Error('Please select an electricity provider');
    }

    console.log(`Verifying meter: ${meterNumber} for ${provider}`);

    try {
      const result = await vtuProvider.verifyMeter(meterNumber, provider);
      
      console.log('Verify result:', JSON.stringify(result));
      
      return {
        success: true,
        data: {
          customerName: result.customerName || 'Customer',
          customerAddress: result.address || 'Address not available',
          meterNumber,
          provider,
          meterType
        }
      };
    } catch (error) {
      console.error('Meter verification error:', error.message);
      throw new Error(error.message || 'Meter verification failed. Please check the meter number.');
    }
  }

  /**
   * Pay electricity bill
   */
  async pay({ userId, meterNumber, provider, amount, phone, meterType = 'prepaid' }) {
    this.validate({ meterNumber, provider, amount, phone });

    const SERVICE_CHARGE = 100;
    const apiAmount = amount - SERVICE_CHARGE; // Amount to send to ClubKonnect
    
    if (apiAmount < 1000) {
      throw new Error('Minimum electricity amount after service charge must be ₦1,000');
    }

    const session = await mongoose.startSession();

    try {
      let transaction;

      await session.withTransaction(async () => {
        await walletService.debit({
          userId,
          amount: Number(amount), // Debit full amount from customer
          description: `Electricity: ${provider} - ${meterNumber} (₦${apiAmount} + ₦${SERVICE_CHARGE} service fee)`,
          session
        });

        transaction = await transactionService.create({
          userId,
          type: 'electricity_bill',
          amount: Number(amount),
          service: provider,
          metadata: { 
            meterNumber, provider, amount, phone, meterType,
            apiAmount, serviceCharge: SERVICE_CHARGE 
          },
          session
        });
      });

      try {
        // Send ONLY the apiAmount to ClubKonnect (without service charge)
        const result = await this.callProviderWithTimeout({ 
          meterNumber, 
          provider, 
          amount: apiAmount, // Send ₦1,000 to ClubKonnect, not ₦1,100
          phone,
          meterType
        });

        if (result.success) {
          await transactionService.markSuccessful(transaction._id, {
            externalReference: result.reference,
            metadata: result
          });

          const balance = await walletService.getBalance(userId);
          return {
            success: true,
            message: 'Electricity payment successful!',
            data: {
              reference: transaction.paymentReference,
              walletBalance: balance,
              token: result.token || 'XXXX-XXXX-XXXX-XXXX',
              units: result.units || 'N/A',
              amount: Number(amount),
              apiAmount: apiAmount,
              serviceCharge: SERVICE_CHARGE,
              meterNumber,
              provider
            }
          };
        } else {
          throw new Error(result.message || 'Provider failed');
        }
      } catch (providerError) {
        await this.refund({ 
          userId, 
          amount: Number(amount), 
          transactionId: transaction._id, 
          error: providerError.message 
        });
        throw new Error(providerError.message || 'Electricity payment failed. Wallet refunded.');
      }

    } finally {
      await session.endSession();
    }
  }

  async refund({ userId, amount, transactionId, error }) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await walletService.credit({ 
          userId, 
          amount, 
          description: 'Refund: Electricity payment failed', 
          session 
        });
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
    return Promise.race([vtuProvider.payElectricity(params), timeoutPromise]);
  }
}

module.exports = new ElectricityService();