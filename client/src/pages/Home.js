import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaMobileAlt, FaTv, FaBolt, FaArrowRight } from 'react-icons/fa';
import api from '../api/axios';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      try {
        await api.get('/api/auth/me');
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <h2 style={styles.logo}>PaySwift<span style={{ color: '#ffd700' }}>VTU</span></h2>
          <div style={styles.navLinks}>
            {!checking && (
              isLoggedIn ? (
                <Link to="/dashboard" style={styles.registerBtn}>Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" style={styles.navLink}>Login</Link>
                  <Link to="/register" style={styles.registerBtn}>Get Started</Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Buy Airtime, Data, Pay Bills <span style={{ color: '#ffd700' }}>Instantly</span>
          </h1>
          <p style={styles.heroText}>
            Fast and reliable VTU platform for all your airtime, data, TV subscription and electricity bill payments in Nigeria.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/register" style={styles.ctaBtn}>
              Get Started Free <FaArrowRight />
            </Link>
            <a 
              href="https://wa.me/2348105002814" 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.whatsappBtn}
            >
              <FaWhatsapp /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={styles.servicesSection}>
        <h2 style={styles.sectionTitle}>Our Services</h2>
        <p style={styles.sectionSubtitle}>Everything you need in one place</p>
        
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}><FaMobileAlt /></div>
            <h3>Buy Data</h3>
            <p>MTN, Airtel, Glo & 9mobile data bundles at affordable prices</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}><FaMobileAlt /></div>
            <h3>Buy Airtime</h3>
            <p>Instant airtime recharge for all Nigerian networks</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}><FaTv /></div>
            <h3>TV Subscription</h3>
            <p>Renew your DStv, GOtv & Startimes subscription easily</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}><FaBolt /></div>
            <h3>Electricity Bills</h3>
            <p>Pay electricity bills for all distribution companies</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={styles.pricingSection}>
        <h2 style={styles.sectionTitle}>Popular Data Plans</h2>
        <p style={styles.sectionSubtitle}>Affordable plans for all networks</p>
        
        <div style={styles.pricingGrid}>
          <div style={styles.pricingCard}>
            <div style={styles.networkBadge}>MTN</div>
            <h3>1.5GB</h3>
            <p style={styles.validity}>30 Days</p>
            <p style={styles.price}>₦500</p>
          </div>
          <div style={styles.pricingCard}>
            <div style={{ ...styles.networkBadge, backgroundColor: '#dc3545' }}>Airtel</div>
            <h3>1.5GB</h3>
            <p style={styles.validity}>30 Days</p>
            <p style={styles.price}>₦500</p>
          </div>
          <div style={styles.pricingCard}>
            <div style={{ ...styles.networkBadge, backgroundColor: '#28a745' }}>Glo</div>
            <h3>1.35GB</h3>
            <p style={styles.validity}>14 Days</p>
            <p style={styles.price}>₦500</p>
          </div>
          <div style={styles.pricingCard}>
            <div style={{ ...styles.networkBadge, backgroundColor: '#6f42c1' }}>9mobile</div>
            <h3>1GB</h3>
            <p style={styles.validity}>30 Days</p>
            <p style={styles.price}>₦500</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/register" style={styles.ctaBtn}>
            View All Plans <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div>
            <h3 style={{ color: 'white' }}>PaySwift<span style={{ color: '#ffd700' }}>VTU</span></h3>
            <p style={{ color: '#ccc', marginTop: '10px' }}>
              Your trusted VTU platform for airtime, data, TV subscription & electricity bills.
            </p>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Quick Links</h4>
            <Link to="/login" style={styles.footerLink}>Login</Link><br />
            <Link to="/register" style={styles.footerLink}>Register</Link><br />
            <a href="https://wa.me/2348105002814" style={styles.footerLink}>Contact Us</a>
          </div>
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Contact</h4>
            <p style={{ color: '#ccc', margin: '5px 0' }}>
              <FaWhatsapp /> WhatsApp: 08105002814
            </p>
            <p style={{ color: '#ccc', margin: '5px 0' }}>Available 24/7</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '30px', color: '#999', fontSize: '14px' }}>
          © 2025 PaySwift VTU. All rights reserved.
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/2348105002814" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          backgroundColor: '#25D366',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1000,
          textDecoration: 'none'
        }}
      >
        <FaWhatsapp />
      </a>
    </div>
  );
};

const styles = {
  nav: {
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    margin: 0,
    color: '#0066cc',
    fontSize: '24px',
    fontWeight: '800'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: '500'
  },
  registerBtn: {
    textDecoration: 'none',
    backgroundColor: '#0066cc',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    fontWeight: '600'
  },
  hero: {
    background: 'linear-gradient(135deg, #0066cc, #004d99)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '700px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '20px',
    lineHeight: '1.2'
  },
  heroText: {
    fontSize: '18px',
    marginBottom: '30px',
    opacity: '0.95',
    lineHeight: '1.6'
  },
  heroBtns: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  ctaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffd700',
    color: '#333',
    padding: '15px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px'
  },
  whatsappBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#25D366',
    color: 'white',
    padding: '15px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px'
  },
  servicesSection: {
    padding: '80px 20px',
    backgroundColor: '#f8f9fa'
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '50px',
    fontSize: '18px'
  },
  servicesGrid: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '25px'
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: '35px 25px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },
  serviceIcon: {
    fontSize: '40px',
    color: '#0066cc',
    marginBottom: '15px'
  },
  pricingSection: {
    padding: '80px 20px',
    backgroundColor: 'white'
  },
  pricingGrid: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  pricingCard: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px solid #eee'
  },
  networkBadge: {
    display: 'inline-block',
    backgroundColor: '#ffc107',
    color: '#333',
    padding: '5px 15px',
    borderRadius: '20px',
    fontWeight: '700',
    marginBottom: '15px',
    fontSize: '14px'
  },
  validity: {
    color: '#666',
    fontSize: '14px',
    margin: '5px 0'
  },
  price: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0066cc',
    margin: '10px 0 0 0'
  },
  footer: {
    backgroundColor: '#1a1a2e',
    padding: '50px 20px 20px',
    marginTop: '0'
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px'
  },
  footerLink: {
    color: '#ccc',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '5px 0'
  }
};

export default Home;