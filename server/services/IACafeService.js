const axios = require('axios');
const crypto = require('crypto');

const IACAFE_BASE_URL = process.env.IACAFE_BASE_URL || 'https://iacafeapi.com/api';
const IACAFE_API_KEY = process.env.IACAFE_API_KEY;
const IACAFE_SECRET_KEY = process.env.IACAFE_SECRET_KEY;

class IACafeService {

    verifyWebhookSignature(body, signature) {
        if (!IACAFE_SECRET_KEY) return false;
        
        const hash = crypto
            .createHmac('sha256', IACAFE_SECRET_KEY)
            .update(JSON.stringify(body))
            .digest('hex');

        return hash === signature;
    }

    async verifyTransaction(reference) {
        try {
            const response = await axios.post(
                `${IACAFE_BASE_URL}/transaction/verify`,
                {
                    api_key: IACAFE_API_KEY,
                    secret_key: IACAFE_SECRET_KEY,
                    reference
                },
                { timeout: 15000 }
            );

            return {
                success: response.data.status === 'success',
                status: response.data.status,
                reference: response.data.reference,
                amount: response.data.amount
            };
        } catch (error) {
            console.error('IA Cafe verify error:', error.message);
            throw new Error('Transaction verification failed');
        }
    }
}

module.exports = new IACafeService();