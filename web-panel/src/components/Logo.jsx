import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const width = { sm: 'w-[170px]', md: 'w-[210px]', lg: 'w-[280px]' }[size] || 'w-[210px]';
  return <div className={`flex flex-col min-w-0 items-start ${className}`}>
    <svg className={`${width} max-w-full h-auto shrink-0`} viewBox="945 1020 425 112" role="img" aria-label="MeetFame" xmlns="http://www.w3.org/2000/svg">
      <title>MeetFame — Connect • Book • Meet</title>
      <image href={`${import.meta.env.BASE_URL}branding/meetfame-reference.png`} width="1400" height="1398" />
    </svg>
    <span className="text-[8px] font-semibold tracking-[0.16em] text-brand-purple uppercase mt-1">Admin Command Center</span>
  </div>;
}
