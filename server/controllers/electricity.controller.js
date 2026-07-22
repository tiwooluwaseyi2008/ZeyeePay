exports.verifyMeter = async (req, res) => {
    const { provider, meterNumber } = req.body;

    if (!meterNumber) {
        return res.status(400).json({
            success: false,
            message: 'Please provide meter number'
        });
    }

    res.json({
        success: true,
        data: {
            customerName: 'John Doe',
            customerAddress: '123 Main Street, Lagos, Nigeria'
        }
    });
};

exports.payElectricity = async (req, res) => {
    const { provider, meterNumber, amount, phone } = req.body;

    if (!provider || !meterNumber || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if (amount < 1000) {
        return res.status(400).json({
            success: false,
            message: 'Minimum amount is 1,000'
        });
    }

    res.json({
        success: true,
        message: 'Electricity payment successful',
        data: {
            provider,
            meterNumber,
            amount,
            token: '1234-5678-9012-3456',
            units: '50.5 kWh',
            reference: 'REF' + Date.now()
        }
    });
};