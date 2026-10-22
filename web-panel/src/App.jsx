import React, { useState, useEffect, useRef } from 'react';
import AdminLogin from './components/AdminLogin';
import PasswordRecovery from '../../shared/PasswordRecovery';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import LogoLoader from './components/LogoLoader';
import AdminDashboard from './components/AdminDashboard';
import { adminApi } from './api';
import { adminPath, matchAdminPage, navigateAdmin, cleanAdminReturnUrl } from './routes';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState(() => window.location.pathname);
  const requestedPage = useRef(null);
  const page = matchAdminPage(path);
  useEffect(() => {
    cleanAdminReturnUrl();
    const update = () => { cleanAdminReturnUrl(); setPath(window.location.pathname); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => {
    if (loading) return;
    if (['forgot-password', 'reset-password'].includes(page)) return;
    if (!admin && page !== 'login') {
      if (page) requestedPage.current = { path: window.location.pathname, search: window.location.search, state: window.history.state };
      navigateAdmin(null, { replace: true });
    } else if (admin && (!page || page === 'login')) {
      const destination = requestedPage.current;
      if (destination) {
        window.history.replaceState(destination.state || {}, '', destination.path + destination.search);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo(0, 0);
      } else navigateAdmin('overview', { replace: true });
      requestedPage.current = null;
    }
  }, [admin, loading, page]);

  useEffect(() => {
    async function verifyAdminSession() {
      const token = localStorage.getItem('meetfame_admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await adminApi.auth.getMe();
        if (res.user?.role === 'admin') {
          setAdmin(res.user);
        } else {
          localStorage.removeItem('meetfame_admin_token');
        }
      } catch (err) {
        console.warn('Admin session expired:', err);
        localStorage.removeItem('meetfame_admin_token');
      } finally {
        setLoading(false);
      }
    }

    verifyAdminSession();
  }, []);

  const handleLoginSuccess = (adminUser) => {
    setAdmin(adminUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('meetfame_admin_token');
    requestedPage.current = null;
    setAdmin(null);
    navigateAdmin(null, { replace: true });
  };

  if (loading) return <LogoLoader label="Loading admin workspace…" />;
  if (['forgot-password', 'reset-password'].includes(page)) return <PasswordRecovery header={<><Logo /><ThemeToggle /></>} key={page} role="admin" reset={page === 'reset-password'} requestReset={adminApi.auth.forgotPassword} verifyOtp={adminApi.auth.verifyOtp} savePassword={adminApi.auth.resetPassword} loginUrl={adminPath(null)} />;

  return (
    <div>
      {!admin ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminDashboard
          activeTab={page && page !== 'login' ? page : 'overview'}
          admin={admin}
          onLogout={handleLogout}
          onProfileUpdated={setAdmin}
        />
      )}
    </div>
  );
}
