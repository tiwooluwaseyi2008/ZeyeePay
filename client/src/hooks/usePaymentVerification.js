import { useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

export const usePaymentVerification = (setUser) => {
  const retryCount = useRef(0);
  const timeoutRef = useRef(null);
  const verifying = useRef(false);
  const toastId = useRef(null);

  const clearPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (toastId.current) {
      toast.dismiss(toastId.current);
      toastId.current = null;
    }
  }, []);

  const pollPaymentStatus = useCallback(async (reference) => {
    // Prevent duplicate requests
    if (verifying.current) return;
    verifying.current = true;

    try {
      // Show toast only once
      if (!toastId.current) {
        toastId.current = toast.loading('Confirming payment...');
      }

      const res = await api.get(`/api/wallet/verify/${reference}`);
      const { status } = res.data;

      if (status === 'successful') {
        // Update balance
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.walletBalance = res.data.data.walletBalance;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        localStorage.removeItem('pendingPayment');
        
        toast.success('Payment successful! 🎉', { id: toastId.current });
        clearPolling();
        return;
      }

      if (retryCount.current >= MAX_RETRIES) {
        toast.error('Payment confirmation timed out', { id: toastId.current });
        localStorage.removeItem('pendingPayment');
        clearPolling();
        return;
      }

      // Retry
      retryCount.current++;
      timeoutRef.current = setTimeout(() => {
        verifying.current = false;
        pollPaymentStatus(reference);
      }, RETRY_DELAY);

    } catch (error) {
      if (retryCount.current >= MAX_RETRIES) {
        toast.error('Could not verify payment', { id: toastId.current });
        localStorage.removeItem('pendingPayment');
        clearPolling();
        return;
      }
      
      retryCount.current++;
      timeoutRef.current = setTimeout(() => {
        verifying.current = false;
        pollPaymentStatus(reference);
      }, RETRY_DELAY);
    }
  }, [setUser, clearPolling]);

  return { pollPaymentStatus, clearPolling };
};