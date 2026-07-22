import React, { useState, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import { FaBolt } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ElectricityBill = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [meterVerified, setMeterVerified] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [successData, setSuccessData] = useState(null);

  const SERVICE_CHARGE = 100;
  const presetAmounts = [2000, 3000, 5000, 10000, 20000];

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await api.get('/api/data/services?type=electricity');
      const elecServices = res.data.data.services.filter(s => s.type === 'electricity' && s.isActive);
      setProviders(elecServices);
    } catch (error) {
      toast.error('Failed to load providers');
    }
  };

  const handlePhoneChange = (value) => {
    let num = value.replace(/\D/g, '').slice(0, 10);
    if (num.startsWith('0')) {
      num = num.substring(1);
    }
    setPhone(num);
  };

  const handleVerifyMeter = async () => {
    if (!meterNumber || !selectedProvider) {
      return toast.error('Please enter meter number and select provider');
    }

    if (meterNumber.length < 10) {
      return toast.error('Invalid meter number. Must be at least 10 digits');
    }

    setVerifying(true);
    setMeterVerified(false);
    
    try {
      const res = await api.post('/api/electricity/verify', {
        meterNumber,
        provider: selectedProvider,
        meterType: 'prepaid'
      });

      setCustomerName(res.data.data.customerName || 'Customer');
      setCustomerAddress(res.data.data.customerAddress || 'Address not available');
      setMeterVerified(true);
      toast.success('Meter verified successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Meter verification failed. Check the meter number.');
      setMeterVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const getTotalAmount = () => {
    const baseAmount = parseInt(amount) || 0;
    return baseAmount > 0 ? baseAmount + SERVICE_CHARGE : 0;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    
    if (!selectedProvider || !meterNumber || !amount || !phone) {
      return toast.error('Please fill all fields');
    }
    
    if (amount < 1000) {
      return toast.error('Minimum amount is ₦1,000');
    }

    if (phone.length < 10) {
      return toast.error('Enter a valid phone number');
    }

    const totalAmount = parseInt(amount) + SERVICE_CHARGE; // Customer pays amount + ₦100

    setLoading(true);
    try {
      const res = await api.post('/api/electricity/pay', {
        provider: selectedProvider,
        meterNumber,
        amount: totalAmount, // Send total (e.g., ₦1,100)
        phone: '0' + phone,
        meterType: 'prepaid'
      });

      setSuccessData({
        provider: selectedProvider,
        meterNumber,
        amount: parseInt(amount),
        serviceCharge: SERVICE_CHARGE,
        totalAmount: totalAmount,
        token: res.data.data?.token || 'XXXX-XXXX-XXXX-XXXX',
        units: res.data.data?.units || 'N/A',
        reference: res.data.data?.reference || 'N/A',
        newBalance: res.data.data?.walletBalance
      });

      toast.success('Payment successful! Token generated.');
      setMeterNumber('');
      setAmount('');
      setPhone('');
      setMeterVerified(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setSelectedProvider('');
    setMeterNumber('');
    setAmount('');
    setPhone('');
    setMeterVerified(false);
    setCustomerName('');
    setCustomerAddress('');
  };

  // Success screen
  if (successData) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <UserSidebar activePage="electricity" />
        <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
          <div style={{
            backgroundColor: 'white', padding: '35px', borderRadius: '16px',
            textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>✅</div>
            <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Payment Successful!</h2>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={receiptRow}><span>Provider:</span> <strong>{successData.provider}</strong></div>
              <div style={receiptRow}><span>Meter Number:</span> <strong>{successData.meterNumber}</strong></div>
              <div style={receiptRow}><span>Electricity Amount:</span> <strong>₦{successData.amount?.toLocaleString()}</strong></div>
              <div style={receiptRow}><span>Service Charge:</span> <strong>₦{successData.serviceCharge?.toLocaleString()}</strong></div>
              <div style={receiptRow}><span>Total Paid:</span> <strong style={{ color: '#28a745', fontSize: '16px' }}>₦{successData.totalAmount?.toLocaleString()}</strong></div>
              <div style={{ ...receiptRow, borderBottom: 'none' }}>
                <span>Reference:</span> 
                <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>{successData.reference}</strong>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff3cd', padding: '20px', borderRadius: '12px',
              marginBottom: '20px', border: '2px dashed #ffc107'
            }}>
              <p style={{ margin: '0 0 10px', color: '#856404', fontWeight: '600' }}>🔑 Recharge Token</p>
              <h3 style={{ margin: '0', fontFamily: 'monospace', fontSize: '24px', letterSpacing: '3px', color: '#333' }}>
                {successData.token}
              </h3>
              <p style={{ margin: '10px 0 0', color: '#856404', fontSize: '14px' }}>
                Units: {successData.units} kWh
              </p>
            </div>

            <p style={{ color: '#666', marginBottom: '20px' }}>
              New Balance: <strong>₦{successData.newBalance?.toLocaleString()}</strong>
            </p>

            <button onClick={resetForm} style={{
              width: '100%', padding: '14px', backgroundColor: '#0066cc', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
            }}>
              Make Another Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="electricity" />
      
      <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
        <h1><FaBolt /> Pay Electricity Bill</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>Instant token delivery for all distribution companies</p>

        {/* Service Charge Notice */}
        <div style={{ backgroundColor: '#fff3cd', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#856404' }}>
          💡 A ₦100 service charge applies to all electricity payments
        </div>

        <form onSubmit={handlePay}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Select Provider</label>
            <select value={selectedProvider}
              onChange={(e) => { setSelectedProvider(e.target.value); setMeterVerified(false); }}
              style={styles.input}>
              <option value="">Choose distribution company</option>
              {providers.map(prov => (
                <option key={prov.planCode} value={prov.network}>
                  {prov.network} {prov.description ? `- ${prov.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meter Number</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={meterNumber}
                onChange={(e) => { setMeterNumber(e.target.value.replace(/\D/g, '')); setMeterVerified(false); }}
                placeholder="Enter meter number" style={{ ...styles.input, flex: 1 }} maxLength="20" />
              <button type="button" onClick={handleVerifyMeter}
                disabled={verifying || !meterNumber || !selectedProvider}
                style={{
                  padding: '12px 20px', backgroundColor: verifying ? '#ccc' : '#0066cc', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: verifying ? 'not-allowed' : 'pointer',
                  fontWeight: '600', whiteSpace: 'nowrap', minWidth: '130px'
                }}>
                {verifying ? 'Verifying...' : 'Verify Meter'}
              </button>
            </div>
            
            {meterVerified && (
              <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#155724' }}>✅ Meter Verified Successfully</p>
                <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Customer:</strong> {customerName}</p>
                {customerAddress && (
                  <p style={{ margin: '3px 0', fontSize: '14px' }}><strong>Address:</strong> {customerAddress}</p>
                )}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount (₦)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              {presetAmounts.map(amt => (
                <button key={amt} type="button" onClick={() => setAmount(amt.toString())}
                  style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                    border: amount === amt.toString() ? '2px solid #dc3545' : '1px solid #ddd',
                    backgroundColor: amount === amt.toString() ? '#f8d7da' : 'white'
                  }}>
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (min ₦1,000)" style={styles.input} />
            
            {/* Show total with service charge */}
            {amount >= 1000 && (
              <div style={{ 
                marginTop: '10px', 
                padding: '12px 15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px'
              }}>
                <div>
                  <span style={{ color: '#666' }}>Amount:</span> <strong>₦{parseInt(amount).toLocaleString()}</strong><br />
                  <span style={{ color: '#856404', fontSize: '12px' }}>Service Charge:</span> <strong style={{ color: '#856404', fontSize: '12px' }}>₦{SERVICE_CHARGE.toLocaleString()}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Total to Pay</span><br />
                  <strong style={{ fontSize: '18px', color: '#dc3545' }}>₦{getTotalAmount().toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number (for receipt)</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '12px 15px', background: '#f5f5f5', fontWeight: '600', color: '#666', borderRight: '1px solid #ddd' }}>+234</span>
              <input type="text" value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="8012345678" maxLength="10"
                style={{ ...styles.input, border: 'none', borderRadius: '0' }} />
            </div>
            {phone && <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Full number: 0{phone}</p>}
          </div>

          <button type="submit" disabled={loading}
            style={{ ...styles.buyBtn, backgroundColor: loading ? '#ccc' : '#dc3545', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing Payment...' : `Pay ₦${getTotalAmount().toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const receiptRow = {
  display: 'flex', justifyContent: 'space-between', padding: '10px 0',
  borderBottom: '1px solid #e0e0e0', fontSize: '14px'
};

const styles = {
  label: { display: 'block', marginBottom: '8px', fontWeight: '600' },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' },
  formGroup: { marginBottom: '20px' },
  buyBtn: { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600' }
};

export default ElectricityBill;