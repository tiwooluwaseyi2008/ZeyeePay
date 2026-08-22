import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.firstName) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  // Get the page they tried to visit
  const from = location.state?.from || '/dashboard';

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleKeyDown = (e) => {
    // Detect Caps Lock
    if (e.getModifierState('CapsLock')) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      
      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to connect to server';
      
      if (!error.response) {
        toast.error('Network error. Please check your connection.');
      } else if (error.response.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response.status === 403) {
        toast.error('Account suspended. Contact support.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <h1>ZeyeeSub<span>VTU</span></h1>
          <p>Fast & Secure VTU Platform</p>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to access your wallet</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className={`input-group ${errors.email ? 'error' : ''}`}>
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={`input-group ${errors.password ? 'error' : ''}`}>
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {/* Caps Lock Warning */}
          {capsLock && (
            <div className="capslock-warning">
              <FaExclamationTriangle /> Caps Lock is ON
            </div>
          )}

          {/* Remember & Forgot */}
          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>

          {/* Submit */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <><FaSpinner className="spinner" /> Logging in...</>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>

        {/* Contact */}
        <div className="auth-contact">
          <p>Need help? WhatsApp: <a href="https://wa.me/2348105002814">08105002814</a></p>
        </div>
      </div>

      {/* Features Side */}
      <div className="auth-side">
        <div className="auth-side-content">
          <h2>Why ZeyeeSub?</h2>
          <ul>
            <li>📶 Buy Data - MTN, Airtel, Glo, 9mobile</li>
            <li>📱 Instant Airtime Recharge</li>
            <li>📺 TV Subscription - DStv, GOtv, Startimes</li>
            <li>⚡ Pay Electricity Bills</li>
            <li>💰 Secure Wallet System</li>
            <li>🕐 24/7 Availability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
