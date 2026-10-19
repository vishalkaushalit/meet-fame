import LogoLoader from './LogoLoader';
import React, { useState } from 'react';
import Logo from './Logo';
import { adminApi } from '../api';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@meetfame.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminApi.auth.login(email, password);
      localStorage.setItem('meetfame_admin_token', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.error || 'Failed to authenticate admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail('admin@meetfame.com');
    setPassword('admin123');
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.auth.login('admin@meetfame.com', 'admin123');
      localStorage.setItem('meetfame_admin_token', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.error || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Access</span>
          </div>
          <p className="text-xs text-slate-400">
            Sign in to manage influencer approvals, slots, bookings &
            conversations.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@meetfame.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <LogoLoader variant="button" label="Authenticating…" />
            ) : (
              'Sign In to Command Center'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Login for testing */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1-Click Super Admin Login (admin@meetfame.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
