import React from 'react';
import {
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  Info,
} from 'lucide-react';
import { formatDate } from '../../../../shared/dateFormat';
import Pagination from '../Pagination';
import LogoLoader from '../LogoLoader';
import JoinCallButton from '../JoinCallButton';

export default function InfluencerBookings({
  bookings,
  bookingsError,
  loadingBookings,
  bookingPagination,
  onJoinCall,
  onOpenChat,
}) {
  return (
    <div className="creator-appointments p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-purple" />
            <span>My Bookings</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Manage your sessions and connect with your users.
          </p>
        </div>
      </div>

      {bookingsError && (
        <div
          role="alert"
          className="p-3 mb-4 text-xs text-rose-300 border border-rose-500/30 rounded-xl"
        >
          {bookingsError}
          <button
            className="ml-3 underline"
            onClick={() => {
              return window.dispatchEvent(
                new Event('meetfame-bookings-updated'),
              );
            }}
          >
            Retry
          </button>
        </div>
      )}
      {loadingBookings ? (
        <LogoLoader variant="inline" label="Loading appointments..." />
      ) : bookingsError && bookings.length === 0 ? null : bookings.length ===
        0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
          No paid bookings yet. Sessions appear here after payment is confirmed.
        </div>
      ) : (
        <div className="space-y-3">
          {bookingPagination.items.map((b) => {
            return (
              <article key={b.id} className="creator-appointment">
                <div className="creator-client">
                  <span className="creator-client-avatar" aria-hidden="true">
                    {b.userName?.charAt(0) || 'U'}
                  </span>
                  <div>
                    <h4>{b.userName}</h4>
                    <p>{b.userEmail}</p>
                  </div>
                </div>
                <div className="creator-session-info">
                  <div className="creator-topic">
                    <MessageSquare size={17} aria-hidden="true" />
                    <div>
                      <span>Topic</span>
                      <strong>{b.topic || '1-on-1 session'}</strong>
                    </div>
                  </div>
                  <div className="creator-session-time">
                    <span>
                      <Calendar size={16} aria-hidden="true" />
                      {formatDate(b.date)}{' '}
                      <span className="capitalize">({b.dayOfWeek})</span>
                    </span>
                    <span className="time-slot-badge">
                      <Clock size={16} aria-hidden="true" />
                      {b.slotLabel || b.slot} <small>IST</small>
                    </span>
                  </div>
                </div>
                <div className="creator-session-meta">
                  <div className="creator-status-field">
                    <span
                      className={`creator-status creator-status-${b.status}`}
                    >
                      <CheckCircle size={13} aria-hidden="true" />
                      {b.status}
                    </span>
                  </div>
                  <div className="creator-fee">
                    <div>
                      <span>Fee</span>
                      <strong>${b.price ?? 0}</strong>
                    </div>
                  </div>
                </div>
                <div className="creator-session-actions">
                  {b.status === 'confirmed' && b.meetingType === 'video' && (
                    <JoinCallButton booking={b} onJoinCall={onJoinCall} />
                  )}
                  <button
                    className="creator-chat-button"
                    onClick={() => {
                      return onOpenChat?.(
                        { id: b.userId, name: b.userName },
                        'user',
                      );
                    }}
                  >
                    <MessageSquare size={17} aria-hidden="true" />
                    Chat with User
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {!loadingBookings && (
        <Pagination pagination={bookingPagination} label="bookings" />
      )}
      <p className="creator-session-note">
        <Info size={18} aria-hidden="true" />
        You can join the meeting at the scheduled time or chat with the user for
        any updates.
      </p>
    </div>
  );
}
