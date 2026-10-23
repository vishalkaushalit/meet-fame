import DatePicker from '../../../shared/DatePicker.jsx';
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { adminApi } from '../api';
import { navigateAdminRecord } from '../routes';
export default function AnnouncementsView({ announcement }) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [message, setMessage] = useState(announcement?.message || '');
  const [audience, setAudience] = useState(announcement?.audience || 'all');
  const localDate = (value) => {
    return value
      ? new Date(Date.parse(value) + 19800000).toISOString().slice(0, 10)
      : '';
  };
  const [activeFrom, setActiveFrom] = useState(
    localDate(announcement?.activeFrom),
  );
  const [expiresAt, setExpiresAt] = useState(
    localDate(announcement?.expiresAt),
  );
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (sending || !title.trim() || !message.trim()) {
      return;
    }
    setSending(true);
    setNotice('');
    setError('');
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        audience,
        activeFrom: activeFrom
          ? new Date(`${activeFrom}T00:00:00+05:30`).toISOString()
          : undefined,
        expiresAt: expiresAt
          ? new Date(`${expiresAt}T23:59:59.999+05:30`).toISOString()
          : null,
      };
      if (announcement) {
        await adminApi.announcements.update(announcement.id, payload);
        navigateAdminRecord('announcements', announcement.id);
        return;
      }
      const result = await adminApi.announcements.send(payload);
      setNotice(
        Date.parse(payload.activeFrom) > Date.now()
          ? `Announcement scheduled for ${activeFrom}.`
          : `Announcement sent to ${result.sent} active accounts.`,
      );
      setTitle('');
      setMessage('');
      setActiveFrom('');
      setExpiresAt('');
    } catch (err) {
      setError(err.error || 'Unable to send announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };
  const field =
    'w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white mt-2';
  return (
    <form
      onSubmit={submit}
      className="dashboard-card admin-announcement-form p-6"
    >
      <p className="text-xs text-slate-400">
        Send an in-app notification to approved users, influencers, or both.
      </p>
      <label className="block text-xs text-slate-300">
        Title
        <input
          required
          maxLength={100}
          disabled={sending}
          placeholder="Enter your announcement title"
          value={title}
          onChange={(event) => {
            return setTitle(event.target.value);
          }}
          className={field}
        />
      </label>
      <label className="block text-xs text-slate-300">
        Audience
        <select
          disabled={sending || Boolean(announcement)}
          value={audience}
          onChange={(event) => {
            return setAudience(event.target.value);
          }}
          className={field}
        >
          <option value="all">Users and influencers</option>
          <option value="user">Users only</option>
          <option value="influencer">Influencers only</option>
        </select>
      </label>
      <label className="announcement-message-field block text-xs text-slate-300">
        Announcement
        <textarea
          required
          maxLength={2000}
          rows={6}
          disabled={sending}
          placeholder="Enter your announcement message"
          value={message}
          onChange={(event) => {
            return setMessage(event.target.value);
          }}
          className={field}
        />
      </label>
      <div className="announcement-date-fields grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label>
          Activation (IST)
          <DatePicker
            required
            className={field}
            value={activeFrom}
            onChange={(event) => {
              return setActiveFrom(event.target.value);
            }}
            disabled={sending}
          />
        </label>
        <label>
          Expiry (optional, IST)
          <DatePicker
            className={field}
            value={expiresAt}
            min={activeFrom || undefined}
            onChange={(event) => {
              return setExpiresAt(event.target.value);
            }}
            disabled={sending}
          />
        </label>
      </div>
      {notice && (
        <p role="status" className="text-xs text-emerald-400">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
      <button
        disabled={sending || !title.trim() || !message.trim() || !activeFrom}
        className="dashboard-button button-primary disabled:opacity-50"
      >
        <Send size={15} />
        {sending ? (
          <span>Sending…</span>
        ) : announcement ? (
          'Save changes'
        ) : activeFrom &&
          Date.parse(`${activeFrom}T00:00:00+05:30`) > Date.now() ? (
          'Schedule announcement'
        ) : (
          'Send announcement'
        )}
      </button>
    </form>
  );
}
