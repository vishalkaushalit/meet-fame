import React from 'react';

export default function Logo({ size = 'md', showTagline = true, className = '' }) {
  const width = { sm: 'w-[144px]', md: 'w-[180px]', lg: 'w-[240px]', xl: 'w-[320px]' }[size] || 'w-[180px]';
  return <svg className={`${width} max-w-full h-auto shrink-0 ${className}`} viewBox="945 1020 425 112" role="img" aria-label="MeetFame" xmlns="http://www.w3.org/2000/svg">
    <title>{showTagline ? 'MeetFame — Connect • Book • Meet' : 'MeetFame'}</title>
    <image href={`${import.meta.env.BASE_URL}branding/meetfame-reference.png`} width="1400" height="1398" />
  </svg>;
}
