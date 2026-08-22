import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import './App.css';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import BuyData from './pages/dashboard/BuyData';
import BuyAirtime from './pages/dashboard/BuyAirtime';
import TVSubscription from './pages/dashboard/TVSubscription';
import ElectricityBill from './pages/dashboard/ElectricityBill';
import FundWallet from './pages/dashboard/FundWallet';
import TransactionHistory from './pages/dashboard/TransactionHistory';
import Profile from './pages/dashboard/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminServices from './pages/admin/AdminServices';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import AdminFunding from './pages/admin/AdminFunding';
import VerifyEmail from './pages/auth/VerifyEmail';
import api from './api/axios';

// Auto logout wrapper component
// Auto logout wrapper component
const AutoLogoutHandler = () => {
  const navigate = useNavigate();
  

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 60 * 1000; // 1 minute warning
    let timeoutRef;
    let warningRef;

    const logout = async () => {
      try {
        await api.post('/api/auth/logout');
      } catch (error) {
        // Silent fail
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingPayment');
      navigate('/login');
    };

    const resetTimer = () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      if (warningRef) clearTimeout(warningRef);

      warningRef = setTimeout(() => {
        toast('You will be logged out in 1 minute due to inactivity.', {
          icon: '⏰',
          duration: 5000,
          position: 'top-center'
        });
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      timeoutRef = setTimeout(() => {
        logout();
        toast.error('Session expired due to inactivity. Please login again.');
      }, INACTIVITY_TIMEOUT);
    };

    // Only activate if user is logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    // Events that count as activity
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
      'click', 'keydown', 'wheel'
    ];

    const handleActivity = () => resetTimer();

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // ==========================================
    // LOGOUT ON TAB/BROWSER CLOSE
    // ==========================================
    const handleTabClose = () => {
      // Use sendBeacon for reliable logout on tab close
      const token = localStorage.getItem('token');
      if (token && navigator.sendBeacon) {
        const logoutUrl = `${process.env.REACT_APP_API_URL || window.location.origin}/api/auth/logout`;
        navigator.sendBeacon(logoutUrl, JSON.stringify({}));
      }
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('pendingPayment');
    };

    // Handle beforeunload (tab close, browser close, refresh)
    window.addEventListener('beforeunload', handleTabClose);
    
    // Handle page visibility change (tab hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab is hidden - clear local storage but don't call API (might be temporary)
        // We'll rely on inactivity timeout for the actual logout
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle when component unmounts (navigation away)
    const handleUnload = () => {
      handleTabClose();
    };
    window.addEventListener('unload', handleUnload);

    resetTimer();

    return () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      if (warningRef) clearTimeout(warningRef);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <AutoLogoutHandler />
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/buy-data" element={<ProtectedRoute><BuyData /></ProtectedRoute>} />
        <Route path="/dashboard/buy-airtime" element={<ProtectedRoute><BuyAirtime /></ProtectedRoute>} />
        <Route path="/dashboard/tv" element={<ProtectedRoute><TVSubscription /></ProtectedRoute>} />
        <Route path="/dashboard/electricity" element={<ProtectedRoute><ElectricityBill /></ProtectedRoute>} />
        <Route path="/dashboard/fund-wallet" element={<ProtectedRoute><FundWallet /></ProtectedRoute>} />
        <Route path="/dashboard/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute adminOnly={true}><AdminTransactions /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute adminOnly={true}><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/funding" element={<ProtectedRoute adminOnly={true}><AdminFunding /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
