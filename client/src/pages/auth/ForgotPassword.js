import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

    if (sent) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', maxWidth: '450px' }}>
          <h2 style={{ color: '#28a745' }}>✅ Email Sent!</h2>
          <p style={{ fontSize: '16px', margin: '15px 0' }}>We've sent a password reset link to <strong>{email}</strong></p>
          <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ margin: 0, color: '#856404', fontWeight: '500' }}>📧 Check your spam folder if you don't see it in your inbox</p>
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>The link expires in 10 minutes</p>
          <Link to="/login" style={{ color: '#0066cc', marginTop: '10px', display: 'inline-block' }}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', width: '100%', maxWidth: '400px' }}>
        <h2>Forgot Password</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Enter your email to receive a reset link</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '16px', boxSizing: 'border-box' }}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;