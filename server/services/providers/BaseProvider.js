/**
 * Base VTU Provider Interface
 * All providers must implement these methods
 */
class BaseProvider {
  constructor(config) {
    this.name = 'BaseProvider';
    this.config = config;
    this.isActive = true;
  }

  /**
   * Purchase data bundle
   * @param {Object} params - { phone, network, planCode, amount }
   * @returns {Promise<{success: boolean, reference: string, message: string}>}
   */
  async buyData(params) {
    throw new Error('buyData() must be implemented by provider');
  }

  /**
   * Purchase airtime
   * @param {Object} params - { phone, network, amount }
   * @returns {Promise<{success: boolean, reference: string, message: string}>}
   */
  async buyAirtime(params) {
    throw new Error('buyAirtime() must be implemented by provider');
  }

  /**
   * Subscribe TV
   * @param {Object} params - { smartCardNumber, provider, packageCode }
   * @returns {Promise<{success: boolean, reference: string, message: string}>}
   */
  async subscribeTV(params) {
    throw new Error('subscribeTV() must be implemented by provider');
  }

  /**
   * Pay electricity bill
   * @param {Object} params - { meterNumber, provider, amount, phone }
   * @returns {Promise<{success: boolean, reference: string, token: string, units: string}>}
   */
  async payElectricity(params) {
    throw new Error('payElectricity() must be implemented by provider');
  }

  /**
   * Verify transaction status
   * @param {string} reference - Transaction reference
   * @returns {Promise<{success: boolean, status: string, message: string}>}
   */
  async verifyTransaction(reference) {
    throw new Error('verifyTransaction() must be implemented by provider');
  }

  /**
   * Get available data plans
   * @param {string} network - Network name
   * @returns {Promise<Array>}
   */
  async getDataPlans(network) {
    throw new Error('getDataPlans() must be implemented by provider');
  }

  /**
   * Get TV packages
   * @param {string} provider - TV provider name
   * @returns {Promise<Array>}
   */
  async getTVPackages(provider) {
    throw new Error('getTVPackages() must be implemented by provider');
  }

  /**
   * Verify smart card number
   * @param {string} smartCardNumber
   * @param {string} provider
   * @returns {Promise<{customerName: string, customerId: string}>}
   */
  async verifySmartCard(smartCardNumber, provider) {
    throw new Error('verifySmartCard() must be implemented by provider');
  }

  /**
   * Verify meter number
   * @param {string} meterNumber
   * @param {string} provider
   * @returns {Promise<{customerName: string, address: string}>}
   */
  async verifyMeter(meterNumber, provider) {
    throw new Error('verifyMeter() must be implemented by provider');
  }

  /**
   * Check provider health/balance
   * @returns {Promise<{balance: number, status: string}>}
   */
  async checkBalance() {
    throw new Error('checkBalance() must be implemented by provider');
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return this.name;
  }

  /**
   * Check if provider is active
   */
  isProviderActive() {
    return this.isActive;
  }
}

module.exports = BaseProvider;