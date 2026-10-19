import Pagination, { usePagination } from './Pagination';
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
  CheckCircle2,
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

  const filtered = bookings.filter((b) => {
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

  const bookingPagination = usePagination(
    filtered,
    `${statusFilter}:${searchTerm}`,
  );

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
            Global record of all 1-hour sessions, consultations, and attendee
            bookings.
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
            <strong className="text-emerald-400 font-mono">
              ${totalRevenue}
            </strong>
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
        <div className="record-list">
          <div className="admin-records-table-wrap">
            <table className="dashboard-table admin-records-table">
              <caption className="sr-only">Booked sessions</caption>
              <thead>
                <tr>
                  {[
                    'Sr. No.',
                    'Booking',
                    'Client',
                    'Creator',
                    'Topic',
                    'Date',
                    'Time (IST)',
                    'Meeting',
                    'Status',
                    'Fee',
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingPagination.items.map((b, index) => (
                  <tr key={b.id}>
                    <td className="record-serial-cell">
                      {bookingPagination.start + index}
                    </td>
                    <td>
                      <code className="record-id" title={b.id}>
                        {b.id}
                      </code>
                    </td>
                    <td>
                      <strong>{b.userName}</strong>
                      <small>{b.userEmail}</small>
                    </td>
                    <td>{b.influencerName}</td>
                    <td className="record-description">{b.topic || '—'}</td>
                    <td>
                      {b.date}
                      <small className="capitalize">{b.dayOfWeek}</small>
                    </td>
                    <td className="whitespace-nowrap">
                      {b.slotLabel || b.slot}
                    </td>
                    <td className="capitalize">{b.meetingType}</td>
                    <td>
                      <span className={`booking-status ${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>${b.price ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={bookingPagination} label="bookings" />
        </div>
      )}
    </div>
  );
}
