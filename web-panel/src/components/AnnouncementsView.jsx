import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { adminApi } from '../api';
export default function AnnouncementsView() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (sending || !title.trim() || !message.trim()) return;
    setSending(true);
    setNotice('');
    setError('');
    try {
      const result = await adminApi.announcements.send({
        title: title.trim(),
        message: message.trim(),
        audience,
      });
      setNotice(`Announcement sent to ${result.sent} active accounts.`);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.error || 'Unable to send announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };
  const field =
    'w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white mt-2';
  return (
    <form onSubmit={submit} className="dashboard-card p-6 max-w-2xl space-y-5">
      <p className="text-xs text-slate-400">
        Send an in-app notification to approved users, influencers, or both.
      </p>
      <label className="block text-xs text-slate-300">
        Audience
        <select
          disabled={sending}
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          className={field}
        >
          <option value="all">Users and influencers</option>
          <option value="user">Users only</option>
          <option value="influencer">Influencers only</option>
        </select>
      </label>
      <label className="block text-xs text-slate-300">
        Title
        <input
          required
          maxLength={100}
          disabled={sending}
          placeholder="Enter your announcement title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={field}
        />
      </label>
      <label className="block text-xs text-slate-300">
        Announcement
        <textarea
          required
          maxLength={2000}
          rows={6}
          disabled={sending}
          placeholder="Enter your announcement message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={field}
        />
      </label>
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
        disabled={sending || !title.trim() || !message.trim()}
        className="dashboard-button button-primary disabled:opacity-50"
      >
        <Send size={15} />
        {sending ? <span>Sending…</span> : 'Send announcement'}
      </button>
    </form>
  );
}
