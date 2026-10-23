import React, { useEffect, useState } from 'react';
import BankDetailsForm from '../../../shared/BankDetailsForm';
import {
  ArrowLeft,
  Pencil,
  Save,
  UserRound,
  Mail,
  Phone,
  Briefcase,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { navigate } from '../authRoutes';
import PhoneInput from '../../../shared/PhoneInput';
import { REGISTRATION_CATEGORIES } from '../../../shared/registrationValidation';
import { formatDate } from '../../../shared/dateFormat';
import VerifiedBadge from './VerifiedBadge';
import LogoLoader from './LogoLoader';
import './profile-page.css';

const marcusDemoBankDetails = {
  accountHolder: 'Marcus Vance (Demo)',
  bankName: 'Demo Bank — Sample Only',
  country: 'IN',
  accountNumber: '000000123456',
  routingCode: 'DEMO0000001',
};

export default function ProfilePage({ edit = false }) {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setFields({});
    setPhoto(null);
    api.auth
      .getMe()
      .then((result) => {
        if (active) setProfile(result.user);
      })
      .catch(() => {
        if (active) setError('Unable to load your profile. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [edit, user.id]);
  const influencer = user.role === 'influencer';
  const change = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setFields((current) => ({ ...current, [key]: '' }));
    setSaved(false);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setFields({});
    const payload = Object.fromEntries(
      [
        'name',
        'email',
        'phone',
        'avatar',
        ...(influencer ? ['bio', 'specialization', 'category'] : []),
      ].map((key) => [key, profile[key] || '']),
    );
    if (influencer) payload.hourlyRate = Number(profile.hourlyRate);
    try {
      let body = payload;
      if (photo) {
        body = new FormData();
        for (const [key, value] of Object.entries(payload))
          body.append(key, String(value));
        body.append('avatarFile', photo);
      }
      const result = await api.auth.updateProfile(body);
      updateUserProfile(result.user);
      setProfile(result.user);
      setSaved(true);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Unable to save your profile.');
      setFields(err.fields || {});
    } finally {
      setSaving(false);
    }
  };
  const input = (key, label, type = 'text', required = false, maxLength) => (
    <div className="profile-field" key={key}>
      <label htmlFor={`profile-${key}`}>{label}</label>
      <input
        id={`profile-${key}`}
        type={type}
        required={required}
        maxLength={maxLength}
        value={profile[key] ?? ''}
        disabled={saving}
        onChange={(event) => change(key, event.target.value)}
        aria-invalid={Boolean(fields[key])}
        aria-describedby={fields[key] ? `profile-${key}-error` : undefined}
      />
      {fields[key] && (
        <small id={`profile-${key}-error`} role="alert">
          {fields[key]}
        </small>
      )}
    </div>
  );
  const detail = (label, value) => (
    <div className="profile-detail" key={label}>
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  );
  return (
    <section
      className={`profile-page${influencer ? ' profile-page-influencer' : ''}`}
    >
      <div className="profile-page-heading">
        <div>
          <button
            type="button"
            className="profile-back"
            onClick={() => navigate(edit ? '/profile' : '/')}
            aria-label={edit ? 'Back to profile' : 'Back to dashboard'}
          >
            <ArrowLeft size={18} />
          </button>
          <h1>{edit ? 'Edit Profile' : 'My Profile'}</h1>
        </div>
        {!edit && (
          <button
            className="profile-primary"
            type="button"
            onClick={() => {
              setSaved(false);
              navigate('/profile/edit');
            }}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>
      {saved && !edit && (
        <p className="profile-success" role="status">
          Profile updated successfully.
        </p>
      )}
      {error && (
        <p className="profile-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <LogoLoader label="Loading profile…" />
      ) : (
        <>
          <div className="profile-identity">
            {photoPreview || profile.avatar ? (
              <img src={photoPreview || profile.avatar} alt={profile.name} />
            ) : (
              <span className="profile-avatar-placeholder">
                <UserRound size={32} />
              </span>
            )}
            <div>
              <h2>
                {profile.name}
                {profile.isVerified && <VerifiedBadge size="md" />}
              </h2>
              {influencer && <p>{profile.specialization}</p>}
              <span className="profile-role">
                {influencer ? 'Influencer' : 'User'}
              </span>
            </div>
            {influencer && (
              <nav
                className="profile-section-tabs"
                aria-label="Profile sections"
              >
                <button
                  type="button"
                  aria-pressed={activeSection === 'profile'}
                  aria-controls="profile-details-panel"
                  disabled={saving}
                  onClick={() => setActiveSection('profile')}
                >
                  <UserRound size={18} />
                  Profile details
                </button>
                <button
                  type="button"
                  aria-pressed={activeSection === 'bank'}
                  aria-controls="profile-bank-panel"
                  disabled={saving}
                  onClick={() => setActiveSection('bank')}
                >
                  <Briefcase size={18} />
                  Bank details
                </button>
              </nav>
            )}
          </div>
          <div
            id="profile-details-panel"
            hidden={influencer && activeSection !== 'profile'}
          >
            {edit ? (
              <form onSubmit={submit} className="profile-card">
                <h2>
                  <UserRound size={18} />
                  Personal details
                </h2>
                <div className="profile-grid">
                  {input('name', 'Full name', 'text', true, 100)}
                  {input('email', 'Email address', 'email', true, 254)}
                  <div className="profile-field">
                    <label htmlFor="profile-phone">Phone number</label>
                    <PhoneInput
                      id="profile-phone"
                      required
                      value={profile.phone || ''}
                      onChange={(value) => change('phone', value)}
                      disabled={saving}
                      invalid={Boolean(fields.phone)}
                      describedBy={
                        fields.phone ? 'profile-phone-error' : undefined
                      }
                    />
                    {fields.phone && (
                      <small id="profile-phone-error" role="alert">
                        {fields.phone}
                      </small>
                    )}
                  </div>
                  <div className="profile-field">
                    <label htmlFor="profile-photo">Profile photo</label>
                    <label
                      className="profile-photo-upload"
                      htmlFor="profile-photo"
                    >
                      <Upload size={18} aria-hidden="true" />
                      <span>{photo ? photo.name : 'Select Profile Photo'}</span>
                      <input
                        id="profile-photo"
                        className="profile-photo-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={saving}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          if (
                            !['image/jpeg', 'image/png', 'image/webp'].includes(
                              file.type,
                            ) ||
                            file.size > 2 * 1024 * 1024 ||
                            !file.size
                          ) {
                            setFields((current) => ({
                              ...current,
                              avatar:
                                'Choose a JPG, PNG, or WebP image up to 2 MB.',
                            }));
                            event.target.value = '';
                            return;
                          }
                          setPhoto(file);
                          setFields((current) => ({ ...current, avatar: '' }));
                        }}
                      />
                    </label>
                    <p className="profile-upload-hint">
                      JPG, PNG or WebP · Maximum 2 MB.
                    </p>
                    {photo && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setPhoto(null);
                          const input =
                            document.getElementById('profile-photo');
                          if (input) input.value = '';
                        }}
                      >
                        <X size={14} />
                        Clear selection
                      </button>
                    )}
                    {fields.avatar && (
                      <small role="alert">{fields.avatar}</small>
                    )}
                  </div>
                </div>
                {influencer && (
                  <>
                    <h2>
                      <Briefcase size={18} />
                      Professional details
                    </h2>
                    <div className="profile-grid">
                      {input(
                        'specialization',
                        'Specialization',
                        'text',
                        true,
                        200,
                      )}
                      <div className="profile-field">
                        <label htmlFor="profile-category">Category</label>
                        <select
                          id="profile-category"
                          value={profile.category || ''}
                          disabled={saving}
                          onChange={(event) =>
                            change('category', event.target.value)
                          }
                          required
                        >
                          {!REGISTRATION_CATEGORIES.includes(
                            profile.category,
                          ) && <option value="">Select a category</option>}
                          {REGISTRATION_CATEGORIES.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                        {fields.category && (
                          <small role="alert">{fields.category}</small>
                        )}
                      </div>
                      <div className="profile-field">
                        <label htmlFor="profile-rate">Hourly rate (USD)</label>
                        <input
                          id="profile-rate"
                          type="number"
                          min="0.01"
                          max="1000000"
                          step="0.01"
                          required
                          value={profile.hourlyRate ?? ''}
                          disabled={saving}
                          onChange={(event) =>
                            change('hourlyRate', event.target.value)
                          }
                        />
                        {fields.hourlyRate && (
                          <small role="alert">{fields.hourlyRate}</small>
                        )}
                      </div>
                      <div className="profile-field profile-full">
                        <label htmlFor="profile-bio">Bio</label>
                        <textarea
                          id="profile-bio"
                          rows={4}
                          maxLength={2000}
                          value={profile.bio || ''}
                          disabled={saving}
                          onChange={(event) =>
                            change('bio', event.target.value)
                          }
                        />
                        {fields.bio && <small role="alert">{fields.bio}</small>}
                      </div>
                    </div>
                  </>
                )}
                <div className="profile-form-actions">
                  <button
                    className="profile-primary"
                    type="submit"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-card">
                <h2>
                  <UserRound size={18} />
                  Personal details
                </h2>
                <dl className="profile-grid">
                  {detail('Full name', profile.name)}
                  {detail(
                    'Email address',
                    <span className="profile-detail-inline">
                      <Mail size={16} />
                      {profile.email}
                    </span>,
                  )}
                  {detail(
                    'Phone number',
                    profile.phone ? (
                      <span className="profile-detail-inline">
                        <Phone size={16} />
                        {profile.phone}
                      </span>
                    ) : null,
                  )}
                  {detail('Member since', formatDate(profile.createdAt))}
                </dl>
                {influencer && (
                  <>
                    <h2>
                      <Briefcase size={18} />
                      Professional details
                    </h2>
                    <dl className="profile-grid">
                      {detail('Specialization', profile.specialization)}
                      {detail('Category', profile.category)}
                      {detail(
                        'Hourly rate',
                        `$${profile.hourlyRate ?? 0} / hour`,
                      )}
                      {detail(
                        'Account status',
                        profile.status?.replaceAll('_', ' '),
                      )}
                      {detail(
                        'Verification',
                        profile.isVerified ? 'Verified' : 'Not verified',
                      )}
                      {detail('Bio', profile.bio)}
                    </dl>
                  </>
                )}
              </div>
            )}
          </div>
          {influencer && (
            <div id="profile-bank-panel" hidden={activeSection !== 'bank'}>
              <BankDetailsForm
                api={api.bankDetails}
                demoDetails={
                  user.email?.toLowerCase() === 'marcus@techcreator.io'
                    ? marcusDemoBankDetails
                    : null
                }
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
