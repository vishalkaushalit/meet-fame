import React from 'react';
import BrandLogo from './BrandLogo';
export default function Logo({ size = 'md', className = '' }) {
  const width = { sm: 'w-[160px]', md: 'w-[200px]', lg: 'w-[260px]', xl: 'w-[340px]' }[size] || 'w-[200px]';
  return <BrandLogo className={`${width} ${className}`} src={`${import.meta.env.BASE_URL}branding/meetfame-logo.png`} />;
}
