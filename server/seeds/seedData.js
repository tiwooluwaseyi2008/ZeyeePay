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
    // 1. CREATE ADMIN USER
    // ==========================================
    const existingAdmin = await User.findOne({ email: 'admin@zeyeesub.com' });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@zeyeesub.com',
        phone: '08105002814',
        password: hashedPassword,
        walletBalance: 1000000,
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      console.log('✅ Admin created: admin@zeyeesub.com / admin123');
    } else {
      console.log('✅ Admin already exists');
    }

    // ==========================================
    // 2. DELETE EXISTING SERVICES & SEED NEW ONES
    // ==========================================
    await ServicePrice.deleteMany({});
    console.log('Old services cleared');

    const services = [
      // ========== DATA PLANS ==========
      // ========== DATA PLANS (Unique Plan Codes) ==========
// Format: network_originalcode

// MTN
{ type: 'data', network: 'MTN', category: 'daily', planName: '110MB', planCode: 'mtn_100.01', price: 100, validity: '1 Day' },
{ type: 'data', network: 'MTN', category: 'daily', planName: '230MB', planCode: 'mtn_200.01', price: 200, validity: '1 Day' },
{ type: 'data', network: 'MTN', category: 'daily', planName: '500MB', planCode: 'mtn_350.01', price: 350, validity: '1 Day' },
{ type: 'data', network: 'MTN', category: 'daily', planName: '1GB', planCode: 'mtn_500.01', price: 500, validity: '1 Day' },
{ type: 'data', network: 'MTN', category: 'weekly', planName: '500MB SME', planCode: 'mtn_500', price: 317, validity: '7 Days' },
{ type: 'data', network: 'MTN', category: 'weekly', planName: '1GB SME', planCode: 'mtn_1000', price: 423, validity: '7 Days' },
{ type: 'data', network: 'MTN', category: 'weekly', planName: '2GB SME', planCode: 'mtn_2000', price: 846, validity: '7 Days' },
{ type: 'data', network: 'MTN', category: 'weekly', planName: '3GB SME', planCode: 'mtn_3000', price: 1269, validity: '7 Days' },
{ type: 'data', network: 'MTN', category: 'weekly', planName: '5GB SME', planCode: 'mtn_5000', price: 2114, validity: '7 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '500MB SME', planCode: 'mtn_500.00', price: 317, validity: '30 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '1GB SME', planCode: 'mtn_1000.00', price: 581, validity: '30 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '2GB SME', planCode: 'mtn_2000.00', price: 1152, validity: '30 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '3GB SME', planCode: 'mtn_3000.00', price: 1680, validity: '30 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '5GB SME', planCode: 'mtn_5000.00', price: 2589, validity: '30 Days' },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '10GB', planCode: 'mtn_4500.01', price: 4500, validity: '30 Days', isPopular: true },
{ type: 'data', network: 'MTN', category: 'monthly', planName: '20GB', planCode: 'mtn_7500.01', price: 7500, validity: '30 Days' },

// Airtel
{ type: 'data', network: 'Airtel', category: 'daily', planName: '1GB', planCode: 'airtel_499.91', price: 500, validity: '1 Day' },
{ type: 'data', network: 'Airtel', category: 'daily', planName: '1.5GB', planCode: 'airtel_599.91', price: 600, validity: '2 Days' },
{ type: 'data', network: 'Airtel', category: 'daily', planName: '3GB', planCode: 'airtel_999.91', price: 1000, validity: '2 Days' },
{ type: 'data', network: 'Airtel', category: 'weekly', planName: '500MB', planCode: 'airtel_499.92', price: 500, validity: '7 Days' },
{ type: 'data', network: 'Airtel', category: 'weekly', planName: '1GB', planCode: 'airtel_799.91', price: 800, validity: '7 Days' },
{ type: 'data', network: 'Airtel', category: 'weekly', planName: '1.5GB', planCode: 'airtel_999.92', price: 1000, validity: '7 Days' },
{ type: 'data', network: 'Airtel', category: 'weekly', planName: '6GB', planCode: 'airtel_2499.91', price: 2500, validity: '7 Days' },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '2GB', planCode: 'airtel_1499.93', price: 1500, validity: '30 Days' },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '3GB', planCode: 'airtel_1999.91', price: 2000, validity: '30 Days' },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '8GB', planCode: 'airtel_2999.92', price: 3000, validity: '30 Days' },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '10GB', planCode: 'airtel_3999.91', price: 4000, validity: '30 Days', isPopular: true },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '18GB', planCode: 'airtel_5999.91', price: 6000, validity: '30 Days' },
{ type: 'data', network: 'Airtel', category: 'monthly', planName: '25GB', planCode: 'airtel_7999.91', price: 8000, validity: '30 Days' },

