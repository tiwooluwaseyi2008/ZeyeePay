import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  FaUsers, FaMoneyBillWave, FaShoppingCart, FaChartLine,
  FaExclamationTriangle, FaClock, FaUserPlus, FaSpinner, FaSync
} from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/format';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh] = useState(true);
  const [providerBalance, setProviderBalance] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        api.get('/api/admin/full-stats'),
        api.get('/api/admin/revenue-chart?days=30')
      ]);
      setData({
        ...statsRes.data.data,
        revenueChart: {
          labels: chartRes.data.labels,
          values: chartRes.data.values
        }
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviderBalance = async () => {
    try {
      const res = await api.get('/api/admin/provider-balance');
      setProviderBalance(res.data.data);
    } catch (error) {
      console.error('Failed to fetch provider balance');
    }
  };

  useEffect(() => {
    fetchData();
    fetchProviderBalance();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchData();
        fetchProviderBalance();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <AdminSidebar activePage="dashboard" />
        <div className="admin-loading">
          <FaSpinner className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, serviceBreakdown, networkBreakdown, recentTransactions, recentUsers, topCustomers } = data || {};

  const statCards = [
    { icon: <FaUsers />, title: 'Total Users', value: formatNumber(stats?.totalUsers), sub: `${formatNumber(stats?.activeUsers)} active`, color: '#0066cc' },
    { icon: <FaUserPlus />, title: 'New Today', value: formatNumber(stats?.newUsersToday), sub: 'New registrations', color: '#17a2b8' },
    { icon: <FaMoneyBillWave />, title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), sub: `${formatCurrency(stats?.todayRevenue)} today`, color: '#28a745' },
    { icon: <FaShoppingCart />, title: 'Transactions', value: formatNumber(stats?.totalTransactions), sub: `${formatNumber(stats?.todayTransactions)} today`, color: '#ffc107' },
    { icon: <FaChartLine />, title: 'Successful', value: formatNumber(stats?.successfulTransactions), sub: 'Completed', color: '#20c997' },
    { icon: <FaExclamationTriangle />, title: 'Failed', value: formatNumber(stats?.failedTransactions), sub: 'Needs attention', color: '#dc3545' },
    { icon: <FaClock />, title: 'Pending', value: formatNumber(stats?.pendingTransactions), sub: 'In progress', color: '#fd7e14' },
    { icon: <FaMoneyBillWave />, title: 'Platform Balance', value: formatCurrency(stats?.platformWalletBalance), sub: 'All user wallets', color: '#6f42c1' }
  ];

  const revenueChartData = {
    labels: data?.revenueChart?.labels || [],
    datasets: [{
      label: 'Revenue',
      data: data?.revenueChart?.values || [],
      borderColor: '#0066cc',
      backgroundColor: 'rgba(0, 102, 204, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const serviceChartData = {
    labels: serviceBreakdown?.map(s => s.name) || [],
    datasets: [{
      data: serviceBreakdown?.map(s => s.revenue) || [],
      backgroundColor: ['#0066cc', '#28a745', '#ffc107', '#dc3545', '#6f42c1']
    }]
  };

  const networkChartData = {
    labels: networkBreakdown?.map(n => n.name) || [],
    datasets: [{
      data: networkBreakdown?.map(n => n.revenue) || [],
      backgroundColor: ['#FFCC00', '#FF0000', '#00A651', '#009A44', '#800080']
    }]
  };

  const getStatusStyle = (status) => {
    const styles = {
      successful: { bg: '#d4edda', color: '#155724', text: 'Success' },
      failed: { bg: '#f8d7da', color: '#721c24', text: 'Failed' },
      pending: { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      processing: { bg: '#d1ecf1', color: '#0c5460', text: 'Processing' }
    };
    return styles[status] || { bg: '#e2e3e5', color: '#383d41', text: status };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminSidebar activePage="dashboard" />
      
      <div style={{ flex: 1, padding: '25px', overflow: 'auto' }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={() => { fetchData(); fetchProviderBalance(); toast.success('Refreshed!'); }}
            className="refresh-btn"
          >
            <FaSync /> Refresh
          </button>
        </div>

        {/* ClubKonnect Balance Card */}
        {providerBalance && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            color: 'white',
            padding: '20px 25px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: providerBalance.balance > 5000 ? '#28a745' : '#dc3545',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px'
              }}>
                💰
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>ClubKonnect Wallet Balance</p>
                <h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>
                  ₦{providerBalance.balance?.toLocaleString() || '0'}
                </h3>
                {providerBalance.date && (
                  <p style={{ margin: '3px 0 0', fontSize: '11px', opacity: 0.5 }}>
                    As at: {providerBalance.date}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={fetchProviderBalance}
                style={{
                  padding: '10px 20px', background: 'rgba(255,255,255,0.15)',
                  color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                }}>
                <FaSync style={{ marginRight: '6px' }} /> Refresh
              </button>
              {providerBalance.balance < 5000 && (
                <a href="https://www.nellobytesystems.com" target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px', background: '#dc3545', color: 'white',
                    textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px'
                  }}>
                  ⚠️ Fund ClubKonnect
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="stat-card" style={{ borderLeftColor: card.color }}>
              <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
              <div className="stat-info">
                <h3>{card.value}</h3>
                <p>{card.title}</p>
                <span>{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card large">
            <h3>Revenue (Last 30 Days)</h3>
            <Line data={revenueChartData} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { ticks: { callback: (v) => '₦' + v.toLocaleString() } } }
            }} />
          </div>
          <div className="chart-card small">
            <h3>Sales by Service</h3>
            <Doughnut data={serviceChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card small">
            <h3>Sales by Network</h3>
            <Doughnut data={networkChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="chart-card small">
            <h3>Top Customers</h3>
            <div className="top-customers">
              {topCustomers?.map((customer, i) => (
                <div key={i} className="customer-row">
                  <div className="customer-rank">#{i + 1}</div>
                  <div className="customer-info">
                    <strong>{customer.name}</strong>
                    <span>{customer.email}</span>
                  </div>
                  <div className="customer-spent">{formatCurrency(customer.totalSpent)}</div>
                </div>
              ))}
              {(!topCustomers || topCustomers.length === 0) && (
                <p style={{ textAlign: 'center', color: '#999' }}>No customers yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="section-card">
          <h3>Recent Transactions</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>User</th><th>Service</th><th>Amount</th><th>Status</th><th>Time</th></tr>
              </thead>
              <tbody>
                {recentTransactions?.map((tx, i) => {
                  const statusStyle = getStatusStyle(tx.status);
                  return (
                    <tr key={i}>
                      <td>{tx.user?.firstName} {tx.user?.lastName}</td>
                      <td className="capitalize">{tx.transactionType?.replace(/_/g, ' ')}</td>
                      <td>{formatCurrency(tx.amount)}</td>
                      <td><span className="status-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{statusStyle.text}</span></td>
                      <td>{timeAgo(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="section-card">
          <h3>Newest Users</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {recentUsers?.map((user, i) => (
                  <tr key={i}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;