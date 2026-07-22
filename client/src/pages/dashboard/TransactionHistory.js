import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserSidebar from '../../components/UserSidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'successful': return { bg: '#d4edda', color: '#155724' };
      case 'failed': return { bg: '#f8d7da', color: '#721c24' };
      default: return { bg: '#fff3cd', color: '#856404' };
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="history" />
      
      <div style={{ flex: 1, padding: '30px' }}>
        <h1>Transaction History</h1>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: '#666', fontSize: '18px' }}>No transactions yet</p>
            <Link to="/dashboard/buy-data" style={{ color: '#0066cc' }}>Make your first purchase</Link>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                  <th style={th}>Service</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const statusStyle = getStatusStyle(tx.status);
                  return (
                    <tr key={tx._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={td}>{tx.transactionType?.replace('_', ' ') || 'Transaction'}</td>
                      <td style={td}>₦{tx.amount?.toLocaleString()}</td>
                      <td style={td}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={td}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const th = { padding: '15px', textAlign: 'left', fontWeight: '600', color: '#333' };
const td = { padding: '15px', color: '#555', textTransform: 'capitalize' };

export default TransactionHistory;