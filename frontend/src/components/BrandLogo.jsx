import React from 'react';

export default function BrandLogo({ src, className = '' }) {
  return (
    <>
      <img
        src={src}
        width={935}
        height={221}
        className={`theme-logo-dark max-w-full h-auto shrink-0 ${className}`}
        alt="MeetFame — Connect • Book • Meet"
      />
      <img
        src={`${import.meta.env.BASE_URL}branding/meetfame-logo-light.svg`}
        width={1100}
        height={280}
        className={`theme-logo-light max-w-full h-auto shrink-0 ${className}`}
        alt="MeetFame — Connect • Book • Meet"
      />
    </>
  );
}
