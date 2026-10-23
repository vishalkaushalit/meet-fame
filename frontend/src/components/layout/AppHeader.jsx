import React from 'react';
import { ExternalLink } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';
import Notifications from '../Notifications';
import HeaderProfileMenu from '../HeaderProfileMenu';
import './app-header.css';

export default function AppHeader({ user, role, onLogout }) {
  return (
    <header
      className={`${role === 'influencer' ? 'creator-site-header ' : ''}fixed inset-x-0 top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-slate-800`}
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-20 py-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Logo size="header" className="shrink-0" />
          <span className="hidden md:inline-flex shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
            {role === 'influencer' ? 'Influencer Dashboard' : 'User Portal'}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Notifications key={`${user.role}:${user.id}`} />
          <a
            href={
              import.meta.env.VITE_ADMIN_PANEL_URL ||
              (import.meta.env.PROD ? '/admin' : 'http://localhost:5174')
            }
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            title="Open Admin Command Center in new tab"
          >
            <span>Admin Panel</span>
            <ExternalLink className="w-3 h-3 text-brand-purple" />
          </a>

          <HeaderProfileMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
