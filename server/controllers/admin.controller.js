const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ServicePrice = require('../models/ServicePrice');

exports.getFullDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Run all queries in parallel
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalTransactions,
      todayTransactions,
      successfulTx,
      failedTx,
      pendingTx,
      revenueData,
      todayRevenueData,
      serviceBreakdown,
      networkBreakdown,
      recentTransactions,
      recentUsers,
      topCustomers,
      walletSummary
    ] = await Promise.all([
      // Users
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
      
      // Transactions
      Transaction.countDocuments(),
      Transaction.countDocuments({ createdAt: { $gte: today } }),
      Transaction.countDocuments({ status: 'successful' }),
      Transaction.countDocuments({ status: 'failed' }),
      Transaction.countDocuments({ status: 'pending' }),
      
      // Revenue - All time
      Transaction.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Revenue - Today
      Transaction.aggregate([
        { $match: { status: 'successful', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Service breakdown
      Transaction.aggregate([
        { $match: { status: 'successful', createdAt: { $gte: today } } },
        { $group: { _id: '$transactionType', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]),
      
      // Network breakdown
      Transaction.aggregate([
        { $match: { status: 'successful', service: { $ne: null }, createdAt: { $gte: today } } },
        { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ]),
      
      // Recent transactions
      Transaction.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Recent users
      User.find({ role: 'user' })
        .select('firstName lastName email phone createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      
      // Top customers
      Transaction.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$amount' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, email: '$user.email', totalSpent: 1 } }
      ]),
      
      // Wallet summary
      User.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: null, totalBalance: { $sum: '$walletBalance' }, count: { $sum: 1 } } }
      ])
    ]);

    // Format service breakdown
    const serviceNames = {
      data_purchase: 'Data',
      airtime_purchase: 'Airtime',
      tv_subscription: 'TV',
      electricity_bill: 'Electricity',
      wallet_funding: 'Wallet Funding'
    };

    const serviceData = serviceBreakdown.map(s => ({
      name: serviceNames[s._id] || s._id,
      count: s.count,
      revenue: s.revenue
    }));

    // Format network breakdown
    const networkData = networkBreakdown.map(n => ({
      name: n._id?.toUpperCase(),
      count: n.count,
      revenue: n.revenue
    }));

    const totalRevenue = revenueData[0]?.total || 0;
    const todayRevenue = todayRevenueData[0]?.total || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          newUsersToday,
          totalTransactions,
          todayTransactions,
          successfulTransactions: successfulTx,
          failedTransactions: failedTx,
          pendingTransactions: pendingTx,
          totalRevenue,
          todayRevenue,
          platformWalletBalance: walletSummary[0]?.totalBalance || 0,
          averageUserBalance: walletSummary[0] ? walletSummary[0].totalBalance / walletSummary[0].count : 0
        },
        serviceBreakdown: serviceData,
        networkBreakdown: networkData,
        recentTransactions,
        recentUsers,
        topCustomers,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Revenue chart data (last 30 days)
exports.getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          status: 'successful',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing dates with 0
    const labels = [];
    const values = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dataPoint = revenueData.find(d => d._id === dateStr);
      labels.push(dateStr);
      values.push(dataPoint ? dataPoint.revenue : 0);
    }

    res.json({ success: true, labels, values });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};