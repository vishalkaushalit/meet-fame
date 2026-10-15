import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import VerifiedBadge from './VerifiedBadge';
import {
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
  Sparkles
} from 'lucide-react';

export default function ApprovalsView() {
  const [activeTab, setActiveTab] = useState('influencers'); // 'influencers' | 'users'
  const [statusFilter, setStatusFilter] = useState('all');
  const [influencers, setInfluencers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('Missing required professional credentials.');

  const loadData = async () => {
    setLoading(true);
    try {
      const [infRes, userRes] = await Promise.all([
        adminApi.influencers.getAll(statusFilter),
        adminApi.users.getAll(statusFilter)
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
      setActionMessage(`Approved ${name}! They can now log in to their Influencer Dashboard.`);
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
      await adminApi.influencers.updateStatus(rejectingItem.id, 'rejected', rejectReason);
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
      await adminApi.influencers.verifyCertificate(id, grant, grant ? 'verified' : 'rejected');
      setActionMessage(
        grant
          ? `Verified ${name}'s certificate! Instagram-style Blue Badge awarded.`
          : `Revoked certificate verification for ${name}.`
      );
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Certificate verification failed:', err);
    }
  };

  // Handle User Approval
  const handleApproveUser = async (id, name) => {
    try {
      await adminApi.users.updateStatus(id, 'approved');
      setActionMessage(`Approved user ${name}.`);
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('User approval failed:', err);
    }
  };

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
            Review applicant credentials. Influencers can only log in once approved by admin.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['all', 'pending_review', 'approved', 'rejected'].map(s => (
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
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs: Influencer Queue vs User Queue */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('influencers')}
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
          <span>User Registrations ({users.length})</span>
        </button>
      </div>

      {/* QUEUE CONTENT */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading registrations...</div>
      ) : activeTab === 'influencers' ? (
        influencers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
            No influencers match the "{statusFilter}" filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {influencers.map((inf) => {
              const isPending = inf.status === 'pending_review';
              const isApproved = inf.status === 'approved';
              const isRejected = inf.status === 'rejected';

              return (
                <div
                  key={inf.id}
                  className="p-5 md:p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={inf.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={inf.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-800 flex-shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-base">{inf.name}</h3>
                        {inf.isVerified && <VerifiedBadge size="sm" />}
                        
                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {inf.status?.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-brand-purple text-xs font-semibold mt-0.5">{inf.specialization}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span>Email: <strong className="text-white">{inf.email}</strong></span>
                        <span>•</span>
                        <span>Phone: <strong className="text-white">{inf.phone}</strong></span>
                        <span>•</span>
                        <span>Category: <strong className="text-indigo-300">{inf.category}</strong></span>
                        <span>•</span>
                        <span>Fee: <strong className="text-emerald-400">${inf.hourlyRate}/hr</strong></span>
                      </div>

                      {/* Certification Section */}
                      {inf.certification && (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[#0095F6]" />
                            <span className="text-slate-300">
                              Credential: <strong>{inf.certification.title || 'Specialization Certificate'}</strong>
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
                                onClick={() => handleVerifyCertificate(inf.id, inf.name, false)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold"
                              >
                                Revoke Blue Badge
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyCertificate(inf.id, inf.name, true)}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                              >
                                <VerifiedBadge size="sm" />
                                <span>Verify Certificate & Grant Instagram Badge</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-center">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApproveInfluencer(inf.id, inf.name)}
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

                    {isRejected && (
                      <button
                        onClick={() => handleApproveInfluencer(inf.id, inf.name)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
                      >
                        Re-Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* USER QUEUE */
        users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800 text-xs">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{u.name}</h4>
                    <p className="text-xs text-slate-400">{u.email} • {u.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    u.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {u.status}
                  </span>

                  {u.status !== 'approved' && (
                    <button
                      onClick={() => handleApproveUser(u.id, u.name)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Approve User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2">Decline Influencer Application</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the reason for declining <strong>{rejectingItem.name}</strong>. This status will be shown to the influencer when they attempt to sign in.
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
