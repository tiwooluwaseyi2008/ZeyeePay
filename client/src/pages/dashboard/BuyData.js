import React, { useState, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import {
  FaMobileAlt, FaSearch, FaStar, FaHistory, FaCheckCircle,
  FaTimes, FaSpinner, FaFire, FaClock, FaSignal, FaCalendar
} from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import './BuyData.css';

const BuyData = () => {
  const [allServices, setAllServices] = useState([]);
  const [groupedPlans, setGroupedPlans] = useState({});
  const [categories, setCategories] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [phone, setPhone] = useState('');
  const [autoNetwork, setAutoNetwork] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [searchPlan, setSearchPlan] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);

  const categoryIcons = {
    daily: <FaClock />, weekly: <FaCalendar />, monthly: <FaCalendar />,
    sme: <FaSignal />, corporate: <FaSignal />, social: <FaSignal />, night: <FaSignal />
  };

  const categoryLabels = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    sme: 'SME', corporate: 'Corporate', social: 'Social', night: 'Night'
  };

  const networkColors = {
    MTN: { bg: '#FFCC00', color: '#333' },
    Airtel: { bg: '#FF0000', color: '#fff' },
    Glo: { bg: '#00A651', color: '#fff' },
    '9mobile': { bg: '#009A44', color: '#fff' }
  };

  useEffect(() => {
    fetchServices();
    fetchWallet();
    loadFavorites();
    loadRecentPurchases();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/api/data/services?type=data');
      const services = res.data.data.services;
      setAllServices(services);
      const uniqueNetworks = [...new Set(services.map(s => s.network))];
      setNetworks(uniqueNetworks);
    } catch (error) {
      toast.error('Failed to load data plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get('/api/wallet/balance');
      setWalletBalance(res.data.data.balance);
    } catch { /* silent */ }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('dataFavorites');
    if (saved) setFavorites(JSON.parse(saved));
  };

  const loadRecentPurchases = () => {
    const saved = localStorage.getItem('recentDataPurchases');
    if (saved) setRecentPurchases(JSON.parse(saved));
  };

  useEffect(() => {
    if (selectedNetwork) {
      const networkPlans = allServices.filter(s => s.network === selectedNetwork);
      const grouped = {};
      networkPlans.forEach(plan => {
        const cat = plan.category || 'monthly';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(plan);
      });
      setGroupedPlans(grouped);
      setCategories(['all', ...Object.keys(grouped)]);
      setSelectedCategory('all');
    }
  }, [selectedNetwork, allServices]);

  const handlePhoneChange = (value) => {
    let num = value.replace(/\D/g, '').slice(0, 10);
    // Remove leading 0 since +234 prefix handles it
    if (num.startsWith('0')) {
      num = num.substring(1);
    }
    setPhone(num);

    // Auto-detect network from the full number (with 0 prefix)
    if (num.length >= 3) {
      const fullNum = '0' + num;
      const prefix = fullNum.slice(0, 4);
      const networkMap = {
        '0803': 'MTN', '0806': 'MTN', '0810': 'MTN', '0813': 'MTN', '0814': 'MTN', '0816': 'MTN',
        '0802': 'Airtel', '0808': 'Airtel', '0812': 'Airtel',
        '0805': 'Glo', '0807': 'Glo', '0811': 'Glo', '0815': 'Glo',
        '0809': '9mobile', '0817': '9mobile', '0818': '9mobile'
      };
      const detected = networkMap[prefix];
      if (detected && detected !== selectedNetwork) {
        setAutoNetwork(detected);
      }
    }
  };

  const applyAutoNetwork = () => {
    setSelectedNetwork(autoNetwork);
    setAutoNetwork('');
  };

  const getFilteredPlans = () => {
    if (selectedCategory === 'all') {
      return allServices.filter(s => s.network === selectedNetwork);
    }
    return groupedPlans[selectedCategory] || [];
  };

  const getSearchFilteredPlans = () => {
    const plans = getFilteredPlans();
    if (!searchPlan) return plans;
    return plans.filter(p =>
      p.planName.toLowerCase().includes(searchPlan.toLowerCase()) ||
      p.planCode.toLowerCase().includes(searchPlan.toLowerCase())
    );
  };

  const toggleFavorite = (plan) => {
    const exists = favorites.find(f => f.planCode === plan.planCode);
    let newFavorites;
    if (exists) {
      newFavorites = favorites.filter(f => f.planCode !== plan.planCode);
    } else {
      newFavorites = [...favorites, { planCode: plan.planCode, network: plan.network, planName: plan.planName }];
    }
    setFavorites(newFavorites);
    localStorage.setItem('dataFavorites', JSON.stringify(newFavorites));
  };

  const handleBuy = (plan) => {
    if (!phone || phone.length < 10) {
      return toast.error('Enter a valid phone number');
    }
    if (walletBalance < plan.price) {
      return toast.error('Insufficient wallet balance');
    }
    setSelectedPlan(plan);
    setShowConfirm(true);
  };

  const handleQuickBuy = async (plan, savedPhone) => {
    setPhone(savedPhone);
    setSelectedNetwork(plan.network);
    setSelectedPlan(plan);
    setShowConfirm(true);
  };

  const confirmPurchase = async () => {
    setLoadingPurchase(true);
    try {
      const res = await api.post('/api/data/purchase', {
        network: selectedNetwork,
        planId: selectedPlan.planCode,
        phone: '0' + phone  // Add 0 prefix for API
      });

      const recent = [{ planCode: selectedPlan.planCode, network: selectedNetwork, planName: selectedPlan.planName, phone }, ...recentPurchases.slice(0, 4)];
      setRecentPurchases(recent);
      localStorage.setItem('recentDataPurchases', JSON.stringify(recent));

      setSuccessData({
        network: selectedNetwork,
        plan: selectedPlan.planName,
        phone: '0' + phone,
        amount: selectedPlan.price,
        reference: res.data.data?.reference || 'N/A',
        newBalance: res.data.data?.walletBalance
      });

      setWalletBalance(res.data.data?.walletBalance);
      setShowConfirm(false);
      setShowSuccess(true);
      toast.success('Data purchase successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    } finally {
      setLoadingPurchase(false);
    }
  };

  const filteredPlans = getSearchFilteredPlans();

  return (
    <div className="buydata-layout">
      <UserSidebar activePage="data" />

      <div className="buydata-main">
        <h1><FaMobileAlt /> Buy Data Bundle</h1>
        <p className="buydata-subtitle">Fast & affordable data for all networks</p>

        <div className="bd-wallet-bar">
          <span>Wallet Balance: <strong>{formatCurrency(walletBalance)}</strong></span>
        </div>

        {autoNetwork && (
          <div className="auto-detect-banner" onClick={applyAutoNetwork}>
            <FaSignal /> We detected <strong>{autoNetwork}</strong>. Tap to select.
          </div>
        )}

        <div className="bd-section">
          <h3>Select Network</h3>
          <div className="network-grid">
            {networks.map(net => {
              const colors = networkColors[net] || { bg: '#666', color: '#fff' };
              return (
                <button key={net} className={`network-btn ${selectedNetwork === net ? 'active' : ''}`}
                  style={{
                    backgroundColor: selectedNetwork === net ? colors.bg : 'white',
                    color: selectedNetwork === net ? colors.color : '#333',
                    borderColor: colors.bg
                  }}
                  onClick={() => setSelectedNetwork(net)}>
                  {net}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bd-section">
          <h3>Phone Number</h3>
          <div className="phone-input-wrapper">
            <span className="phone-prefix">+234</span>
            <input type="text" value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="8012345678" maxLength="10" className="phone-input" />
          </div>
          {phone && <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Full number: 0{phone}</p>}
        </div>

        {selectedNetwork && (
          <>
            <div className="bd-section">
              <h3>Plan Category</h3>
              <div className="category-tabs">
                {categories.map(cat => (
                  <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}>
                    {categoryIcons[cat]} {categoryLabels[cat] || cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bd-section">
              <div className="search-plans">
                <FaSearch />
                <input type="text" value={searchPlan} onChange={(e) => setSearchPlan(e.target.value)} placeholder="Search plans..." />
              </div>
            </div>

            {favorites.length > 0 && selectedCategory === 'all' && (
              <div className="bd-section">
                <h3><FaStar style={{ color: '#ffc107' }} /> Favorites</h3>
                <div className="plans-grid">
                  {favorites.filter(f => f.network === selectedNetwork).map(fav => {
                    const plan = allServices.find(s => s.planCode === fav.planCode);
                    if (!plan) return null;
                    return (
                      <div key={plan.planCode} className="plan-card favorite" onClick={() => handleBuy(plan)}>
                        <FaStar className="fav-star" />
                        <span className="plan-name">{plan.planName}</span>
                        <span className="plan-validity">{plan.validity}</span>
                        <span className="plan-price">{formatCurrency(plan.price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bd-section">
              <h3>Available Plans {filteredPlans.length > 0 && `(${filteredPlans.length})`}</h3>
              {loading ? (
                <div className="loading-plans"><FaSpinner className="spinner" /> Loading plans...</div>
              ) : filteredPlans.length === 0 ? (
                <p className="no-plans">No plans found for this category</p>
              ) : (
                <div className="plans-grid">
                  {filteredPlans.map(plan => (
                    <div key={plan.planCode}
                      className={`plan-card ${plan.isPopular ? 'popular' : ''} ${favorites.find(f => f.planCode === plan.planCode) ? 'favorite' : ''}`}
                      onClick={() => handleBuy(plan)}>
                      {plan.isPopular && <span className="popular-badge"><FaFire /> Popular</span>}
                      <div className="plan-header">
                        <span className="plan-name">{plan.planName}</span>
                        <button className={`fav-btn ${favorites.find(f => f.planCode === plan.planCode) ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(plan); }}>
                          <FaStar />
                        </button>
                      </div>
                      <span className="plan-validity">{plan.validity || '30 Days'}</span>
                      <span className="plan-price">{formatCurrency(plan.price)}</span>
                      {plan.description && <span className="plan-desc">{plan.description}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {recentPurchases.length > 0 && (
          <div className="bd-section">
            <h3><FaHistory /> Recent Purchases</h3>
            <div className="recent-grid">
              {recentPurchases.map((rp, i) => {
                const plan = allServices.find(s => s.planCode === rp.planCode);
                if (!plan) return null;
                return (
                  <div key={i} className="recent-card" onClick={() => handleQuickBuy(plan, rp.phone)}>
                    <span className="rc-network">{rp.network}</span>
                    <span className="rc-plan">{rp.planName}</span>
                    <span className="rc-phone">0{rp.phone}</span>
                    <span className="rc-amount">{formatCurrency(plan.price)}</span>
                    <span className="rc-buy">Buy Again</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>Confirm Purchase</h2>
            <div className="confirm-details">
              <div className="confirm-row"><span>Network</span><strong>{selectedNetwork}</strong></div>
              <div className="confirm-row"><span>Plan</span><strong>{selectedPlan.planName}</strong></div>
              <div className="confirm-row"><span>Validity</span><strong>{selectedPlan.validity || '30 Days'}</strong></div>
              <div className="confirm-row"><span>Phone</span><strong>0{phone}</strong></div>
              <div className="confirm-divider"></div>
              <div className="confirm-row"><span>Amount</span><strong className="confirm-amount">{formatCurrency(selectedPlan.price)}</strong></div>
              <div className="confirm-row"><span>Balance After</span><strong>{formatCurrency(walletBalance - selectedPlan.price)}</strong></div>
            </div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}><FaTimes /> Cancel</button>
              <button className="btn-confirm" onClick={confirmPurchase} disabled={loadingPurchase}>
                {loadingPurchase ? <><FaSpinner className="spinner" /> Processing...</> : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && successData && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-modal" onClick={e => e.stopPropagation()}>
            <FaCheckCircle className="success-icon" />
            <h2>Purchase Successful!</h2>
            <div className="success-details">
              <p><strong>{successData.plan}</strong> - {successData.network}</p>
              <p>Phone: {successData.phone}</p>
              <p>Amount: {formatCurrency(successData.amount)}</p>
              <p className="ref-text">Ref: {successData.reference}</p>
              <p>New Balance: <strong>{formatCurrency(successData.newBalance)}</strong></p>
            </div>
            <button className="btn-done" onClick={() => {
              setShowSuccess(false);
              setPhone('');
              setSelectedNetwork('');
              setSelectedCategory('all');
            }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyData;