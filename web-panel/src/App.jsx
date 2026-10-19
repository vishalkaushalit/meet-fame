import React, { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { adminApi } from './api';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setAdmin(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-xs text-slate-500">
        Loading MeetFame Command Center...
      </div>
    );
  }

  return (
    <div>
      {!admin ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminDashboard admin={admin} onLogout={handleLogout} onProfileUpdated={setAdmin} />
      )}
    </div>
  );
}
