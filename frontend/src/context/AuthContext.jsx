import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem('meetfame_token') || null,
  );
  const [loading, setLoading] = useState(true);

  // Status modal / popup state (for under-review or status alerts)
  const [statusAlert, setStatusAlert] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.auth.getMe();
        if (active) setUser(res.user);
      } catch (err) {
        if (!active) return;
        console.warn('Session expired or invalid token:', err);
        localStorage.removeItem('meetfame_token');
        setToken(null);
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUser();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const syncSession = (event) => {
      if (event.key !== 'meetfame_token' && event.key !== null) return;
      window.dispatchEvent(new Event('meetfame-session-ending'));
      setUser(null);
      setToken(localStorage.getItem('meetfame_token'));
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await api.auth.login(email, password, role);
      if (res.token && res.user) {
        localStorage.setItem('meetfame_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return res;
    } catch (err) {
      // Prompt requirement: "When the admin approves the influencer request only then the influencer will be active for login otherwise a popup is shown that the account is under selected status by the admin."
      if (
        err.status === 'pending_review' ||
        err.status === 'rejected' ||
        err.status === 'blocked'
      ) {
        setStatusAlert({
          title:
            err.status === 'pending_review'
              ? 'Account Under Review'
              : err.status === 'blocked'
                ? 'Account Blocked'
                : 'Account Status Notice',
          message:
            err.message ||
            'Your account is under review. You will be able to access your dashboard once approved.',
          status: err.status,
        });
      }
      throw err;
    }
  };

  const registerUser = async (formData) => {
    const res = await api.auth.registerUser(formData);
    if (res.token && res.user) {
      localStorage.setItem('meetfame_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const registerInfluencer = async (formData) => {
    const res = await api.auth.registerInfluencer(formData);
    // Prompt rule: "While registration the first msg is shown to influencer is your account is under review"
    setStatusAlert({
      title: 'Registration Submitted',
      message:
        res.message ||
        'Your account is under review. You will be able to access your dashboard once approved.',
      status: 'pending_review',
    });
    return res;
  };

  const logout = () => {
    window.dispatchEvent(new Event('meetfame-session-ending'));
    localStorage.removeItem('meetfame_token');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loading,
        statusAlert,
        setStatusAlert,
        login,
        registerUser,
        registerInfluencer,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