// Glo
{ type: 'data', network: 'Glo', category: 'daily', planName: '125MB', planCode: 'glo_100.01', price: 102, validity: '1 Day' },
{ type: 'data', network: 'Glo', category: 'daily', planName: '260MB', planCode: 'glo_200.01', price: 204, validity: '2 Days' },
{ type: 'data', network: 'Glo', category: 'daily', planName: '1.5GB', planCode: 'glo_500.01', price: 508, validity: '14 Days', isPopular: true },
{ type: 'data', network: 'Glo', category: 'weekly', planName: '200MB', planCode: 'glo_200', price: 99, validity: '14 Days' },
{ type: 'data', network: 'Glo', category: 'weekly', planName: '500MB', planCode: 'glo_500', price: 241, validity: '7 Days' },
{ type: 'data', network: 'Glo', category: 'weekly', planName: '1GB', planCode: 'glo_1000.12', price: 374, validity: '7 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '1GB', planCode: 'glo_1000', price: 483, validity: '30 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '2GB', planCode: 'glo_2000', price: 966, validity: '30 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '3GB', planCode: 'glo_3000', price: 1449, validity: '30 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '5GB', planCode: 'glo_5000', price: 2414, validity: '30 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '10GB', planCode: 'glo_10000', price: 4828, validity: '30 Days' },
{ type: 'data', network: 'Glo', category: 'monthly', planName: '5GB Direct', planCode: 'glo_1500.01', price: 1524, validity: '30 Days' },

// 9mobile
{ type: 'data', network: '9mobile', category: 'daily', planName: '100MB', planCode: '9mobile_100.01', price: 100, validity: '1 Day' },
{ type: 'data', network: '9mobile', category: 'daily', planName: '180MB', planCode: '9mobile_150.01', price: 150, validity: '1 Day' },
{ type: 'data', network: '9mobile', category: 'weekly', planName: '650MB', planCode: '9mobile_500.01', price: 500, validity: '3 Days' },
{ type: 'data', network: '9mobile', category: 'weekly', planName: '1.75GB', planCode: '9mobile_1500.01', price: 1500, validity: '7 Days' },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '500MB SME', planCode: '9mobile_500', price: 265, validity: '30 Days' },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '1GB SME', planCode: '9mobile_1000', price: 530, validity: '30 Days', isPopular: true },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '2GB SME', planCode: '9mobile_2000', price: 1059, validity: '30 Days' },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '3GB SME', planCode: '9mobile_3000', price: 1588, validity: '30 Days' },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '5GB SME', planCode: '9mobile_5000', price: 2646, validity: '30 Days' },
{ type: 'data', network: '9mobile', category: 'monthly', planName: '10GB SME', planCode: '9mobile_10000', price: 5291, validity: '30 Days' },
      // ========== AIRTIME ==========
      // ========== AIRTIME (ClubKonnect Network Codes) ==========
// MTN=01, Glo=02, 9mobile=03, Airtel=04
{ type: 'airtime', network: 'MTN', category: 'airtime', planName: 'Airtime Recharge', planCode: 'mtn_airtime', price: 0, validity: 'Instant', description: 'MTN (Code: 01) - 3% discount - Min ₦50' },
{ type: 'airtime', network: 'Glo', category: 'airtime', planName: 'Airtime Recharge', planCode: 'glo_airtime', price: 0, validity: 'Instant', description: 'Glo (Code: 02) - 8% discount - Min ₦50' },
{ type: 'airtime', network: '9mobile', category: 'airtime', planName: 'Airtime Recharge', planCode: '9mobile_airtime', price: 0, validity: 'Instant', description: '9mobile (Code: 03) - 7% discount - Min ₦50' },
{ type: 'airtime', network: 'Airtel', category: 'airtime', planName: 'Airtime Recharge', planCode: 'airtel_airtime', price: 0, validity: 'Instant', description: 'Airtel (Code: 04) - 3% discount - Min ₦50' },

      // ========== TV SUBSCRIPTIONS ==========
      // ========== CABLE TV (ClubKonnect Real Package Codes) ==========
