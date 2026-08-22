const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const User = require('../models/User');
const ServicePrice = require('../models/ServicePrice');

const seedAll = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeyeesub';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // ==========================================
    // CREATE ADMIN
    // ==========================================
    const existingAdmin = await User.findOne({ email: 'admin@zeyeesub.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      await User.create({
        firstName: 'Admin', lastName: 'User',
        email: 'admin@zeyeesub.com', phone: '08105002814',
        password: await bcrypt.hash('admin123', salt),
        walletBalance: 1000000, role: 'admin',
        isEmailVerified: true, isActive: true
      });
      console.log('✅ Admin created');
    }

    // ==========================================
    // CLEAR OLD SERVICES
    // ==========================================
    await ServicePrice.deleteMany({});

    // ==========================================
    // PRICE FORMULA: Math.ceil(cost / rate * 1.10)
    // MTN: 0.970, Airtel: 0.970, Glo: 0.955, 9mobile: 0.930
    // ==========================================

    const services = [
      // ==================== MTN DATA ====================
      // Daily (Awoof)
      { type:'data', network:'MTN', category:'daily', planName:'110MB', planCode:'mtn_100.01', price:110, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'MTN', category:'daily', planName:'230MB', planCode:'mtn_200.01', price:220, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'MTN', category:'daily', planName:'500MB', planCode:'mtn_350.01', price:385, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'MTN', category:'daily', planName:'1GB + 1.5mins', planCode:'mtn_500.01', price:550, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'MTN', category:'daily', planName:'2.5GB', planCode:'mtn_750.01', price:825, validity:'1 Day', description:'Awoof Daily' },
      // 2-Day
      { type:'data', network:'MTN', category:'daily', planName:'2.5GB', planCode:'mtn_900.01', price:990, validity:'2 Days', description:'Awoof 2-Day' },
      { type:'data', network:'MTN', category:'daily', planName:'3.2GB', planCode:'mtn_1000.01', price:1100, validity:'2 Days', description:'Awoof 2-Day' },
      // Weekly SME
      { type:'data', network:'MTN', category:'weekly', planName:'500MB SME', planCode:'mtn_500', price:348, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'1GB SME', planCode:'mtn_1000', price:465, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'2GB SME', planCode:'mtn_2000', price:930, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'3GB SME', planCode:'mtn_3000', price:1395, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'5GB SME', planCode:'mtn_5000', price:2325, validity:'7 Days', description:'SME Weekly' },
      // Weekly Direct
      { type:'data', network:'MTN', category:'weekly', planName:'500MB Direct', planCode:'mtn_500.02', price:550, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'1GB Direct', planCode:'mtn_800.01', price:880, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'1.5GB Direct', planCode:'mtn_1000.03', price:1100, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'3.5GB Direct', planCode:'mtn_1500.03', price:1650, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'6GB Direct', planCode:'mtn_2500.01', price:2750, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'11GB Direct', planCode:'mtn_3500.01', price:3850, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'MTN', category:'weekly', planName:'20GB Direct', planCode:'mtn_5000.01', price:5500, validity:'7 Days', description:'Direct Weekly' },
      // Monthly SME
      { type:'data', network:'MTN', category:'monthly', planName:'500MB SME', planCode:'mtn_500.00', price:348, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'1GB SME', planCode:'mtn_1000.00', price:639, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'2GB SME', planCode:'mtn_2000.00', price:1267, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'3GB SME', planCode:'mtn_3000.00', price:1848, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'5GB SME', planCode:'mtn_5000.00', price:2848, validity:'30 Days', description:'SME Monthly', isPopular:true },
      // Monthly Direct
      { type:'data', network:'MTN', category:'monthly', planName:'2GB+2mins', planCode:'mtn_1500.02', price:1650, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'2.7GB+2mins', planCode:'mtn_2000.01', price:2200, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'3.5GB+5mins', planCode:'mtn_2500.02', price:2750, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'7GB', planCode:'mtn_3500.02', price:3850, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'10GB+10mins', planCode:'mtn_4500.01', price:4950, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'12.5GB', planCode:'mtn_5500.01', price:6050, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'16.5GB+10mins', planCode:'mtn_6500.01', price:7150, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'20GB', planCode:'mtn_7500.01', price:8250, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'25GB', planCode:'mtn_9000.01', price:9900, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'36GB', planCode:'mtn_11000.01', price:12100, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'75GB', planCode:'mtn_18000.01', price:19800, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'MTN', category:'monthly', planName:'165GB', planCode:'mtn_35000.01', price:38500, validity:'30 Days', description:'Direct Monthly' },
      // 60-Day
      { type:'data', network:'MTN', category:'monthly', planName:'150GB', planCode:'mtn_40000.01', price:44000, validity:'60 Days', description:'2-Month Plan' },
      // 90-Day
      { type:'data', network:'MTN', category:'monthly', planName:'480GB', planCode:'mtn_90000.03', price:99000, validity:'90 Days', description:'3-Month Plan' },

      // ==================== AIRTEL DATA ====================
      { type:'data', network:'Airtel', category:'daily', planName:'1GB', planCode:'airtel_499.91', price:550, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'Airtel', category:'daily', planName:'1.5GB', planCode:'airtel_599.91', price:660, validity:'2 Days', description:'Awoof' },
      { type:'data', network:'Airtel', category:'daily', planName:'2GB', planCode:'airtel_749.91', price:825, validity:'2 Days', description:'Awoof' },
      { type:'data', network:'Airtel', category:'daily', planName:'3GB', planCode:'airtel_999.91', price:1100, validity:'2 Days', description:'Awoof' },
      { type:'data', network:'Airtel', category:'daily', planName:'5GB', planCode:'airtel_1499.91', price:1650, validity:'2 Days', description:'Awoof' },
      // Weekly
      { type:'data', network:'Airtel', category:'weekly', planName:'500MB', planCode:'airtel_499.92', price:550, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'1GB', planCode:'airtel_799.91', price:880, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'1.5GB', planCode:'airtel_999.92', price:1100, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'3.5GB', planCode:'airtel_1499.92', price:1650, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'6GB', planCode:'airtel_2499.91', price:2750, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'10GB', planCode:'airtel_2999.91', price:3300, validity:'7 Days', description:'Direct Weekly' },
      { type:'data', network:'Airtel', category:'weekly', planName:'18GB', planCode:'airtel_4999.91', price:5500, validity:'7 Days', description:'Direct Weekly' },
      // Monthly
      { type:'data', network:'Airtel', category:'monthly', planName:'2GB', planCode:'airtel_1499.93', price:1650, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'3GB', planCode:'airtel_1999.91', price:2200, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'4GB', planCode:'airtel_2499.92', price:2750, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'8GB', planCode:'airtel_2999.92', price:3300, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'10GB', planCode:'airtel_3999.91', price:4400, validity:'30 Days', description:'Direct Monthly', isPopular:true },
      { type:'data', network:'Airtel', category:'monthly', planName:'13GB', planCode:'airtel_4999.92', price:5500, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'18GB', planCode:'airtel_5999.91', price:6600, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'25GB', planCode:'airtel_7999.91', price:8800, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'35GB', planCode:'airtel_9999.91', price:11000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'60GB', planCode:'airtel_14999.91', price:16500, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Airtel', category:'monthly', planName:'100GB', planCode:'airtel_19999.91', price:22000, validity:'30 Days', description:'Direct Monthly' },
      // 90-Day
      { type:'data', network:'Airtel', category:'monthly', planName:'300GB', planCode:'airtel_49999.91', price:55000, validity:'90 Days', description:'3-Month Plan' },
      { type:'data', network:'Airtel', category:'monthly', planName:'350GB', planCode:'airtel_59999.91', price:66000, validity:'90 Days', description:'3-Month Plan' },

      // ==================== GLO DATA ====================
      { type:'data', network:'Glo', category:'daily', planName:'125MB', planCode:'glo_100.01', price:110, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'Glo', category:'daily', planName:'260MB', planCode:'glo_200.01', price:220, validity:'2 Days', description:'Awoof' },
      // Weekend
      { type:'data', network:'Glo', category:'weekly', planName:'875MB Sun', planCode:'glo_200.02', price:220, validity:'1 Day', description:'Sunday Plan' },
      { type:'data', network:'Glo', category:'weekly', planName:'2.5GB Wknd', planCode:'glo_500.03', price:550, validity:'Weekend', description:'Sat & Sun' },
      // Weekly SME
      { type:'data', network:'Glo', category:'weekly', planName:'500MB SME', planCode:'glo_500', price:265, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'Glo', category:'weekly', planName:'1GB SME', planCode:'glo_1000.12', price:411, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'Glo', category:'weekly', planName:'3GB SME', planCode:'glo_3000.12', price:1235, validity:'7 Days', description:'SME Weekly' },
      { type:'data', network:'Glo', category:'weekly', planName:'5GB SME', planCode:'glo_5000.12', price:2059, validity:'7 Days', description:'SME Weekly' },
      // Night
      { type:'data', network:'Glo', category:'night', planName:'1GB Night', planCode:'glo_1000.21', price:411, validity:'14 Days', description:'Night Plan' },
      { type:'data', network:'Glo', category:'night', planName:'3GB Night', planCode:'glo_3000.21', price:1235, validity:'14 Days', description:'Night Plan' },
      { type:'data', network:'Glo', category:'night', planName:'5GB Night', planCode:'glo_5000.21', price:2059, validity:'14 Days', description:'Night Plan' },
      { type:'data', network:'Glo', category:'night', planName:'10GB Night', planCode:'glo_10000.21', price:4118, validity:'14 Days', description:'Night Plan' },
      // Monthly SME
      { type:'data', network:'Glo', category:'monthly', planName:'1GB SME', planCode:'glo_1000', price:531, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'2GB SME', planCode:'glo_2000', price:1062, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'3GB SME', planCode:'glo_3000', price:1593, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'5GB SME', planCode:'glo_5000', price:2656, validity:'30 Days', description:'SME Monthly', isPopular:true },
      { type:'data', network:'Glo', category:'monthly', planName:'10GB SME', planCode:'glo_10000', price:5312, validity:'30 Days', description:'SME Monthly' },
      // Monthly Direct
      { type:'data', network:'Glo', category:'monthly', planName:'1.5GB', planCode:'glo_500.01', price:550, validity:'14 Days', description:'Direct' },
      { type:'data', network:'Glo', category:'monthly', planName:'2.6GB', planCode:'glo_1000.01', price:1100, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'5GB Direct', planCode:'glo_1500.01', price:1650, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'6.15GB', planCode:'glo_2000.01', price:2200, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'7.5GB', planCode:'glo_2500.01', price:2750, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'10GB Direct', planCode:'glo_3000.01', price:3300, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'12.5GB', planCode:'glo_4000.01', price:4400, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'16GB', planCode:'glo_5000.01', price:5500, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'28GB', planCode:'glo_8000.01', price:8800, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'38GB', planCode:'glo_10000.01', price:11000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'64GB', planCode:'glo_15000.01', price:16500, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'107GB', planCode:'glo_20000.01', price:22000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'165GB', planCode:'glo_30000.01', price:33000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'220GB', planCode:'glo_36000.01', price:39600, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'320GB', planCode:'glo_50000.01', price:55000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'380GB', planCode:'glo_60000.01', price:66000, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'Glo', category:'monthly', planName:'475GB', planCode:'glo_75000.01', price:82500, validity:'30 Days', description:'Direct Monthly' },
      // Annual
      { type:'data', network:'Glo', category:'monthly', planName:'1TB', planCode:'glo_150000.03', price:165000, validity:'365 Days', description:'Annual Plan' },

      // ==================== 9MOBILE DATA ====================
      { type:'data', network:'9mobile', category:'daily', planName:'100MB', planCode:'9mobile_100.01', price:110, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'9mobile', category:'daily', planName:'180MB', planCode:'9mobile_150.01', price:165, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'9mobile', category:'daily', planName:'250MB', planCode:'9mobile_200.01', price:220, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'9mobile', category:'daily', planName:'450MB', planCode:'9mobile_350.01', price:385, validity:'1 Day', description:'Awoof Daily' },
      { type:'data', network:'9mobile', category:'daily', planName:'650MB', planCode:'9mobile_500.01', price:550, validity:'3 Days', description:'Awoof' },
      // Weekly
      { type:'data', network:'9mobile', category:'weekly', planName:'1.75GB', planCode:'9mobile_1500.01', price:1650, validity:'7 Days', description:'Direct Weekly' },
      // 14-Day
      { type:'data', network:'9mobile', category:'weekly', planName:'650MB', planCode:'9mobile_600.01', price:660, validity:'14 Days', description:'Direct' },
      // Monthly SME
      { type:'data', network:'9mobile', category:'monthly', planName:'50MB SME', planCode:'9mobile_50', price:30, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'100MB SME', planCode:'9mobile_100', price:60, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'300MB SME', planCode:'9mobile_300', price:181, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'500MB SME', planCode:'9mobile_500', price:291, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'1GB SME', planCode:'9mobile_1000', price:582, validity:'30 Days', description:'SME Monthly', isPopular:true },
      { type:'data', network:'9mobile', category:'monthly', planName:'2GB SME', planCode:'9mobile_2000', price:1164, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'3GB SME', planCode:'9mobile_3000', price:1746, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'4GB SME', planCode:'9mobile_4000', price:2328, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'5GB SME', planCode:'9mobile_5000', price:2910, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'10GB SME', planCode:'9mobile_10000', price:5820, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'15GB SME', planCode:'9mobile_15000', price:8730, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'20GB SME', planCode:'9mobile_20000', price:11640, validity:'30 Days', description:'SME Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'25GB SME', planCode:'9mobile_25000', price:14550, validity:'30 Days', description:'SME Monthly' },
      // Monthly Direct
      { type:'data', network:'9mobile', category:'monthly', planName:'1.1GB', planCode:'9mobile_1000.01', price:1100, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'1.4GB', planCode:'9mobile_1200.01', price:1320, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'2.44GB', planCode:'9mobile_2000.01', price:2200, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'3.17GB', planCode:'9mobile_2500.01', price:2750, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'3.91GB', planCode:'9mobile_3000.01', price:3300, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'5.10GB', planCode:'9mobile_4000.01', price:4400, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'6.5GB', planCode:'9mobile_5000.01', price:5500, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'16GB', planCode:'9mobile_12000.01', price:13200, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'24.3GB', planCode:'9mobile_18500.01', price:20350, validity:'30 Days', description:'Direct Monthly' },
      { type:'data', network:'9mobile', category:'monthly', planName:'26.5GB', planCode:'9mobile_20000.01', price:22000, validity:'30 Days', description:'Direct Monthly' },
      // 60-Day
      { type:'data', network:'9mobile', category:'monthly', planName:'39GB', planCode:'9mobile_30000.01', price:33000, validity:'60 Days', description:'2-Month Plan' },

      // ==================== AIRTIME ====================
      { type:'airtime', network:'MTN', category:'airtime', planName:'Airtime Recharge', planCode:'mtn_airtime', price:0, validity:'Instant', description:'MTN - 3% discount' },
      { type:'airtime', network:'Glo', category:'airtime', planName:'Airtime Recharge', planCode:'glo_airtime', price:0, validity:'Instant', description:'Glo - 8% discount' },
      { type:'airtime', network:'9mobile', category:'airtime', planName:'Airtime Recharge', planCode:'9mobile_airtime', price:0, validity:'Instant', description:'9mobile - 7% discount' },
      { type:'airtime', network:'Airtel', category:'airtime', planName:'Airtime Recharge', planCode:'airtel_airtime', price:0, validity:'Instant', description:'Airtel - 3% discount' },

      // ==================== TV ====================
      // DStv
      { type:'tv', network:'DStv', category:'basic', planName:'Padi', planCode:'dstv-padi', price:4500, validity:'1 Month', description:'45+ channels' },
      { type:'tv', network:'DStv', category:'basic', planName:'Yanga', planCode:'dstv-yanga', price:6100, validity:'1 Month', description:'95+ channels' },
      { type:'tv', network:'DStv', category:'compact', planName:'Confam', planCode:'dstv-confam', price:11100, validity:'1 Month', description:'110+ channels' },
      { type:'tv', network:'DStv', category:'compact', planName:'Compact', planCode:'dstv79', price:19100, validity:'1 Month', description:'130+ channels' },
      { type:'tv', network:'DStv', category:'premium', planName:'Compact Plus', planCode:'dstv7', price:30100, validity:'1 Month', description:'155+ channels' },
      { type:'tv', network:'DStv', category:'premium', planName:'Premium', planCode:'dstv3', price:44600, validity:'1 Month', description:'All channels' },
      // GOtv
      { type:'tv', network:'GOtv', category:'basic', planName:'Smallie', planCode:'gotv-smallie', price:2000, validity:'1 Month', description:'Monthly basic' },
      { type:'tv', network:'GOtv', category:'basic', planName:'Jinja', planCode:'gotv-jinja', price:4000, validity:'1 Month', description:'25+ channels' },
      { type:'tv', network:'GOtv', category:'basic', planName:'Jolli', planCode:'gotv-jolli', price:5900, validity:'1 Month', description:'40+ channels' },
      { type:'tv', network:'GOtv', category:'compact', planName:'Max', planCode:'gotv-max', price:8600, validity:'1 Month', description:'55+ channels' },
      { type:'tv', network:'GOtv', category:'premium', planName:'Supa', planCode:'gotv-supa', price:11500, validity:'1 Month', description:'70+ channels' },
      { type:'tv', network:'GOtv', category:'premium', planName:'Supa Plus', planCode:'gotv-supa-plus', price:16900, validity:'1 Month', description:'All GOtv' },
      // StarTimes
      { type:'tv', network:'StarTimes', category:'basic', planName:'Nova (Ant) 1W', planCode:'nova-weekly', price:800, validity:'1 Week', description:'Nova antenna' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Nova (Dish) 1W', planCode:'nova-dish-weekly', price:800, validity:'1 Week', description:'Nova dish' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Nova (Ant) 1M', planCode:'nova', price:2200, validity:'1 Month', description:'Nova antenna' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Basic (Ant) 1W', planCode:'basic-weekly', price:1500, validity:'1 Week', description:'Basic antenna' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Basic (Dish) 1W', planCode:'smart-weekly', price:1800, validity:'1 Week', description:'Basic dish' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Basic (Ant) 1M', planCode:'basic', price:4100, validity:'1 Month', description:'Basic antenna' },
      { type:'tv', network:'StarTimes', category:'basic', planName:'Basic (Dish) 1M', planCode:'smart', price:5200, validity:'1 Month', description:'Basic dish' },
      { type:'tv', network:'StarTimes', category:'compact', planName:'Classic (Dish) 1W', planCode:'classic-weekly-dish', price:2600, validity:'1 Week', description:'Classic dish' },
      { type:'tv', network:'StarTimes', category:'compact', planName:'Classic (Dish) 1M', planCode:'special-monthly', price:7500, validity:'1 Month', description:'Classic dish' },
      { type:'tv', network:'StarTimes', category:'premium', planName:'Super (Dish) 1W', planCode:'super-weekly', price:3400, validity:'1 Week', description:'Super dish' },
      { type:'tv', network:'StarTimes', category:'premium', planName:'Super (Ant) 1W', planCode:'super-antenna-weekly', price:3300, validity:'1 Week', description:'Super antenna' },
      { type:'tv', network:'StarTimes', category:'premium', planName:'Super (Ant) 1M', planCode:'super-antenna-monthly', price:9600, validity:'1 Month', description:'Super antenna' },
      { type:'tv', network:'StarTimes', category:'premium', planName:'Super (Dish) 1M', planCode:'super', price:9900, validity:'1 Month', description:'Super dish' },

      // ==================== ELECTRICITY ====================
      { type:'electricity', network:'Eko Electric', category:'prepaid', planName:'Prepaid', planCode:'ekedc_prepaid', price:0, validity:'N/A', description:'EKEDC - Code 01' },
      { type:'electricity', network:'Ikeja Electric', category:'prepaid', planName:'Prepaid', planCode:'ikedc_prepaid', price:0, validity:'N/A', description:'IKEDC - Code 02' },
      { type:'electricity', network:'Abuja Electric', category:'prepaid', planName:'Prepaid', planCode:'aedc_prepaid', price:0, validity:'N/A', description:'AEDC - Code 03' },
      { type:'electricity', network:'Kano Electric', category:'prepaid', planName:'Prepaid', planCode:'kedco_prepaid', price:0, validity:'N/A', description:'KEDCO - Code 04' },
      { type:'electricity', network:'Port Harcourt Electric', category:'prepaid', planName:'Prepaid', planCode:'phedc_prepaid', price:0, validity:'N/A', description:'PHEDC - Code 05' },
      { type:'electricity', network:'Jos Electric', category:'prepaid', planName:'Prepaid', planCode:'jedc_prepaid', price:0, validity:'N/A', description:'JEDC - Code 06' },
      { type:'electricity', network:'Ibadan Electric', category:'prepaid', planName:'Prepaid', planCode:'ibedc_prepaid', price:0, validity:'N/A', description:'IBEDC - Code 07' },
      { type:'electricity', network:'Kaduna Electric', category:'prepaid', planName:'Prepaid', planCode:'kaedc_prepaid', price:0, validity:'N/A', description:'KAEDC - Code 08' },
      { type:'electricity', network:'Benin Electric', category:'prepaid', planName:'Prepaid', planCode:'bedc_prepaid', price:0, validity:'N/A', description:'BEDC - Code 10' },
      { type:'electricity', network:'Yola Electric', category:'prepaid', planName:'Prepaid', planCode:'yedc_prepaid', price:0, validity:'N/A', description:'YEDC - Code 11' },
      { type:'electricity', network:'Aba Electric', category:'prepaid', planName:'Prepaid', planCode:'aple_prepaid', price:0, validity:'N/A', description:'APLE - Code 12' },
    ];

    await ServicePrice.insertMany(services);

    console.log('\n========================================');
    console.log('🌱 Database Seeded Successfully!');
    console.log('========================================');
    console.log(`📶 Data Plans:     ${services.filter(s=>s.type==='data').length}`);
    console.log(`📱 Airtime:        ${services.filter(s=>s.type==='airtime').length}`);
    console.log(`📺 TV Packages:    ${services.filter(s=>s.type==='tv').length}`);
    console.log(`⚡ Electricity:    ${services.filter(s=>s.type==='electricity').length}`);
    console.log(`📦 Total:          ${services.length}`);
    console.log('========================================');
    console.log('👤 Admin: admin@zeyeesub.com / admin123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedAll();
