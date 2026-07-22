import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '100%', maxWidth: '400px' }}>
        <h2>Reset Password</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Enter your new password</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;