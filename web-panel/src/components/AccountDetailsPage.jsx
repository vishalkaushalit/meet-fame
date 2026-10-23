import IntroVideo from '../../../shared/IntroVideo';
import { formatDateTime } from '../../../shared/dateFormat';
import StatusBadge from './StatusBadge';
import LogoLoader from './LogoLoader';
import { dayRanges } from '../../../shared/availability';
import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileCheck } from 'lucide-react';
import { adminApi } from '../api';
import { API_BASE } from '../api/endpoints';

const text = (value) =>
  value === undefined || value === null || value === ''
    ? 'Not provided'
    : String(value);
const label = (value) => text(value).replaceAll('_', ' ');
const date = (value) =>
  value && !Number.isNaN(Date.parse(value))
    ? formatDateTime(value)
    : 'Not provided';
const safeLink = (value) => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export default function AccountDetailsPage({ account }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const heading = useRef(null);

  useEffect(() => {
    let active = true;
    setDetails(null);
    setError('');
    adminApi.accounts
      .getDetails(account.role, account.id)
      .then((result) => {
        if (active) setDetails(result.account);
      })
      .catch((err) => {
        if (active)
          setError(
            err.error || 'Unable to load account details. Please try again.',
          );
      });
    return () => {
      active = false;
    };
  }, [account.role, account.id, retry]);

  useEffect(() => {
    heading.current?.focus();
  }, [account.role, account.id]);

  const fields = details
    ? [
        ['Account ID', details.id],
        ['Role', label(details.role)],
        ['Status', label(details.status)],
        ['Email', details.email],
        ['Phone', details.phone],
        ['Joined', date(details.createdAt)],
        ...(details.role === 'influencer'
          ? [
              ['Specialization', details.specialization],
              ['Category', details.category],
              [
                'Hourly rate',
                details.hourlyRate != null
                  ? `$${details.hourlyRate}/hour`
                  : null,
              ],
              ['Verified', details.isVerified ? 'Yes' : 'No'],
              ['Certificate status', label(details.certificateStatus)],
            ]
          : []),
      ]
    : [];
  const certificateUrl = safeLink(details?.certification?.fileUrl);
  return (
    <section
      aria-labelledby="account-details-title"
      className="account-details-dialog account-details-page"
    >
      <header>
        <div>
          <p>ACCOUNT DETAILS</p>
          <h2 ref={heading} tabIndex={-1} id="account-details-title">
            {details?.name || account.name || 'Account details'}
          </h2>
        </div>
      </header>
      <div className="account-details-body">
        {error ? (
          <div role="alert" className="account-details-error">
            <p>{error}</p>
            <button onClick={() => setRetry((value) => value + 1)}>
              Retry
            </button>
          </div>
        ) : !details ? (
          <LogoLoader variant="inline" label="Loading account details…" />
        ) : (
          <>
            <dl className="account-details-fields">
              {fields.map(([title, value]) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>
                    {title === 'Certificate status' ? (
                      <StatusBadge status={details.certificateStatus} />
                    ) : title === 'Status' ? (
                      <StatusBadge status={details.status} />
                    ) : title === 'Verified' ? (
                      <StatusBadge
                        status={details.isVerified ? 'verified' : 'unverified'}
                      >
                        {value}
                      </StatusBadge>
                    ) : (
                      text(value)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {details.statusReason && (
              <section>
                <h3>
                  {details.status === 'blocked'
                    ? 'Blocking remark'
                    : 'Admin remark'}
                </h3>
                <p>{details.statusReason}</p>
              </section>
            )}
            {details.role === 'influencer' && (
              <>
                <section>
                  <h3>About</h3>
                  <p>{text(details.bio)}</p>
                </section>
                <div className="account-media-schedule">
                  <section className="account-video-section">
                    <h3>Introduction video</h3>
                    {details.introVideoUrl ? (
                      <div className="account-intro-player">
                        <IntroVideo
                          influencer={details}
                          apiBase={API_BASE}
                          card
                        />
                      </div>
                    ) : (
                      <p>No introduction video uploaded.</p>
                    )}
                  </section>
                  <section className="account-weekly-schedule">
                    <h3>
                      Weekly availability{' '}
                      <span className="account-schedule-zone">(IST)</span>
                    </h3>
                    <dl className="account-weekday-grid">
                      {[
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                      ].map((day) => (
                        <div key={day}>
                          <dt className="capitalize">{day}</dt>
                          <dd className="account-availability-badges">
                            {dayRanges(details.availability?.[day]).length ? (
                              dayRanges(details.availability?.[day]).map(
                                (range, index) => (
                                  <span
                                    key={`${range.start}-${range.end}-${index}`}
                                    className="account-time-badge"
                                  >
                                    {range.start}–{range.end}
                                  </span>
                                ),
                              )
                            ) : (
                              <span className="account-time-unavailable">
                                Unavailable
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>
                <section>
                  <h3>Certificate</h3>
                  <div className="account-certificate-card">
                    <FileCheck size={20} aria-hidden="true" />
                    <span>
                      Credential:{' '}
                      <strong>{text(details.certification?.title)}</strong>
                    </span>
                    {certificateUrl && (
                      <a href={certificateUrl} target="_blank" rel="noreferrer">
                        Preview Document <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
