import Pagination, { usePagination } from './Pagination';
import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import AccountDetailsDialog from './AccountDetailsDialog';
import VerifiedBadge from './VerifiedBadge';
import {
  Eye,
  Ban,
  LockOpen,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  Shield,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';

export default function ApprovalsView() {
  const [activeTab, setActiveTab] = useState('influencers'); // 'influencers' | 'users'
  const [statusFilter, setStatusFilter] = useState('all');
  const [influencers, setInfluencers] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingUser, setUpdatingUser] = useState(null);

  const [blockingItem, setBlockingItem] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');
  const [blocking, setBlocking] = useState(false);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState(
    'Missing required professional credentials.',
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [infRes, userRes] = await Promise.all([
        adminApi.influencers.getAll(statusFilter),
        adminApi.users.getAll(statusFilter),
      ]);
      setInfluencers(infRes.influencers || []);
      setUsers(userRes.users || []);
    } catch (err) {
      console.error('Failed to load approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Handle Influencer Approval
  const handleApproveInfluencer = async (id, name) => {
    try {
      await adminApi.influencers.updateStatus(id, 'approved');
      setActionMessage(
        `Approved ${name}! They can now log in to their Influencer Dashboard.`,
      );
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // Handle Influencer Rejection
  const handleConfirmRejectInfluencer = async () => {
    if (!rejectingItem) return;
    try {
      await adminApi.influencers.updateStatus(
        rejectingItem.id,
        'rejected',
        rejectReason,
      );
      setActionMessage(`Declined ${rejectingItem.name}.`);
      setRejectingItem(null);
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  // Handle Certificate Verification (Instagram Style Blue Badge)
  const handleVerifyCertificate = async (id, name, grant) => {
    try {
      await adminApi.influencers.verifyCertificate(
        id,
        grant,
        grant ? 'verified' : 'rejected',
      );
      setActionMessage(
        grant
          ? `Verified ${name}'s certificate! Instagram-style Blue Badge awarded.`
          : `Revoked certificate verification for ${name}.`,
      );
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Certificate verification failed:', err);
    }
  };

  const handleUserStatus = async (user, status) => {
    setUpdatingUser(user.id);
    setActionError('');
    setActionMessage('');
    try {
      await adminApi.users.updateStatus(user.id, status);
      setActionMessage(
        status === 'blocked'
          ? `${user.name} has been blocked from logging in.`
          : `${user.name} can now log in.`,
      );
      await loadData();
    } catch (err) {
      setActionError(
        err.error || 'Unable to update this user. Please try again.',
      );
    } finally {
      setUpdatingUser(null);
    }
  };

  const openBlock = (account, role) => {
    setBlockingItem({ ...account, role });
    setBlockReason(account.statusReason || '');
    setBlockError('');
  };

  const confirmBlock = async (event) => {
    event.preventDefault();
    if (!blockingItem || !blockReason.trim()) return;
    setBlocking(true);
    setBlockError('');
    try {
      const api =
        blockingItem.role === 'influencer'
          ? adminApi.influencers
          : adminApi.users;
      await api.updateStatus(blockingItem.id, 'blocked', blockReason.trim());
      setActionMessage(
        `${blockingItem.name} has been blocked. They will see your remark when logging in.`,
      );
      setBlockingItem(null);
      await loadData();
    } catch (err) {
      setBlockError(
        err.error || 'Unable to block this account. Please try again.',
      );
    } finally {
      setBlocking(false);
    }
  };

  const creatorPagination = usePagination(influencers, statusFilter);
  const userPagination = usePagination(users, statusFilter);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-purple" />
            <span>Registration & Certificate Approvals</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review applicant credentials. Influencers can only log in once
            approved by admin.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['all', 'pending_review', 'approved', 'rejected', 'blocked'].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-brand-purple text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ),
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs"
        >
          {actionError}
        </div>
      )}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs: Influencer Queue vs User Queue */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            setActiveTab('influencers');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'influencers'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span>Influencer Applications ({influencers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-brand-indigo" />
          <span>Users ({users.length})</span>
        </button>
      </div>

      {/* QUEUE CONTENT */}
      {loading ? (
        <LogoLoader variant="inline" label="Loading registrations..." />
      ) : activeTab === 'influencers' ? (
        influencers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
            No influencers match the "{statusFilter}" filter.
          </div>
        ) : (
          <div className="record-list">
            <div className="admin-records-table-wrap">
              <table className="dashboard-table admin-records-table approval-creators-table">
                <caption className="sr-only">Influencer applications</caption>
                <thead>
                  <tr>
                    {[
                      'Sr. No.',
                      'Influencer',
                      'Contact',
                      'Category',
                      'Rate',
                      'Status',
                      'Certification',
                      'Blocking remark',
                      'Actions',
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creatorPagination.items.map((inf, index) => {
                    const isPending = inf.status === 'pending_review';
                    const isApproved = inf.status === 'approved';
                    const isRejected = inf.status === 'rejected';
                    return (
                      <tr key={inf.id}>
                        <td className="record-serial-cell">
                          {creatorPagination.start + index}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                inf.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                              }
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <strong className="flex items-center gap-2">
                                {inf.name}
                                {inf.isVerified && <VerifiedBadge size="sm" />}
                              </strong>
                              <small>{inf.specialization}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {inf.email}
                          <small>{inf.phone || '—'}</small>
                        </td>
                        <td>{inf.category}</td>
                        <td className="whitespace-nowrap">
                          ${inf.hourlyRate ?? 0}/hr
                        </td>
                        <td>
                          {' '}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isPending
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {inf.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="record-certification">
                          {' '}
                          {inf.certification && (
                            <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-[#0095F6]" />
                                <span className="text-slate-300">
                                  Credential:{' '}
                                  <strong>
                                    {inf.certification.title ||
                                      'Specialization Certificate'}
                                  </strong>
                                </span>
                                {inf.certification.fileUrl && (
                                  <a
                                    href={inf.certification.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-brand-purple hover:underline flex items-center gap-1"
                                  >
                                    <span>Preview Document</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>

                              {/* Certificate verified status */}
                              <div className="flex items-center gap-2">
                                {inf.isVerified ? (
                                  <button
                                    onClick={() =>
                                      handleVerifyCertificate(
                                        inf.id,
                                        inf.name,
                                        false,
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold"
                                  >
                                    Revoke Blue Badge
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleVerifyCertificate(
                                        inf.id,
                                        inf.name,
                                        true,
                                      )
                                    }
                                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                                  >
                                    <VerifiedBadge size="sm" />
                                    <span>Verify Certificate</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {!inf.certification && '—'}
                        </td>
                        <td className="record-description">
                          {inf.status === 'blocked'
                            ? inf.statusReason || 'No remark recorded'
                            : '—'}
                        </td>
                        <td>
                          {' '}
                          <div className="approval-actions flex items-center gap-2 self-start lg:self-center">
                            <button
                              type="button"
                              className="user-view-button approval-icon-button"
                              title="View details"
                              aria-label={`View details for ${inf.name}`}
                              onClick={() =>
                                setViewingAccount({
                                  ...inf,
                                  role: 'influencer',
                                })
                              }
                            >
                              <Eye size={16} aria-hidden="true" />
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApproveInfluencer(inf.id, inf.name)
                                  }
                                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5 transition-all"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve Application</span>
                                </button>

                                <button
                                  onClick={() => setRejectingItem(inf)}
                                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Decline</span>
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle className="w-4 h-4" />
                                <span>Active for Login</span>
                              </span>
                            )}

                            {inf.status !== 'blocked' && (
                              <button
                                onClick={() => openBlock(inf, 'influencer')}
                                title="Block influencer"
                                aria-label={`Block ${inf.name}`}
                                className="approval-icon-button rounded-xl bg-rose-500/10 text-rose-400"
                              >
                                <Ban size={16} aria-hidden="true" />
                              </button>
                            )}
                            {inf.status === 'blocked' && (
                              <button
                                onClick={() =>
                                  handleApproveInfluencer(inf.id, inf.name)
                                }
                                title="Unblock influencer"
                                aria-label={`Unblock ${inf.name}`}
                                className="approval-icon-button rounded-xl bg-emerald-600 text-white"
                              >
                                <LockOpen size={16} aria-hidden="true" />
                              </button>
                            )}

                            {isRejected && (
                              <button
                                onClick={() =>
                                  handleApproveInfluencer(inf.id, inf.name)
                                }
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
                              >
                                Re-Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination pagination={creatorPagination} label="influencers" />
          </div>
        )
      ) : /* USER QUEUE */
      users.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
          No users found.
        </div>
      ) : (
        <div className="record-list">
          <div className="approval-users-table-wrap">
            <table className="dashboard-table approval-users-table">
              <caption className="sr-only">
                Registered users and account access
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sr. No.</th>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                  <th scope="col">Blocking remark</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userPagination.items.map((u, index) => (
                  <tr key={u.id}>
                    <td className="record-serial-cell">
                      {userPagination.start + index}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm"
                          aria-hidden="true"
                        >
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      {' '}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : u.status === 'blocked'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {u.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="approval-blocking-remark">
                      {u.status === 'blocked'
                        ? u.statusReason || 'No remark recorded'
                        : '—'}
                    </td>
                    <td>
                      <div className="approval-user-actions">
                        {' '}
                        <button
                          type="button"
                          className="user-view-button approval-icon-button"
                          title="View details"
                          aria-label={`View details for ${u.name}`}
                          onClick={() =>
                            setViewingAccount({ ...u, role: 'user' })
                          }
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        {u.status !== 'blocked' && (
                          <button
                            onClick={() => openBlock(u, 'user')}
                            disabled={updatingUser === u.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold disabled:opacity-50"
                          >
                            {updatingUser === u.id ? (
                              <span>Saving…</span>
                            ) : (
                              'Block User'
                            )}
                          </button>
                        )}
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleUserStatus(u, 'approved')}
                            disabled={updatingUser === u.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            {updatingUser === u.id ? (
                              <span>Saving…</span>
                            ) : u.status === 'blocked' ? (
                              'Unblock User'
                            ) : (
                              'Approve User'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={userPagination} label="users" />
        </div>
      )}

      {viewingAccount && (
        <AccountDetailsDialog
          account={viewingAccount}
          onClose={() => setViewingAccount(null)}
        />
      )}
      {blockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form
            onSubmit={confirmBlock}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-title"
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700"
          >
            <h3 id="block-title" className="text-lg font-bold text-white">
              Block {blockingItem.name}
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-4">
              This account will be unable to log in. Your remark will be shown
              to this person when they try to sign in.
            </p>
            <label
              htmlFor="block-remark"
              className="block text-xs text-slate-300 mb-2"
            >
              Reason for blocking (required)
            </label>
            <textarea
              id="block-remark"
              autoFocus
              required
              maxLength={1000}
              rows={4}
              value={blockReason}
              disabled={blocking}
              onChange={(event) => setBlockReason(event.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              {blockReason.length}/1000 characters
            </p>
            {blockError && (
              <p role="alert" className="text-xs text-rose-400 mt-3">
                {blockError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                disabled={blocking}
                onClick={() => setBlockingItem(null)}
                className="text-xs text-slate-400 px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={blocking || !blockReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {blocking ? 'Blocking…' : 'Block account'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2">
              Decline Influencer Application
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the reason for declining{' '}
              <strong>{rejectingItem.name}</strong>. This status will be shown
              to the influencer when they attempt to sign in.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectInfluencer}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
