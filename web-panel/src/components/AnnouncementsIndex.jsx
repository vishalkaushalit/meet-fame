import React, { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Search } from 'lucide-react';
import { adminApi } from '../api';
import { navigateAdminAction, navigateAdminRecord } from '../routes';
import { formatDate, formatDateTime } from '../../../shared/dateFormat';
import Pagination, { usePagination } from './Pagination';
import AnnouncementsView from './AnnouncementsView';
import StatusBadge from './StatusBadge';

export default function AnnouncementsIndex({ detailId, edit = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi.announcements.getAll().then(result => { if (active) { setItems(result.announcements || []); setError(''); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, detailId, edit]);
  const pagination = usePagination(items.filter(item => `${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase())), search);
  const selected = items.find(item => item.id === detailId);
  const status = item => item.expiresAt && Date.now() >= Date.parse(item.expiresAt) ? 'expired' : item.activeFrom && Date.now() < Date.parse(item.activeFrom) ? 'scheduled' : 'active';
  const audience = value => value === 'all' ? 'Users and influencers' : value === 'user' ? 'Users' : 'Influencers';
  const remove = async item => {
    if (!window.confirm(`Delete "${item.title}" and its notifications?`)) return;
    setDeleting(item.id);
    try { await adminApi.announcements.remove(item.id); setRevision(value => value + 1); } catch (err) { setError(err.message); }
    finally { setDeleting(null); }
  };
  if (loading) return <p role="status">Loading announcements…</p>;
  if (detailId && !selected) return <p role="alert">{error || 'Announcement not found.'}</p>;
  if (selected && edit) return <AnnouncementsView key={selected.id} announcement={selected} />;
  if (selected) return <section className="dashboard-card p-6 space-y-5">
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{selected.title}</h2><button className="user-view-button" aria-label="Edit announcement" onClick={() => navigateAdminRecord('announcements', selected.id, { edit: true })}><Pencil size={18} /></button></div>
    <dl className="account-details-fields">{[['Audience', audience(selected.audience)], ['Status', <StatusBadge status={status(selected)} />], ['Activation', formatDate(selected.activeFrom || selected.createdAt)], ['Expiry', selected.expiresAt ? formatDate(selected.expiresAt) : 'No expiry'], ['Recipients', selected.sent], ['Created', formatDateTime(selected.createdAt)], ['Updated', formatDateTime(selected.updatedAt || selected.createdAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="whitespace-pre-wrap break-words">{selected.message}</p>
  </section>;
  return <div className="space-y-6">
    <div className="admin-list-toolbar"><div className="users-search"><Search size={16} /><input aria-label="Search announcements" placeholder="Search announcements..." value={search} onChange={event => setSearch(event.target.value)} /></div><button className="dashboard-button button-primary" onClick={() => navigateAdminAction('add-announcement')}>Add announcement</button></div>
    {error && <p role="alert">{error}</p>}
    <div className="admin-records-table-wrap"><table className="dashboard-table"><thead><tr>{['S.No.', 'Title', 'Audience', 'Created', 'Activation', 'Expiry', 'Status', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{pagination.items.map((item, index) => <tr key={item.id}><td>{pagination.start + index}</td><td>{item.title}</td><td>{audience(item.audience)}</td><td>{formatDate(item.createdAt)}</td><td>{formatDate(item.activeFrom || item.createdAt)}</td><td>{item.expiresAt ? formatDate(item.expiresAt) : 'No expiry'}</td><td><StatusBadge status={status(item)} /></td><td><div className="account-icon-actions flex gap-2"><button className="user-view-button" aria-label={`View ${item.title}`} onClick={() => navigateAdminRecord('announcements', item.id)}><Eye size={16} /></button><button className="user-view-button" aria-label={`Edit ${item.title}`} onClick={() => navigateAdminRecord('announcements', item.id, { edit: true })}><Pencil size={16} /></button><button className="user-view-button" disabled={deleting === item.id} aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}{!pagination.total && <tr><td colSpan={8}>No announcements found.</td></tr>}</tbody></table></div>
    <Pagination pagination={pagination} label="announcements" />
  </div>;
}
