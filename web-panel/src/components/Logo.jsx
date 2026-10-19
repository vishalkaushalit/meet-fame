import React from 'react';
import BrandLogo from './BrandLogo';
export default function Logo({ size = 'md', className = '' }) {
  const width = { sm: 'w-[170px]', md: 'w-[210px]', lg: 'w-[280px]' }[size] || 'w-[210px]';
  return <div className={`flex flex-col min-w-0 items-start ${className}`}>
    <BrandLogo className={width} src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`} />
    <span className="text-[8px] font-semibold tracking-[0.16em] text-brand-purple uppercase mt-1">Admin Command Center</span>
  </div>;
}
