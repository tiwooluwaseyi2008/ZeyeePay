const IACafeProvider = require('./providers/IACafeProvider');
const ClubKonnectProvider = require('./providers/ClubKonnectProvider');
const CheapDataHubProvider = require('./providers/CheapDataHubProvider');

class VtuProviderManager {
  constructor() {
    this.providers = {};
    this.activeProvider = null;
    this.initializeProviders();
  }

  initializeProviders() {
    // Register providers
    this.registerProvider('iacafe', new IACafeProvider());
    this.registerProvider('clubkonnect', new ClubKonnectProvider());
    this.registerProvider('cheapdatahub', new CheapDataHubProvider());

    // Set active provider
    const activeProviderName = process.env.ACTIVE_VTU_PROVIDER || 'iacafe';
    this.setActiveProvider(activeProviderName);
    
    console.log(`✅ VTU Provider: ${this.activeProvider.getProviderName()}`);

    //const activeProviderName = process.env.ACTIVE_VTU_PROVIDER || 'cheapdatahub';
    //this.setActiveProvider(activeProviderName);
    
    //console.log(`✅ VTU Provider: ${this.activeProvider.getProviderName()}`);
  }

  registerProvider(name, provider) {
    this.providers[name] = provider;
  }

  setActiveProvider(name) {
    if (!this.providers[name]) {
      console.warn(`Provider "${name}" not found. Available: ${Object.keys(this.providers).join(', ')}`);
      // Fallback to first available
      this.activeProvider = Object.values(this.providers)[0];
      return;
    }
    this.activeProvider = this.providers[name];
  }

  getProvider(name = null) {
    if (name && this.providers[name]) {
      return this.providers[name];
    }
    return this.activeProvider;
  }

  getActiveProviderName() {
    return this.activeProvider.getProviderName();
  }

  getAllProviders() {
    return Object.keys(this.providers);
  }

  // Delegate all methods to active provider
  async buyData(params) {
    return this.activeProvider.buyData(params);
  }

  async buyAirtime(params) {
    return this.activeProvider.buyAirtime(params);
  }

  async subscribeTV(params) {
    return this.activeProvider.subscribeTV(params);
  }

  async payElectricity(params) {
    return this.activeProvider.payElectricity(params);
  }

  async verifyTransaction(reference) {
    return this.activeProvider.verifyTransaction(reference);
  }

  async getDataPlans(network) {
    return this.activeProvider.getDataPlans(network);
  }

  async getTVPackages(provider) {
    return this.activeProvider.getTVPackages(provider);
  }

  async verifySmartCard(smartCardNumber, provider) {
    return this.activeProvider.verifySmartCard(smartCardNumber, provider);
  }

  async verifyMeter(meterNumber, provider) {
    return this.activeProvider.verifyMeter(meterNumber, provider);
  }

  async checkBalance() {
    return this.activeProvider.checkBalance();
  }
}

// Singleton
const providerManager = new VtuProviderManager();

module.exports = providerManager;