import React, { useState, useEffect } from 'react';
import UserSidebar from '../../components/UserSidebar';
import { FaUser, FaEnvelope, FaPhone, FaSave } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || ''
    });
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('user', JSON.stringify(res.data.data));
      setUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/users/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Password change failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <UserSidebar activePage="profile" />

      <div style={{ flex: 1, padding: '30px', maxWidth: '700px' }}>
        <h1>Profile Settings</h1>

        {/* Profile Info */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}><FaUser /> Personal Information</h3>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: editing ? '#6c757d' : '#0066cc',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!editing}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!editing}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}><FaEnvelope /> Email</label>
                <input type="email" value={formData.email} disabled style={styles.input} />
              </div>
              <div>
                <label style={styles.label}><FaPhone /> Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  style={styles.input}
                />
              </div>
            </div>
            {editing && (
              <button type="submit" disabled={loading} style={styles.saveBtn}>
                <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Change Password */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '20px' }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={styles.saveBtn}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '15px' }}>Account Info</h3>
          <p style={{ color: '#666', margin: '5px 0' }}>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
          <p style={{ color: '#666', margin: '5px 0' }}>Wallet Balance: ₦{user.walletBalance?.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '15px',
    boxSizing: 'border-box'
  },
  formGroup: {
    marginBottom: '15px'
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 25px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '15px'
  }
};

export default Profile;