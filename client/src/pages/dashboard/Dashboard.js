import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaWallet, FaMobileAlt, FaTv, FaBolt, FaMoneyBillWave,
  FaEye, FaEyeSlash, FaHistory, FaCopy, FaUser, FaSync,
  FaBell, FaGift, FaChartLine, FaShare, FaSpinner, FaIdCard
} from 'react-icons/fa';
import UserSidebar from '../../components/UserSidebar';
import api from '../../api/axios';
import { usePaymentVerification } from '../../hooks/usePaymentVerification';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/format';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    todaySpending: 0,
    monthlySpending: 0,
    totalTransactions: 0,
    referralEarnings: 0
  });
  const [greeting, setGreeting] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigate = useNavigate();
  const mounted = useRef(true);
  const { pollPaymentStatus, clearPolling } = usePaymentVerification(setUser);

  // Greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Initialize dashboard
  useEffect(() => {
    mounted.current = true;
    initDashboard();
    return () => {
      mounted.current = false;
      clearPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initDashboard = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!token || !userStr) {
        navigate('/login');
        return;
      }

      let userData;
      try { userData = JSON.parse(userStr); } catch {
        localStorage.clear();
        navigate('/login');
        return;
      }

      if (!userData.firstName) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      await Promise.all([
        fetchBalance(userData),
        fetchRecentTransactions(),
        fetchStats()
      ]);

      const pendingPayment = localStorage.getItem('pendingPayment');
      if (pendingPayment) {
        pollPaymentStatus(pendingPayment);
      }
    } catch {
      if (mounted.current) navigate('/login');
    }
  };

  const fetchBalance = async (userData) => {
    try {
      const res = await api.get('/api/wallet/balance');
      userData.walletBalance = res.data.data.balance;
      
      // Also fetch fresh user profile to get userId
      const profileRes = await api.get('/api/users/profile');
      if (profileRes.data.data) {
        userData.userId = profileRes.data.data.userId;
        userData.isEmailVerified = profileRes.data.data.isEmailVerified;
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      if (mounted.current) setUser(userData);
    } catch {
      if (mounted.current) setUser(userData);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const res = await api.get('/api/transactions/recent');
      if (mounted.current) setRecentTransactions(res.data.data || []);
    } catch { /* silent */ }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/transactions/stats');
      if (mounted.current && res.data.data) {
        setStats(res.data.data);
      }
    } catch { /* silent */ }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/wallet/balance');
      const userData = { ...user, walletBalance: res.data.data.balance };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Balance refreshed');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyReferral = () => {
    const code = user?.referralCode || 'PSWIFT' + (user?._id?.slice(-6) || '');
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied!');
  };

  const handleCopyUserId = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      toast.success('User ID copied!');
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/api/auth/resend-verification');
      toast.success('Verification email resent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    }
  };

  const services = [
    { icon: <FaMobileAlt />, title: 'Buy Data', desc: 'MTN, Airtel, Glo, 9mobile', path: '/dashboard/buy-data', color: '#0066cc' },
    { icon: <FaMobileAlt />, title: 'Buy Airtime', desc: 'Instant recharge', path: '/dashboard/buy-airtime', color: '#28a745' },
    { icon: <FaTv />, title: 'TV', desc: 'GOtv, DStv, Startimes', path: '/dashboard/tv', color: '#ffc107' },
    { icon: <FaBolt />, title: 'Electricity', desc: 'Pay electricity bills', path: '/dashboard/electricity', color: '#dc3545' },
    { icon: <FaMoneyBillWave />, title: 'Fund Wallet', desc: 'Add money', path: '/dashboard/fund-wallet', color: '#6f42c1' },
    { icon: <FaHistory />, title: 'History', desc: 'View transactions', path: '/dashboard/transactions', color: '#17a2b8' },
    { icon: <FaUser />, title: 'Profile', desc: 'Account settings', path: '/dashboard/profile', color: '#6c757d' },
    { icon: <FaShare />, title: 'Refer & Earn', desc: 'Invite friends', path: '/dashboard/refer', color: '#fd7e14' }
  ];

  const getStatusStyle = (status) => {
    const styles = {
      successful: { bg: '#d4edda', color: '#155724', icon: '✅' },
      failed: { bg: '#f8d7da', color: '#721c24', icon: '❌' },
      pending: { bg: '#fff3cd', color: '#856404', icon: '⏳' },
      processing: { bg: '#d1ecf1', color: '#0c5460', icon: '🔄' }
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <FaSpinner className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const referralCode = user.referralCode || 'PSWIFT' + (user._id?.slice(-6) || '');

  return (
    <div className="dashboard-layout">
      <UserSidebar activePage="dashboard" />

      <div className="dashboard-main">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>{greeting}, {user.firstName}! 👋</h1>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            {user.userId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#0066cc', 
                  backgroundColor: '#e6f0ff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  <FaIdCard style={{ marginRight: '5px', fontSize: '11px' }} />
                  {user.userId}
                </span>
                <button 
                  onClick={handleCopyUserId}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#0066cc',
                    fontSize: '14px',
                    padding: '4px'
                  }}
                  title="Copy User ID"
                >
                  <FaCopy />
                </button>
              </div>
            )}
          </div>
          <div className="dash-header-actions">
            <button className="icon-btn" title="Notifications">
              <FaBell />
            </button>
            <button className="icon-btn" onClick={handleRefreshBalance} title="Refresh Balance">
              <FaSync className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Email Verification Banner */}
        {!user.isEmailVerified && (
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            border: '1px solid #ffc107'
          }}>
            <div>
              <strong style={{ color: '#856404' }}>⚠️ Email Not Verified</strong>
              <p style={{ margin: '5px 0 0', color: '#856404', fontSize: '13px' }}>
                Verify your email to access all features including buying data, airtime, and paying bills.
              </p>
            </div>
            <button 
              onClick={handleResendVerification}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              Resend Verification Email
            </button>
          </div>
        )}

        {/* Wallet Card */}
        <div className="wallet-card">
          <div className="wallet-top">
            <div className="wallet-info">
              <FaWallet className="wallet-icon" />
              <div>
                <p className="wallet-label">Wallet Balance</p>
                <h2 className="wallet-amount">
                  {showBalance ? formatCurrency(user.walletBalance) : '₦ ****'}
                </h2>
              </div>
            </div>
            <button 
              className="balance-toggle"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="wallet-actions">
            <Link to="/dashboard/fund-wallet" className="fund-btn">+ Fund Wallet</Link>
            <button className="copy-btn" onClick={handleCopyReferral} title="Copy Referral Code">
              <FaCopy /> {referralCode}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-row">
          <div className="stat-card-mini">
            <FaChartLine className="stat-icon-mini" style={{ color: '#0066cc' }} />
            <div>
              <p className="stat-label-mini">Today's Spending</p>
              <h4>{formatCurrency(stats.todaySpending)}</h4>
            </div>
          </div>
          <div className="stat-card-mini">
            <FaChartLine className="stat-icon-mini" style={{ color: '#28a745' }} />
            <div>
              <p className="stat-label-mini">This Month</p>
              <h4>{formatCurrency(stats.monthlySpending)}</h4>
            </div>
          </div>
          <div className="stat-card-mini">
            <FaHistory className="stat-icon-mini" style={{ color: '#ffc107' }} />
            <div>
              <p className="stat-label-mini">Transactions</p>
              <h4>{formatNumber(stats.totalTransactions)}</h4>
            </div>
          </div>
          <div className="stat-card-mini">
            <FaGift className="stat-icon-mini" style={{ color: '#fd7e14' }} />
            <div>
              <p className="stat-label-mini">Referral Earnings</p>
              <h4>{formatCurrency(stats.referralEarnings)}</h4>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="section-title">Quick Actions</h3>
        <div className="services-grid">
          {services.map((service, index) => (
            <Link to={service.path} key={index} className="service-card" style={{ borderTopColor: service.color }}>
              <div className="service-icon" style={{ color: service.color }}>{service.icon}</div>
              <h4>{service.title}</h4>
              <p>{service.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            <Link to="/dashboard/transactions">View All →</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-recent">
              <FaHistory style={{ fontSize: '30px', color: '#ccc' }} />
              <p>No transactions yet</p>
              <Link to="/dashboard/buy-data">Make your first purchase</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recentTransactions.slice(0, 5).map(tx => {
                const statusStyle = getStatusStyle(tx.status);
                return (
                  <div key={tx._id} className="recent-item">
                    <span className="recent-status">{statusStyle.icon}</span>
                    <div className="recent-info">
                      <span className="recent-type">{tx.transactionType?.replace(/_/g, ' ')}</span>
                      <span className="recent-date">{timeAgo(tx.createdAt)}</span>
                    </div>
                    <span className={`recent-amount ${tx.status}`}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Referral Card */}
        <div className="referral-card">
          <FaGift className="gift-icon" />
          <div>
            <h4>Refer & Earn</h4>
            <p>Share your code and earn ₦100 per referral</p>
          </div>
          <button onClick={handleCopyReferral} className="share-btn">
            <FaShare /> Share Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;