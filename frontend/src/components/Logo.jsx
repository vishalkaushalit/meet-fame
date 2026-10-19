import React from 'react';
import BrandLogo from './BrandLogo';
export default function Logo({ size = 'md', className = '' }) {
  const width =
    {
      header: 'website-header-logo',
      sm: 'w-[160px]',
      md: 'w-[200px]',
      lg: 'w-[260px]',
      xl: 'w-[340px]',
    }[size] || 'w-[200px]';
  return (
    <a
      href="/"
      aria-label="MeetFame homepage"
      className="inline-flex shrink-0 max-w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      <BrandLogo
        className={`${width} ${className}`}
        src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`}
      />
    </a>
  );
}
