import LogoLoader from './LogoLoader';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { adminApi } from '../api';
export default function AdminEditProfile({ admin, onClose, onSaved }) {
  const dialog = useRef(null);
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try { const result = await adminApi.profile.update({ name, email, phone }); onSaved(result.user); }
    catch (err) { setError(err.error || 'Unable to save profile. Please try again.'); }
    finally { setSaving(false); }
  };
  const field = 'w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-2';
  return createPortal(<dialog ref={dialog} className="admin-edit-profile" aria-labelledby="admin-edit-profile-title" onCancel={event => { if (saving) event.preventDefault(); else onClose(); }}><form onSubmit={submit}>
    <header className="flex items-center justify-between gap-4 mb-5"><h2 id="admin-edit-profile-title" className="text-lg font-semibold">Edit profile</h2><button type="button" aria-label="Close edit profile" disabled={saving} onClick={onClose}><X size={20} /></button></header>
    <label className="block text-xs text-slate-300 mb-4">Name<input autoFocus required autoComplete="name" maxLength={100} value={name} disabled={saving} onChange={event => setName(event.target.value)} className={field} /></label>
    <label className="block text-xs text-slate-300 mb-4">Email<input required type="email" autoComplete="email" maxLength={254} value={email} disabled={saving} onChange={event => setEmail(event.target.value)} className={field} /></label>
    <label className="block text-xs text-slate-300 mb-4">Phone<input type="tel" autoComplete="tel" maxLength={40} value={phone} disabled={saving} onChange={event => setPhone(event.target.value)} className={field} /></label>
    <p className="text-xs text-slate-400 mb-4">Use your updated email the next time you sign in.</p>
    {error && <p role="alert" className="text-xs text-rose-400 mb-4">{error}</p>}
    <footer className="flex justify-end gap-3 mt-5"><button type="button" disabled={saving} onClick={onClose} className="px-3 py-2 text-xs text-slate-400">Cancel</button><button type="submit" disabled={saving || !name.trim() || !email.trim()} className="dashboard-button"><Save size={15} />{saving ? <LogoLoader variant="button" label="Saving…" /> : 'Save changes'}</button></footer>
  </form></dialog>, document.body);
}
