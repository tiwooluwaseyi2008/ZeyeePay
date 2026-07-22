const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ServicePrice = require('../models/ServicePrice');
const sendNotification = require('../utils/sendNotification');
const FundingRequest = require('../models/FundingRequest');
const vtuProvider = require('../services/VtuProviderManager');

router.use(protect);
router.use(authorize('admin'));

// ==========================================
// DASHBOARD
// ==========================================
router.get('/full-stats', adminController.getFullDashboardStats);
router.get('/revenue-chart', adminController.getRevenueChart);

// Check VTU provider wallet balance
router.get('/provider-balance', async (req, res) => {
  try {
    console.log('Checking ClubKonnect balance...');
    const balance = await vtuProvider.checkBalance();
    console.log('ClubKonnect balance:', balance);
    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Provider balance error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to check balance' });
  }
});

// ==========================================
// USERS
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'newest';

    const query = { role: 'user' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    let sortObj = {};
    switch (sort) {
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'highest_balance': sortObj = { walletBalance: -1 }; break;
      case 'lowest_balance': sortObj = { walletBalance: 1 }; break;
      case 'name': sortObj = { firstName: 1 }; break;
      default: sortObj = { createdAt: -1 };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort(sortObj).skip((page - 1) * limit).limit(limit);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalUsers, activeUsers, newToday, totalBalance] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
      User.aggregate([{ $match: { role: 'user' } }, { $group: { _id: null, total: { $sum: '$walletBalance' } } }])
    ]);

    res.json({ success: true, data: { users, stats: { totalUsers, activeUsers, newToday, totalWalletBalance: totalBalance[0]?.total || 0 }, pagination: { page, pages: Math.ceil(total / limit), total, limit } } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive; await user.save();
    res.json({ success: true, data: { isActive: user.isActive } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/users/:id/credit', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.walletBalance += Number(amount); await user.save();
    await Transaction.create({ user: user._id, transactionType: 'wallet_credit', amount: Number(amount), totalAmount: Number(amount), status: 'successful', paymentReference: `ADMINCREDIT${Date.now()}`, description: description || 'Admin wallet credit', completedAt: new Date() });
    res.json({ success: true, message: 'Wallet credited', data: { walletBalance: user.walletBalance } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/users/:id/debit', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.walletBalance < Number(amount)) return res.status(400).json({ success: false, message: 'Insufficient balance' });
    user.walletBalance -= Number(amount); await user.save();
    await Transaction.create({ user: user._id, transactionType: 'wallet_debit', amount: Number(amount), totalAmount: Number(amount), status: 'successful', paymentReference: `ADMINDEBIT${Date.now()}`, description: description || 'Admin wallet debit', completedAt: new Date() });
    res.json({ success: true, message: 'Wallet debited', data: { walletBalance: user.walletBalance } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/users/:id', async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'User deleted' }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ==========================================
// FUNDING REQUESTS
// ==========================================
router.get('/funding-requests', async (req, res) => {
  try {
    const requests = await FundingRequest.find().populate('user', 'firstName lastName email phone').sort({ createdAt: -1 });
    res.json({ success: true, data: { requests } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/funding-requests/:id/approve', async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    // CHECK FOR DUPLICATE TRANSACTION
    const existingTx = await Transaction.findOne({ 
      paymentReference: request.reference,
      status: 'successful'
    });

    if (existingTx) {
      // Already credited - just update the request status
      request.status = 'approved';
      request.approvedAt = new Date();
      await request.save();
      return res.json({ success: true, message: 'Already processed' });
    }

    const user = await User.findById(request.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.walletBalance += request.amount;
    await user.save();

    request.status = 'approved';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();

    await Transaction.create({
      user: request.user, transactionType: 'wallet_funding', amount: request.amount,
      totalAmount: request.amount, status: 'successful', paymentMethod: 'bank_transfer',
      paymentReference: request.reference, description: 'Wallet funding approved',
      completedAt: new Date()
    });

    console.log(`✅ Approved ₦${request.amount} for ${user.firstName}`);
    sendNotification.fundingApproved(request, user);
    res.json({ success: true, message: `Approved ₦${request.amount} for ${user.firstName}` });
  } catch (error) { 
    console.error('Approve error:', error);
    res.status(500).json({ success: false, message: 'Server error' }); 
  }
});

router.post('/funding-requests/:id/reject', async (req, res) => {
  try {
    const request = await FundingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'rejected';
    request.approvedBy = req.user.id;
    request.rejectedAt = new Date();
    await request.save();

    await Transaction.create({
      user: request.user, transactionType: 'wallet_funding', amount: request.amount,
      totalAmount: request.amount, status: 'failed', paymentMethod: 'bank_transfer',
      paymentReference: request.reference, description: 'Wallet funding rejected',
      completedAt: new Date(), metadata: { fundingRequestId: request._id.toString(), rejectedBy: req.user.id.toString() }
    });

    console.log(`❌ Rejected ₦${request.amount}`);
    const user = await User.findById(request.user);
    sendNotification.fundingRejected(request, user);
    res.json({ success: true, message: 'Funding request rejected' });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ==========================================
// TRANSACTIONS
// ==========================================
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const type = req.query.type || '';
    const sort = req.query.sort || 'newest';

    const query = {};
    if (status) query.status = status;
    if (type) query.transactionType = type;
    if (search) { query.$or = [{ paymentReference: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]; }

    let sortObj = {};
    switch (sort) { case 'oldest': sortObj = { createdAt: 1 }; break; case 'highest_amount': sortObj = { amount: -1 }; break; case 'lowest_amount': sortObj = { amount: 1 }; break; default: sortObj = { createdAt: -1 }; }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query).populate('user', 'firstName lastName email phone').sort(sortObj).skip((page - 1) * limit).limit(limit);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [statsData, todayStats] = await Promise.all([
      Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { createdAt: { $gte: today } } }, { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }])
    ]);

    const stats = {
      total, successful: statsData.find(s => s._id === 'successful')?.count || 0,
      pending: statsData.find(s => s._id === 'pending')?.count || 0,
      failed: statsData.find(s => s._id === 'failed')?.count || 0,
      totalRevenue: statsData.reduce((sum, s) => sum + (s.revenue || 0), 0),
      todayRevenue: todayStats[0]?.revenue || 0
    };

    res.json({ success: true, data: { transactions, stats, pagination: { page, pages: Math.ceil(total / limit), total, limit } } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('user', 'firstName lastName email phone');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: { transaction } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/transactions/:id/retry', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (transaction.status !== 'failed') return res.status(400).json({ success: false, message: 'Only failed transactions can be retried' });
    transaction.status = 'pending'; await transaction.save();
    res.json({ success: true, message: 'Transaction queued for retry' });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ==========================================
// SERVICES
// ==========================================
router.get('/services', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'newest';
    const query = {};
    if (type) query.type = type;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) { query.$or = [{ network: { $regex: search, $options: 'i' } }, { planName: { $regex: search, $options: 'i' } }, { planCode: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }]; }
    let sortObj = {};
    switch (sort) { case 'oldest': sortObj = { createdAt: 1 }; break; case 'price_high': sortObj = { price: -1 }; break; case 'price_low': sortObj = { price: 1 }; break; case 'network': sortObj = { network: 1 }; break; default: sortObj = { createdAt: -1 }; }
    const total = await ServicePrice.countDocuments(query);
    const services = await ServicePrice.find(query).sort(sortObj).skip((page - 1) * limit).limit(limit);
    const [totalAll, activeCount, dataCount, airtimeCount, tvCount, elecCount] = await Promise.all([ServicePrice.countDocuments(), ServicePrice.countDocuments({ isActive: true }), ServicePrice.countDocuments({ type: 'data' }), ServicePrice.countDocuments({ type: 'airtime' }), ServicePrice.countDocuments({ type: 'tv' }), ServicePrice.countDocuments({ type: 'electricity' })]);
    res.json({ success: true, data: { services, stats: { total: totalAll, active: activeCount, inactive: totalAll - activeCount, data: dataCount, airtime: airtimeCount, tv: tvCount, electricity: elecCount }, pagination: { page, pages: Math.ceil(total / limit), total, limit } } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/services', async (req, res) => {
  try { const service = await ServicePrice.create({ ...req.body, updatedBy: req.user._id }); res.status(201).json({ success: true, data: { service } }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/services/:id', async (req, res) => {
  try { const service = await ServicePrice.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true }); if (!service) return res.status(404).json({ success: false, message: 'Service not found' }); res.json({ success: true, data: { service } }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/services/:id', async (req, res) => {
  try { await ServicePrice.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Service deleted' }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.patch('/services/:id/toggle', async (req, res) => {
  try { const service = await ServicePrice.findById(req.params.id); if (!service) return res.status(404).json({ success: false, message: 'Service not found' }); service.isActive = !service.isActive; await service.save(); res.json({ success: true, data: { isActive: service.isActive } }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/services/bulk', async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'No services selected' });
    switch (action) { case 'activate': await ServicePrice.updateMany({ _id: { $in: ids } }, { isActive: true }); break; case 'deactivate': await ServicePrice.updateMany({ _id: { $in: ids } }, { isActive: false }); break; case 'delete': await ServicePrice.deleteMany({ _id: { $in: ids } }); break; default: return res.status(400).json({ success: false, message: 'Invalid action' }); }
    res.json({ success: true, message: `Bulk ${action} completed` });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/services/:id/duplicate', async (req, res) => {
  try {
    const original = await ServicePrice.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Service not found' });
    const duplicate = await ServicePrice.create({ type: original.type, network: original.network, category: original.category, planName: original.planName + ' (Copy)', planCode: original.planCode + '_copy_' + Date.now(), price: original.price, validity: original.validity, discount: original.discount, description: original.description, isActive: true, updatedBy: req.user._id });
    res.status(201).json({ success: true, data: { service: duplicate } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;