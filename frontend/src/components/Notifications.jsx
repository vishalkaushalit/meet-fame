import { formatDateTime } from '../../../shared/dateFormat';
import LogoLoader from './LogoLoader';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CalendarClock, X, CheckCheck } from 'lucide-react';
import { api } from '../api';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const root = useRef(null),
    trigger = useRef(null),
    shown = useRef(new Set());
  const refresh = useRef(null);
  const load = useCallback(async () => {
    try {
      const result = await api.notifications.request();
      setItems(result.notifications);
      setUnread(result.unreadCount);
      setError('');
      const reminder = result.notifications.find(
        (item) =>
          item.kind === 'reminder' &&
          !item.readAt &&
          !shown.current.has(item.id),
      );
      for (const item of result.notifications) shown.current.add(item.id);
      if (reminder) setBanner(reminder);
      return result.nextDueAt
        ? Math.min(10000, Math.max(250, result.nextDueAt - result.serverNow))
        : 10000;
    } catch {
      setError('Unable to load notifications. Please try again.');
      return 10000;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true,
      timer;
    const poll = async () => {
      clearTimeout(timer);
      const delay = await load();
      if (active) timer = setTimeout(poll, delay);
    };
    refresh.current = poll;
    poll();
    const focus = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', focus);
    window.addEventListener('meetfame-bookings-updated', poll);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', focus);
      window.removeEventListener('meetfame-bookings-updated', poll);
      refresh.current = null;
    };
  }, [load]);
  useEffect(() => {
    if (!open) return;
    refresh.current?.();
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  // Dismiss a reminder banner once the session ends or is cancelled.
  useEffect(() => {
    if (banner && !items.some((item) => item.id === banner.id)) setBanner(null);
  }, [items, banner]);
  const mark = async (id) => {
    setSaving(true);
    try {
      await api.notifications.request(
        id ? `/${encodeURIComponent(id)}/read` : '/read-all',
        'PUT',
      );
      await load();
    } catch {
      setError('Unable to save read status. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const viewBookings = () => {
    setOpen(false);
    setBanner(null);
    window.dispatchEvent(new Event('meetfame-show-bookings'));
  };
  return (
    <>
      <div
        className="notification-root"
        ref={root}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <button
          ref={trigger}
          type="button"
          className="notification-trigger"
          aria-label={`Notifications, ${unread} unread`}
          aria-expanded={open}
          aria-controls="meeting-notifications"
          onClick={() => setOpen((value) => !value)}
        >
          <Bell size={20} aria-hidden="true" />
          {unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}
        </button>
        {open && (
          <section
            id="meeting-notifications"
            className="notification-panel"
            aria-label="Meeting notifications"
          >
            <header>
              <div>
                <strong>Notifications ({unread})</strong>
              </div>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="notification-tools">
              <button disabled={saving || !unread} onClick={() => mark()}>
                <CheckCheck size={14} />
                Mark all read
              </button>
            </div>
            {error && (
              <p role="alert" className="notification-error">
                {error}{' '}
                <button onClick={() => refresh.current?.()}>Retry</button>
              </p>
            )}
            <div className="notification-feed">
              {loading ? (
                <LogoLoader variant="inline" label="Loading notifications…" />
              ) : !items.length && !error ? (
                <p className="notification-empty">
                  No notifications yet. Meeting reminders appear 15 minutes
                  before your session.
                </p>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    className={item.readAt ? '' : 'is-unread'}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.message}</p>
                    <div className="notification-actions">
                      <button onClick={viewBookings}>View booking</button>
                      {!item.readAt && (
                        <button disabled={saving} onClick={() => mark(item.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                    <time dateTime={item.createdAt}>
                      {formatDateTime(item.createdAt)}{' '}
                      IST
                    </time>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </div>
      {banner &&
        createPortal(
          <aside className="meeting-reminder-banner" role="status">
            <CalendarClock size={22} aria-hidden="true" />
            <div>
              <strong>Upcoming session</strong>
              <p>{banner.message}</p>
              <button onClick={viewBookings}>View booking</button>
            </div>
            <button
              className="reminder-dismiss"
              aria-label="Dismiss meeting reminder"
              onClick={() => setBanner(null)}
            >
              <X size={18} />
            </button>
          </aside>,
          document.body,
        )}
    </>
  );
}
