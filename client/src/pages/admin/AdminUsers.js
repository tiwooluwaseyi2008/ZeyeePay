import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  FaSearch, FaSync, FaUserPlus, FaTimes,
  FaWallet, FaTrash, FaCheck, FaBan,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaCoins,
  FaUsers, FaUserCheck, FaClock
} from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency, formatNumber } from '../../utils/format';
import toast from 'react-hot-toast';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [formData, setFormData] = useState({ amount: '', reason: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page || 1,
        limit: 20,
        search,
        status: statusFilter,
        sort: sortBy
      });

      const res = await api.get(`/api/admin/users?${params}`);
      setUsers(res.data.data.users || []);
      setStats(res.data.data.stats || {});
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load users');
      setUsers([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/admin/users/${userId}/toggle-status`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      setActionMenu(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
    setFormData({ amount: '', reason: '' });
    setShowModal(true);
    setActionMenu(null);
  };

  const handleCreditWallet = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return toast.error('Enter a valid amount');
    }
    try {
      await api.post(`/api/admin/users/${selectedUser._id}/credit`, {
        amount: Number(formData.amount),
        description: formData.reason
      });
      toast.success(`Credited ₦${Number(formData.amount).toLocaleString()} to ${selectedUser.firstName}`);
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to credit wallet');
    }
  };

  const handleDebitWallet = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return toast.error('Enter a valid amount');
    }
    try {
      await api.post(`/api/admin/users/${selectedUser._id}/debit`, {
        amount: Number(formData.amount),
        description: formData.reason
      });
      toast.success(`Debited ₦${Number(formData.amount).toLocaleString()} from ${selectedUser.firstName}`);
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to debit wallet');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/admin/users/${selectedUser._id}`);
      toast.success('User deleted');
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null);
    if (actionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenu]);

  const statCards = [
    { icon: <FaUsers />, label: 'Total Users', value: formatNumber(stats.totalUsers || 0), color: '#0066cc' },
    { icon: <FaUserCheck />, label: 'Active', value: formatNumber(stats.activeUsers || 0), color: '#28a745' },
    { icon: <FaClock />, label: 'New Today', value: formatNumber(stats.newToday || 0), color: '#17a2b8' },
    { icon: <FaCoins />, label: 'Total Balance', value: formatCurrency(stats.totalWalletBalance || 0), color: '#ffc107' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminSidebar activePage="users" />

      <div style={{ flex: 1, padding: '25px', overflow: 'auto' }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p>{formatNumber(stats.totalUsers || 0)} total users</p>
          </div>
          <button className="btn-primary" onClick={() => openModal('create', {})}>
            <FaUserPlus /> Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="user-stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="user-stat-card" style={{ borderLeftColor: card.color }}>
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
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="toolbar-actions">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_balance">Highest Balance</option>
              <option value="lowest_balance">Lowest Balance</option>
              <option value="name">Name A-Z</option>
            </select>

            <button className="btn-refresh" onClick={fetchUsers}>
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-skeleton">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton" style={{width:'40px',height:'40px',borderRadius:'50%'}}></div>
                  <div className="skeleton" style={{width:'120px'}}></div>
                  <div className="skeleton" style={{width:'180px'}}></div>
                  <div className="skeleton" style={{width:'100px'}}></div>
                  <div className="skeleton" style={{width:'80px'}}></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <FaUser style={{ fontSize: '50px', color: '#ccc' }} />
              <h3>No users found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ backgroundColor: user.isActive ? '#0066cc' : '#999' }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <strong>{user.firstName || 'Unknown'} {user.lastName || ''}</strong>
                          <span className="user-id">ID: {user._id?.slice(-8) || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div><FaEnvelope className="cell-icon" /> {user.email || 'N/A'}</div>
                        <div><FaPhone className="cell-icon" /> {user.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="wallet-amount">{formatCurrency(user.walletBalance || 0)}</span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${user.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                      >
                        {user.isActive ? <><FaCheck /> Active</> : <><FaBan /> Inactive</>}
                      </button>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FaCalendar className="cell-icon" />
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenu(actionMenu === user._id ? null : user._id);
                          }}
                        >
                          <FaUserPlus style={{ transform: 'rotate(90deg)' }} />
                        </button>
                        {actionMenu === user._id && (
                          <div className="action-dropdown" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openModal('view', user)}>
                              <FaUser /> View Profile
                            </button>
                            <button onClick={() => openModal('credit', user)}>
                              <FaWallet /> Credit Wallet
                            </button>
                            <button onClick={() => openModal('debit', user)}>
                              <FaWallet /> Debit Wallet
                            </button>
                            <button onClick={() => handleToggleStatus(user._id, user.isActive)}>
                              {user.isActive ? <><FaBan /> Deactivate</> : <><FaCheck /> Activate</>}
                            </button>
                            <hr />
                            <button className="danger" onClick={() => openModal('delete', user)}>
                              <FaTrash /> Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {users.length > 0 && (
            <div className="pagination">
              <span>Showing {((pagination.page - 1) * 20) + 1}-{Math.min(pagination.page * 20, pagination.total || 0)} of {pagination.total || 0}</span>
              <div className="pagination-btns">
                <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                {[...Array(pagination.pages || 1)].map((_, i) => (
                  <button
                    key={i}
                    className={pagination.page === i + 1 ? 'active' : ''}
                    onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={pagination.page >= (pagination.pages || 1)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'credit' && 'Credit Wallet'}
                {modalType === 'debit' && 'Debit Wallet'}
                {modalType === 'view' && 'User Details'}
                {modalType === 'delete' && 'Delete User'}
              </h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              {(modalType === 'credit' || modalType === 'debit') && (
                <form onSubmit={modalType === 'credit' ? handleCreditWallet : handleDebitWallet}>
                  <p><strong>User:</strong> {selectedUser?.firstName || 'Unknown'} {selectedUser?.lastName || ''}</p>
                  <p><strong>Current Balance:</strong> {formatCurrency(selectedUser?.walletBalance || 0)}</p>
                  <div className="form-group">
                    <label>Amount (₦)</label>
                    <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required min="1" />
                  </div>
                  <div className="form-group">
                    <label>Reason</label>
                    <input type="text" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Reason for this action" />
                  </div>
                  <button type="submit" className={`btn-block ${modalType === 'debit' ? 'btn-danger' : 'btn-primary'}`}>
                    {modalType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                  </button>
                </form>
              )}

              {modalType === 'view' && (
                <div className="user-details">
                  <div className="detail-row"><FaUser /><span>Name:</span> <strong>{selectedUser?.firstName || 'Unknown'} {selectedUser?.lastName || ''}</strong></div>
                  <div className="detail-row"><FaEnvelope /><span>Email:</span> <strong>{selectedUser?.email || 'N/A'}</strong></div>
                  <div className="detail-row"><FaPhone /><span>Phone:</span> <strong>{selectedUser?.phone || 'N/A'}</strong></div>
                  <div className="detail-row"><FaWallet /><span>Balance:</span> <strong>{formatCurrency(selectedUser?.walletBalance || 0)}</strong></div>
                  <div className="detail-row"><FaCalendar /><span>Joined:</span> <strong>{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</strong></div>
                </div>
              )}

              {modalType === 'delete' && (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete <strong>{selectedUser?.firstName || 'Unknown'} {selectedUser?.lastName || ''}</strong>?</p>
                  <p className="warning">This action cannot be undone.</p>
                  <div className="btn-group">
                    <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                    <button className="btn-danger" onClick={handleDeleteUser}>Delete User</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;