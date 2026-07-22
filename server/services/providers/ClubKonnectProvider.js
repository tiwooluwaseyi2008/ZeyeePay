const axios = require('axios');
const BaseProvider = require('./BaseProvider');

class ClubKonnectProvider extends BaseProvider {
  constructor() {
    super({
      baseURL: process.env.CLUBKONNECT_BASE_URL || 'https://www.nellobytesystems.com',
      userID: process.env.CLUBKONNECT_USER_ID,
      apiKey: process.env.CLUBKONNECT_API_KEY
    });
    this.name = 'ClubKonnect';
  }

  // ClubKonnect uses GET requests with query parameters
  async request(endpoint, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        UserID: this.config.userID,
        APIKey: this.config.apiKey,
        ...params
      });

      const url = `${this.config.baseURL}/${endpoint}?${queryParams.toString()}`;
      console.log('ClubKonnect request:', url.replace(this.config.apiKey, '****'));

      const response = await axios.get(url, { timeout: 30000 });
      const data = response.data;

      // ORDER_RECEIVED (statuscode 100) is SUCCESS
      if (data.statuscode === '100') {
        return { success: true, data };
      }

      // ORDER_COMPLETED (statuscode 200) is SUCCESS
      if (data.statuscode === '200') {
        return { success: true, data };
      }

      // Has orderid = success
      if (data.orderid) {
        return { success: true, data };
      }

      // Has customer_name (verification response)
      if (data.customer_name) {
        return { success: true, data };
      }

      // Has balance (wallet balance response)
      if (data.balance !== undefined) {
        return { success: true, data };
      }

      // Check for error status codes
      if (data.statuscode) {
        throw new Error(data.status || data.orderremark || 'Transaction failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('ClubKonnect error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.status || error.message || 'ClubKonnect request failed');
    }
  }

  // ==================== MAPPING FUNCTIONS ====================

  mapTVProvider(provider) {
    const codes = { 'dstv': 'dstv', 'gotv': 'gotv', 'startimes': 'startimes', 'showmax': 'showmax' };
    return codes[provider.toLowerCase()] || provider.toLowerCase();
  }

  mapElectricCompany(provider) {
    const codes = {
      'eko electric': '01', 'EKEDC': '01', 'ikeja electric': '02', 'IKEDC': '02',
      'abuja electric': '03', 'AEDC': '03', 'kano electric': '04', 'KEDCO': '04',
      'port harcourt electric': '05', 'PHEDC': '05', 'jos electric': '06', 'JEDC': '06',
      'ibadan electric': '07', 'IBEDC': '07', 'kaduna electric': '08', 'KAEDC': '08',
      'benin electric': '10', 'BEDC': '10', 'yola electric': '11', 'YEDC': '11',
      'aba electric': '12', 'APLE': '12'
    };
    return codes[provider] || codes[provider.toLowerCase()] || '01';
  }

  mapNetwork(network) {
    const codes = { 'mtn': '01', 'glo': '02', '9mobile': '03', 'airtel': '04' };
    return codes[network.toLowerCase()] || '01';
  }

  // ==================== AIRTIME ====================

  async buyAirtime({ phone, network, amount }) {
    try {
      const requestId = `PSVTU${Date.now()}`;
      const result = await this.request('APIAirtimeV1.asp', {
        MobileNetwork: this.mapNetwork(network), Amount: amount, MobileNumber: phone, RequestID: requestId
      });
      const statuscode = result.data?.statuscode;
      const isSuccess = statuscode === '100' || statuscode === '200' || result.data?.orderid;
      return { success: isSuccess, reference: result.data?.orderid || requestId, message: result.data?.status || 'Airtime purchase completed' };
    } catch (error) { throw new Error(error.message || 'Airtime purchase failed'); }
  }

  // ==================== DATA ====================

  async buyData({ phone, network, planCode }) {
    try {
      const requestId = `PSVTU${Date.now()}`;
      const apiPlanCode = planCode.replace(/^(mtn|airtel|glo|9mobile)_/, '');
      const result = await this.request('APIDatabundleV1.asp', {
        MobileNetwork: this.mapNetwork(network), DataPlan: apiPlanCode, MobileNumber: phone, RequestID: requestId
      });
      const statuscode = result.data?.statuscode;
      const isSuccess = statuscode === '100' || statuscode === '200' || result.data?.orderid;
      return { success: isSuccess, reference: result.data?.orderid || requestId, message: result.data?.status || 'Data purchase completed' };
    } catch (error) { throw new Error(error.message || 'Data purchase failed'); }
  }

  // ==================== TV / CABLE ====================

  async verifySmartCard(smartCardNumber, provider) {
    try {
      const result = await this.request('APIVerifyCableTVV1.asp', { CableTV: this.mapTVProvider(provider), SmartCardNo: smartCardNumber });
      return { customerName: result.data?.customer_name || result.data?.CustomerName || 'Customer', customerId: smartCardNumber, provider, smartCardNumber };
    } catch (error) { throw new Error(error.message || 'Smart card verification failed'); }
  }

  async subscribeTV({ smartCardNumber, provider, packageCode }) {
    try {
      const requestId = `PSVTU${Date.now()}`;
      const result = await this.request('APICableTVV1.asp', {
        CableTV: this.mapTVProvider(provider), Package: packageCode, SmartCardNo: smartCardNumber, PhoneNo: '08000000000', RequestID: requestId
      });
      return { success: result.data?.statuscode === '100' || result.data?.orderid, reference: result.data?.orderid || requestId, message: result.data?.status || 'TV subscription completed' };
    } catch (error) { throw new Error(error.message || 'TV subscription failed'); }
  }

  // ==================== ELECTRICITY ====================

  async verifyMeter(meterNumber, provider) {
    try {
      const companyCode = this.mapElectricCompany(provider);
      const result = await this.request('APIVerifyElectricityV1.asp', { ElectricCompany: companyCode, MeterNo: meterNumber, MeterType: '01' });
      return { customerName: result.data?.customer_name || 'Customer', address: result.data?.address || '', meterNumber, provider };
    } catch (error) { throw new Error(error.message || 'Meter verification failed'); }
  }

  async payElectricity({ meterNumber, provider, amount, phone }) {
    try {
      const companyCode = this.mapElectricCompany(provider);
      const requestId = `PSVTU${Date.now()}`;
      const result = await this.request('APIElectricityV1.asp', {
        ElectricCompany: companyCode, MeterType: '01', MeterNo: meterNumber, Amount: amount, PhoneNo: phone, RequestID: requestId
      });
      return { success: result.data?.statuscode === '100' || result.data?.orderid, reference: result.data?.orderid || requestId, token: result.data?.metertoken || '', units: result.data?.units || '', message: result.data?.status || 'Payment completed' };
    } catch (error) { throw new Error(error.message || 'Electricity payment failed'); }
  }

  // ==================== WALLET BALANCE ====================

    async checkBalance() {
    try {
      const queryParams = new URLSearchParams({
        UserID: this.config.userID,
        APIKey: this.config.apiKey
      });
      const url = `${this.config.baseURL}/APIWalletBalanceV1.asp?${queryParams.toString()}`;
      
      const response = await axios.get(url, { timeout: 30000 });
      console.log('ClubKonnect raw balance:', JSON.stringify(response.data));
      
      // Remove commas from balance string before parsing
      const balanceStr = (response.data.balance || '0').replace(/,/g, '');
      
      return {
        balance: parseFloat(balanceStr) || 0,
        date: response.data.date || '',
        phone: response.data.phoneno || '',
        userId: response.data.id || '',
        status: 'active'
      };
    } catch (error) {
      console.error('ClubKonnect balance error:', error.message);
      return { balance: 0, status: 'error', message: error.message };
    }
  }

  // ==================== UTILITIES ====================

  async verifyTransaction(reference) {
    try {
      const result = await this.request('APIQueryV1.asp', { OrderID: reference });
      return { success: result.data?.statuscode === '200', status: result.data?.orderstatus || 'unknown', message: result.data?.orderremark || '' };
    } catch (error) { throw new Error(error.message); }
  }

  async getDataPlans() { return []; }
  async getTVPackages() { return []; }
}

module.exports = ClubKonnectProvider;