import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { adminApi } from '../api';

const text = value => value === undefined || value === null || value === '' ? 'Not provided' : String(value);
const label = value => text(value).replaceAll('_', ' ');
const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString() : 'Not provided';
const safeLink = value => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

export default function AccountDetailsDialog({ account, onClose }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const dialog = useRef(null);
  const close = useRef(null);

  useEffect(() => {
    let active = true;
    setDetails(null);
    setError('');
    adminApi.accounts.getDetails(account.role, account.id).then(result => {
      if (active) setDetails(result.account);
    }).catch(err => { if (active) setError(err.error || 'Unable to load account details. Please try again.'); });
    return () => { active = false; };
  }, [account.role, account.id, retry]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const elements = [...dialog.current.querySelectorAll('button:not(:disabled), a[href]')];
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [onClose]);

  const fields = details ? [
    ['Account ID', details.id], ['Role', label(details.role)], ['Status', label(details.status)],
    ['Email', details.email], ['Phone', details.phone], ['Joined', date(details.createdAt)],
    ...(details.role === 'influencer' ? [['Specialization', details.specialization], ['Category', details.category], ['Hourly rate', details.hourlyRate != null ? `$${details.hourlyRate}/hour` : null], ['Verified', details.isVerified ? 'Yes' : 'No'], ['Certificate status', label(details.certificateStatus)]] : []),
  ] : [];
  const certificateUrl = safeLink(details?.certification?.fileUrl);
  return createPortal(<div className="account-details-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="account-details-title" className="account-details-dialog">
      <header><div><p>ACCOUNT DETAILS</p><h2 id="account-details-title">{details?.name || account.name || 'Account details'}</h2></div><button ref={close} type="button" aria-label="Close account details" onClick={onClose}><X size={20} /></button></header>
      <div className="account-details-body">
        {error ? <div role="alert" className="account-details-error"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div> : !details ? <p role="status">Loading account details…</p> : <>
          <dl className="account-details-fields">{fields.map(([title, value]) => <div key={title}><dt>{title}</dt><dd>{text(value)}</dd></div>)}</dl>
          {details.statusReason && <section><h3>{details.status === 'blocked' ? 'Blocking remark' : 'Admin remark'}</h3><p>{details.statusReason}</p></section>}
          {details.role === 'influencer' && <>
            <section><h3>About</h3><p>{text(details.bio)}</p></section>
            <section><h3>Certificate</h3><p>{text(details.certification?.title)}</p>{details.certification?.fileName && <p>{details.certification.fileName}</p>}{certificateUrl && <a href={certificateUrl} target="_blank" rel="noreferrer">View certificate <ExternalLink size={14} /></a>}</section>
            <section><h3>Weekly availability</h3><dl className="account-details-fields">{['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => <div key={day}><dt className="capitalize">{day}</dt><dd>{details.availability?.[day]?.length ? details.availability[day].map(range => `${range.start}–${range.end}`).join(', ') : 'Unavailable'}</dd></div>)}</dl></section>
          </>}
        </>}
      </div>
      <footer><button type="button" onClick={onClose}>Close</button></footer>
    </section>
  </div>, document.body);
}
