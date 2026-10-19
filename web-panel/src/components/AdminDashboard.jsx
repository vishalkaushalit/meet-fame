import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import ApprovalsView from './ApprovalsView';
import UsersView from './UsersView';
import AnnouncementsView from './AnnouncementsView';
import AccountDetailsDialog from './AccountDetailsDialog';
import SlotsInspectorView from './SlotsInspectorView';
import BookingsView from './BookingsView';
import ConversationsView from './ConversationsView';
import { adminApi } from '../api';
import { LayoutDashboard, ShieldCheck, Clock, CalendarDays, MessageSquare, Users, Sparkles, DollarSign, LogOut, ExternalLink, ArrowUpRight, ArrowRight, RefreshCw, Menu, X, AlertCircle, CheckCircle2, ChevronDown, UserRound, Megaphone } from 'lucide-react';
import './dashboard.css';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'A clear view of your platform, all in one place.' },
  { id: 'users', label: 'Users', icon: Users, description: 'Browse users, influencers and admins, and manage account access.' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, description: 'Review registrations and verify professional credentials.' },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, description: 'Manage sessions across the MeetFame community.' },
  { id: 'slots', label: 'Availability', icon: Clock, description: 'Explore creator schedules and booked time slots.' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, description: 'Send updates to users and influencers.' },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare, description: 'Review conversations between clients and creators.' },
];
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
const initials = name => (name || 'Administrator').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenu = useRef(null);
  const profileTrigger = useRef(null);
  useEffect(() => {
    if (!profileMenuOpen) return;
    const outsideClick = event => {
      if (!profileMenu.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        profileTrigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outsideClick);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outsideClick);
      document.removeEventListener('keydown', escape);
    };
  }, [profileMenuOpen]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [days, setDays] = useState(7);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [overview, result] = await Promise.all([adminApi.stats.getOverview(), adminApi.bookings.getAll()]);
      setStats(overview);
      setBookings(result.bookings || []);
      setUpdated(new Date());
      setError('');
    } catch {
      setError('Unable to refresh dashboard data. Check your connection and try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);
  // Refresh summary counts after approval actions in a different view.
  useEffect(() => { if (activeTab === 'overview') load(); }, [activeTab, load]);

  const navigate = id => { setActiveTab(id); setMobileOpen(false); };
  const current = navigation.find(item => item.id === activeTab);
  const pending = stats ? (stats.pendingInfluencers || 0) + (stats.pendingCertificates || 0) + (stats.pendingUsers || 0) : null;
  const metrics = [
    { label: 'Total creators', value: stats?.totalInfluencers, detail: stats ? `${stats.verifiedInfluencers || 0} verified creators` : 'Waiting for platform data', icon: Sparkles, color: 'violet' },
    { label: 'Total bookings', value: stats?.totalBookings, detail: stats ? `${stats.confirmedBookings || 0} confirmed sessions` : 'Waiting for platform data', icon: CalendarDays, color: 'blue' },
    { label: 'Platform volume', value: stats ? money(stats.totalVolume) : null, detail: 'All-time booking value', icon: DollarSign, color: 'green' },
    { label: 'Total clients', value: stats?.totalUsers, detail: stats ? `${stats.pendingUsers || 0} awaiting approval` : 'Waiting for platform data', icon: Users, color: 'orange' },
  ];
  const activity = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - days + index + 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: bookings.filter(booking => booking.date === key).length };
  });
  const maximum = Math.max(1, ...activity.map(day => day.count));
  const statuses = ['confirmed', 'completed', 'cancelled'];

  return (
    <div className="dashboard-shell">
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand"><Logo size="sm" /><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
        <div className="sidebar-scroll">
        <div className="workspace-label"><span className="workspace-mark">M</span><div>MeetFame workspace<small>Administration</small></div><ShieldCheck size={15} /></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Dashboard navigation">{navigation.map(item => <button key={item.id} onClick={() => navigate(item.id)} className={`nav-item ${activeTab === item.id ? 'selected' : ''}`} aria-current={activeTab === item.id ? 'page' : undefined}><item.icon size={19} /><span>{item.label}</span>{item.id === 'approvals' && pending > 0 && <b>{pending}</b>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="workspace-note"><ShieldCheck size={20} /><strong>Your platform, connected.</strong><p>Manage the people and sessions that make MeetFame happen.</p><a href={import.meta.env.VITE_FRONTEND_URL || '/'} target="_blank" rel="noreferrer">Visit main website <ExternalLink size={14} /></a></div></div>
        </div>
        <div className="sidebar-footer"><button className="signout-button" onClick={onLogout}><LogOut size={17} /> Sign out</button></div>
      </aside>
      {profileOpen && <AccountDetailsDialog account={{ ...admin, role: 'admin' }} onClose={() => { setProfileOpen(false); profileTrigger.current?.focus(); }} />}
      <div className="dashboard-workspace">
        <header className="dashboard-topbar"><div className="breadcrumb"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span>Workspace</span><span>/</span><strong>{current.label}</strong></div><div className="admin-profile-menu" ref={profileMenu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setProfileMenuOpen(false); }}>
          <button type="button" ref={profileTrigger} className="admin-profile profile-menu-trigger" aria-label="Admin account options" aria-expanded={profileMenuOpen} aria-controls="admin-profile-options" onClick={() => setProfileMenuOpen(open => !open)}>
            <span className="profile-avatar">{initials(admin?.name)}</span><div><strong>{admin?.name || 'Administrator'}</strong><small>Super admin</small></div><ChevronDown size={15} aria-hidden="true" />
          </button>
          {profileMenuOpen && <div id="admin-profile-options" className="profile-dropdown" aria-label="Admin account options">
            <button type="button" onClick={() => { setProfileMenuOpen(false); setProfileOpen(true); }}><UserRound size={16} aria-hidden="true" />Profile</button>
            <button type="button" className="profile-logout" onClick={() => { setProfileMenuOpen(false); onLogout(); }}><LogOut size={16} aria-hidden="true" />Sign out</button>
          </div>}
        </div></header>
        <main className="dashboard-main">
          <div className="dashboard-page-heading"><div><p className="eyebrow">MEETFAME ADMIN</p><h1>{activeTab === 'overview' ? 'Platform overview' : current.label}</h1><p>{current.description}</p></div><button className="dashboard-button" onClick={() => { load(); if (activeTab === 'users') setUsersRefreshKey(value => value + 1); }} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'refresh-spinning' : ''} />{refreshing ? 'Refreshing…' : 'Refresh data'}</button></div>
          {error && <div className="dashboard-error" role="alert"><AlertCircle size={18} /><span>{error}{updated && ' Showing the last successful update.'}</span><button onClick={load} disabled={refreshing}>Retry</button></div>}
          {activeTab === 'overview' ? <>
            <div className="dashboard-metrics">{metrics.map(metric => <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className={`metric-icon ${metric.color}`}><metric.icon size={18} /></span></div><strong className="metric-value">{metric.value ?? '—'}</strong><p>{metric.detail}</p></article>)}</div>
            <div className="dashboard-middle"><section className="dashboard-card activity-card"><div className="card-heading"><div><h2>Booking activity</h2><p>Sessions scheduled over the last {days} days</p></div><select aria-label="Booking activity period" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option></select></div><div className="activity-total"><strong>{stats ? activity.reduce((sum, day) => sum + day.count, 0) : '—'}</strong><span>scheduled sessions</span></div><div className="activity-chart" role="img" aria-label={stats ? activity.map(day => `${day.label}: ${day.count} bookings`).join(', ') : 'Booking activity unavailable'}>{activity.map((day, index) => <div className="chart-column" key={day.key}><div className="chart-track"><div className="chart-bar" style={{ height: stats ? `${day.count / maximum * 100}%` : '0%' }} title={`${day.label}: ${day.count} bookings`} /></div><span>{days <= 7 || index % Math.ceil(days / 7) === 0 ? day.label : ''}</span></div>)}</div></section>
            <section className="dashboard-card review-card"><div className="card-heading"><div><h2>Needs your attention</h2><p>Keep your community moving forward</p></div><span className="attention-dot" /></div><div className="review-total">{pending ?? '—'}<span>pending reviews</span></div>{[{ label: 'Creator registrations', value: stats?.pendingInfluencers, icon: Users }, { label: 'Certificate verification', value: stats?.pendingCertificates, icon: ShieldCheck }, { label: 'Client registrations', value: stats?.pendingUsers, icon: CheckCircle2 }].map(item => <button className="review-row" key={item.label} onClick={() => navigate('approvals')}><item.icon size={17} /><span>{item.label}</span><strong>{item.value ?? '—'}</strong><ArrowRight size={15} /></button>)}<button className="primary-dashboard-button" onClick={() => navigate('approvals')}>Open review queue <ArrowUpRight size={17} /></button></section></div>
            <section className="dashboard-card"><div className="card-heading"><div><h2>Recent bookings</h2><p>The latest connections on your platform</p></div><button className="text-action" onClick={() => navigate('bookings')}>View all bookings <ArrowRight size={16} /></button></div><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Client / Creator</th><th>Session</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{bookings.slice(0, 5).map(booking => <tr key={booking.id}><td><div className="booking-person"><span className="booking-avatar">{initials(booking.userName)}</span><div><strong>{booking.userName}</strong><small>with {booking.influencerName}</small></div></div></td><td>{booking.topic || 'Consultation'}<small>{booking.slotLabel || booking.slot}</small></td><td>{booking.date}</td><td className="booking-amount">{money(booking.price)}</td><td><span className={`booking-status ${statuses.includes(booking.status) ? booking.status : ''}`}>{booking.status || 'Unknown'}</span></td></tr>)}</tbody></table>{!bookings.length && <div className="dashboard-empty"><CalendarDays size={28} /><strong>{stats ? 'No bookings yet' : 'Booking data unavailable'}</strong><p>{stats ? 'New sessions will appear here as clients make bookings.' : 'Refresh the dashboard to load your latest bookings.'}</p></div>}</div></section>
            <div className="dashboard-footnote"><span className={error ? 'sync-dot offline' : 'sync-dot'} />{updated ? `Last updated ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · Refreshes every 30 seconds` : 'Waiting for the first successful update'}</div>
          </> : <div className="dashboard-detail">{activeTab === 'announcements' && <AnnouncementsView />}{activeTab === 'users' && <UsersView refreshKey={usersRefreshKey} />}{activeTab === 'approvals' && <ApprovalsView />}{activeTab === 'slots' && <SlotsInspectorView />}{activeTab === 'bookings' && <BookingsView />}{activeTab === 'conversations' && <ConversationsView />}</div>}
        </main>
      </div>
    </div>
  );
}
