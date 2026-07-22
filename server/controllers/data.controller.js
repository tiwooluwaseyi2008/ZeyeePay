exports.getDataPlans = async (req, res) => {
    const plans = {
        mtn: [
            { variation_code: 'mtn_500mb', name: '500MB', variation_amount: '150' },
            { variation_code: 'mtn_1gb', name: '1GB', variation_amount: '300' },
            { variation_code: 'mtn_2gb', name: '2GB', variation_amount: '500' },
            { variation_code: 'mtn_5gb', name: '5GB', variation_amount: '1200' }
        ],
        airtel: [
            { variation_code: 'airtel_750mb', name: '750MB', variation_amount: '200' },
            { variation_code: 'airtel_1.5gb', name: '1.5GB', variation_amount: '500' },
            { variation_code: 'airtel_3gb', name: '3GB', variation_amount: '800' }
        ],
        glo: [
            { variation_code: 'glo_1.35gb', name: '1.35GB', variation_amount: '500' },
            { variation_code: 'glo_2.9gb', name: '2.9GB', variation_amount: '800' }
        ],
        '9mobile': [
            { variation_code: '9mobile_1gb', name: '1GB', variation_amount: '500' },
            { variation_code: '9mobile_2.5gb', name: '2.5GB', variation_amount: '800' }
        ]
    };

    const network = req.params.network.toLowerCase();
    const dataPlans = plans[network] || [];

    res.json({
        success: true,
        data: dataPlans
    });
};

exports.purchaseData = async (req, res) => {
    const { network, planId, phone } = req.body;

    if (!network || !planId || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if (req.user.walletBalance < 500) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
        });
    }

    res.json({
        success: true,
        message: 'Data purchase successful',
        data: {
            network,
            phone,
            planId,
            reference: 'REF' + Date.now()
        }
    });
};