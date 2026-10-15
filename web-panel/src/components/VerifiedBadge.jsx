import React from 'react';

export default function VerifiedBadge({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size] || 'w-5 h-5';

  return (
    <span
      title="Verified Influencer - Verified Badge"
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <svg
        className={`${sizeMap} text-[#0095F6] filter drop-shadow-[0_2px_4px_rgba(0,149,246,0.4)]`}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2C13.06 2 14.07 2.45 14.8 3.22L15.44 3.9C15.86 4.34 16.44 4.58 17.05 4.56L17.97 4.52C19.38 4.47 20.53 5.62 20.48 7.03L20.44 7.95C20.42 8.56 20.66 9.14 21.1 9.56L21.78 10.2C22.55 10.93 23 11.94 23 13C23 14.06 22.55 15.07 21.78 15.8L21.1 16.44C20.66 16.86 20.42 17.44 20.44 18.05L20.48 18.97C20.53 20.38 19.38 21.53 17.97 21.48L17.05 21.44C16.44 21.42 15.86 21.66 15.44 22.1L14.8 22.78C14.07 23.55 13.06 24 12 24C10.94 24 9.93 23.55 9.2 22.78L8.56 22.1C8.14 21.66 7.56 21.42 6.95 21.44L6.03 21.48C4.62 21.53 3.47 20.38 3.52 18.97L3.56 18.05C3.58 17.44 3.34 16.86 2.9 16.44L2.22 15.8C1.45 15.07 1 14.06 1 13C1 11.94 1.45 10.93 2.22 10.2L2.9 9.56C3.34 9.14 3.58 8.56 3.56 7.95L3.52 7.03C3.47 5.62 4.62 4.47 6.03 4.52L6.95 4.56C7.56 4.58 8.14 4.34 8.56 3.9L9.2 3.22C9.93 2.45 10.94 2 12 2Z" />
        <path
          d="M9.5 12.5L11 14L15 10"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
