const mongoose = require('mongoose');
require('dotenv').config();
const ServicePrice = require('../models/ServicePrice');

const services = [
  // Data Plans
  { type: 'data', network: 'MTN', planName: '500MB', planCode: 'mtn_500mb', price: 150, description: '500MB - 30 Days' },
  { type: 'data', network: 'MTN', planName: '1GB', planCode: 'mtn_1gb', price: 300, description: '1GB - 30 Days' },
  { type: 'data', network: 'MTN', planName: '2GB', planCode: 'mtn_2gb', price: 500, description: '2GB - 30 Days' },
  { type: 'data', network: 'MTN', planName: '3GB', planCode: 'mtn_3gb', price: 800, description: '3GB - 30 Days' },
  { type: 'data', network: 'MTN', planName: '5GB', planCode: 'mtn_5gb', price: 1200, description: '5GB - 30 Days' },
  { type: 'data', network: 'MTN', planName: '10GB', planCode: 'mtn_10gb', price: 2000, description: '10GB - 30 Days' },
  
  { type: 'data', network: 'Airtel', planName: '750MB', planCode: 'airtel_750mb', price: 200, description: '750MB - 14 Days' },
  { type: 'data', network: 'Airtel', planName: '1.5GB', planCode: 'airtel_1.5gb', price: 500, description: '1.5GB - 30 Days' },
  { type: 'data', network: 'Airtel', planName: '3GB', planCode: 'airtel_3gb', price: 800, description: '3GB - 30 Days' },
  { type: 'data', network: 'Airtel', planName: '6GB', planCode: 'airtel_6gb', price: 1500, description: '6GB - 30 Days' },
  { type: 'data', network: 'Airtel', planName: '10GB', planCode: 'airtel_10gb', price: 2000, description: '10GB - 30 Days' },
  
  { type: 'data', network: 'Glo', planName: '1.35GB', planCode: 'glo_1.35gb', price: 500, description: '1.35GB - 14 Days' },
  { type: 'data', network: 'Glo', planName: '2.9GB', planCode: 'glo_2.9gb', price: 800, description: '2.9GB - 30 Days' },
  { type: 'data', network: 'Glo', planName: '5.8GB', planCode: 'glo_5.8gb', price: 1500, description: '5.8GB - 30 Days' },
  { type: 'data', network: 'Glo', planName: '7.5GB', planCode: 'glo_7.5gb', price: 2000, description: '7.5GB - 30 Days' },
  
  { type: 'data', network: '9mobile', planName: '1GB', planCode: '9mobile_1gb', price: 500, description: '1GB - 30 Days' },
  { type: 'data', network: '9mobile', planName: '2.5GB', planCode: '9mobile_2.5gb', price: 800, description: '2.5GB - 30 Days' },
  { type: 'data', network: '9mobile', planName: '5GB', planCode: '9mobile_5gb', price: 1500, description: '5GB - 30 Days' },

  // Airtime
  { type: 'airtime', network: 'MTN', planName: 'Airtime Recharge', planCode: 'mtn_airtime', price: 0, description: 'Instant delivery - 2% discount' },
  { type: 'airtime', network: 'Airtel', planName: 'Airtime Recharge', planCode: 'airtel_airtime', price: 0, description: 'Instant delivery - 2% discount' },
  { type: 'airtime', network: 'Glo', planName: 'Airtime Recharge', planCode: 'glo_airtime', price: 0, description: 'Instant delivery - 2% discount' },
  { type: 'airtime', network: '9mobile', planName: 'Airtime Recharge', planCode: '9mobile_airtime', price: 0, description: 'Instant delivery - 2% discount' },

  // TV Packages
  { type: 'tv', network: 'DStv', planName: 'Premium', planCode: 'dstv_premium', price: 24500, description: 'All channels - HD - 1 Month' },
  { type: 'tv', network: 'DStv', planName: 'Compact+', planCode: 'dstv_compact_plus', price: 16600, description: '155+ channels - 1 Month' },
  { type: 'tv', network: 'DStv', planName: 'Compact', planCode: 'dstv_compact', price: 10500, description: '130+ channels - 1 Month' },
  { type: 'tv', network: 'DStv', planName: 'Confam', planCode: 'dstv_confam', price: 7400, description: '110+ channels - 1 Month' },
  { type: 'tv', network: 'DStv', planName: 'Yanga', planCode: 'dstv_yanga', price: 4200, description: '95+ channels - 1 Month' },
  
  { type: 'tv', network: 'GOtv', planName: 'Supa', planCode: 'gotv_supa', price: 6400, description: '70+ channels - 1 Month' },
  { type: 'tv', network: 'GOtv', planName: 'Max', planCode: 'gotv_max', price: 4850, description: '55+ channels - 1 Month' },
  { type: 'tv', network: 'GOtv', planName: 'Joli', planCode: 'gotv_joli', price: 3300, description: '40+ channels - 1 Month' },
  { type: 'tv', network: 'GOtv', planName: 'Jinja', planCode: 'gotv_jinja', price: 2250, description: '25+ channels - 1 Month' },
  
  { type: 'tv', network: 'StarTimes', planName: 'Super', planCode: 'startimes_super', price: 4900, description: '65+ channels - 1 Month' },
  { type: 'tv', network: 'StarTimes', planName: 'Classic', planCode: 'startimes_classic', price: 2600, description: '40+ channels - 1 Month' },
  { type: 'tv', network: 'StarTimes', planName: 'Basic', planCode: 'startimes_basic', price: 1700, description: '25+ channels - 1 Month' },

  // Electricity
  { type: 'electricity', network: 'Ikeja Electric', planName: 'Prepaid', planCode: 'ikeja_prepaid', price: 0, description: 'IKEDC - Instant token delivery' },
  { type: 'electricity', network: 'Eko Electric', planName: 'Prepaid', planCode: 'eko_prepaid', price: 0, description: 'EKEDC - Instant token delivery' },
  { type: 'electricity', network: 'Abuja Electric', planName: 'Prepaid', planCode: 'abuja_prepaid', price: 0, description: 'AEDC - Instant token delivery' },
  { type: 'electricity', network: 'Ibadan Electric', planName: 'Prepaid', planCode: 'ibadan_prepaid', price: 0, description: 'IBEDC - Instant token delivery' },
  { type: 'electricity', network: 'Enugu Electric', planName: 'Prepaid', planCode: 'enugu_prepaid', price: 0, description: 'EEDC - Instant token delivery' },
  { type: 'electricity', network: 'Port Harcourt Electric', planName: 'Prepaid', planCode: 'ph_prepaid', price: 0, description: 'PHEDC - Instant token delivery' },
  { type: 'electricity', network: 'Kano Electric', planName: 'Prepaid', planCode: 'kano_prepaid', price: 0, description: 'KEDCO - Instant token delivery' },
  { type: 'electricity', network: 'Kaduna Electric', planName: 'Prepaid', planCode: 'kaduna_prepaid', price: 0, description: 'KEDCO - Instant token delivery' },
  { type: 'electricity', network: 'Jos Electric', planName: 'Prepaid', planCode: 'jos_prepaid', price: 0, description: 'JEDC - Instant token delivery' },
];

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeyeesub');
    console.log('Connected to MongoDB');
    
    await ServicePrice.deleteMany({});
    await ServicePrice.insertMany(services);
    
    console.log(`${services.length} services seeded with full descriptions!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedServices();
