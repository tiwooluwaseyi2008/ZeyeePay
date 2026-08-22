const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ServicePrice = require('../models/ServicePrice');

const updatePrices = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeyeesub';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    // ClubKonnect original prices (what YOU pay)
    const clubKonnectPrices = {
  // MTN
  'mtn_100.01': 97, 'mtn_200.01': 194, 'mtn_350.01': 340, 'mtn_500.01': 485,
  'mtn_500': 307, 'mtn_1000': 410, 'mtn_2000': 820, 'mtn_3000': 1230, 'mtn_5000': 2050,
  'mtn_500.00': 307, 'mtn_1000.00': 563, 'mtn_2000.00': 1117, 'mtn_3000.00': 1629, 'mtn_5000.00': 2511,
  'mtn_4500.01': 4365, 'mtn_7500.01': 7275,
  // Airtel
  'airtel_499.91': 485, 'airtel_599.91': 582, 'airtel_999.91': 970,
  'airtel_499.92': 485, 'airtel_799.91': 776, 'airtel_999.92': 970, 'airtel_2499.91': 2425,
  'airtel_1499.93': 1455, 'airtel_1999.91': 1940, 'airtel_2999.92': 2910, 'airtel_3999.91': 3880, 'airtel_5999.91': 5820, 'airtel_7999.91': 7760,
  // Glo
  'glo_100.01': 97, 'glo_200.01': 194, 'glo_500.01': 485,
  'glo_200': 94, 'glo_500': 230, 'glo_1000.12': 357,
  'glo_1000': 461, 'glo_2000': 922, 'glo_3000': 1383, 'glo_5000': 2306, 'glo_10000': 4612,
  'glo_1500.01': 1455,
  // 9mobile
  '9mobile_100.01': 93, '9mobile_150.01': 140, '9mobile_500.01': 465, '9mobile_1500.01': 1395,
  '9mobile_500': 246, '9mobile_1000': 492, '9mobile_2000': 984, '9mobile_3000': 1476, '9mobile_5000': 2460, '9mobile_10000': 4920,
};

    // Discount rates per network
    const rates = {
      'MTN': 0.970,
      'Airtel': 0.970,
      'Glo': 0.955,
      '9mobile': 0.930,
    };

    const services = await ServicePrice.find({ type: 'data' });
    let updated = 0;

    for (const service of services) {
      const originalPrice = clubKonnectPrices[service.planCode];
      const rate = rates[service.network] || 0.970;

      if (originalPrice) {
        // Formula: (originalPrice / rate) + 10% markup, rounded up
        let newPrice = Math.ceil((originalPrice / rate) * 1.10);
        
        console.log(`${service.network} | ${service.planName} | ₦${originalPrice} → ₦${newPrice}`);
        
        service.price = newPrice;
        await service.save();
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} data plans`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

updatePrices();
