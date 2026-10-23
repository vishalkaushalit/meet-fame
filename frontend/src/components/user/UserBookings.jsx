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

export default function UserBookings({
  bookingsError,
  loadingBookings,
  myBookings,
  bookingPagination,
  onJoinCall,
  onOpenChat,
}) {
  return (
    <div className="user-bookings creator-appointments p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
      {bookingsError && (
        <div
          role="alert"
          className="p-3 mb-4 text-xs text-rose-300 border border-rose-500/30 rounded-xl"
        >
          {bookingsError}
          <button
            className="ml-3 underline"
            onClick={() =>
              window.dispatchEvent(new Event('meetfame-bookings-updated'))
            }
          >
            Retry
          </button>
        </div>
      )}
      {loadingBookings ? (
        <LogoLoader variant="inline" label="Loading bookings..." />
      ) : bookingsError &&
        myBookings.length === 0 ? null : myBookings.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
          No paid bookings yet. Complete payment for a session to see it here.
        </div>
      ) : (
        <div className="space-y-3">
          {bookingPagination.items.map((b) => (
            <article key={b.id} className="creator-appointment">
              <div className="creator-client">
                <span className="creator-client-avatar" aria-hidden="true">
                  {b.influencerName?.charAt(0) || 'I'}
                </span>
                <div>
                  <h4>{b.influencerName}</h4>
                  <p>
                    Influencer ·{' '}
                    {b.meetingType === 'video'
                      ? 'Video session'
                      : 'In-person session'}
                  </p>
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
                  <span className={`creator-status creator-status-${b.status}`}>
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
                  onClick={() =>
                    onOpenChat?.(
                      { id: b.influencerId, name: b.influencerName },
                      'influencer',
                    )
                  }
                >
                  <MessageSquare size={17} aria-hidden="true" />
                  Chat with Influencer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loadingBookings && (
        <Pagination pagination={bookingPagination} label="bookings" />
      )}
      <p className="creator-session-note">
        <Info size={18} aria-hidden="true" />
        You can join the meeting at the scheduled time or chat with the
        influencer for any updates.
      </p>
    </div>
  );
}
