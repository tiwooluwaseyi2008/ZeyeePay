import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import {
  FaSearch, FaSync, FaPlus, FaEdit, FaTrash, FaCopy, FaTimes,
  FaCheck, FaBan, FaBox, FaMobileAlt, FaTv, FaBolt
} from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import './AdminServices.css';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    type: 'data', network: '', planName: '', planCode: '',
    price: '', discount: '0', description: '', category: 'monthly', validity: '30 Days'
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page || 1,
        limit: 12,
        search,
        type: typeFilter,
        status: statusFilter,
        sort: sortBy
      });

      const res = await api.get(`/api/admin/services?${params}`);
      let filteredServices = res.data.data.services || [];
      
      // Client-side category filter
      if (categoryFilter) {
        filteredServices = filteredServices.filter(s => s.category === categoryFilter);
      }
      
      setServices(filteredServices);
      setStats(res.data.data.stats || {});
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error('Failed to load services');
      setServices([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, typeFilter, statusFilter, sortBy, categoryFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.network || !form.planName || !form.planCode || !form.price) {
      return toast.error('Please fill all required fields');
    }

    try {
      if (editingId) {
        await api.put(`/api/admin/services/${editingId}`, form);
        toast.success('Service updated!');
      } else {
        await api.post('/api/admin/services', form);
        toast.success('Service added!');
      }
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (service) => {
    setForm({
      type: service.type || 'data',
      network: service.network || '',
      planName: service.planName || '',
      planCode: service.planCode || '',
      price: service.price || '',
      discount: service.discount || 0,
      description: service.description || '',
      category: service.category || 'monthly',
      validity: service.validity || '30 Days'
    });
    setEditingId(service._id);
    setShowForm(true);
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/api/admin/services/${id}/duplicate`);
      toast.success('Service duplicated!');
      fetchServices();
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/services/${id}`);
      toast.success('Service deleted!');
      setShowDeleteConfirm(null);
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/api/admin/services/${id}/toggle`);
      fetchServices();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleBulkAction = async (action) => {
    if (!selected.length) return toast.error('No services selected');
    
    try {
      await api.post('/api/admin/services/bulk', { ids: selected, action });
      toast.success(`Bulk ${action} completed`);
      setSelected([]);
      fetchServices();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === services.length && services.length > 0) {
      setSelected([]);
    } else {
      setSelected(services.map(s => s._id));
    }
  };

  const resetForm = () => {
    setForm({ 
      type: 'data', network: '', planName: '', planCode: '', 
      price: '', discount: '0', description: '', category: 'monthly', validity: '30 Days' 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeIcon = (type) => {
    const icons = { data: '📶', airtime: '📱', tv: '📺', electricity: '⚡' };
    return icons[type] || '📄';
  };

  const getTypeColor = (type) => {
    const colors = { data: '#0066cc', airtime: '#28a745', tv: '#6f42c1', electricity: '#fd7e14' };
    return colors[type] || '#666';
  };

  const profit = form.price && form.discount ? Number(form.price) - Number(form.discount) : 0;
  const profitPercent = form.price ? ((profit / Number(form.price)) * 100).toFixed(1) : 0;

  const statCards = [
    { icon: <FaBox />, label: 'Total', value: stats.total || 0, color: '#0066cc' },
    { icon: <FaCheck />, label: 'Active', value: stats.active || 0, color: '#28a745' },
    { icon: <FaBan />, label: 'Inactive', value: stats.inactive || 0, color: '#dc3545' },
    { icon: <FaMobileAlt />, label: 'Data', value: stats.data || 0, color: '#17a2b8' },
    { icon: <FaMobileAlt />, label: 'Airtime', value: stats.airtime || 0, color: '#20c997' },
    { icon: <FaTv />, label: 'TV', value: stats.tv || 0, color: '#6f42c1' },
    { icon: <FaBolt />, label: 'Electricity', value: stats.electricity || 0, color: '#fd7e14' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminSidebar activePage="services" />

      <div style={{ flex: 1, padding: '25px', overflow: 'auto' }}>
        <div className="page-header">
          <div>
            <h1>Service Management</h1>
            <p>{stats.total || 0} total services</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {selected.length > 0 && (
              <div className="bulk-actions">
                <span>{selected.length} selected</span>
                <button onClick={() => handleBulkAction('activate')}>Activate</button>
                <button onClick={() => handleBulkAction('deactivate')}>Deactivate</button>
                <button className="danger" onClick={() => handleBulkAction('delete')}>Delete</button>
              </div>
            )}
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              <FaPlus /> {showForm ? 'Cancel' : 'Add Service'}
            </button>
          </div>
        </div>

        <div className="service-stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="service-stat-card" style={{ borderLeftColor: card.color }}>
              <div className="stat-icon" style={{ color: card.color }}>{card.icon}</div>
              <div>
                <h3>{card.value || 0}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="toolbar">
          <form onSubmit={(e) => { e.preventDefault(); fetchServices(); }} className="search-form">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by network, plan name, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="toolbar-actions">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCategoryFilter(''); }}>
              <option value="">All Types</option>
              <option value="data">📶 Data</option>
              <option value="airtime">📱 Airtime</option>
              <option value="tv">📺 TV</option>
              <option value="electricity">⚡ Electricity</option>
            </select>
            
            {typeFilter === 'data' && (
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">All Categories</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="sme">SME</option>
                <option value="corporate">Corporate</option>
                <option value="night">Night</option>
                <option value="social">Social</option>
              </select>
            )}
            
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">🟢 Active</option>
              <option value="inactive">🔴 Inactive</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_high">Highest Price</option>
              <option value="price_low">Lowest Price</option>
              <option value="network">By Network</option>
            </select>
            <button className="btn-refresh" onClick={fetchServices}>
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Select All Checkbox */}
        {services.length > 0 && !loading && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selected.length === services.length && services.length > 0}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', color: '#666' }}>
              Select All ({services.length} services)
            </span>
          </div>
        )}

        {showForm && (
          <div className="form-card">
            <h3>{editingId ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="data">📶 Data</option>
                    <option value="airtime">📱 Airtime</option>
                    <option value="tv">📺 TV</option>
                    <option value="electricity">⚡ Electricity</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Network *</label>
                  {form.type === 'data' || form.type === 'airtime' ? (
                    <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                      <option value="">Select Network</option>
                      <option value="MTN">MTN</option>
                      <option value="Airtel">Airtel</option>
                      <option value="Glo">Glo</option>
                      <option value="9mobile">9mobile</option>
                    </select>
                  ) : form.type === 'tv' ? (
                    <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                      <option value="">Select Provider</option>
                      <option value="DStv">DStv</option>
                      <option value="GOtv">GOtv</option>
                      <option value="StarTimes">StarTimes</option>
                    </select>
                  ) : (
                    <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                      <option value="">Select Disco</option>
                      <option value="Ikeja Electric">Ikeja Electric (IKEDC)</option>
                      <option value="Eko Electric">Eko Electric (EKEDC)</option>
                      <option value="Abuja Electric">Abuja Electric (AEDC)</option>
                      <option value="Ibadan Electric">Ibadan Electric (IBEDC)</option>
                      <option value="Enugu Electric">Enugu Electric (EEDC)</option>
                      <option value="Port Harcourt Electric">Port Harcourt Electric (PHEDC)</option>
                      <option value="Kano Electric">Kano Electric (KEDCO)</option>
                      <option value="Kaduna Electric">Kaduna Electric</option>
                      <option value="Jos Electric">Jos Electric (JEDC)</option>
                      <option value="Benin Electric">Benin Electric (BEDC)</option>
                      <option value="Yola Electric">Yola Electric (YEDC)</option>
                      <option value="Aba Electric">Aba Electric (APLE)</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Plan Name *</label>
                  <input type="text" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} 
                    placeholder={form.type === 'data' ? 'e.g. 1GB, 2GB, 5GB' : form.type === 'tv' ? 'e.g. Premium, Compact' : 'e.g. Prepaid'} />
                </div>

                <div className="form-group">
                  <label>Plan Code *</label>
                  <input type="text" value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })} 
                    placeholder="e.g. mtn_1000, dstv-padi, gotv-max" />
                </div>

                {form.type === 'data' && (
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category || 'monthly'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="sme">SME</option>
                      <option value="corporate">Corporate</option>
                      <option value="night">Night</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Validity</label>
                  <input type="text" value={form.validity || ''} onChange={(e) => setForm({ ...form, validity: e.target.value })} 
                    placeholder="e.g. 30 Days, 7 Days, 1 Day" />
                </div>

                <div className="form-group">
                  <label>Selling Price (₦) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} 
                    placeholder="Price customers pay" />
                </div>

                <div className="form-group">
                  <label>Buying Price (₦)</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} 
                    placeholder="Your cost price (optional)" />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    placeholder="e.g. 30 Days validity" />
                </div>

                {form.price && (
                  <div className="profit-display">
                    <span>Profit: <strong>₦{profit.toLocaleString()}</strong></span>
                    <span className="profit-percent">({profitPercent}%)</span>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update Service' : 'Add Service'}
                </button>
                <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-skeleton">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{width:'60%',height:'20px'}}></div>
                <div className="skeleton" style={{width:'40%',height:'30px',marginTop:'10px'}}></div>
                <div className="skeleton" style={{width:'80%',height:'15px',marginTop:'10px'}}></div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <FaBox style={{ fontSize: '50px', color: '#ccc' }} />
            <h3>No services found</h3>
            <p>Try adjusting your filters or add a new service</p>
          </div>
        ) : (
          <>
            <div className="services-grid">
              {services.map(service => (
                <div key={service._id} className={`service-card ${selected.includes(service._id) ? 'selected' : ''} ${!service.isActive ? 'inactive' : ''}`}>
                  <div className="card-checkbox">
                    <input
                      type="checkbox"
                      checked={selected.includes(service._id)}
                      onChange={() => toggleSelect(service._id)}
                    />
                  </div>

                  <div className="card-type" style={{ backgroundColor: getTypeColor(service.type) + '15', color: getTypeColor(service.type) }}>
                    {getTypeIcon(service.type)} {service.type?.toUpperCase()}
                  </div>

                  <h3 className="card-network">{service.network || 'N/A'}</h3>
                  <p className="card-plan">{service.planName || 'N/A'}</p>
                  <p className="card-code">Code: {service.planCode || 'N/A'}</p>

                  {service.category && (
                    <p className="card-cat">📂 {service.category} | ⏱ {service.validity || '30 Days'}</p>
                  )}

                  {service.description && (
                    <p className="card-desc">{service.description}</p>
                  )}

                  <div className="card-price">
                    <span className="price-value">{formatCurrency(service.price || 0)}</span>
                    {service.discount > 0 && (
                      <span className="price-profit">Cost: ₦{service.discount.toLocaleString()}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(service._id)}
                    className={`toggle-btn ${service.isActive ? 'active' : 'inactive'}`}
                  >
                    {service.isActive ? <><FaCheck /> Active</> : <><FaBan /> Inactive</>}
                  </button>

                  <p className="card-updated">Updated: {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : 'N/A'}</p>

                  <div className="card-actions">
                    <button onClick={() => handleEdit(service)} title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDuplicate(service._id)} title="Duplicate"><FaCopy /></button>
                    <button onClick={() => setShowDeleteConfirm(service._id)} title="Delete" className="danger"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <span>Showing {((pagination.page - 1) * 12) + 1}-{Math.min(pagination.page * 12, pagination.total || 0)} of {pagination.total || 0}</span>
              <div className="pagination-btns">
                <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                <span className="page-indicator">Page {pagination.page || 1} of {pagination.pages || 1}</span>
                <button disabled={pagination.page >= (pagination.pages || 1)} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Service?</h2>
              <button onClick={() => setShowDeleteConfirm(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p>This action cannot be undone.</p>
              <div className="btn-group">
                <button className="btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;