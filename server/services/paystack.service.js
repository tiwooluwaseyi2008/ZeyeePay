const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Fail fast if no secret key
if (!PAYSTACK_SECRET) {
  throw new Error('PAYSTACK_SECRET_KEY is missing. Check your .env file. Get keys at https://dashboard.paystack.com');
}

class PaystackService {
  
  // Generate unique reference
  generateReference() {
    return 'PSVTU_' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Generic request helper - reduces duplication
  async request(method, path, data = null) {
    try {
      const response = await axios({
        method,
        url: `${PAYSTACK_BASE_URL}${path}`,
        data,
        timeout: 15000,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.status) {
        throw new Error(response.data.message || 'Request failed');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Paystack API error');
      }
      throw error;
    }
  }

  // Initialize payment
  async initializePayment(email, amount, metadata = {}) {
    const reference = this.generateReference();
    
    const body = {
      email,
      amount: amount * 100, // Convert to kobo
      reference,
      currency: 'NGN',
      callback_url: `${CLIENT_URL}/dashboard`,
      metadata: {
        ...metadata,
        reference,
        platform: 'PaySwiftVTU',
        timestamp: new Date().toISOString()
      }
    };

    const response = await this.request('post', '/transaction/initialize', body);
    
    return {
      success: true,
      authorization_url: response.data.authorization_url,
      reference: reference,
      access_code: response.data.access_code
    };
  }

  // Verify payment with all fields
  async verifyPayment(reference) {
    const response = await this.request('get', `/transaction/verify/${reference}`);
    const { data } = response;

    return {
      success: data.status === 'success',
      reference: data.reference,
      amount: data.amount / 100, // Convert back to naira
      status: data.status,
      currency: data.currency,
      email: data.customer?.email,
      customerCode: data.customer?.customer_code,
      paidAt: data.paid_at,
      channel: data.channel,
      gatewayResponse: data.gateway_response,
      fees: data.fees ? data.fees / 100 : 0,
      ipAddress: data.ip_address,
      metadata: data.metadata,
      authorization: {
        brand: data.authorization?.brand,
        last4: data.authorization?.last4,
        bank: data.authorization?.bank,
        country: data.authorization?.country_code
      }
    };
  }

    // Verify webhook signature using raw buffer
  verifyWebhookSignature(rawBody, signature) {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET)
      .update(rawBody)  // Hash the raw buffer directly
      .digest('hex');
    
    return hash === signature;
  }

  // List banks (useful for transfers)
  async listBanks() {
    const response = await this.request('get', '/bank?country=nigeria');
    return response.data;
  }

  // Validate bank account
  async validateAccount(accountNumber, bankCode) {
    const response = await this.request('get', 
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return response.data;
  }
}

module.exports = new PaystackService();