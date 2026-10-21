import React from 'react';
import './auth-social-background.css';

const placements = [
  ['instagram', '8%', '12%', '-12deg', '0s'],
  ['youtube', '21%', '39%', '9deg', '-3s'],
  ['tiktok', '7%', '72%', '-8deg', '-6s'],
  ['facebook', '24%', '88%', '12deg', '-2s'],
  ['youtube', '87%', '14%', '10deg', '-5s'],
  ['instagram', '77%', '43%', '-10deg', '-1s'],
  ['facebook', '92%', '66%', '8deg', '-4s'],
  ['tiktok', '78%', '86%', '-14deg', '-7s'],
];
function SocialIcon({ type }) {
  if (type === 'instagram') return <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>;
  if (type === 'youtube') return <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3Z" fill="currentColor" stroke="none" /></>;
  if (type === 'facebook') return <path d="M14 22v-9h3l.5-4H14V7c0-1 .5-2 2-2h2V1h-3c-4 0-6 2-6 6v2H6v4h3v9" fill="currentColor" stroke="none" />;
  return <path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6" strokeWidth="3" />;
}
export default function AuthSocialBackground() {
  return (
    <div className="auth-social-background" aria-hidden="true">
      {placements.map(([type, left, top, rotation, delay], index) => (
        <span key={index} className={`auth-social-icon auth-social-${type}`}
          style={{ left, top, '--social-rotation': rotation, animationDelay: delay }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><SocialIcon type={type} /></svg>
        </span>
      ))}
    </div>
  );
}
