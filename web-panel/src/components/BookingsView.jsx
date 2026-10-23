import { formatDate } from '../../../shared/dateFormat';
import StatusBadge from './StatusBadge';
import Pagination, { usePagination } from './Pagination';
import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { navigateAdminRecord } from '../routes';
import { Calendar, DollarSign, Search, Eye } from 'lucide-react';

export default function BookingsView({ detailId }) {
  const [bookings, setBookings] = useState([]);
  const selectedBooking = bookings.find((booking) => booking.id === detailId);
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

  if (selectedBooking) {
    const b = selectedBooking;
    const details = [
      ['Booking ID', b.id],
      ['User', b.userName],
      ['User email', b.userEmail],
      ['Influencer', b.influencerName],
      ['Date', formatDate(b.date)],
      ['Day', b.dayOfWeek],
      [
        'Time (IST)',
        <span className="time-slot-badge">{b.slotLabel || b.slot || '—'}</span>,
      ],
      ['Meeting type', b.meetingType],
      ['Status', <StatusBadge status={b.status} />],
      ['Fee', `$${b.price ?? 0}`],
      ['Topic', b.topic],
    ];
    return (
      <section
        className="account-details-dialog account-details-page"
        aria-labelledby="booking-details-title"
      >
        <div className="card-heading">
          <h2 id="booking-details-title">Booking details</h2>
        </div>
        <div className="account-details-body">
          <dl className="account-details-fields">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    );
  }

  if (detailId && !loading && !selectedBooking) {
    return (
      <div className="dashboard-card p-6 space-y-4">
        <p>Booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="booking-summary-cards">
        <div className="metric-card">
          <div className="metric-top">
            <span>Total Bookings</span>
            <span className="metric-icon violet">
              <Calendar size={18} />
            </span>
          </div>
          <strong className="metric-value text-white">{bookings.length}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-top">
            <span>Total Volume</span>
            <span className="metric-icon green">
              <DollarSign size={18} />
            </span>
          </div>
          <strong className="metric-value text-emerald-400">
            ${totalRevenue}
          </strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-list-toolbar">
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

        <label className="approval-status-filter ml-auto flex items-center gap-3 text-sm text-slate-300">
          Status:
          <select
            aria-label="Filter bookings by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
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
            <table
              className="dashboard-table admin-records-table column-sized-table"
              style={{ minWidth: 1074 }}
            >
              <colgroup>
                <col style={{ width: 64 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 210 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <caption className="sr-only">Booked sessions</caption>
              <thead>
                <tr>
                  {[
                    'S.No.',
                    'User',
                    'Influencer',
                    'Date',
                    'Time (IST)',
                    'Status',
                    'Fee',
                    'Action',
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
                      <span>{b.userName}</span>
                    </td>
                    <td>{b.influencerName}</td>
                    <td>{formatDate(b.date)}</td>
                    <td className="whitespace-nowrap">
                      <span className="time-slot-badge">
                        {b.slotLabel || b.slot || '—'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>${b.price ?? 0}</td>
                    <td>
                      <div className="account-icon-actions">
                        <button
                          type="button"
                          className="user-view-button"
                          title="View booking details"
                          aria-label={`View booking details for ${b.userName} with ${b.influencerName}`}
                          onClick={() => navigateAdminRecord('bookings', b.id)}
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
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
