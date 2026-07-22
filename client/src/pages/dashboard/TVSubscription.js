import React, { useState, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import { FaTv, FaCheckCircle } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TVSubscription = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [smartCard, setSmartCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cardVerified, setCardVerified] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchPackages(selectedProvider);
    }
  }, [selectedProvider]);

  const fetchProviders = async () => {
    try {
      const res = await api.get('/api/data/services?type=tv');
      const tvServices = res.data.data.services.filter(s => s.type === 'tv' && s.isActive);
      const uniqueProviders = [...new Set(tvServices.map(s => s.network))];
      setProviders(uniqueProviders);
    } catch (error) {
      toast.error('Failed to load providers');
    }
  };

  const fetchPackages = async (provider) => {
    try {
      const res = await api.get('/api/data/services?type=tv');
      const providerPackages = res.data.data.services.filter(
        s => s.type === 'tv' && s.network === provider && s.isActive
      );
      setPackages(providerPackages);
    } catch (error) {
      toast.error('Failed to load packages');
    }
  };

  const handleVerifyCard = async () => {
    if (!smartCard || !selectedProvider) {
      return toast.error('Please enter smart card number and select provider');
    }

    if (smartCard.length < 10) {
      return toast.error('Invalid smart card number. Must be at least 10 digits');
    }

    setVerifying(true);
    setCardVerified(false);

    try {
      const res = await api.post('/api/tv/verify', {
        smartCardNumber: smartCard,
        provider: selectedProvider
      });

      setCustomerName(res.data.data.customerName || 'Customer');
      setCardVerified(true);
      toast.success('Smart card verified successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed. Check the smart card number.');
      setCardVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!selectedProvider || !smartCard || !selectedPackage) {
      return toast.error('Please fill all fields');
    }

    setLoading(true);
    try {
      const res = await api.post('/api/tv/subscribe', {
        provider: selectedProvider,
        smartCardNumber: smartCard,
        packageId: selectedPackage
      });

      const selectedPkg = packages.find(p => p.planCode === selectedPackage);
      
      setSuccessData({
        provider: selectedProvider,
        smartCard,
        packageName: selectedPkg?.planName || 'Unknown',
        amount: selectedPkg?.price || 0,
        reference: res.data.data?.reference || 'N/A',
        newBalance: res.data.data?.walletBalance
      });

      toast.success('TV subscription successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setSelectedProvider('');
    setSmartCard('');
    setSelectedPackage('');
    setCardVerified(false);
    setCustomerName('');
  };

  // Success Screen
  if (successData) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <UserSidebar activePage="tv" />
        <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '35px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}>
            <FaCheckCircle style={{ fontSize: '60px', color: '#28a745', marginBottom: '15px' }} />
            <h2 style={{ color: '#28a745', marginBottom: '20px' }}>Subscription Successful!</h2>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <div style={receiptRow}><span>Provider:</span> <strong>{successData.provider}</strong></div>
              <div style={receiptRow}><span>Smart Card:</span> <strong>{successData.smartCard}</strong></div>
              <div style={receiptRow}><span>Package:</span> <strong>{successData.packageName}</strong></div>
              <div style={receiptRow}><span>Amount:</span> <strong>₦{successData.amount?.toLocaleString()}</strong></div>
              <div style={{ ...receiptRow, borderBottom: 'none' }}>
                <span>Reference:</span> 
                <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>{successData.reference}</strong>
              </div>
            </div>

            <p style={{ color: '#666', marginBottom: '20px' }}>
              New Balance: <strong>₦{successData.newBalance?.toLocaleString()}</strong>
            </p>

            <button onClick={resetForm} style={styles.buyBtn}>
              Make Another Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="tv" />
      
      <div style={{ flex: 1, padding: '30px', maxWidth: '600px' }}>
        <h1><FaTv /> TV Subscription</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>Renew your DStv, GOtv, or StarTimes subscription</p>

        <form onSubmit={handleSubscribe}>
          {/* Provider Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Select Provider</label>
            <div style={{ display: 'grid', gap: '10px' }}>
              {providers.map(prov => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => { 
                    setSelectedProvider(prov); 
                    setSelectedPackage(''); 
                    setCardVerified(false); 
                  }}
                  style={{
                    ...styles.providerBtn,
                    borderColor: selectedProvider === prov ? '#ffc107' : '#ddd',
                    backgroundColor: selectedProvider === prov ? '#fff3cd' : 'white'
                  }}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Card Number with Verification */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Smart Card Number</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={smartCard}
                onChange={(e) => {
                  setSmartCard(e.target.value.replace(/\D/g, ''));
                  setCardVerified(false);
                }}
                placeholder="Enter smart card number"
                style={{ ...styles.input, flex: 1 }}
                maxLength="16"
              />
              <button
                type="button"
                onClick={handleVerifyCard}
                disabled={verifying || !smartCard || !selectedProvider}
                style={{
                  padding: '12px 20px',
                  backgroundColor: verifying ? '#ccc' : '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: verifying ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  minWidth: '120px'
                }}
              >
                {verifying ? 'Verifying...' : 'Verify Card'}
              </button>
            </div>

            {/* Verification Result */}
            {cardVerified && (
              <div style={{ 
                marginTop: '10px', 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <p style={{ margin: '0 0 5px', fontWeight: '600', color: '#155724' }}>
                  ✅ Smart Card Verified
                </p>
                <p style={{ margin: '3px 0', fontSize: '14px' }}>
                  <strong>Customer:</strong> {customerName}
                </p>
              </div>
            )}
          </div>

          {/* Package Selection */}
          {selectedProvider && packages.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Package</label>
              <div style={{ display: 'grid', gap: '10px' }}>
                {packages.map(pkg => (
                  <button
                    key={pkg.planCode}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.planCode)}
                    style={{
                      ...styles.packageBtn,
                      borderColor: selectedPackage === pkg.planCode ? '#ffc107' : '#ddd',
                      backgroundColor: selectedPackage === pkg.planCode ? '#fff3cd' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{pkg.planName}</strong>
                        {pkg.description && (
                          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#888' }}>{pkg.description}</p>
                        )}
                        <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#aaa' }}>
                          Validity: {pkg.validity || '1 Month'}
                        </p>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                        ₦{pkg.price?.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedProvider && packages.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No packages available for {selectedProvider}
            </p>
          )}

          {/* Subscribe Button */}
          <button 
            type="submit" 
            disabled={loading || !selectedPackage} 
            style={{ 
              ...styles.buyBtn, 
              backgroundColor: loading || !selectedPackage ? '#ccc' : '#ffc107', 
              color: '#333',
              cursor: loading || !selectedPackage ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

const receiptRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #e0e0e0',
  fontSize: '14px'
};

const styles = {
  label: { display: 'block', marginBottom: '8px', fontWeight: '600' },
  input: { 
    width: '100%', 
    padding: '12px', 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    fontSize: '16px', 
    boxSizing: 'border-box' 
  },
  formGroup: { marginBottom: '20px' },
  providerBtn: { 
    padding: '15px', 
    border: '2px solid', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '16px', 
    textAlign: 'left' 
  },
  packageBtn: { 
    padding: '15px', 
    border: '2px solid', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    textAlign: 'left', 
    width: '100%' 
  },
  buyBtn: { 
    width: '100%', 
    padding: '15px', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default TVSubscription;