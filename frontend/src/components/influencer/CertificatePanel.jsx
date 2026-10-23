import React from 'react';
import { Upload, CheckCircle, ShieldAlert } from 'lucide-react';
import VerifiedBadge from '../VerifiedBadge';

export default function CertificatePanel({
  user,
  certTitle,
  setCertTitle,
  certFile,
  setCertFile,
  certUploading,
  certMessage,
  handleCertificateUpload,
}) {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl max-w-3xl">
      <div className="flex items-center justify-start gap-3 mb-6">
        {/* <div className="w-10 h-8 rounded-2xl bg-blue-500/10 text-[#0095F6] flex items-center justify-center border border-blue-500/30"> */}
        <VerifiedBadge size="lg" />
        {/* </div> */}
        <div>
          <h3 className="text-xl font-semibold text-white">
            Instagram-Style Verified Badge
          </h3>
          <p className="text-slate-400 text-xs">
            Upload your specialization credentials. Upon approval, the blue
            badge is displayed next to your name platform-wide.
          </p>
        </div>
      </div>

      {/* Current Status Box */}
      <div
        className={`p-4 rounded-2xl mb-6 border ${
          user?.isVerified
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : user?.certificateStatus === 'pending'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.isVerified ? (
              <CheckCircle className="w-5 h-5 text-[#0095F6]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
            <span className="font-semibold text-sm">
              {user?.isVerified
                ? 'Verified Badge Active'
                : user?.certificateStatus === 'pending'
                  ? 'Certificate Under Review'
                  : 'No Certificate Submitted Yet'}
            </span>
          </div>
          {user?.isVerified && <VerifiedBadge size="md" />}
        </div>

        {user?.certification?.title && (
          <div className="mt-2 text-xs text-slate-300">
            Submitted Credential: <strong>{user.certification.title}</strong>
          </div>
        )}
      </div>

      {/* Upload New / Update Certificate Form */}
      <form onSubmit={handleCertificateUpload} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Certificate / Qualification Title
          </label>
          <input
            type="text"
            required
            value={certTitle}
            onChange={(e) => {
              return setCertTitle(e.target.value);
            }}
            placeholder="Enter your certificate name"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Attach Document / Certificate (PDF, PNG, JPG)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-brand-purple bg-slate-950 text-xs text-slate-400 hover:text-white transition-colors">
              <Upload className="w-4 h-4 text-brand-purple" />
              <span>
                {certFile ? certFile.name : 'Select Certificate File'}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  return setCertFile(e.target.files[0] || null);
                }}
              />
            </label>
            {certFile && (
              <button
                type="button"
                onClick={() => {
                  return setCertFile(null);
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {certMessage && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
            {certMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={certUploading || (!certTitle && !certFile)}
          className="py-3 px-6 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 shadow-md disabled:opacity-40 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>
            {certUploading ? (
              <span>Submitting...</span>
            ) : (
              'Submit Certificate for Verification'
            )}
          </span>
        </button>
      </form>
    </div>
  );
}
