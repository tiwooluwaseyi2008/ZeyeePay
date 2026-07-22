import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { FaCheck, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

const AdminFunding = () => {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/admin/funding-requests');
      const allData = res.data.data.requests || [];
      setAllRequests(allData);
      
      // Filter by status if selected
      if (statusFilter) {
        setRequests(allData.filter(r => r.status === statusFilter));
      } else {
        setRequests(allData);
      }
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // Re-filter when status filter changes
  useEffect(() => {
    if (allRequests.length > 0) {
      if (statusFilter) {
        setRequests(allRequests.filter(r => r.status === statusFilter));
      } else {
        setRequests(allRequests);
      }
    }
  }, [statusFilter, allRequests]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/api/admin/funding-requests/${id}/approve`);
      toast.success('Funding approved!');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/api/admin/funding-requests/${id}/reject`);
      toast.success('Funding rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fff3cd', color: '#856404', text: '⏳ Pending' },
      approved: { bg: '#d4edda', color: '#155724', text: '✅ Approved' },
      rejected: { bg: '#f8d7da', color: '#721c24', text: '❌ Rejected' },
      review: { bg: '#d1ecf1', color: '#0c5460', text: '🔍 Review Needed' }
    };
    const b = badges[status] || badges.pending;
    return <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: b.bg, color: b.color }}>{b.text}</span>;
  };

  // Count by status
  const counts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'pending').length,
    review: allRequests.filter(r => r.status === 'review').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminSidebar activePage="funding" />
      <div style={{ flex: 1, padding: '25px' }}>
        <h1><FaMoneyBillWave /> Wallet Funding Requests</h1>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Approve or reject manual bank transfer funding requests
        </p>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStatusFilter('')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: statusFilter === '' ? '2px solid #0066cc' : '1px solid #ddd',
              backgroundColor: statusFilter === '' ? '#e6f0ff' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📋 All ({counts.all})
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: statusFilter === 'pending' ? '2px solid #ffc107' : '1px solid #ddd',
              backgroundColor: statusFilter === 'pending' ? '#fff3cd' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ⏳ Pending ({counts.pending})
          </button>
          <button 
            onClick={() => setStatusFilter('review')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: statusFilter === 'review' ? '2px solid #17a2b8' : '1px solid #ddd',
              backgroundColor: statusFilter === 'review' ? '#d1ecf1' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🔍 Review Queue ({counts.review})
          </button>
          <button 
            onClick={() => setStatusFilter('approved')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: statusFilter === 'approved' ? '2px solid #28a745' : '1px solid #ddd',
              backgroundColor: statusFilter === 'approved' ? '#d4edda' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ✅ Approved ({counts.approved})
          </button>
          <button 
            onClick={() => setStatusFilter('rejected')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: statusFilter === 'rejected' ? '2px solid #dc3545' : '1px solid #ddd',
              backgroundColor: statusFilter === 'rejected' ? '#f8d7da' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ❌ Rejected ({counts.rejected})
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Loading...</p>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '12px' }}>
            <FaMoneyBillWave style={{ fontSize: '50px', color: '#ccc' }} />
            <h3>No funding requests found</h3>
            <p style={{ color: '#888' }}>
              {statusFilter ? `No ${statusFilter} requests` : 'All clear!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {requests.map(req => (
              <div key={req._id} style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: req.status === 'review' ? '4px solid #17a2b8' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong>{req.user?.firstName} {req.user?.lastName}</strong>
                    <p style={{ margin: '3px 0', fontSize: '13px', color: '#888' }}>
                      {req.user?.email} | {req.user?.phone}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, color: '#0066cc' }}>{formatCurrency(req.amount)}</h3>
                    <p style={{ margin: '3px 0', fontSize: '12px', color: '#888' }}>
                      Ref: {req.reference}
                    </p>
                  </div>
                </div>

                {/* Show review reason if in review queue */}
                {req.status === 'review' && req.reviewReason && (
                  <div style={{
                    backgroundColor: '#d1ecf1',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    marginTop: '10px',
                    fontSize: '13px',
                    color: '#0c5460'
                  }}>
                    <strong>🔍 Review Reason:</strong> {req.reviewReason}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <div>
                    {getStatusBadge(req.status)}
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {(req.status === 'pending' || req.status === 'review') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApprove(req._id)} style={approveBtn}>
                        <FaCheck /> Approve
                      </button>
                      <button onClick={() => handleReject(req._id)} style={rejectBtn}>
                        <FaTimes /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const approveBtn = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
  backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px',
  cursor: 'pointer', fontWeight: '600'
};

const rejectBtn = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
  backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '8px',
  cursor: 'pointer', fontWeight: '600'
};

export default AdminFunding;