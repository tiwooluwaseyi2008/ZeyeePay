import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaEnvelope } from 'react-icons/fa';
import api from '../../api/axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await api.get(`/api/auth/verify-email/${token}`);
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      
      // Update user in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Verification failed. The link may have expired or already been used.'
      );
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '25px' }}>
          <h1 style={{ color: '#0066cc', fontSize: '24px', margin: 0 }}>
            ZeyeeSub<span style={{ color: '#ffd700' }}>VTU</span>
          </h1>
        </div>

        {/* Verifying State */}
        {status === 'verifying' && (
          <>
            <FaSpinner style={{ 
              fontSize: '50px', 
              color: '#0066cc', 
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }} />
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Verifying Your Email</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#d4edda',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px'
            }}>
              <FaCheckCircle style={{ fontSize: '40px', color: '#28a745' }} />
            </div>
            <h2 style={{ color: '#28a745', marginBottom: '10px' }}>Email Verified!</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>{message}</p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              Redirecting you to dashboard...
            </p>
            <Link to="/dashboard" style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#0066cc',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px'
            }}>
              Go to Dashboard Now
            </Link>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f8d7da',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px'
            }}>
              <FaTimesCircle style={{ fontSize: '40px', color: '#dc3545' }} />
            </div>
            <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Verification Failed</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>{message}</p>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'center', 
              flexWrap: 'wrap' 
            }}>
              <Link to="/login" style={{
                padding: '12px 25px',
                backgroundColor: '#0066cc',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Go to Login
              </Link>
              <Link to="/register" style={{
                padding: '12px 25px',
                backgroundColor: '#6c757d',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Register Again
              </Link>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>
                <FaEnvelope style={{ marginRight: '5px' }} /> What to do:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
                <li>Check if the link has expired (links are valid for 24 hours)</li>
                <li>Login and request a new verification email</li>
                <li>Check your spam folder</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
