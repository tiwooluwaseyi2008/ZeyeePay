import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import {
  FaSearch, FaSync, FaEye, FaRedo, FaCopy, FaTimes,
  FaShoppingCart, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaMoneyBillWave, FaCalendar
} from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency, formatNumber } from '../../utils/format';
import toast from 'react-hot-toast';
import './AdminTransactions.css';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page || 1,
        limit: 20,
        search,
        status: statusFilter,
        type: typeFilter,
        sort: sortBy
      });

      const res = await api.get(`/api/admin/transactions?${params}`);
      setTransactions(res.data.data.transactions || []);
      setStats(res.data.data.stats || {});
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
    } catch (error) {
      toast.error('Failed to load transactions');
      setTransactions([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, typeFilter, sortBy]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleView = async (tx) => {
    try {
      const res = await api.get(`/api/admin/transactions/${tx._id}`);
      setSelectedTx(res.data.data.transaction);
      setShowDetail(true);
    } catch (error) {
      toast.error('Failed to load transaction details');
    }
  };

  const handleRetry = async (txId) => {
    try {
      await api.post(`/api/admin/transactions/${txId}/retry`);
      toast.success('Transaction queued for retry');
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Retry failed');
    }
  };

  const handleCopyRef = (ref) => {
    if (!ref) return;
    navigator.clipboard.writeText(ref).then(() => {
      toast.success('Reference copied!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      successful: { icon: <FaCheckCircle />, className: 'badge-success', text: 'Successful' },
      failed: { icon: <FaExclamationTriangle />, className: 'badge-failed', text: 'Failed' },
      pending: { icon: <FaClock />, className: 'badge-pending', text: 'Pending' },
      processing: { icon: <FaClock />, className: 'badge-processing', text: 'Processing' },
      refunded: { icon: <FaRedo />, className: 'badge-refunded', text: 'Refunded' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      data_purchase: '📶',
      airtime_purchase: '📱',
      tv_subscription: '📺',
      electricity_bill: '⚡',
      wallet_funding: '💰',
      wallet_credit: '💳',
      wallet_debit: '🏦',
      refund: '↩️'
    };
    return icons[type] || '📄';
  };

  const statCards = [
    { icon: <FaShoppingCart />, label: 'All Time', value: formatNumber(stats.total || 0), color: '#0066cc' },
    { icon: <FaCheckCircle />, label: 'Successful', value: formatNumber(stats.successful || 0), color: '#28a745' },
    { icon: <FaClock />, label: 'Pending', value: formatNumber(stats.pending || 0), color: '#ffc107' },
    { icon: <FaExclamationTriangle />, label: 'Failed', value: formatNumber(stats.failed || 0), color: '#dc3545' },
    { icon: <FaMoneyBillWave />, label: 'Revenue', value: formatCurrency(stats.totalRevenue || 0), color: '#6f42c1' },
    { icon: <FaCalendar />, label: "Today's Revenue", value: formatCurrency(stats.todayRevenue || 0), color: '#17a2b8' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminSidebar activePage="transactions" />

      <div style={{ flex: 1, padding: '25px', overflow: 'auto' }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Transactions</h1>
            <p>{formatNumber(stats.total || 0)} total transactions</p>
          </div>
          <button className="btn-refresh" onClick={fetchTransactions}>
            <FaSync /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="tx-stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="tx-stat-card" style={{ borderLeftColor: card.color }}>
              <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
              <div>
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <form onSubmit={handleSearch} className="search-form">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by reference, phone, meter number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="toolbar-actions">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="data_purchase">Data</option>
              <option value="airtime_purchase">Airtime</option>
              <option value="tv_subscription">TV</option>
              <option value="electricity_bill">Electricity</option>
              <option value="wallet_funding">Wallet Funding</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_amount">Highest Amount</option>
              <option value="lowest_amount">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-skeleton">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton" style={{width:'100px'}}></div>
                  <div className="skeleton" style={{width:'150px'}}></div>
                  <div className="skeleton" style={{width:'80px'}}></div>
                  <div className="skeleton" style={{width:'100px'}}></div>
                  <div className="skeleton" style={{width:'80px'}}></div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <FaShoppingCart style={{ fontSize: '50px', color: '#ccc' }} />
              <h3>No transactions found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id}>
                    <td>
                      <div className="ref-cell">
                        <span className="ref-text">{tx.paymentReference?.slice(-12) || 'N/A'}</span>
                        <button className="copy-btn" onClick={() => handleCopyRef(tx.paymentReference)} title="Copy">
                          <FaCopy />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {tx.user?.firstName?.[0]}{tx.user?.lastName?.[0]}
                        </div>
                        <div>
                          <strong>{tx.user?.firstName || 'Unknown'} {tx.user?.lastName || ''}</strong>
                          <span className="user-email">{tx.user?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">
                        {getTypeIcon(tx.transactionType)} {tx.transactionType?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="amount-text">{formatCurrency(tx.amount || 0)}</span>
                    </td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      <div className="date-cell">
                        <div>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}</div>
                        <div className="time-text">{tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : ''}</div>
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => handleView(tx)} title="View Details">
                          <FaEye />
                        </button>
                        {tx.status === 'failed' && (
                          <button className="icon-btn retry" onClick={() => handleRetry(tx._id)} title="Retry">
                            <FaRedo />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="pagination">
              <span>Showing {((pagination.page - 1) * 20) + 1}-{Math.min(pagination.page * 20, pagination.total || 0)} of {pagination.total || 0}</span>
              <div className="pagination-btns">
                <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span className="page-indicator">Page {pagination.page || 1} of {pagination.pages || 1}</span>
                <button disabled={pagination.page >= (pagination.pages || 1)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedTx && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button onClick={() => setShowDetail(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Reference</label>
                  <p>{selectedTx.paymentReference || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{getStatusBadge(selectedTx.status)}</p>
                </div>
                <div className="detail-item">
                  <label>Type</label>
                  <p className="capitalize">{selectedTx.transactionType?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Amount</label>
                  <p className="amount-highlight">{formatCurrency(selectedTx.amount || 0)}</p>
                </div>
                <div className="detail-item">
                  <label>User</label>
                  <p>{selectedTx.user?.firstName || 'Unknown'} {selectedTx.user?.lastName || ''}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedTx.user?.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{selectedTx.recipientPhone || selectedTx.user?.phone || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Service</label>
                  <p className="capitalize">{selectedTx.service || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Payment Method</label>
                  <p className="capitalize">{selectedTx.paymentMethod || 'Wallet'}</p>
                </div>
                <div className="detail-item">
                  <label>Date</label>
                  <p>{selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Description</label>
                  <p>{selectedTx.description || 'N/A'}</p>
                </div>
                {selectedTx.metadata && (
                  <div className="detail-item full-width">
                    <label>API Response</label>
                    <pre className="api-response">{JSON.stringify(selectedTx.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;