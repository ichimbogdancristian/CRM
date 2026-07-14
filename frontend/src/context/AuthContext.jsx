import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as authAPI from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

  useEffect(() => {
    checkAuth();
    setupInactivityListener();
    return () => clearInactivityTimer();
  }, []);

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const resetInactivityTimer = () => {
    clearInactivityTimer();
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        logoutDueToInactivity();
      }, INACTIVITY_TIMEOUT);
    }
  };

  const logoutDueToInactivity = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    window.location.href = '/login?reason=inactivity';
  };

  const setupInactivityListener = () => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  };

  const checkAuth = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data);
      setError(null);
    } catch (err) {
      setUser(null);
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      setUser(response.data);
      setError(null);
      resetInactivityTimer();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isSuperuser: user?.is_superuser || false,
    isStaff: user?.is_staff || false,
    isClient: !user?.is_staff && !user?.is_superuser && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
