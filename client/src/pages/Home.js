import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBolt, FaCheckCircle, FaMobileAlt, FaShieldAlt, FaSignal, FaTv, FaWhatsapp } from 'react-icons/fa';
import api from '../api/axios';
import './Home.css';

const networks = [
  { name: 'MTN', className: 'network-mtn', detail: 'Reliable bundles, every day' },
  { name: 'Airtel', className: 'network-airtel', detail: 'Stay connected for less' },
  { name: 'Glo', className: 'network-glo', detail: 'More data. More value.' },
];

const services = [
  { icon: FaMobileAlt, title: 'Data bundles', text: 'Affordable plans for streaming, work, school and everything in between.' },
  { icon: FaSignal, title: 'Airtime recharge', text: 'Top up any Nigerian line in seconds, with instant delivery.' },
  { icon: FaTv, title: 'TV subscriptions', text: 'Keep your DStv, GOtv and Startimes entertainment active.' },
  { icon: FaBolt, title: 'Electricity bills', text: 'Pay your power bill without queues or unnecessary stress.' },
];

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setChecking(false); return; }
      try { await api.get('/api/auth/me'); setIsLoggedIn(true); }
      catch { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      finally { setChecking(false); }
    };
    checkAuth();
  }, []);

  return (
    <main className="home-page">
      <div className="home-orb home-orb-one" /><div className="home-orb home-orb-two" />
      <nav className="home-nav container-wide">
        <Link to="/" className="brand-mark"><span className="brand-dot" />ZeyeeSub<span>VTU</span></Link>
        <div className="nav-actions">
          {!checking && (isLoggedIn ? <Link to="/dashboard" className="button button-primary">Open dashboard <FaArrowRight /></Link> : <><Link to="/login" className="nav-login">Login</Link><Link to="/register" className="button button-primary">Get started <FaArrowRight /></Link></>)}
        </div>
      </nav>

      <section className="hero container-wide">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse" /> Nigeria's simpler VTU platform</div>
          <h1>Power your day.<br /><em>Stay connected.</em></h1>
          <p>Buy data, airtime and pay bills across Nigeria with a wallet that works as fast as you do.</p>
          <div className="hero-actions"><Link to={isLoggedIn ? '/dashboard/data' : '/register'} className="button button-accent">Buy data now <FaArrowRight /></Link><a href="https://wa.me/2348105002814" target="_blank" rel="noopener noreferrer" className="button button-quiet"><FaWhatsapp /> Talk to support</a></div>
          <div className="trust-row"><span><FaCheckCircle /> Instant delivery</span><span><FaShieldAlt /> Secure payments</span><span><FaCheckCircle /> 24/7 access</span></div>
        </div>
        <div className="hero-card-wrap"><div className="hero-glow" /><div className="wallet-card"><div className="wallet-top"><span>ZeyeeSub wallet</span><span className="live-pill">● Live</span></div><p className="wallet-label">Available balance</p><strong className="wallet-amount">₦24,850<span>.00</span></strong><div className="wallet-bottom"><span>•••• 4028</span><span>Ready to use</span></div></div><div className="floating-transaction"><span className="transaction-icon"><FaCheckCircle /></span><span><b>Data delivered</b><small>MTN · 2GB plan</small></span><strong>₦700</strong></div></div>
      </section>

      <section className="network-strip container-wide"><p>One wallet. Every network.</p><div className="network-list">{networks.map((network) => <div className={`network-chip ${network.className}`} key={network.name}><b>{network.name}</b><span>{network.detail}</span></div>)}</div></section>
      <section className="services-section container-wide"><div className="section-heading"><div><span className="eyebrow">Everything in one place</span><h2>Move through life<br /><em>without interruptions.</em></h2></div><p>From your next data bundle to your monthly power bill, take care of the essentials in a few taps.</p></div><div className="service-grid">{services.map(({ icon: Icon, title, text }) => <article className="service-card" key={title}><div className="service-icon"><Icon /></div><h3>{title}</h3><p>{text}</p><Link to="/register">Explore <FaArrowRight /></Link></article>)}</div></section>
      <section className="home-cta container-wide"><div><span className="eyebrow">Ready when you are</span><h2>Good things happen<br /><em>when you stay connected.</em></h2></div><Link to="/register" className="button button-accent">Create free account <FaArrowRight /></Link></section>
      <footer className="home-footer container-wide"><Link to="/" className="brand-mark"><span className="brand-dot" />ZeyeeSub<span>VTU</span></Link><p>Simple, reliable payments for everyday Nigeria.</p><span>© 2026 ZeyeeSub VTU</span></footer>
      <a className="floating-whatsapp" href="https://wa.me/2348105002814" target="_blank" rel="noopener noreferrer" aria-label="Chat with ZeyeeSub support on WhatsApp"><FaWhatsapp /></a>
    </main>
  );
};

export default Home;
