import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { FaSpinner } from 'react-icons/fa';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isValid, setIsValid] = useState(null); // null = loading, true = valid, false = invalid
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        
        if (adminOnly && res.data.data.user.role !== 'admin') {
          setIsValid(false);
          return;
        }
        
        setIsValid(true);
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsValid(false);
      }
    };

    verifyToken();
  }, [adminOnly]);

  // Loading state
  if (isValid === null) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        gap: '15px',
        color: '#666'
      }}>
        <FaSpinner style={{ fontSize: '40px', color: '#0066cc', animation: 'spin 1s linear infinite' }} />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isValid) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Authenticated
  return children;
};

export default ProtectedRoute;