// DStv
{ type: 'tv', network: 'DStv', category: 'basic', planName: 'Padi', planCode: 'dstv-padi', price: 4500, validity: '1 Month', description: '45+ channels' },
{ type: 'tv', network: 'DStv', category: 'basic', planName: 'Yanga', planCode: 'dstv-yanga', price: 6100, validity: '1 Month', description: '95+ channels' },
{ type: 'tv', network: 'DStv', category: 'compact', planName: 'Confam', planCode: 'dstv-confam', price: 11100, validity: '1 Month', description: '110+ channels' },
{ type: 'tv', network: 'DStv', category: 'compact', planName: 'Compact', planCode: 'dstv79', price: 19100, validity: '1 Month', description: '130+ channels' },
{ type: 'tv', network: 'DStv', category: 'premium', planName: 'Compact Plus', planCode: 'dstv7', price: 30100, validity: '1 Month', description: '155+ channels' },
{ type: 'tv', network: 'DStv', category: 'premium', planName: 'Premium', planCode: 'dstv3', price: 44600, validity: '1 Month', description: 'All channels - HD' },

// GOtv
{ type: 'tv', network: 'GOtv', category: 'basic', planName: 'Smallie', planCode: 'gotv-smallie', price: 2000, validity: '1 Month', description: 'Monthly basic' },
{ type: 'tv', network: 'GOtv', category: 'basic', planName: 'Jinja', planCode: 'gotv-jinja', price: 4000, validity: '1 Month', description: '25+ channels' },
{ type: 'tv', network: 'GOtv', category: 'basic', planName: 'Jolli', planCode: 'gotv-jolli', price: 5900, validity: '1 Month', description: '40+ channels' },
{ type: 'tv', network: 'GOtv', category: 'compact', planName: 'Max', planCode: 'gotv-max', price: 8600, validity: '1 Month', description: '55+ channels' },
{ type: 'tv', network: 'GOtv', category: 'premium', planName: 'Supa', planCode: 'gotv-supa', price: 11500, validity: '1 Month', description: '70+ channels' },
{ type: 'tv', network: 'GOtv', category: 'premium', planName: 'Supa Plus', planCode: 'gotv-supa-plus', price: 16900, validity: '1 Month', description: 'All GOtv channels' },

// StarTimes
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Nova (Antenna) 1W', planCode: 'nova-weekly', price: 800, validity: '1 Week', description: 'Nova antenna weekly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Nova (Dish) 1W', planCode: 'nova-dish-weekly', price: 800, validity: '1 Week', description: 'Nova dish weekly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Nova (Antenna) 1M', planCode: 'nova', price: 2200, validity: '1 Month', description: 'Nova antenna monthly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Basic (Antenna) 1W', planCode: 'basic-weekly', price: 1500, validity: '1 Week', description: 'Basic antenna weekly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Basic (Dish) 1W', planCode: 'smart-weekly', price: 1800, validity: '1 Week', description: 'Basic dish weekly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Basic (Antenna) 1M', planCode: 'basic', price: 4100, validity: '1 Month', description: 'Basic antenna monthly' },
{ type: 'tv', network: 'StarTimes', category: 'basic', planName: 'Basic (Dish) 1M', planCode: 'smart', price: 5200, validity: '1 Month', description: 'Basic dish monthly' },
{ type: 'tv', network: 'StarTimes', category: 'compact', planName: 'Classic (Dish) 1W', planCode: 'classic-weekly-dish', price: 2600, validity: '1 Week', description: 'Classic dish weekly' },
{ type: 'tv', network: 'StarTimes', category: 'compact', planName: 'Classic (Dish) 1M', planCode: 'special-monthly', price: 7500, validity: '1 Month', description: 'Classic dish monthly' },
{ type: 'tv', network: 'StarTimes', category: 'premium', planName: 'Super (Dish) 1W', planCode: 'super-weekly', price: 3400, validity: '1 Week', description: 'Super dish weekly' },
{ type: 'tv', network: 'StarTimes', category: 'premium', planName: 'Super (Antenna) 1W', planCode: 'super-antenna-weekly', price: 3300, validity: '1 Week', description: 'Super antenna weekly' },
{ type: 'tv', network: 'StarTimes', category: 'premium', planName: 'Super (Antenna) 1M', planCode: 'super-antenna-monthly', price: 9600, validity: '1 Month', description: 'Super antenna monthly' },
{ type: 'tv', network: 'StarTimes', category: 'premium', planName: 'Super (Dish) 1M', planCode: 'super', price: 9900, validity: '1 Month', description: 'Super dish monthly' },

      // ========== ELECTRICITY ==========
      // ========== ELECTRICITY (ClubKonnect Company Codes) ==========
