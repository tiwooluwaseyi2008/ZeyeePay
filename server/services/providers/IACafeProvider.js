const axios = require('axios');
const BaseProvider = require('./BaseProvider');

class IACafeProvider extends BaseProvider {
  constructor() {
    super({
      baseURL: process.env.IACAFE_BASE_URL || 'https://iacafeapi.com/api',
      apiKey: process.env.IACAFE_API_KEY,
      secretKey: process.env.IACAFE_SECRET_KEY
    });
    this.name = 'IACafe';
  }

  async request(endpoint, data = {}) {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/${endpoint}`,
        {
          ...data,
          api_key: this.config.apiKey,
          secret_key: this.config.secretKey
        },
        { timeout: 30000 }
      );

      return response.data;
    } catch (error) {
      console.error(`IACafe [${endpoint}] error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'IA Cafe request failed');
    }
  }

  async buyData({ phone, network, planCode }) {
    const response = await this.request('data/purchase', {
      network: this.mapNetwork(network),
      mobile_number: phone,
      plan: planCode,
      Ported_number: true
    });

    return {
      success: response.status === 'success',
      reference: response.reference || response.transaction_id,
      message: response.message || 'Data purchase completed',
      data: response.data
    };
  }

  async buyAirtime({ phone, network, amount }) {
    const response = await this.request('airtime/purchase', {
      network: this.mapNetwork(network),
      mobile_number: phone,
      amount: amount,
      Ported_number: true
    });

    return {
      success: response.status === 'success',
      reference: response.reference || response.transaction_id,
      message: response.message || 'Airtime purchase completed'
    };
  }

  async subscribeTV({ smartCardNumber, provider, packageCode }) {
    const response = await this.request('tv/subscribe', {
      provider: provider.toUpperCase(),
      smartcard_number: smartCardNumber,
      package: packageCode
    });

    return {
      success: response.status === 'success',
      reference: response.reference || response.transaction_id,
      message: response.message || 'TV subscription completed'
    };
  }

  async payElectricity({ meterNumber, provider, amount, phone }) {
    const response = await this.request('electricity/pay', {
      disco: this.mapDisco(provider),
      meter_number: meterNumber,
      amount: amount,
      phone_number: phone,
      meter_type: 'prepaid'
    });

    return {
      success: response.status === 'success',
      reference: response.reference || response.transaction_id,
      token: response.token,
      units: response.units,
      message: response.message || 'Electricity payment completed'
    };
  }

  async verifyTransaction(reference) {
    const response = await this.request('transaction/verify', {
      reference: reference
    });

    return {
      success: response.status === 'success',
      status: response.status,
      message: response.message
    };
  }

  async getDataPlans(network) {
    const response = await this.request('data/plans', {
      network: this.mapNetwork(network)
    });

    return response.plans || response.data || [];
  }

  async getTVPackages(provider) {
    const response = await this.request('tv/packages', {
      provider: provider.toUpperCase()
    });

    return response.packages || response.data || [];
  }

    async verifySmartCard(smartCardNumber, provider) {
    try {
      console.log(`IA Cafe verify TV: card=${smartCardNumber}, provider=${provider}`);
      
      // IA Cafe expects 'customer_id' for cable/TV verification
      const response = await this.request('verify-customer', {
        type: 'cable',
        provider: provider.toLowerCase(),
        customer_id: smartCardNumber
      });

      console.log('IA Cafe TV verify response:', JSON.stringify(response));

      const data = response.data || response;
      
      return {
        customerName: data.name || data.customer_name || 'Customer',
        customerId: data.customer_id || smartCardNumber,
        provider: provider,
        smartCardNumber: smartCardNumber
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || error.message;
      console.error('IA Cafe TV verify failed:', errMsg);
      throw new Error(errMsg);
    }
  }

  async getTVPackages(provider) {
    try {
      // IA Cafe expects 'product=cable' and 'service_id=provider'
      const response = await this.request('variations', {
        product: 'cable',
        service_id: provider.toLowerCase()
      });

      console.log('IA Cafe TV packages:', JSON.stringify(response));

      const packages = (response.data || response.variations || []).map(pkg => ({
        variation_code: pkg.variation_code || pkg.code,
        name: pkg.name || pkg.plan_name,
        variation_amount: pkg.variation_amount || pkg.price || pkg.amount,
        description: pkg.description || ''
      }));

      return packages;
    } catch (error) {
      console.error('IA Cafe get TV packages error:', error.message);
      return [];
    }
  }

  async subscribeTV({ smartCardNumber, provider, packageCode }) {
    try {
      // IA Cafe uses 'cable' endpoint for TV subscription
      const response = await this.request('cable', {
        provider: provider.toLowerCase(),
        customer_id: smartCardNumber,
        variation_id: packageCode,
        quantity: 1
      });

      return {
        success: response.status === 'success' || response.success === true,
        reference: response.reference || response.request_id,
        message: response.message || 'TV subscription completed'
      };
    } catch (error) {
      console.error('IA Cafe TV subscribe error:', error.message);
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'TV subscription failed');
    }
  }

  async verifyMeter(meterNumber, provider) {
    try {
      const mappedDisco = this.mapDisco(provider);
      console.log(`IA Cafe verify: meter=${meterNumber}, disco=${mappedDisco}`);
      
      // IA Cafe requires variation_id for electricity verification
      const response = await this.request('verify-customer', {
        type: 'electricity',
        disco: mappedDisco,
        meter_number: meterNumber,
        variation_id: 'prepaid'  // Add this - required field!
      });

      console.log('IA Cafe verify response:', JSON.stringify(response));

      // Handle different response formats
      const data = response.data || response;
      
      return {
        customerName: data.name || data.customer_name || data.customerName || 'Customer',
        address: data.address || data.customer_address || data.customerAddress || '',
        meterNumber,
        provider
      };
    } catch (error) {
      const errMsg = error.response?.data?.error?.message || 
                     error.response?.data?.message || 
                     error.message;
      console.error('IA Cafe verify failed:', errMsg);
      throw new Error(errMsg);
    }
  }

    async payElectricity({ meterNumber, provider, amount, phone, meterType = 'prepaid' }) {
    try {
      const response = await this.request('electricity', {
        disco: this.mapDisco(provider),
        meter_number: meterNumber,
        amount: amount,
        phone_number: phone,
        variation_id: meterType || 'prepaid'  // Add this
      });

      return {
        success: response.status === 'success' || response.success === true,
        reference: response.reference || response.request_id || response.transaction_id,
        token: response.token || response.purchased_code || response.data?.token,
        units: response.units || response.unit || response.data?.units,
        message: response.message || 'Electricity payment completed'
      };
    } catch (error) {
      console.error('IA Cafe pay electricity error:', error.message);
      throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Payment failed');
    }
  }

  async checkBalance() {
    const response = await this.request('account/balance');
    
    return {
      balance: response.balance || 0,
      status: response.status || 'unknown'
    };
  }

  // Map network names to IA Cafe format
  mapNetwork(network) {
    const networkMap = {
      'mtn': 'MTN',
      'airtel': 'AIRTEL',
      'glo': 'GLO',
      '9mobile': '9MOBILE',
      'etisalat': '9MOBILE'
    };
    return networkMap[network.toLowerCase()] || network.toUpperCase();
  }

    mapDisco(provider) {
    const discoMap = {
      'ikeja electric': 'ikeja',
      'eko electric': 'eko',
      'abuja electric': 'abuja',
      'ibadan electric': 'ibadan',
      'enugu electric': 'enugu',
      'port harcourt electric': 'portharcourt',
      'kano electric': 'kano',
      'kaduna electric': 'kaduna',
      'jos electric': 'jos',
      'IKEDC': 'ikeja',
      'EKEDC': 'eko',
      'AEDC': 'abuja',
      'IBEDC': 'ibadan',
      'EEDC': 'enugu',
      'PHEDC': 'portharcourt',
      'KEDCO': 'kano'
    };
    return discoMap[provider.toLowerCase()] || provider.toLowerCase().replace(/\s+/g, '');
  }
}

module.exports = IACafeProvider;