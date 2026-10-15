import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: { icon: 'h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'h-9', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'h-12', text: 'text-3xl', sub: 'text-xs' }
  }[size] || { icon: 'h-9', text: 'text-xl', sub: 'text-[10px]' };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        className={`${sizeClasses.icon} w-auto flex-shrink-0`}
        viewBox="0 0 220 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="adminLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="30%" stopColor="#6366F1" />
            <stop offset="60%" stopColor="#A855F7" />
            <stop offset="85%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FF5E62" />
          </linearGradient>
          <linearGradient id="admHeadLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="admHeadRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A59" />
            <stop offset="100%" stopColor="#FF5E62" />
          </linearGradient>
        </defs>

        <circle cx="65" cy="46" r="17" fill="url(#admHeadLeft)" />
        <circle cx="155" cy="46" r="17" fill="url(#admHeadRight)" />

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
          stroke="url(#adminLogoGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform="translate(142, 118)">
          <rect x="0" y="4" width="22" height="16" rx="3.5" fill="#FFFFFF" />
          <polygon points="23,8 31,4 31,20 23,16" fill="#FFFFFF" />
          <circle cx="11" cy="12" r="3.5" fill="#EC4899" />
        </g>
      </svg>

      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight ${sizeClasses.text} text-white`}>
          Meet<span className="text-gradient">Fame</span>
        </span>
        <span className={`font-bold tracking-[0.2em] text-brand-purple uppercase mt-0.5 ${sizeClasses.sub}`}>
          Admin Command Center
        </span>
      </div>
    </div>
  );
}
