import React from 'react';

export default function BrandLogo({ src, className = '' }) {
  return <img src={src} width={935} height={221} className={`max-w-full h-auto shrink-0 ${className}`} alt="MeetFame — Connect • Book • Meet" />;
}
