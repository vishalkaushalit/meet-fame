import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function StatusAlertModal() {
  const { statusAlert, setStatusAlert } = useAuth();

  if (!statusAlert) return null;

  const isPending = statusAlert.status === 'pending_review';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-center">
        {/* Decorative background glow */}
        <div
          className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isPending ? 'bg-amber-500' : 'bg-rose-500'}`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isPending ? 'bg-brand-purple' : 'bg-brand-coral'}`}
        />

        <button
          onClick={() => setStatusAlert(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isPending
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isPending ? (
              <Clock className="w-8 h-8 animate-pulse" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">
          {statusAlert.title || (isPending ? 'Account Under Review' : 'Notice')}
        </h3>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-slate-800 border border-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-400 animate-ping' : 'bg-rose-400'}`}
          />
          <span className={isPending ? 'text-amber-300' : 'text-rose-300'}>
            Status:{' '}
            {isPending
              ? 'Pending Review'
              : statusAlert.status === 'blocked'
                ? 'Blocked'
                : 'Action Required'}
          </span>
        </div>

        {/* Message */}
        <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap break-words">
          {statusAlert.message}
        </p>

        {/* Admin note helper */}
        <div className="bg-slate-950/60 rounded-xl p-3 text-xs text-slate-400 mb-6 text-left border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-brand-indigo" />
            <span>
              {statusAlert.status === 'blocked'
                ? 'Account access'
                : 'Admin Review Process'}
            </span>
          </div>
          <p>
            {statusAlert.status === 'blocked'
              ? 'Contact support if you need help with this decision. Access can be restored by an administrator.'
              : 'Our administration team verifies credentials, categories, and specialization certificates to keep MeetFame trusted. Once approved, full access is granted immediately.'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setStatusAlert(null)}
          className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.99]"
        >
          Understood
        </button>
      </div>
    </div>
  );
}
