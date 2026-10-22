import { formatDate } from '../../../shared/dateFormat';
import StatusBadge from './StatusBadge';
import Pagination from './Pagination';
import { paginate } from '../../../shared/pagination';
import LogoLoader from './LogoLoader';
import React, { useEffect, useState } from 'react';
import {
  Search,
  Users,
  AlertCircle,
  Eye,
  Ban,
  Check,
  LockOpen,
  LoaderCircle,
} from 'lucide-react';
import { adminApi } from '../api';
import { navigateAccountDetails } from '../routes';

const statuses = [
  'all',
  'active',
  'approved',
  'pending_review',
  'blocked',
  'rejected',
];
const label = (status) => (status || 'unknown').replaceAll('_', ' ');

export default function UsersView({ refreshKey = 0 }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [blockingUser, setBlockingUser] = useState(null);
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi.accounts
      .getAll()
      .then((result) => {
        if (active) setUsers(result.accounts || []);
      })
      .catch(() => {
        if (active) setError('Unable to load accounts. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, reload]);

  const updateStatus = async (user, nextStatus, remark = '') => {
    if (!['user', 'influencer'].includes(user.role)) return;
    setSaving(`${user.role}:${user.id}`);
    setError('');
    setModalError('');
    setNotice('');
    try {
      const api =
        user.role === 'influencer' ? adminApi.influencers : adminApi.users;
      const result = await api.updateStatus(user.id, nextStatus, remark);
      const updated =
        user.role === 'influencer' ? result.influencer : result.user;
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id && item.role === user.role
            ? { ...updated, role: user.role }
            : item,
        ),
      );
      setNotice(
        nextStatus === 'blocked'
          ? `${user.name} is blocked from login. They will see your remark when signing in.`
          : `${user.name} can now log in.`,
      );
      setBlockingUser(null);
    } catch (err) {
      const message =
        err.error || 'Unable to update this user. Please try again.';
      if (nextStatus === 'blocked') setModalError(message);
      else setError(message);
    } finally {
      setSaving(null);
    }
  };

  const query = search.trim().toLowerCase();
  const filtered = users.filter(
    (user) =>
      (role === 'all' || user.role === role) &&
      (status === 'all' || user.status === status) &&
      [user.role, user.name, user.email, user.phone, user.id].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <section
      className="dashboard-card users-directory"
      aria-label="Registered accounts"
    >
      <div className="card-heading">
        <div>
          <h2>
            Registered accounts{!loading && !error ? ` (${users.length})` : ''}
          </h2>
          <p>All user, influencer and administrator accounts.</p>
        </div>
      </div>
      <div className="users-toolbar admin-list-toolbar">
        <div className="users-search">
          <Search size={16} />
          <input
            aria-label="Search users"
            placeholder="Search name, email, phone or user ID"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="users-filters">
          <label className="approval-status-filter flex items-center gap-3 text-sm">
          Role:
          <select
            aria-label="Filter accounts by role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            {['all', 'user', 'influencer', 'admin'].map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All roles' : label(value)}
              </option>
            ))}
          </select>
          </label>
          <label className="approval-status-filter flex items-center gap-3 text-sm">
          Status:
          <select
            aria-label="Filter users by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All statuses' : label(value)}
              </option>
            ))}
          </select>
          </label>
        </div>
      </div>
      {notice && (
        <p className="users-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="dashboard-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={() => setReload((value) => value + 1)}>Retry</button>
        </div>
      )}
      {loading ? (
        <LogoLoader variant="inline" label="Loading accounts…" />
      ) : error && !users.length ? null : (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table column-sized-table" style={{ minWidth: 1204 }}><colgroup><col style={{ width: 64 }} /><col style={{ width: 200 }} /><col style={{ width: 110 }} /><col style={{ width: 230 }} /><col style={{ width: 140 }} /><col style={{ width: 120 }} /><col style={{ width: 200 }} /><col style={{ width: 140 }} /></colgroup>
              <thead>
                <tr>
                  <th scope="col">S.No.</th>
                  <th scope="col">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                  <th scope="col">Blocking remark</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user, index) => (
                  <tr key={`${user.role}:${user.id}`}>
                    <td className="record-serial-cell">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td>
                      <div className="booking-person">
                        <span className="booking-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <div>
                          <strong>{user.name || 'Unnamed user'}</strong>
                          <small>{user.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="booking-status account-role">
                        {label(user.role)}
                      </span>
                    </td>
                    <td>
                      {user.email || '—'}
                      <small>{user.phone || 'No phone provided'}</small>
                    </td>
                    <td>
                      {user.createdAt &&
                      !Number.isNaN(Date.parse(user.createdAt))
                        ? formatDate(user.createdAt)
                        : '—'}
                    </td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="user-remark">
                      {user.status === 'blocked'
                        ? user.statusReason || 'No remark recorded'
                        : '—'}
                    </td>
                    <td>
                      <div className="user-actions account-icon-actions">
                        <button
                          type="button"
                          className="user-view-button"
                          title="View details"
                          aria-label={`View details for ${user.name || 'account'}`}
                          onClick={() => navigateAccountDetails(user)}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            {user.status !== 'blocked' && (
                              <button
                                type="button"
                                className="user-block-button"
                                title="Block account"
                                aria-label={`Block ${user.name || 'account'}`}
                                disabled={saving !== null}
                                onClick={() => {
                                  setBlockingUser(user);
                                  setReason('');
                                  setModalError('');
                                }}
                              >
                                <Ban size={16} aria-hidden="true" />
                              </button>
                            )}
                            {user.status !== 'approved' && (
                              <button
                                type="button"
                                className="user-approve-button"
                                title={
                                  user.status === 'blocked'
                                    ? 'Unblock account'
                                    : 'Approve account'
                                }
                                aria-label={`${user.status === 'blocked' ? 'Unblock' : 'Approve'} ${user.name || 'account'}`}
                                disabled={saving !== null}
                                onClick={() => updateStatus(user, 'approved')}
                              >
                                {saving === `${user.role}:${user.id}` ? (
                                  <LoaderCircle
                                    size={16}
                                    className="refresh-spinning"
                                    aria-hidden="true"
                                  />
                                ) : user.status === 'blocked' ? (
                                  <LockOpen size={16} aria-hidden="true" />
                                ) : (
                                  <Check size={16} aria-hidden="true" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="dashboard-empty">
              <Users size={28} />
              <strong>
                {users.length
                  ? 'No matching accounts'
                  : 'No accounts registered yet'}
              </strong>
              <p>
                {users.length
                  ? 'Try another search, role or status filter.'
                  : 'Users will appear here after registering on the website.'}
              </p>
            </div>
          )}
          <Pagination
            pagination={{ ...paginate(filtered, currentPage), setPage }}
            label="accounts"
          />
        </>
      )}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-block-title"
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700"
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim() && saving === null)
                updateStatus(blockingUser, 'blocked', reason.trim());
            }}
          >
            <h3 id="directory-block-title" className="text-lg font-semibold">
              Block {blockingUser.name}
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              This user will be unable to log in. Your remark will be shown to
              them when they try to sign in.
            </p>
            <label
              htmlFor="directory-block-reason"
              className="block text-xs text-slate-300 mb-2"
            >
              Reason for blocking (required)
            </label>
            <textarea
              id="directory-block-reason"
              autoFocus
              required
              rows={4}
              maxLength={1000}
              disabled={saving !== null}
              placeholder="Enter your reason for blocking"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs"
            />
            <p className="text-xs text-slate-500 mt-1">
              {reason.length}/1000 characters
            </p>
            {modalError && (
              <p role="alert" className="text-xs text-rose-400 mt-3">
                {modalError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                disabled={saving !== null}
                onClick={() => setBlockingUser(null)}
                className="text-xs text-slate-400 px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving !== null || !reason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {saving !== null ? 'Blocking…' : 'Block user'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
