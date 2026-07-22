exports.fundWallet = async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount < 100) {
        return res.status(400).json({
            success: false,
            message: 'Minimum funding amount is 100'
        });
    }

    res.json({
        success: true,
        message: 'Wallet funding initiated',
        data: {
            amount,
            reference: 'PAY' + Date.now(),
            paymentUrl: 'https://checkout.paystack.com/test'
        }
    });
};

exports.getBalance = async (req, res) => {
    res.json({
        success: true,
        data: {
            balance: req.user.walletBalance
        }
    });
};