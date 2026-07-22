// server/services/vtpass.service.js
const axios = require('axios');

class VTPassService {
    constructor() {
        this.baseURL = process.env.VTPASS_BASE_URL;
        this.apiKey = process.env.VTPASS_API_KEY;
        this.secretKey = process.env.VTPASS_SECRET_KEY;
        this.publicKey = process.env.VTPASS_PUBLIC_KEY;
    }

    async makeRequest(endpoint, data) {
        try {
            const response = await axios.post(`${this.baseURL}/${endpoint}`, data, {
                headers: {
                    'api-key': this.apiKey,
                    'secret-key': this.secretKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('VTPass API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'VTPass service error');
        }
    }

    // Buy Airtime
    async buyAirtime(phone, amount, network) {
        const serviceID = this.getAirtimeServiceID(network);
        const data = {
            request_id: `PSWIFT${Date.now()}`,
            serviceID,
            amount,
            phone
        };
        return await this.makeRequest('pay', data);
    }

    // Buy Data
    async buyData(phone, dataPlan, network) {
        const serviceID = this.getDataServiceID(network);
        const data = {
            request_id: `PSWIFT${Date.now()}`,
            serviceID,
            billersCode: phone,
            variation_code: dataPlan
        };
        return await this.makeRequest('pay', data);
    }

    // TV Subscription
    async subscribeTV(smartCardNumber, package, provider) {
        const serviceID = this.getTVServiceID(provider);
        const data = {
            request_id: `PSWIFT${Date.now()}`,
            serviceID,
            billersCode: smartCardNumber,
            variation_code: package,
            quantity: 1
        };
        return await this.makeRequest('pay', data);
    }

    // Electricity Bill
    async payElectricity(meterNumber, amount, provider, phone) {
        const serviceID = this.getElectricityServiceID(provider);
        const data = {
            request_id: `PSWIFT${Date.now()}`,
            serviceID,
            billersCode: meterNumber,
            variation_code: 'prepaid',
            amount,
            phone
        };
        return await this.makeRequest('pay', data);
    }

    // Verify Transaction
    async verifyTransaction(requestId) {
        return await this.makeRequest('requery', { request_id: requestId });
    }

    // Get Data Plans
    async getDataPlans(network) {
        const serviceID = this.getDataServiceID(network);
        const response = await axios.get(`${this.baseURL}/service-variations?serviceID=${serviceID}`, {
            headers: {
                'api-key': this.apiKey,
                'public-key': this.publicKey
            }
        });
        return response.data;
    }

    // Service ID Helpers
    getAirtimeServiceID(network) {
        const services = {
            mtn: 'mtn',
            airtel: 'airtel',
            glo: 'glo',
            '9mobile': 'etisalat'
        };
        return services[network.toLowerCase()];
    }

    getDataServiceID(network) {
        const services = {
            mtn: 'mtn-data',
            airtel: 'airtel-data',
            glo: 'glo-data',
            '9mobile': 'etisalat-data'
        };
        return services[network.toLowerCase()];
    }

    getTVServiceID(provider) {
        const services = {
            gotv: 'gotv',
            dstv: 'dstv',
            startimes: 'startimes'
        };
        return services[provider.toLowerCase()];
    }

    getElectricityServiceID(provider) {
        const services = {
            ikeja: 'ikeja-electric',
            eko: 'eko-electric',
            ibadan: 'ibadan-electric',
            enugu: 'enugu-electric',
            abuja: 'abuja-electric',
            portHarcourt: 'portharcourt-electric',
            kano: 'kano-electric',
            jos: 'jos-electric',
            kaduna: 'kaduna-electric'
        };
        return services[provider.toLowerCase()];
    }
}

module.exports = new VTPassService();