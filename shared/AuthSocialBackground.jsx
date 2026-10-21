import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import './auth-social-background.css';

const iconTypes = ['instagram', 'youtube', 'tiktok', 'facebook'];
function randomFor(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
function SocialIcon({ type }) {
  if (type === 'instagram') return <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>;
  if (type === 'youtube') return <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 6 3-6 3Z" fill="currentColor" stroke="none" /></>;
  if (type === 'facebook') return <path d="M14 22v-9h3l.5-4H14V7c0-1 .5-2 2-2h2V1h-3c-4 0-6 2-6 6v2H6v4h3v9" fill="currentColor" stroke="none" />;
  return <path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6" strokeWidth="3" />;
}
export default function AuthSocialBackground({ page = false }) {
  const layer = useRef(null);
  const id = useId();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = layer.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setDimensions((previous) => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const placements = useMemo(() => {
    const { width, height } = dimensions;
    if (!width || !height) return [];
    const seed = [...id].reduce((value, letter) => Math.imul(value, 31) + letter.charCodeAt(0), 173);
    const random = randomFor(seed);
    const columns = Math.max(1, Math.ceil(width / 250));
    const rows = Math.max(1, Math.ceil(height / 240));
    return Array.from({ length: columns * rows }, (_, index) => {
      const size = 36 + random() * 24;
      return {
        type: iconTypes[Math.floor(random() * iconTypes.length)],
        left: Math.max(6, Math.min(width - size - 6, ((index % columns) + .15 + random() * .65) * width / columns)),
        top: Math.max(24, Math.min(height - size - 6, (Math.floor(index / columns) + .2 + random() * .6) * height / rows)),
        size,
        rotation: `${-20 + random() * 40}deg`,
        delay: `${-random() * 16}s`,
        duration: `${9 + random() * 7}s`,
      };
    });
  }, [dimensions, id]);
  return (
    <div ref={layer} className={`auth-social-background${page ? ' social-page-background' : ''}`} aria-hidden="true">
      {placements.map(({ type, left, top, size, rotation, delay, duration }, index) => (
        <span key={index} className={`auth-social-icon auth-social-${type}`}
          style={{ left, top, width: size, height: size, '--social-rotation': rotation, animationDelay: delay, animationDuration: duration }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><SocialIcon type={type} /></svg>
        </span>
      ))}
    </div>
  );
}
