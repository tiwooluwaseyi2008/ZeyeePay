const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const ServicePrice = require('../models/ServicePrice');

// Original ClubKonnect prices (what you pay)
const originalPrices = {
  // MTN
  'mtn_100.01': 97, 'mtn_200.01': 194, 'mtn_350.01': 340, 'mtn_500.01': 485,
  'mtn_900.01': 873, 'mtn_1000.01': 970,
  'mtn_500': 307, 'mtn_1000': 410, 'mtn_2000': 820, 'mtn_3000': 1230, 'mtn_5000': 2050,
  'mtn_500.02': 485, 'mtn_800.01': 776, 'mtn_1000.03': 970, 'mtn_1500.03': 1455, 'mtn_2500.01': 2425, 'mtn_3500.01': 3395, 'mtn_5000.01': 4850,
  'mtn_500.00': 307, 'mtn_1000.00': 563, 'mtn_2000.00': 1117, 'mtn_3000.00': 1629, 'mtn_5000.00': 2511,
  'mtn_1500.02': 1455, 'mtn_2000.01': 1940, 'mtn_2500.02': 2425, 'mtn_3500.02': 3395, 'mtn_4500.01': 4365, 'mtn_5500.01': 5335,
  'mtn_6500.01': 6305, 'mtn_7500.01': 7275, 'mtn_9000.01': 8730, 'mtn_11000.01': 10670, 'mtn_18000.01': 17460, 'mtn_35000.01': 33950,
  'mtn_40000.01': 38800, 'mtn_90000.03': 87300,
  // Airtel
  'airtel_499.91': 485, 'airtel_599.91': 582, 'airtel_749.91': 727, 'airtel_999.91': 970, 'airtel_1499.91': 1455,
  'airtel_499.92': 485, 'airtel_799.91': 776, 'airtel_999.92': 970, 'airtel_1499.92': 1455, 'airtel_2499.91': 2425, 'airtel_2999.91': 2910, 'airtel_4999.91': 4850,
  'airtel_1499.93': 1455, 'airtel_1999.91': 1940, 'airtel_2499.92': 2425, 'airtel_2999.92': 2910, 'airtel_3999.91': 3880,
  'airtel_4999.92': 4850, 'airtel_5999.91': 5820, 'airtel_7999.91': 7760, 'airtel_9999.91': 9700, 'airtel_14999.91': 14550, 'airtel_19999.91': 19400,
  'airtel_49999.91': 48500, 'airtel_59999.91': 58200,
  // Glo
  'glo_100.01': 97, 'glo_200.01': 194, 'glo_200.02': 194, 'glo_500.03': 485,
  'glo_500': 230, 'glo_1000.12': 357, 'glo_3000.12': 1072, 'glo_5000.12': 1787,
  'glo_1000.21': 357, 'glo_3000.21': 1072, 'glo_5000.21': 1787, 'glo_10000.21': 3574,
  'glo_1000': 461, 'glo_2000': 922, 'glo_3000': 1383, 'glo_5000': 2306, 'glo_10000': 4612,
  'glo_500.01': 485, 'glo_1000.01': 970, 'glo_1500.01': 1455, 'glo_2000.01': 1940, 'glo_2500.01': 2425,
  'glo_3000.01': 2910, 'glo_4000.01': 3880, 'glo_5000.01': 4850, 'glo_8000.01': 7760, 'glo_10000.01': 9700,
  'glo_15000.01': 14550, 'glo_20000.01': 19400, 'glo_30000.01': 29100, 'glo_36000.01': 38800,
  'glo_50000.01': 48500, 'glo_60000.01': 58200, 'glo_75000.01': 72750, 'glo_150000.03': 150000,
  // 9mobile
  '9mobile_100.01': 93, '9mobile_150.01': 140, '9mobile_200.01': 186, '9mobile_350.01': 326, '9mobile_500.01': 465,
  '9mobile_1500.01': 1395, '9mobile_600.01': 558,
  '9mobile_50': 25, '9mobile_100': 51, '9mobile_300': 153, '9mobile_500': 246, '9mobile_1000': 492,
  '9mobile_2000': 984, '9mobile_3000': 1476, '9mobile_4000': 1968, '9mobile_5000': 2460,
  '9mobile_10000': 4920, '9mobile_15000': 7380, '9mobile_20000': 9840, '9mobile_25000': 12300,
  '9mobile_1000.01': 930, '9mobile_1200.01': 1116, '9mobile_2000.01': 1860, '9mobile_2500.01': 2325,
  '9mobile_3000.01': 2790, '9mobile_4000.01': 3720, '9mobile_5000.01': 4650,
  '9mobile_12000.01': 11160, '9mobile_18500.01': 17205, '9mobile_20000.01': 18600, '9mobile_30000.01': 27900,
};

// Discount rates
const rates = {
  'MTN': 0.970,
  'Airtel': 0.970,
  'Glo': 0.955,
  '9mobile': 0.930,
};

const removeMarkup = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zeyeesub';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    const services = await ServicePrice.find({ type: 'data' });
    let updated = 0;

    for (const service of services) {
      const originalCost = originalPrices[service.planCode];
      const rate = rates[service.network] || 0.970;

      if (originalCost) {
        // New price: just cost/rate, rounded up (NO 10% markup)
        const newPrice = Math.ceil(originalCost / rate);
        
        if (service.price !== newPrice) {
          console.log(`${service.network} | ${service.planName} | ₦${service.price} → ₦${newPrice}`);
          service.price = newPrice;
          await service.save();
          updated++;
        }
      }
    }

    console.log(`\n✅ Updated ${updated} data plans (removed 10% markup)`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

removeMarkup();
