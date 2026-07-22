const mongoose = require('mongoose');
require('dotenv').config();
const ServicePrice = require('../models/ServicePrice');

const services = [
  // Data Plans
  { type: 'data', network: 'MTN', planName: '500MB', planCode: 'mtn_500mb', price: 150 },
  { type: 'data', network: 'MTN', planName: '1GB', planCode: 'mtn_1gb', price: 300 },
  { type: 'data', network: 'MTN', planName: '2GB', planCode: 'mtn_2gb', price: 500 },
  { type: 'data', network: 'MTN', planName: '5GB', planCode: 'mtn_5gb', price: 1200 },
  { type: 'data', network: 'Airtel', planName: '750MB', planCode: 'airtel_750mb', price: 200 },
  { type: 'data', network: 'Airtel', planName: '1.5GB', planCode: 'airtel_1.5gb', price: 500 },
  { type: 'data', network: 'Glo', planName: '1.35GB', planCode: 'glo_1.35gb', price: 500 },
  { type: 'data', network: '9mobile', planName: '1GB', planCode: '9mobile_1gb', price: 500 },
  // TV Packages
  { type: 'tv', network: 'DStv', planName: 'Premium', planCode: 'dstv_premium', price: 24500 },
  { type: 'tv', network: 'DStv', planName: 'Compact+', planCode: 'dstv_compact_plus', price: 16600 },
  { type: 'tv', network: 'GOtv', planName: 'Supa', planCode: 'gotv_supa', price: 6400 },
  { type: 'tv', network: 'GOtv', planName: 'Max', planCode: 'gotv_max', price: 4850 },
  { type: 'tv', network: 'StarTimes', planName: 'Super', planCode: 'startimes_super', price: 4900 },
    // Airtime (discount rates)
  { type: 'airtime', network: 'MTN', planName: 'Airtime', planCode: 'mtn_airtime', price: 0, description: '2% discount' },
  { type: 'airtime', network: 'Airtel', planName: 'Airtime', planCode: 'airtel_airtime', price: 0, description: '2% discount' },
  { type: 'airtime', network: 'Glo', planName: 'Airtime', planCode: 'glo_airtime', price: 0, description: '2% discount' },
  { type: 'airtime', network: '9mobile', planName: 'Airtime', planCode: '9mobile_airtime', price: 0, description: '2% discount' },
    // Electricity
  { type: 'electricity', network: 'Ikeja Electric', planName: 'Prepaid', planCode: 'ikeja_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Eko Electric', planName: 'Prepaid', planCode: 'eko_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Abuja Electric', planName: 'Prepaid', planCode: 'abuja_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Ibadan Electric', planName: 'Prepaid', planCode: 'ibadan_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Enugu Electric', planName: 'Prepaid', planCode: 'enugu_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Port Harcourt Electric', planName: 'Prepaid', planCode: 'ph_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Kano Electric', planName: 'Prepaid', planCode: 'kano_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Kaduna Electric', planName: 'Prepaid', planCode: 'kaduna_prepaid', price: 0, description: 'Minimum ₦1000' },
  { type: 'electricity', network: 'Jos Electric', planName: 'Prepaid', planCode: 'jos_prepaid', price: 0, description: 'Minimum ₦1000' },
];

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payswift_vtu');
    console.log('Connected to MongoDB');
    
    await ServicePrice.deleteMany({});
    await ServicePrice.insertMany(services);
    
    console.log(`${services.length} services seeded successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedServices();