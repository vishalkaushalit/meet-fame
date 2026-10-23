import PhoneInput from '../../../shared/PhoneInput';
import { phoneError } from '../../../shared/phoneValidation';
import React, { useState } from 'react';
import BankDetailsForm from '../../../shared/BankDetailsForm';
import { Save } from 'lucide-react';
import { adminApi } from '../api';
export default function AdminEditProfile({ admin, onClose, onSaved }) {
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (phoneError(phone)) {
      setError(phoneError(phone));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await adminApi.profile.update({ name, email, phone });
      onSaved(result.user);
    } catch (err) {
      setError(err.error || 'Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const field =
    'w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white mt-2';
  return (
    <section
      className="admin-edit-profile admin-edit-profile-page"
      aria-labelledby="admin-edit-profile-title"
    >
      <form onSubmit={submit} className="admin-profile-form">
        <h2 id="admin-edit-profile-title" className="sr-only">
          Edit profile
        </h2>
        <label className="block text-xs text-slate-300 mb-4">
          Name
          <input
            autoFocus
            required
            autoComplete="name"
            placeholder="Enter your full name"
            maxLength={100}
            value={name}
            disabled={saving}
            onChange={(event) => setName(event.target.value)}
            className={field}
          />
        </label>
        <label className="block text-xs text-slate-300 mb-4">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="Enter your email address"
            maxLength={254}
            value={email}
            disabled={saving}
            onChange={(event) => setEmail(event.target.value)}
            className={field}
          />
        </label>
        <div className="mb-4">
          <label
            htmlFor="admin-phone"
            className="mb-2 block text-xs text-slate-300"
          >
            Phone
          </label>
          <PhoneInput
            id="admin-phone"
            value={phone}
            onChange={setPhone}
            disabled={saving}
          />
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Use your updated email the next time you sign in.
        </p>
        {error && (
          <p role="alert" className="text-xs text-rose-400 mb-4">
            {error}
          </p>
        )}
        <footer className="flex justify-end gap-3 mt-5">
          <button
            type="submit"
            disabled={saving || !name.trim() || !email.trim()}
            className="dashboard-button button-primary"
          >
            <Save size={15} />
            {saving ? <span>Saving…</span> : 'Save changes'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="dashboard-button profile-cancel-button"
          >
            Cancel
          </button>
        </footer>
      </form>
      <BankDetailsForm api={adminApi.bankDetails} />
    </section>
  );
}
