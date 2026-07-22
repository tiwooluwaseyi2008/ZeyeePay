const axios = require('axios');
const BaseProvider = require('./BaseProvider');

class CheapDataHubProvider extends BaseProvider {
  constructor() {
    super({
      baseURL: process.env.CHEAPDATAHUB_BASE_URL || 'https://www.cheapdatahub.ng/api/v1/resellers',
      apiKey: process.env.CHEAPDATAHUB_API_KEY
    });
    this.name = 'CheapDataHub';
  }

  async request(endpoint, data = {}, method = 'POST') {
    try {
      const config = {
        method,
        url: `${this.config.baseURL}/${endpoint}/`,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`CheapDataHub [${endpoint}] error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'CheapDataHub request failed');
    }
  }

  // Verify smart card (Cable TV)
  async verifySmartCard(smartCardNumber, provider) {
    try {
      // CheapDataHub - verify customer endpoint
      const response = await this.request('cable/verify', {
        provider: provider.toLowerCase(),
        cardnumber: smartCardNumber
      });

      return {
        customerName: response.data?.name || response.customer_name || 'Customer',
        customerId: response.data?.customer_id || smartCardNumber,
        provider,
        smartCardNumber
      };
    } catch (error) {
      console.error('CheapDataHub verify smart card error:', error.message);
      throw new Error(error.message || 'Smart card verification failed');
    }
  }

  // Subscribe TV
  async subscribeTV({ smartCardNumber, provider, packageCode }) {
    try {
      const response = await this.request('cable/purchase', {
        plan_id: packageCode,
        cardnumber: smartCardNumber,
        phone: '08000000000'
      });

      return {
        success: response.status === 'true',
        reference: response.reference || response.transaction_id,
        message: response.message || 'Cable subscription completed'
      };
    } catch (error) {
      throw new Error(error.message || 'TV subscription failed');
    }
  }

  // Get TV packages
  async getTVPackages(provider) {
    try {
      const response = await this.request('cable/plans', {
        provider: provider.toLowerCase()
      });

      const plans = response.data || response.plans || [];
      return plans.map(pkg => ({
        variation_code: pkg.id || pkg.plan_id,
        name: pkg.name || pkg.plan_name,
        variation_amount: pkg.price || pkg.amount,
        description: pkg.description || ''
      }));
    } catch (error) {
      console.error('Get TV packages error:', error.message);
      return [];
    }
  }

  // Buy data
  async buyData({ phone, network, planCode }) {
    try {
      const response = await this.request('data/purchase', {
        bundle_id: planCode,
        phone_number: phone
      });

      return {
        success: response.status === 'true',
        reference: response.reference || response.transaction_id,
        message: response.message || 'Data purchase completed'
      };
    } catch (error) {
      throw new Error(error.message || 'Data purchase failed');
    }
  }

  // Buy airtime
  async buyAirtime({ phone, network, amount }) {
    try {
      const providerIds = { mtn: 1, airtel: 2, glo: 3, '9mobile': 4 };
      
      const response = await this.request('airtime/purchase', {
        provider_id: providerIds[network.toLowerCase()] || 1,
        phone_number: phone,
        amount: amount
      });

      return {
        success: response.status === 'true',
        reference: response.reference || response.transaction_id,
        message: response.message || 'Airtime purchase completed'
      };
    } catch (error) {
      throw new Error(error.message || 'Airtime purchase failed');
    }
  }

  // Pay electricity
  async payElectricity({ meterNumber, provider, amount, phone }) {
    try {
      const response = await this.request('electricity/purchase', {
        disco_id: provider,
        meter_number: meterNumber,
        amount: amount,
        meter_type: 'prepaid',
        phone: phone
      });

      return {
        success: response.status === 'true',
        reference: response.reference || response.transaction_id,
        token: response.data?.token,
        units: response.data?.units,
        message: response.message || 'Electricity payment completed'
      };
    } catch (error) {
      throw new Error(error.message || 'Electricity payment failed');
    }
  }

  // Verify meter
  async verifyMeter(meterNumber, provider) {
    try {
      const response = await this.request('electricity/verify', {
        disco_id: provider,
        meter_number: meterNumber,
        meter_type: 'prepaid'
      });

      return {
        customerName: response.data?.name || response.customer_name || 'Customer',
        address: response.data?.address || '',
        meterNumber,
        provider
      };
    } catch (error) {
      throw new Error(error.message || 'Meter verification failed');
    }
  }

  // Verify transaction
  async verifyTransaction(reference) {
    try {
      const response = await this.request(`transactions/${reference}`, {}, 'GET');
      return {
        success: response.status === 'true',
        status: response.data?.status || 'unknown',
        message: response.message
      };
    } catch (error) {
      throw new Error(error.message || 'Transaction verification failed');
    }
  }

  // Get data plans
  async getDataPlans(network) {
    try {
      const response = await this.request('data/plans', {
        network: network.toLowerCase()
      });

      return response.data || response.plans || [];
    } catch (error) {
      return [];
    }
  }

  // Check wallet balance
  async checkBalance() {
    try {
      const response = await this.request('wallet/balance', {}, 'GET');
      return {
        balance: response.data?.balance || 0,
        status: 'active'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = CheapDataHubProvider;