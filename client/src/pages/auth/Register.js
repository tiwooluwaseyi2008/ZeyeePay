import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaLock, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
    agreeTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  // Password strength checker
  useEffect(() => {
    const pw = formData.password;
    const checks = {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      lowercase: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pw)
    };
    setPasswordChecks(checks);
    
    const passed = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(passed);
  }, [formData.password]);

  const getStrengthInfo = () => {
    if (passwordStrength <= 1) return { text: 'Weak', color: '#dc3545', width: '25%' };
    if (passwordStrength <= 2) return { text: 'Fair', color: '#ffc107', width: '50%' };
    if (passwordStrength <= 3) return { text: 'Good', color: '#17a2b8', width: '75%' };
    if (passwordStrength <= 4) return { text: 'Strong', color: '#28a745', width: '90%' };
    return { text: 'Very Strong', color: '#20c997', width: '100%' };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(070|080|081|090|091)\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid Nigerian number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone') {
      // Only allow numbers
      const numValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'firstName' || name === 'lastName') {
      // Auto capitalize
      const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData(prev => ({ ...prev, [name]: capitalized }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        referralCode: formData.referralCode || undefined
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      
      if (message.includes('email')) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.includes('phone')) {
        setErrors(prev => ({ ...prev, phone: message }));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrengthInfo();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <h1>PaySwift<span>VTU</span></h1>
          <p>Fast & Secure VTU Platform</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join thousands of happy users</p>

        {/* Referral Banner */}
        {formData.referralCode && (
          <div className="referral-banner">
            🎉 You were referred! You'll get a bonus after your first purchase.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Row */}
          <div className="form-row">
            <div className={`input-group half ${errors.firstName ? 'error' : ''}`}>
              <FaUser className="input-icon" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                autoFocus
                autoComplete="given-name"
                disabled={loading}
                required
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            <div className={`input-group half ${errors.lastName ? 'error' : ''}`}>
              <FaUser className="input-icon" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                autoComplete="family-name"
                disabled={loading}
                required
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          {/* Email */}
          <div className={`input-group ${errors.email ? 'error' : ''}`}>
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              autoComplete="email"
              disabled={loading}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className={`input-group ${errors.phone ? 'error' : ''}`}>
            <FaPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number (08012345678)"
              autoComplete="tel"
              maxLength="11"
              disabled={loading}
              required
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          {/* Password */}
          <div className={`input-group ${errors.password ? 'error' : ''}`}>
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              autoComplete="new-password"
              disabled={loading}
              required
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

          {/* Password Strength */}
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className="strength-fill" style={{ width: strength.width, backgroundColor: strength.color }}></div>
              </div>
              <span style={{ color: strength.color, fontSize: '13px', fontWeight: '600' }}>{strength.text}</span>
              <div className="password-checks">
                <span className={passwordChecks.length ? 'pass' : ''}>
                  {passwordChecks.length ? <FaCheck /> : <FaTimes />} 8+ characters
                </span>
                <span className={passwordChecks.uppercase ? 'pass' : ''}>
                  {passwordChecks.uppercase ? <FaCheck /> : <FaTimes />} Uppercase letter
                </span>
                <span className={passwordChecks.lowercase ? 'pass' : ''}>
                  {passwordChecks.lowercase ? <FaCheck /> : <FaTimes />} Lowercase letter
                </span>
                <span className={passwordChecks.number ? 'pass' : ''}>
                  {passwordChecks.number ? <FaCheck /> : <FaTimes />} Number
                </span>
                <span className={passwordChecks.special ? 'pass' : ''}>
                  {passwordChecks.special ? <FaCheck /> : <FaTimes />} Special character
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className={`input-group ${errors.confirmPassword ? 'error' : ''}`}>
            <FaLock className="input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <span className="match-success"><FaCheck /> Passwords match</span>
            )}
          </div>

          {/* Referral Code */}
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="Referral Code (Optional)"
              disabled={loading}
            />
          </div>

          {/* Terms */}
          <div className={`terms-group ${errors.agreeTerms ? 'error' : ''}`}>
            <label className="terms-label">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                disabled={loading}
              />
              <span>I agree to the <Link to="/terms" target="_blank">Terms & Conditions</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link></span>
            </label>
            {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
          </div>

          {/* Submit */}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <><FaSpinner className="spinner" /> Creating Account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      {/* Benefits Side */}
      <div className="auth-side">
        <div className="auth-side-content">
          <h2>Why Join PaySwift?</h2>
          <ul>
            <li>📶 Buy Data at best prices</li>
            <li>📱 Instant Airtime delivery</li>
            <li>📺 TV Subscription renewal</li>
            <li>⚡ Fast electricity payments</li>
            <li>💰 Secure wallet system</li>
            <li>🎁 Referral bonuses</li>
            <li>🕐 24/7 Customer support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;