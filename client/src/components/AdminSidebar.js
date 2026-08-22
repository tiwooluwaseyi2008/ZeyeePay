import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaShoppingCart, FaMoneyBillWave,
  FaSignOutAlt, FaBars, FaTimes, FaCog 
} from 'react-icons/fa';
import './Sidebar.css';
import api from '../api/axios';

const AdminSidebar = ({ activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    const token = localStorage.getItem('token');
    if (token) {
      await api.post('/api/auth/logout');
    }
  } catch (error) {
    // Silent fail
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }
};

  const menuItems = [
  { path: '/admin', icon: <FaHome />, label: 'Dashboard', id: 'dashboard' },
  { path: '/admin/users', icon: <FaUsers />, label: 'Users', id: 'users' },
  { path: '/admin/transactions', icon: <FaShoppingCart />, label: 'Transactions', id: 'transactions' },
  { path: '/admin/services', icon: <FaCog />, label: 'Services', id: 'services' },
  { path: '/admin/funding', icon: <FaMoneyBillWave />, label: 'Funding', id: 'funding' }  // ADD THIS
];

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button className="hamburger-btn admin-hamburger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <div className={`sidebar admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button inside sidebar (mobile) */}
        <button className="sidebar-close" onClick={() => setIsOpen(false)}>
          <FaTimes />
        </button>

        {/* Logo */}
        <h2 className="admin-logo">ZeyeeSub<span> Admin</span></h2>

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

export default AdminSidebar;
