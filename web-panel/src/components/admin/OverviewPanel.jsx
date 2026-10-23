import React from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { formatDate } from '../../../../shared/dateFormat';
import { money, initials } from './dashboardFormatters';

export default function OverviewPanel({
  metrics,
  days,
  setDays,
  stats,
  activity,
  maximum,
  pending,
  navigate,
  bookings,
  statuses,
  error,
  updated,
}) {
  return (
    <>
      <div className="dashboard-metrics">
        {metrics.map((metric) => {
          return (
            <article
              className={`metric-card metric-card-${metric.color}`}
              key={metric.label}
            >
              <div className="metric-top">
                <span>{metric.label}</span>
                <span className={`metric-icon ${metric.color}`}>
                  <metric.icon size={18} />
                </span>
              </div>
              <strong className="metric-value">{metric.value ?? '—'}</strong>
              <p>{metric.detail}</p>
            </article>
          );
        })}
      </div>
      <div className="dashboard-middle">
        <section className="dashboard-card activity-card">
          <div className="card-heading">
            <div>
              <h2>Booking activity</h2>
              <p>Sessions scheduled over the last {days} days</p>
            </div>
            <select
              aria-label="Booking activity period"
              value={days}
              onChange={(event) => {
                return setDays(Number(event.target.value));
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          <div className="activity-total">
            <strong>
              {stats
                ? activity.reduce((sum, day) => {
                    return sum + day.count;
                  }, 0)
                : '—'}
            </strong>
            <span>scheduled sessions</span>
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={
              stats
                ? activity.map((day) => {
                      return `${day.label}: ${day.count} bookings`;
                    }).join(', ')
                : 'Booking activity unavailable'
            }
          >
            <div className="chart-scale" aria-hidden="true">
              {[4, 3, 2, 1, 0].map((tick) => {
                return <span key={tick}>{(maximum * tick) / 4}</span>;
              })}
            </div>
            {activity.map((day, index) => {
              return (
                <div className="chart-column" key={day.key}>
                  <div className="chart-track">
                    <div
                      className="chart-bar"
                      style={{
                        height: stats
                          ? `${(day.count / maximum) * 100}%`
                          : '0%',
                      }}
                      title={`${day.label}: ${day.count} bookings`}
                    >
                      <span className="chart-count">
                        {stats ? day.count : '—'}
                      </span>
                    </div>
                  </div>
                  <span>
                    {days <= 7 || index % Math.ceil(days / 7) === 0
                      ? day.label
                      : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="dashboard-card review-card">
          <div className="card-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>Keep your community moving forward</p>
            </div>
            <span className="attention-dot" />
          </div>
          <div className="review-total">
            {pending ?? '—'}
            <span>pending reviews</span>
          </div>
          {[
            {
              label: 'Influencer registrations',
              value: stats?.pendingInfluencers,
              icon: Users,
            },
            {
              label: 'Certificate verification',
              value: stats?.pendingCertificates,
              icon: ShieldCheck,
            },
            {
              label: 'User registrations',
              value: stats?.pendingUsers,
              icon: CheckCircle2,
            },
          ].map((item) => {
            return (
              <button
                className="review-row"
                key={item.label}
                onClick={() => {
                  return navigate('approvals');
                }}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
                <strong>{item.value ?? '—'}</strong>
                <ArrowRight size={15} />
              </button>
            );
          })}
          <button
            className="primary-dashboard-button"
            onClick={() => {
              return navigate('approvals');
            }}
          >
            Open review queue <ArrowUpRight size={17} />
          </button>
        </section>
      </div>
      <section className="dashboard-card">
        <div className="card-heading">
          <div>
            <h2>Recent bookings</h2>
            <p>The latest connections on your platform</p>
          </div>
          <button
            className="dashboard-button button-primary"
            onClick={() => {
              return navigate('bookings');
            }}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>
        <div className="dashboard-table-wrap">
          <table
            className="dashboard-table column-sized-table"
            style={{ minWidth: 904 }}
          >
            <colgroup>
              <col style={{ width: 64 }} />
              <col style={{ width: 240 }} />
              <col style={{ width: 230 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>User / Influencer</th>
                <th>Session</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((booking, index) => {
                return (
                  <tr key={booking.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="booking-person">
                        <span className="booking-avatar">
                          {initials(booking.userName)}
                        </span>
                        <div>
                          <strong>{booking.userName}</strong>
                          <small>with {booking.influencerName}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {booking.topic || 'Consultation'}
                      <div className="recent-booking-time">
                        <span className="time-slot-badge">
                          {booking.slotLabel || booking.slot || '—'}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(booking.date)}</td>
                    <td className="booking-amount">{money(booking.price)}</td>
                    <td>
                      <span
                        className={`booking-status ${statuses.includes(booking.status) ? booking.status : ''}`}
                      >
                        {booking.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!bookings.length && (
            <div className="dashboard-empty">
              <CalendarDays size={28} />
              <strong>
                {stats ? 'No bookings yet' : 'Booking data unavailable'}
              </strong>
              <p>
                {stats
                  ? 'New sessions will appear here as users make bookings.'
                  : 'Refresh the dashboard to load your latest bookings.'}
              </p>
            </div>
          )}
        </div>
      </section>
      <div className="dashboard-footnote">
        <span className={error ? 'sync-dot offline' : 'sync-dot'} />
        {updated
          ? `Last updated ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · Refreshes every 30 seconds`
          : 'Waiting for the first successful update'}
      </div>
    </>
  );
}
