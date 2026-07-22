const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ServicePrice = require('../models/ServicePrice');

const dataPlans = [
  // MTN DAILY
  { type: 'data', network: 'MTN', category: 'daily', planName: '50MB', planCode: 'mtn_daily_50mb', price: 100, validity: '1 Day' },
  { type: 'data', network: 'MTN', category: 'daily', planName: '100MB', planCode: 'mtn_daily_100mb', price: 150, validity: '1 Day' },
  { type: 'data', network: 'MTN', category: 'daily', planName: '200MB', planCode: 'mtn_daily_200mb', price: 200, validity: '1 Day' },
  { type: 'data', network: 'MTN', category: 'daily', planName: '500MB', planCode: 'mtn_daily_500mb', price: 300, validity: '1 Day' },
  { type: 'data', network: 'MTN', category: 'daily', planName: '1GB', planCode: 'mtn_daily_1gb', price: 500, validity: '1 Day' },

  // MTN WEEKLY
  { type: 'data', network: 'MTN', category: 'weekly', planName: '1GB', planCode: 'mtn_weekly_1gb', price: 600, validity: '7 Days' },
  { type: 'data', network: 'MTN', category: 'weekly', planName: '2GB', planCode: 'mtn_weekly_2gb', price: 1000, validity: '7 Days' },
  { type: 'data', network: 'MTN', category: 'weekly', planName: '3GB', planCode: 'mtn_weekly_3gb', price: 1500, validity: '7 Days' },
  { type: 'data', network: 'MTN', category: 'weekly', planName: '5GB', planCode: 'mtn_weekly_5gb', price: 2000, validity: '7 Days' },

  // MTN MONTHLY
  { type: 'data', network: 'MTN', category: 'monthly', planName: '1.5GB', planCode: 'mtn_monthly_1.5gb', price: 500, validity: '30 Days', isPopular: true },
  { type: 'data', network: 'MTN', category: 'monthly', planName: '2GB', planCode: 'mtn_monthly_2gb', price: 800, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'monthly', planName: '3GB', planCode: 'mtn_monthly_3gb', price: 1000, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'monthly', planName: '5GB', planCode: 'mtn_monthly_5gb', price: 1500, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'monthly', planName: '10GB', planCode: 'mtn_monthly_10gb', price: 2500, validity: '30 Days' },

  // MTN SME
  { type: 'data', network: 'MTN', category: 'sme', planName: '500MB SME', planCode: 'mtn_sme_500mb', price: 150, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'sme', planName: '1GB SME', planCode: 'mtn_sme_1gb', price: 300, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'sme', planName: '2GB SME', planCode: 'mtn_sme_2gb', price: 500, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'sme', planName: '5GB SME', planCode: 'mtn_sme_5gb', price: 1200, validity: '30 Days' },

  // MTN NIGHT
  { type: 'data', network: 'MTN', category: 'night', planName: '250MB Night', planCode: 'mtn_night_250mb', price: 50, validity: '1 Night' },
  { type: 'data', network: 'MTN', category: 'night', planName: '500MB Night', planCode: 'mtn_night_500mb', price: 100, validity: '1 Night' },
  { type: 'data', network: 'MTN', category: 'night', planName: '1GB Night', planCode: 'mtn_night_1gb', price: 200, validity: '1 Night' },

  // MTN SOCIAL
  { type: 'data', network: 'MTN', category: 'social', planName: 'WhatsApp', planCode: 'mtn_social_whatsapp', price: 150, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'social', planName: 'Instagram', planCode: 'mtn_social_instagram', price: 200, validity: '30 Days' },
  { type: 'data', network: 'MTN', category: 'social', planName: 'YouTube', planCode: 'mtn_social_youtube', price: 300, validity: '30 Days' },

  // AIRTEL
  { type: 'data', network: 'Airtel', category: 'daily', planName: '100MB', planCode: 'airtel_daily_100mb', price: 150, validity: '1 Day' },
  { type: 'data', network: 'Airtel', category: 'daily', planName: '500MB', planCode: 'airtel_daily_500mb', price: 300, validity: '1 Day' },
  { type: 'data', network: 'Airtel', category: 'weekly', planName: '750MB', planCode: 'airtel_weekly_750mb', price: 500, validity: '7 Days' },
  { type: 'data', network: 'Airtel', category: 'weekly', planName: '1.5GB', planCode: 'airtel_weekly_1.5gb', price: 800, validity: '7 Days' },
  { type: 'data', network: 'Airtel', category: 'monthly', planName: '1.5GB', planCode: 'airtel_monthly_1.5gb', price: 500, validity: '30 Days', isPopular: true },
  { type: 'data', network: 'Airtel', category: 'monthly', planName: '3GB', planCode: 'airtel_monthly_3gb', price: 1000, validity: '30 Days' },
  { type: 'data', network: 'Airtel', category: 'monthly', planName: '6GB', planCode: 'airtel_monthly_6gb', price: 1500, validity: '30 Days' },
  { type: 'data', network: 'Airtel', category: 'sme', planName: '1GB SME', planCode: 'airtel_sme_1gb', price: 300, validity: '30 Days' },
  { type: 'data', network: 'Airtel', category: 'sme', planName: '5GB SME', planCode: 'airtel_sme_5gb', price: 1200, validity: '30 Days' },

  // GLO
  { type: 'data', network: 'Glo', category: 'daily', planName: '100MB', planCode: 'glo_daily_100mb', price: 100, validity: '1 Day' },
  { type: 'data', network: 'Glo', category: 'weekly', planName: '1.35GB', planCode: 'glo_weekly_1.35gb', price: 500, validity: '7 Days', isPopular: true },
  { type: 'data', network: 'Glo', category: 'monthly', planName: '2.9GB', planCode: 'glo_monthly_2.9gb', price: 800, validity: '30 Days' },
  { type: 'data', network: 'Glo', category: 'monthly', planName: '5.8GB', planCode: 'glo_monthly_5.8gb', price: 1500, validity: '30 Days' },

  // 9MOBILE
  { type: 'data', network: '9mobile', category: 'daily', planName: '100MB', planCode: '9mobile_daily_100mb', price: 150, validity: '1 Day' },
  { type: 'data', network: '9mobile', category: 'weekly', planName: '1GB', planCode: '9mobile_weekly_1gb', price: 500, validity: '7 Days' },
  { type: 'data', network: '9mobile', category: 'monthly', planName: '1GB', planCode: '9mobile_monthly_1gb', price: 500, validity: '30 Days', isPopular: true },
  { type: 'data', network: '9mobile', category: 'monthly', planName: '2.5GB', planCode: '9mobile_monthly_2.5gb', price: 800, validity: '30 Days' },
];

const seedDataPlans = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payswift_vtu';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    await ServicePrice.deleteMany({ type: 'data' });
    await ServicePrice.insertMany(dataPlans);
    
    console.log(`${dataPlans.length} data plans seeded!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedDataPlans();