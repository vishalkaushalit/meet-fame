import React from 'react';

export default function Logo({ size = 'md', showTagline = true, className = '' }) {
  const sizeClasses = {
    sm: { icon: 'h-8', text: 'text-xl', sub: 'text-[9px]' },
    md: { icon: 'h-10', text: 'text-2xl', sub: 'text-[11px]' },
    lg: { icon: 'h-14', text: 'text-4xl', sub: 'text-xs' },
    xl: { icon: 'h-20', text: 'text-5xl', sub: 'text-sm' }
  }[size] || { icon: 'h-10', text: 'text-2xl', sub: 'text-[11px]' };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Infinity MeetFame Mark */}
      <svg
        className={`${sizeClasses.icon} w-auto flex-shrink-0 transition-transform duration-300 hover:scale-105`}
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mfLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="25%" stopColor="#6366F1" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="80%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FF5E62" />
          </linearGradient>
          <linearGradient id="mfHeadLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="mfHeadRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A59" />
            <stop offset="100%" stopColor="#FF5E62" />
          </linearGradient>
        </defs>

        {/* Left Head */}
        <circle cx="65" cy="46" r="17" fill="url(#mfHeadLeft)" />

        {/* Right Head */}
        <circle cx="155" cy="46" r="17" fill="url(#mfHeadRight)" />

        {/* Infinity Loop */}
        <path
          d="M 110 130 
             C 135 172 178 172 198 130 
             C 218 88 178 72 155 72
             C 130 72 118 104 110 130
             C 102 156 88 184 62 184
             C 26 184 12 152 12 130
             C 12 92 42 72 65 72
             C 88 72 102 104 110 130 Z"
          fill="none"
          stroke="url(#mfLogoGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Video Camera in Right Loop */}
        <g transform="translate(142, 118)">
          <rect x="0" y="4" width="22" height="16" rx="3.5" fill="#FFFFFF" />
          <polygon points="23,8 31,4 31,20 23,16" fill="#FFFFFF" />
          <circle cx="11" cy="12" r="3.5" fill="#EC4899" />
        </g>
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col justify-center leading-none">
        <span className={`font-black tracking-tight ${sizeClasses.text} text-white`}>
          Meet<span className="text-gradient">Fame</span>
        </span>
        {showTagline && (
          <span className={`font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5 ${sizeClasses.sub}`}>
            Connect • Book • Meet
          </span>
        )}
      </div>
    </div>
  );
}
