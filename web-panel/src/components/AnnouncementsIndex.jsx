import React, { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2, Search, TriangleAlert } from 'lucide-react';
import { adminApi } from '../api';
import {
  navigateAdmin,
  navigateAdminAction,
  navigateAdminRecord,
} from '../routes';
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi.announcements
      .getAll()
      .then((result) => {
        if (active) {
          setItems(result.announcements || []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, detailId, edit]);
  const pagination = usePagination(
    items.filter((item) =>
      `${item.title} ${item.message}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    search,
  );
  const selected = items.find((item) => item.id === detailId);
  const status = (item) =>
    item.expiresAt && Date.now() >= Date.parse(item.expiresAt)
      ? 'expired'
      : item.activeFrom && Date.now() < Date.parse(item.activeFrom)
        ? 'scheduled'
        : 'active';
  const audience = (value) =>
    value === 'all'
      ? 'Users and influencers'
      : value === 'user'
        ? 'Users'
        : 'Influencers';
  const remove = async (item) => {
    if (deleting) return;
    setError('');
    setDeleting(item.id);
    try {
      await adminApi.announcements.remove(item.id);
      setDeleteTarget(null);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setRevision((value) => value + 1);
      if (detailId === item.id) navigateAdmin('announcements');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };
  const deleteConfirmation = deleteTarget && (
    <div
      className="announcement-delete-confirmation"
      role="alertdialog"
      aria-label="Delete announcement"
      aria-describedby="delete-announcement-message"
    >
      <div className="announcement-delete-warning">
        <span className="announcement-warning-icon">
          <TriangleAlert size={22} aria-hidden="true" />
        </span>
        <div>
          <h3>Delete announcement?</h3>
          <p id="delete-announcement-message">
            “{deleteTarget.title}” and its notifications will be permanently
            removed.
          </p>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="announcement-confirm-actions">
        <button
          type="button"
          className="dashboard-button"
          disabled={Boolean(deleting)}
          onClick={() => {
            setDeleteTarget(null);
            setError('');
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="dashboard-button announcement-confirm-delete"
          disabled={Boolean(deleting)}
          onClick={() => remove(deleteTarget)}
        >
          <Trash2 size={16} aria-hidden="true" />
          {deleting ? 'Deleting…' : 'Confirm delete'}
        </button>
      </div>
    </div>
  );
  if (loading) return <p role="status">Loading announcements…</p>;
  if (detailId && !selected)
    return <p role="alert">{error || 'Announcement not found.'}</p>;
  if (selected && edit)
    return <AnnouncementsView key={selected.id} announcement={selected} />;
  if (selected)
    return (
      <section className="dashboard-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">{selected.title}</h2>
          <div className="account-icon-actions announcement-actions">
            <button
              type="button"
              className="user-view-button"
              title="Edit announcement"
              aria-label="Edit announcement"
              onClick={() =>
                navigateAdminRecord('announcements', selected.id, {
                  edit: true,
                })
              }
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              className="announcement-delete-action"
              aria-label="Delete announcement"
              title="Delete announcement"
              disabled={deleting === selected.id}
              onClick={() => setDeleteTarget(selected)}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
        {deleteConfirmation}
        <dl className="account-details-fields">
          {[
            ['Audience', audience(selected.audience)],
            ['Status', <StatusBadge status={status(selected)} />],
            [
              'Activation',
              formatDate(selected.activeFrom || selected.createdAt),
            ],
            [
              'Expiry',
              selected.expiresAt ? formatDate(selected.expiresAt) : 'No expiry',
            ],
            ['Recipients', selected.sent],
            ['Created', formatDateTime(selected.createdAt)],
            [
              'Updated',
              formatDateTime(selected.updatedAt || selected.createdAt),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="whitespace-pre-wrap break-words">{selected.message}</p>
      </section>
    );
  return (
    <div className="space-y-6">
      {deleteConfirmation}
      <div className="admin-list-toolbar">
        <div className="users-search">
          <Search size={16} />
          <input
            aria-label="Search announcements"
            placeholder="Search announcements..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          className="dashboard-button button-primary"
          onClick={() => navigateAdminAction('add-announcement')}
        >
          Add announcement
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="admin-records-table-wrap">
        <table
          className="dashboard-table column-sized-table"
          style={{ minWidth: 1174 }}
        >
          <colgroup>
            <col style={{ width: 64 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 150 }} />
          </colgroup>
          <thead>
            <tr>
              {[
                'S.No.',
                'Title',
                'Audience',
                'Created',
                'Activation',
                'Expiry',
                'Status',
                'Actions',
              ].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((item, index) => (
              <tr key={item.id}>
                <td>{pagination.start + index}</td>
                <td>{item.title}</td>
                <td>{audience(item.audience)}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td>{formatDate(item.activeFrom || item.createdAt)}</td>
                <td>
                  {item.expiresAt ? formatDate(item.expiresAt) : 'No expiry'}
                </td>
                <td>
                  <StatusBadge status={status(item)} />
                </td>
                <td>
                  <div className="account-icon-actions announcement-actions">
                    <button
                      className="user-view-button"
                      aria-label={`View ${item.title}`}
                      onClick={() =>
                        navigateAdminRecord('announcements', item.id)
                      }
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="user-view-button"
                      aria-label={`Edit ${item.title}`}
                      onClick={() =>
                        navigateAdminRecord('announcements', item.id, {
                          edit: true,
                        })
                      }
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="announcement-delete-action"
                      disabled={deleting === item.id}
                      aria-label={`Delete ${item.title}`}
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pagination.total && (
              <tr>
                <td colSpan={8}>No announcements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} label="announcements" />
    </div>
  );
}
