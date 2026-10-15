import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import ApprovalsView from './ApprovalsView';
import SlotsInspectorView from './SlotsInspectorView';
import BookingsView from './BookingsView';
import ConversationsView from './ConversationsView';
import { adminApi } from '../api';
import {
  Shield,
  Clock,
  Calendar,
  MessageSquare,
  Users,
  Sparkles,
  DollarSign,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'slots' | 'bookings' | 'conversations'
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await adminApi.stats.getOverview();
        setStats(res);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-brand-purple selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white py-2 px-3 rounded-xl hover:bg-slate-800 transition-colors border border-slate-800"
            >
              <span>View Main Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-brand-purple" />
            </a>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-bold flex items-center justify-center text-xs">
                AD
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-white">{admin?.name || 'Administrator'}</div>
                <div className="text-[10px] text-slate-400">Super Admin</div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* KPI Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Influencers</span>
              <Sparkles className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="text-3xl font-black text-white">{stats?.totalInfluencers ?? 4}</div>
            <div className="text-[11px] text-amber-400 mt-1 font-semibold flex items-center gap-1">
              <span>{stats?.pendingInfluencers ?? 1} pending review</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Verified Badges</span>
              <CheckCircle2 className="w-4 h-4 text-[#0095F6]" />
            </div>
            <div className="text-3xl font-black text-[#0095F6]">{stats?.verifiedInfluencers ?? 2}</div>
            <div className="text-[11px] text-blue-400 mt-1 font-semibold">
              {stats?.pendingCertificates ?? 1} certs waiting verification
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Bookings</span>
              <Calendar className="w-4 h-4 text-brand-coral" />
            </div>
            <div className="text-3xl font-black text-white">{stats?.totalBookings ?? 3}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
              {stats?.confirmedBookings ?? 3} confirmed 1-hour slots
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Platform Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">${stats?.totalVolume ?? 800}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {stats?.totalUsers ?? 3} active clients
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Registration & Certificate Approvals</span>
            {(stats?.pendingInfluencers || stats?.pendingCertificates) ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {(stats?.pendingInfluencers || 0) + (stats?.pendingCertificates || 0)}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'slots'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Influencer Slots Inspector (Available & Booked)</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Platform Bookings</span>
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conversations Monitor</span>
          </button>
        </div>

        {/* Active Tab View */}
        <div>
          {activeTab === 'approvals' && <ApprovalsView />}
          {activeTab === 'slots' && <SlotsInspectorView />}
          {activeTab === 'bookings' && <BookingsView />}
          {activeTab === 'conversations' && <ConversationsView />}
        </div>
      </main>
    </div>
  );
}
