import React from 'react';
import BrandLogo from './BrandLogo';
export default function Logo({ size = 'md', className = '' }) {
  const width = { sm: 'w-[170px]', md: 'w-[210px]', lg: 'w-[280px]' }[size] || 'w-[210px]';
  return <a href={import.meta.env.VITE_FRONTEND_URL || "/"} aria-label="MeetFame homepage" className={`flex flex-col min-w-0 items-start rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${className}`}>
    <BrandLogo className={width} src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`} />
    <span className="text-[8px] font-semibold tracking-[0.16em] text-brand-purple uppercase mt-1">Admin Command Center</span>
  </a>;
}
