exports.getTVPackages = async (req, res) => {
    const packages = {
        dstv: [
            { variation_code: 'dstv_premium', name: 'DStv Premium', variation_amount: '24500' },
            { variation_code: 'dstv_compact_plus', name: 'DStv Compact+', variation_amount: '16600' },
            { variation_code: 'dstv_compact', name: 'DStv Compact', variation_amount: '10500' }
        ],
        gotv: [
            { variation_code: 'gotv_supa', name: 'GOtv Supa', variation_amount: '6400' },
            { variation_code: 'gotv_max', name: 'GOtv Max', variation_amount: '4850' },
            { variation_code: 'gotv_joli', name: 'GOtv Joli', variation_amount: '3300' }
        ],
        startimes: [
            { variation_code: 'startimes_super', name: 'Super', variation_amount: '4900' },
            { variation_code: 'startimes_classic', name: 'Classic', variation_amount: '2600' }
        ]
    };

    const provider = req.params.provider.toLowerCase();
    const tvPackages = packages[provider] || [];

    res.json({
        success: true,
        data: tvPackages
    });
};

exports.verifySmartCard = async (req, res) => {
    const { provider, smartCardNumber } = req.body;

    if (!smartCardNumber) {
        return res.status(400).json({
            success: false,
            message: 'Please provide smart card number'
        });
    }

    res.json({
        success: true,
        data: {
            customerName: 'John Doe',
            customerId: smartCardNumber
        }
    });
};

exports.subscribeTV = async (req, res) => {
    const { provider, smartCardNumber, packageId } = req.body;

    if (!provider || !smartCardNumber || !packageId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    res.json({
        success: true,
        message: 'TV subscription successful',
        data: {
            provider,
            smartCardNumber,
            packageId,
            reference: 'REF' + Date.now()
        }
    });
};