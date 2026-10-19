import React from 'react';

export default function LogoLoader({ label = 'Loading MeetFame…' }) {
  return <div className="logo-loader-screen" role="status" aria-live="polite" aria-label={label}>
    <div className="logo-loader-art"><img src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`} width="935" height="221" alt="" aria-hidden="true" /></div>
    <div className="logo-loader-track" aria-hidden="true"><span /></div>
    <p>{label}</p>
  </div>;
}
