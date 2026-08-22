import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before logout

// Auto logout wrapper component
const AutoLogoutHandler = () => {
  const navigate = useNavigate();
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 60 * 1000; // 1 minute warning

  useEffect(() => {
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

export default useAutoLogout;
