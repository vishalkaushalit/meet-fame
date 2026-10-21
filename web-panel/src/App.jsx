import React, { useState, useEffect, useRef } from 'react';
import AdminLogin from './components/AdminLogin';
import LogoLoader from './components/LogoLoader';
import AdminDashboard from './components/AdminDashboard';
import { adminApi } from './api';
import { matchAdminPage, navigateAdmin } from './routes';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState(() => window.location.pathname);
  const requestedPage = useRef(null);
  const page = matchAdminPage(path);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => {
    if (loading) return;
    if (!admin && page !== 'login') {
      if (page) requestedPage.current = { path: window.location.pathname, search: window.location.search };
      navigateAdmin(null, { replace: true });
    } else if (admin && (!page || page === 'login')) {
      const destination = requestedPage.current;
      if (destination) {
        window.history.replaceState({}, '', destination.path + destination.search);
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
