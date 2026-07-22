exports.purchaseAirtime = async (req, res) => {
    const { network, phone, amount } = req.body;

    if (!network || !phone || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if (amount < 50 || amount > 50000) {
        return res.status(400).json({
            success: false,
            message: 'Amount must be between 50 and 50,000'
        });
    }

    if (req.user.walletBalance < amount) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
        });
    }

    res.json({
        success: true,
        message: 'Airtime purchase successful',
        data: {
            network,
            phone,
            amount,
            reference: 'REF' + Date.now()
        }
    });
};