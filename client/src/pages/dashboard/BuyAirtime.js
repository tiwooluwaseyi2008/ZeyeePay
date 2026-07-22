import React, { useState, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import { FaMobileAlt } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const BuyAirtime = () => {
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const res = await api.get('/api/data/services?type=airtime');
      const airtimeServices = res.data.data.services.filter(s => s.type === 'airtime' && s.isActive);
      const uniqueNetworks = [...new Set(airtimeServices.map(s => s.network))];
      setNetworks(uniqueNetworks);
    } catch (error) {
      toast.error('Failed to load networks');
    }
  };

  const handlePhoneChange = (value) => {
    let num = value.replace(/\D/g, '').slice(0, 10);
    if (num.startsWith('0')) {
      num = num.substring(1);
    }
    setPhone(num);
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedNetwork || !phone || !amount) {
      return toast.error('Please fill all fields');
    }
    if (phone.length < 10) {
      return toast.error('Enter a valid phone number');
    }
    if (amount < 50 || amount > 200000) {
      return toast.error('Amount must be between ₦50 and ₦200,000');
    }

    setLoading(true);
    try {
      await api.post('/api/airtime/purchase', {
        network: selectedNetwork,
        phone: '0' + phone,
        amount: parseInt(amount)
      });
      toast.success('Airtime purchase successful!');
      setPhone('');
      setAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="airtime" />
      
      <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
        <h1><FaMobileAlt /> Buy Airtime</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>Instant airtime recharge for all networks</p>

        <form onSubmit={handlePurchase}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Select Network</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {networks.map(net => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setSelectedNetwork(net)}
                  style={{
                    ...styles.networkBtn,
                    borderColor: selectedNetwork === net ? '#28a745' : '#ddd',
                    backgroundColor: selectedNetwork === net ? '#d4edda' : 'white'
                  }}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '12px 15px', background: '#f5f5f5', fontWeight: '600', color: '#666', borderRight: '1px solid #ddd' }}>+234</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="8012345678"
                maxLength="10"
                style={{ ...styles.input, border: 'none', borderRadius: '0' }}
              />
            </div>
            {phone && <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Full number: 0{phone}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (₦)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              {presetAmounts.map(amt => (
                <button key={amt} type="button" onClick={() => setAmount(amt.toString())} style={{
                  ...styles.amountBtn,
                  borderColor: amount === amt.toString() ? '#28a745' : '#ddd',
                  backgroundColor: amount === amt.toString() ? '#d4edda' : 'white'
                }}>
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (₦50 - ₦200,000)"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.buyBtn, backgroundColor: loading ? '#ccc' : '#28a745' }}>
            {loading ? 'Processing...' : `Buy Airtime ${amount ? '₦' + parseInt(amount).toLocaleString() : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  label: { display: 'block', marginBottom: '8px', fontWeight: '600' },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' },
  formGroup: { marginBottom: '20px' },
  networkBtn: { padding: '15px', border: '2px solid', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' },
  amountBtn: { padding: '12px', border: '2px solid', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  buyBtn: { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }
};

export default BuyAirtime;