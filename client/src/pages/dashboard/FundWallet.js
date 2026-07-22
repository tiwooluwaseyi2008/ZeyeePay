import React, { useState } from 'react';
import UserSidebar from '../../components/UserSidebar';
import { FaMoneyBillWave, FaExternalLinkAlt, FaCopy, FaCheck } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const FundWallet = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [copied, setCopied] = useState('');

  const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!amount || parseInt(amount) < 100) {
      return toast.error('Minimum amount is ₦100');
    }

    setLoading(true);
    try {
      const res = await api.post('/api/wallet/fund', { amount: parseInt(amount) });
      setPaymentInfo(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied!`);
    setTimeout(() => setCopied(''), 2000);
  };

  if (paymentInfo) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <UserSidebar activePage="fund" />
        <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
          <h1><FaMoneyBillWave /> Fund Wallet</h1>
          
          <div style={styles.card}>
            <div style={{ 
              backgroundColor: '#f97316', 
              padding: '15px', 
              borderRadius: '10px', 
              marginBottom: '25px',
              textAlign: 'center',
              color: 'white'
            }}>
              <h2 style={{ margin: '0 0 10px' }}>Pay with Flutterwave</h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                Secure payment powered by Flutterwave
              </p>
            </div>

            <div style={styles.detailBox}>
              <div style={styles.detailRow}>
                <span>Amount to Pay:</span>
                <strong style={{ fontSize: '22px', color: '#f97316' }}>
                  ₦{paymentInfo.amount?.toLocaleString()}
                </strong>
              </div>
              <div style={styles.detailRow}>
                <span>Reference:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={styles.referenceCode}>{paymentInfo.reference}</code>
                  <button onClick={() => handleCopy(paymentInfo.reference, 'Reference')} 
                    style={styles.copyBtn}>
                    {copied === 'Reference' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
            </div>

            <a 
              href={paymentInfo.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '18px',
                backgroundColor: '#f97316',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '20px'
              }}
            >
              <FaExternalLinkAlt /> Pay with Flutterwave Now
            </a>

            <div style={styles.instructionBox}>
              <h4 style={{ margin: '0 0 10px' }}>📋 How to Pay:</h4>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#555', lineHeight: '1.8' }}>
                <li>Click the <strong>"Pay with Flutterwave"</strong> button above</li>
                <li>Complete the payment on Flutterwave's secure page</li>
                <li>Use the reference: <strong>{paymentInfo.reference}</strong> in the payment description</li>
                <li>After payment, your wallet will be credited automatically</li>
              </ol>
            </div>

            <button 
              onClick={() => { setPaymentInfo(null); setAmount(''); }}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              ← Back to Amount Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="fund" />
      <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
        <h1><FaMoneyBillWave /> Fund Wallet</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>
          Pay securely with Flutterwave - instant wallet funding
        </p>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '12px 15px', 
          borderRadius: '8px', 
          marginBottom: '25px',
          fontSize: '13px',
          color: '#856404',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔒 Secure payments powered by <strong>Flutterwave</strong>
        </div>

        <form onSubmit={handleInitiate}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Enter Amount</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              {presetAmounts.map(amt => (
                <button key={amt} type="button" onClick={() => setAmount(amt.toString())}
                  style={{
                    padding: '15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px',
                    border: amount === amt.toString() ? '2px solid #f97316' : '1px solid #ddd',
                    backgroundColor: amount === amt.toString() ? '#fff3e0' : 'white'
                  }}>
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (min ₦100)" style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={{
            ...styles.buyBtn,
            backgroundColor: loading ? '#ccc' : '#f97316',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Processing...' : 'Generate Payment Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  label: { display: 'block', marginBottom: '8px', fontWeight: '600' },
  input: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' },
  buyBtn: { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  detailBox: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e0e0e0', fontSize: '15px' },
  copyBtn: { background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#f97316', fontSize: '14px' },
  referenceCode: { backgroundColor: '#fff', padding: '8px 15px', borderRadius: '6px', fontSize: '16px', fontWeight: '700', letterSpacing: '1px' },
  instructionBox: { backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #b8daff' }
};

export default FundWallet;