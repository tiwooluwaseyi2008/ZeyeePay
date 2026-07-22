const axios = require('axios');
const crypto = require('crypto');

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
const FLW_ENCRYPTION_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;

class FlutterwaveService {

  async request(endpoint, data = {}, method = 'GET') {
    try {
      const config = {
        method,
        url: `${FLW_BASE_URL}${endpoint}`,
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      };

      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Flutterwave error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Flutterwave request failed');
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body, signature) {
    if (!FLW_SECRET_KEY) return false;
    const hash = crypto.createHmac('sha256', FLW_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');
    return hash === signature;
  }

  // Verify a transaction by reference or transaction ID
  async verifyTransaction(transactionId) {
    try {
      const response = await this.request(`/transactions/${transactionId}/verify`);
      return {
        success: response.status === 'success',
        amount: response.data?.amount,
        currency: response.data?.currency,
        status: response.data?.status,
        reference: response.data?.tx_ref,
        customer: response.data?.customer?.name,
        email: response.data?.customer?.email,
        narration: response.data?.narration
      };
    } catch (error) {
      throw new Error('Transaction verification failed');
    }
  }

  // Get all transactions (for checking payments)
  async getTransactions(params = {}) {
    return this.request('/transactions', params);
  }
}

module.exports = new FlutterwaveService();