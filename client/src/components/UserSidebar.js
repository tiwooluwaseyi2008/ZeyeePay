import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaMobileAlt, FaTv, FaBolt, 
  FaMoneyBillWave, FaHistory, FaUser, FaSignOutAlt,
  FaBars, FaTimes, FaShare
} from 'react-icons/fa';
import './Sidebar.css';
import api from '../api/axios';

const UserSidebar = ({ activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
  try {
    // Call logout API to blacklist token
    const token = localStorage.getItem('token');
    if (token) {
      await api.post('/api/auth/logout');
    }
  } catch (error) {
    // Silent fail - still clear local storage
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }
};

  const menuItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Dashboard', id: 'dashboard' },
    { path: '/dashboard/buy-data', icon: <FaMobileAlt />, label: 'Buy Data', id: 'data' },
    { path: '/dashboard/buy-airtime', icon: <FaMobileAlt />, label: 'Buy Airtime', id: 'airtime' },
    { path: '/dashboard/tv', icon: <FaTv />, label: 'TV Subscription', id: 'tv' },
    { path: '/dashboard/electricity', icon: <FaBolt />, label: 'Electricity', id: 'electricity' },
    { path: '/dashboard/fund-wallet', icon: <FaMoneyBillWave />, label: 'Fund Wallet', id: 'fund' },
    { path: '/dashboard/transactions', icon: <FaHistory />, label: 'History', id: 'history' },
    { path: '/dashboard/profile', icon: <FaUser />, label: 'Profile', id: 'profile' },
    { path: '/dashboard/refer', icon: <FaShare />, label: 'Refer & Earn', id: 'refer' }
  ];

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div className={`sidebar user-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button inside sidebar (mobile) */}
        <button className="sidebar-close" onClick={() => setIsOpen(false)}>
          <FaTimes />
        </button>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <p className="sidebar-name">{user.firstName} {user.lastName}</p>
            <p className="sidebar-email">{user.email}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="sidebar-logout">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </>
  );
};

export default UserSidebar;