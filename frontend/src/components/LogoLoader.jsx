import React from 'react';

export default function LogoLoader({
  label = 'Loading MeetFame…',
  variant = 'screen',
}) {
  return (
    <span
      className={`logo-loader-screen logo-loader-${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <img
        className="logo-loader-brand"
        src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`}
        width="935"
        height="221"
        alt=""
        aria-hidden="true"
      />
      <span className="logo-loader-track" aria-hidden="true">
        <span />
      </span>
      <span className="logo-loader-label">{label}</span>
    </span>
  );
}
