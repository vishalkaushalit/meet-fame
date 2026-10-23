import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, UserRound, LogOut, LayoutDashboard } from 'lucide-react';
import { navigate } from '../authRoutes';
import VerifiedBadge from './VerifiedBadge';
import './header-profile-menu.css';

export default function HeaderProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const go = (path) => {
    setOpen(false);
    navigate(path);
  };
  return (
    <div
      ref={root}
      className="header-profile-menu"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="header-profile-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={id}
        aria-label="Account options"
      >
        <img
          src={
            user.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
          }
          alt=""
        />
        <span className="header-profile-identity">
          <span className="header-profile-name">
            <span>{user.name}</span>
            {user.isVerified && <VerifiedBadge size="sm" />}
          </span>
          <span className="header-profile-role">{user.role}</span>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="header-profile-dropdown" id={id}>
          <div className="header-profile-options" aria-label="Account options">
            <button type="button" onClick={() => go('/')}>
              <LayoutDashboard size={17} aria-hidden="true" />
              Dashboard
            </button>
            <button type="button" onClick={() => go('/profile')}>
              <UserRound size={17} aria-hidden="true" />
              My Profile
            </button>
            <button
              type="button"
              className="header-profile-logout"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
