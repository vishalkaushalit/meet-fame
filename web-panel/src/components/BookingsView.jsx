import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  Filter,
  DollarSign,
  Video,
  Users,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function BookingsView() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      try {
        const res = await adminApi.bookings.getAll(statusFilter);
        setBookings(res.bookings || []);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [statusFilter]);

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.influencerName?.toLowerCase().includes(q) ||
      b.userName?.toLowerCase().includes(q) ||
      b.topic?.toLowerCase().includes(q) ||
      b.slot?.includes(q)
    );
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-purple" />
            <span>All Platform Bookings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global record of all 1-hour sessions, consultations, and attendee bookings.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Bookings: </span>
            <strong className="text-white font-mono">{bookings.length}</strong>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Volume: </span>
            <strong className="text-emerald-400 font-mono">${totalRevenue}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by influencer, user, topic..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {loading ? (
        <LogoLoader variant="inline" label="Loading bookings..." />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
          No bookings found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400">Client:</span>
                    <strong className="text-white text-sm">{b.userName}</strong>
                    <span className="text-xs text-slate-500">({b.userEmail})</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-xs text-slate-400">Creator:</span>
                    <strong className="text-brand-purple text-sm">{b.influencerName}</strong>

                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {b.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Topic: <span className="text-slate-100">{b.topic}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                    <span>Date: <strong className="text-white">{b.date}</strong> ({b.dayOfWeek})</span>
                    <span>•</span>
                    <span>Time Slot: <strong className="text-indigo-300 font-mono">{b.slotLabel || b.slot}</strong></span>
                    <span>•</span>
                    <span>Meeting: <strong className="text-slate-200 capitalize">{b.meetingType}</strong></span>
                    <span>•</span>
                    <span>Fee: <strong className="text-emerald-400 font-bold">${b.price}</strong></span>
                    <span>•</span>
                    <span>Booking ID: <code className="text-slate-500 text-[11px]">{b.id}</code></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
