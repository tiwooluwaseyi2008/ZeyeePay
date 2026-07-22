require('dotenv').config();
const IACafeProvider = require('./services/providers/IACafeProvider');

const test = async () => {
  const provider = new IACafeProvider();
  
  // Test 1: Try verify-customer with different params
  console.log('=== Test 1: verify-customer ===');
  try {
    const res = await provider.request('verify-customer', {
      type: 'tv',
      provider: 'dstv',
      smartcard_number: '1234567890'
    });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }

  // Test 2: Try variations endpoint to see available packages
  console.log('\n=== Test 2: Get DStv packages ===');
  try {
    const res = await provider.request('variations', {
      service: 'tv',
      provider: 'dstv'
    });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
};

test();