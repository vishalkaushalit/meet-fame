import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { api } from '../api';

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const load = useCallback(async () => {
    try {
      const result = await api.notifications.request();
      setItems(result.notifications);
      setError('');
    } catch { setError('Unable to load notifications. Try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [load]);
  useEffect(() => {
    if (!open) return;
    load();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open, load]);
  const mark = async id => {
    setSaving(true);
    try {
      await api.notifications.request(id ? `/${encodeURIComponent(id)}/read` : '/read-all', 'PUT');
      setItems(current => current.map(item => !id || item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setError('');
    } catch { setError('Unable to mark notifications as read. Try again.'); }
    finally { setSaving(false); }
  };
  const unread = items.filter(item => !item.readAt).length;
  return <div className="notification-root" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="notification-trigger" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen(value => !value)}><Bell size={20} />{unread > 0 && <span>{unread > 99 ? '99+' : unread}</span>}</button>
    {open && <section id="notification-panel" className="notification-panel" aria-label="Notifications"><header><div><strong>Notifications</strong><small>Meetings & announcements</small></div><button aria-label="Close notifications" onClick={() => setOpen(false)}><X size={18} /></button></header>
      <div className="notification-tools"><span>{unread} unread</span><button disabled={!unread || saving} onClick={() => mark()}><CheckCheck size={14} />Mark all read</button></div>
      {error && <div role="alert" className="notification-error">{error} <button onClick={load}>Retry</button></div>}
      <div className="notification-feed">{loading ? <p role="status" className="notification-empty">Loading notifications…</p> : !items.length && !error ? <p className="notification-empty">You're all caught up. Meeting updates and announcements will appear here.</p> : items.map(item => <article className={item.readAt ? '' : 'is-unread'} key={item.id}><h3>{item.title}</h3><p>{item.message}</p><footer><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>{!item.readAt && <button disabled={saving} onClick={() => mark(item.id)}>Mark read</button>}</footer></article>)}</div>
    </section>}
  </div>;
}