// ClubKonnect uses numeric codes for each Disco
{ type: 'electricity', network: 'Eko Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'ekedc_prepaid', price: 0, validity: 'N/A', description: 'EKEDC (Code: 01) - Min ₦1,000' },
{ type: 'electricity', network: 'Eko Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'ekedc_postpaid', price: 0, validity: 'N/A', description: 'EKEDC (Code: 01) - Min ₦1,000' },
{ type: 'electricity', network: 'Ikeja Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'ikedc_prepaid', price: 0, validity: 'N/A', description: 'IKEDC (Code: 02) - Min ₦1,000' },
{ type: 'electricity', network: 'Ikeja Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'ikedc_postpaid', price: 0, validity: 'N/A', description: 'IKEDC (Code: 02) - Min ₦1,000' },
{ type: 'electricity', network: 'Abuja Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'aedc_prepaid', price: 0, validity: 'N/A', description: 'AEDC (Code: 03) - Min ₦1,000' },
{ type: 'electricity', network: 'Abuja Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'aedc_postpaid', price: 0, validity: 'N/A', description: 'AEDC (Code: 03) - Min ₦1,000' },
{ type: 'electricity', network: 'Kano Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'kedco_prepaid', price: 0, validity: 'N/A', description: 'KEDCO (Code: 04) - Min ₦1,000' },
{ type: 'electricity', network: 'Kano Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'kedco_postpaid', price: 0, validity: 'N/A', description: 'KEDCO (Code: 04) - Min ₦1,000' },
{ type: 'electricity', network: 'Port Harcourt Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'phedc_prepaid', price: 0, validity: 'N/A', description: 'PHEDC (Code: 05) - Min ₦1,000' },
{ type: 'electricity', network: 'Port Harcourt Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'phedc_postpaid', price: 0, validity: 'N/A', description: 'PHEDC (Code: 05) - Min ₦1,000' },
{ type: 'electricity', network: 'Jos Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'jedc_prepaid', price: 0, validity: 'N/A', description: 'JEDC (Code: 06) - Min ₦1,000' },
{ type: 'electricity', network: 'Jos Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'jedc_postpaid', price: 0, validity: 'N/A', description: 'JEDC (Code: 06) - Min ₦1,000' },
{ type: 'electricity', network: 'Ibadan Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'ibedc_prepaid', price: 0, validity: 'N/A', description: 'IBEDC (Code: 07) - Min ₦1,000' },
{ type: 'electricity', network: 'Ibadan Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'ibedc_postpaid', price: 0, validity: 'N/A', description: 'IBEDC (Code: 07) - Min ₦1,000' },
{ type: 'electricity', network: 'Kaduna Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'kaedc_prepaid', price: 0, validity: 'N/A', description: 'KAEDC (Code: 08) - Min ₦1,000' },
{ type: 'electricity', network: 'Kaduna Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'kaedc_postpaid', price: 0, validity: 'N/A', description: 'KAEDC (Code: 08) - Min ₦1,000' },
{ type: 'electricity', network: 'Benin Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'bedc_prepaid', price: 0, validity: 'N/A', description: 'BEDC (Code: 10) - Min ₦1,000' },
{ type: 'electricity', network: 'Benin Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'bedc_postpaid', price: 0, validity: 'N/A', description: 'BEDC (Code: 10) - Min ₦1,000' },
{ type: 'electricity', network: 'Yola Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'yedc_prepaid', price: 0, validity: 'N/A', description: 'YEDC (Code: 11) - Min ₦1,000' },
{ type: 'electricity', network: 'Yola Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'yedc_postpaid', price: 0, validity: 'N/A', description: 'YEDC (Code: 11) - Min ₦1,000' },
{ type: 'electricity', network: 'Aba Electric', category: 'prepaid', planName: 'Prepaid', planCode: 'aple_prepaid', price: 0, validity: 'N/A', description: 'APLE (Code: 12) - Min ₦1,000' },
{ type: 'electricity', network: 'Aba Electric', category: 'postpaid', planName: 'Postpaid', planCode: 'aple_postpaid', price: 0, validity: 'N/A', description: 'APLE (Code: 12) - Min ₦1,000' },
    ];

    await ServicePrice.insertMany(services);

    // ==========================================
    // 3. SUMMARY
    // ==========================================
    const counts = {
      data: services.filter(s => s.type === 'data').length,
      airtime: services.filter(s => s.type === 'airtime').length,
      tv: services.filter(s => s.type === 'tv').length,
      electricity: services.filter(s => s.type === 'electricity').length,
    };

    console.log('\n========================================');
    console.log('🌱 Database Seeded Successfully!');
    console.log('========================================');
    console.log(`📶 Data Plans:     ${counts.data}`);
    console.log(`📱 Airtime:        ${counts.airtime}`);
    console.log(`📺 TV Packages:    ${counts.tv}`);
    console.log(`⚡ Electricity:    ${counts.electricity}`);
    console.log(`📦 Total Services: ${services.length}`);
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
