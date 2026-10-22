import BillingView from '../../../shared/BillingView';
import AnnouncementsIndex from './AnnouncementsIndex';
import { formatDate } from '../../../shared/dateFormat';
import AuthSocialBackground from '@shared/AuthSocialBackground';
import { adminPath, matchAdminRecord, navigateAdmin, navigateAccountDetails, matchAccountDetails, accountDetailsParent, navigateAdminAction } from '../routes';
import ThemeToggle from './ThemeToggle';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import ApprovalsView from './ApprovalsView';
import AnnouncementsView from './AnnouncementsView';
import AccountDetailsPage from './AccountDetailsPage';
import AdminEditProfile from './AdminEditProfile';
import SlotsInspectorView from './SlotsInspectorView';
import BookingsView from './BookingsView';
import ConversationsView from './ConversationsView';
import { adminApi } from '../api';
import {
  LayoutDashboard,
  ShieldCheck,
  Clock,
  CalendarDays,
  MessageSquare,
  Users,
  Sparkles,
  DollarSign,
  LogOut,
  ExternalLink,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Menu,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  UserRound,
  Megaphone,
  Pencil,
} from 'lucide-react';
import './dashboard.css';

const navigation = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'A clear view of your platform, all in one place.',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ShieldCheck,
    description: 'Review registrations and verify professional credentials.',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: CalendarDays,
    description: 'Manage sessions across the MeetFame community.',
  },
  {
    id: 'slots',
    label: 'Availability',
    icon: Clock,
    description: 'Explore influencer schedules and booked time slots.',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    description: 'Send updates to users and influencers.',
  },
  {
    id: 'conversations',
    label: 'Conversations',
    icon: MessageSquare,
    description: 'Review conversations between users and influencers.',
  },
  { id: 'billing', label: 'Billing', icon: DollarSign, description: 'Review customer payments and transaction history.' },
];
const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
const initials = (name) =>
  (name || 'Administrator')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function AdminDashboard({
  admin,
  onLogout,
  onProfileUpdated,
  activeTab = 'overview',
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const profileMenu = useRef(null);
  const profileTrigger = useRef(null);
  useEffect(() => {
    if (!profileMenuOpen) return;
    const outsideClick = (event) => {
      if (!profileMenu.current?.contains(event.target))
        setProfileMenuOpen(false);
    };
    const escape = (event) => {
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
  const [billingRevision, setBillingRevision] = useState(0);
  const refreshRequest = useRef(0);
  const load = useCallback(async () => {
    const request = ++refreshRequest.current;
    setRefreshing(true);
    setBillingRevision((value) => value + 1);
    try {
      const [overview, result] = await Promise.allSettled([
        adminApi.stats.getOverview(),
        adminApi.bookings.getAll(),
      ]);
      if (request !== refreshRequest.current) return;
      if (overview.status === 'fulfilled') setStats(overview.value);
      if (result.status === 'fulfilled') setBookings(result.value.bookings || []);
      if (overview.status === 'fulfilled' && result.status === 'fulfilled') {
        setUpdated(new Date());
        setError('');
      } else {
        setError('Some dashboard data could not be refreshed. Please try again.');
      }
    } catch {
      setError(
        'Unable to refresh dashboard data. Check your connection and try again.',
      );
    } finally {
      if (request === refreshRequest.current) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);
  // Load live counts immediately on every page, including direct links.
  useEffect(() => {
    load();
  }, [activeTab, load]);

  const navigate = (id) => {
    navigateAdmin(id);
    setProfileMenuOpen(false);
    setMobileOpen(false);
  };
  const navigationTab = activeTab === 'add-announcement' ? 'announcements' : activeTab === 'edit-profile' ? 'overview' : activeTab;
  const actionPages = {
    'edit-profile': { label: 'Edit profile', description: 'Update your account information.' },
    'add-announcement': { label: 'Add announcement', description: 'Create a notification for your community.' },
  };
  const current = actionPages[activeTab] || navigation.find((item) => item.id === navigationTab) || { label: 'Account details', description: 'Profile, credentials, and availability.' };
  const recordDetails = matchAdminRecord(window.location.pathname);
  const detailsAccount = matchAccountDetails(window.location.pathname);
  const pending = stats
    ? (stats.pendingInfluencers || 0) +
      (stats.pendingCertificates || 0) +
      (stats.pendingUsers || 0)
    : null;
  const metrics = [
    {
      label: 'Total influencers',
      value: stats?.totalInfluencers,
      detail: stats
        ? `${stats.verifiedInfluencers || 0} verified influencers`
        : 'Waiting for platform data',
      icon: Sparkles,
      color: 'violet',
    },
    {
      label: 'Total bookings',
      value: stats?.totalBookings,
      detail: stats
        ? `${stats.confirmedBookings || 0} confirmed sessions`
        : 'Waiting for platform data',
      icon: CalendarDays,
      color: 'blue',
    },
    {
      label: 'Platform volume',
      value: stats ? money(stats.totalVolume) : null,
      detail: 'All-time booking value',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Total users',
      value: stats?.totalUsers,
      detail: stats
        ? `${stats.pendingUsers || 0} awaiting approval`
        : 'Waiting for platform data',
      icon: Users,
      color: 'orange',
    },
  ];
  const activity = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - days + index + 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      key,
      label: date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      count: bookings.filter((booking) => booking.date === key).length,
    };
  });
  const maximum = Math.max(4, Math.ceil(Math.max(0, ...activity.map((day) => day.count)) / 4) * 4);
  const statuses = ['confirmed', 'completed', 'cancelled'];

  return (
    <div className="dashboard-shell">
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo size="sm" />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-scroll">
          <div className="workspace-label">
            <span className="workspace-mark">M</span>
            <div className="workspace-copy">
              <span className="workspace-title">MeetFame workspace</span>
              <small>Administration</small>
            </div>
            <ShieldCheck size={15} />
          </div>
          <p className="nav-caption">WORKSPACE</p>
          <nav aria-label="Dashboard navigation">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={adminPath(item.id)}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  navigate(item.id);
                }}
                className={`nav-item ${navigationTab === item.id ? 'selected' : ''}`}
                aria-current={navigationTab === item.id ? 'page' : undefined}
              >
                <item.icon size={19} />
                <span>{item.label}</span>



              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="workspace-note">
              <ShieldCheck size={20} />
              <strong>Your platform, connected.</strong>
              <p>Manage the people and sessions that make MeetFame happen.</p>
              <a
                href={import.meta.env.VITE_FRONTEND_URL || '/'}
                target="_blank"
                rel="noreferrer"
              >
                Visit main website <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="signout-button" onClick={onLogout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{current.label}</strong>
          </div>
          <div className="dashboard-header-actions">
            <ThemeToggle />
            <div
              className="admin-profile-menu"
              ref={profileMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setProfileMenuOpen(false);
              }}
            >
              <button
                type="button"
                ref={profileTrigger}
                className="admin-profile profile-menu-trigger"
                aria-label="Admin account options"
                aria-expanded={profileMenuOpen}
                aria-controls="admin-profile-options"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="profile-avatar">{initials(admin?.name)}</span>
                <div>
                  <strong>{admin?.name || 'Administrator'}</strong>
                  <small>Super admin</small>
                </div>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {profileMenuOpen && (
                <div
                  id="admin-profile-options"
                  className="profile-dropdown"
                  aria-label="Admin account options"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateAccountDetails({ ...admin, role: 'admin' });
                    }}
                  >
                    <UserRound size={16} aria-hidden="true" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigateAdminAction('edit-profile');
                    }}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="profile-logout"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="dashboard-main social-background-host">
          <AuthSocialBackground page />
            <div className="dashboard-page-heading">
              <div className="admin-heading-leading">
                <button type="button" className="dashboard-button admin-back-button admin-back-icon" aria-label="Go back" title="Back" onClick={() => {
                  if (recordDetails) navigateAdmin(recordDetails.page);
                  else if (detailsAccount || ['edit-profile', 'add-announcement'].includes(activeTab)) navigateAdmin(accountDetailsParent());
                  else if (window.history.state?.adminNavigation) window.history.back();
                  else navigateAdmin('overview', { replace: true });
                }}>
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <div className="admin-heading-copy">
                <h1 id="admin-page-title">
                  {activeTab === 'overview'
                    ? 'Platform overview'
                    : current.label}
                </h1>
                <p>{current.description}</p>
                </div>
              </div>
              <div className="admin-heading-actions">
              <button
                className="dashboard-button"
                onClick={load}
                disabled={refreshing}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? 'refresh-spinning' : ''}
                />
                {refreshing ? 'Refreshing…' : 'Refresh data'}
              </button>
              </div>
            </div>
          {profileNotice && (
            <p role="status" className="mb-4 text-xs text-emerald-400">
              {profileNotice}
            </p>
          )}
          {error && (
            <div className="dashboard-error" role="alert">
              <AlertCircle size={18} />
              <span>
                {error}
                {updated && ' Showing the last successful update.'}
              </span>
              <button onClick={load} disabled={refreshing}>
                Retry
              </button>
            </div>
          )}
          {activeTab === 'overview' ? (
            <>
              <div className="dashboard-metrics">
                {metrics.map((metric) => (
                  <article className={`metric-card metric-card-${metric.color}`} key={metric.label}>
                    <div className="metric-top">
                      <span>{metric.label}</span>
                      <span className={`metric-icon ${metric.color}`}>
                        <metric.icon size={18} />
                      </span>
                    </div>
                    <strong className="metric-value">
                      {metric.value ?? '—'}
                    </strong>
                    <p>{metric.detail}</p>
                  </article>
                ))}
              </div>
              <div className="dashboard-middle">
                <section className="dashboard-card activity-card">
                  <div className="card-heading">
                    <div>
                      <h2>Booking activity</h2>
                      <p>Sessions scheduled over the last {days} days</p>
                    </div>
                    <select
                      aria-label="Booking activity period"
                      value={days}
                      onChange={(event) => setDays(Number(event.target.value))}
                    >
                      <option value={7}>Last 7 days</option>
                      <option value={14}>Last 14 days</option>
                      <option value={30}>Last 30 days</option>
                    </select>
                  </div>
                  <div className="activity-total">
                    <strong>
                      {stats
                        ? activity.reduce((sum, day) => sum + day.count, 0)
                        : '—'}
                    </strong>
                    <span>scheduled sessions</span>
                  </div>
                  <div
                    className="activity-chart"
                    role="img"
                    aria-label={
                      stats
                        ? activity
                            .map((day) => `${day.label}: ${day.count} bookings`)
                            .join(', ')
                        : 'Booking activity unavailable'
                    }
                  >
                    <div className="chart-scale" aria-hidden="true">
                      {[4, 3, 2, 1, 0].map((tick) => <span key={tick}>{maximum * tick / 4}</span>)}
                    </div>
                    {activity.map((day, index) => (
                      <div className="chart-column" key={day.key}>
                        <div className="chart-track">
                          <div
                            className="chart-bar"
                            style={{
                              height: stats
                                ? `${(day.count / maximum) * 100}%`
                                : '0%',
                            }}
                            title={`${day.label}: ${day.count} bookings`}
                          >
                            <span className="chart-count">{stats ? day.count : '—'}</span>
                          </div>
                        </div>
                        <span>
                          {days <= 7 || index % Math.ceil(days / 7) === 0
                            ? day.label
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="dashboard-card review-card">
                  <div className="card-heading">
                    <div>
                      <h2>Needs your attention</h2>
                      <p>Keep your community moving forward</p>
                    </div>
                    <span className="attention-dot" />
                  </div>
                  <div className="review-total">
                    {pending ?? '—'}
                    <span>pending reviews</span>
                  </div>
                  {[
                    {
                      label: 'Influencer registrations',
                      value: stats?.pendingInfluencers,
                      icon: Users,
                    },
                    {
                      label: 'Certificate verification',
                      value: stats?.pendingCertificates,
                      icon: ShieldCheck,
                    },
                    {
                      label: 'User registrations',
                      value: stats?.pendingUsers,
                      icon: CheckCircle2,
                    },
                  ].map((item) => (
                    <button
                      className="review-row"
                      key={item.label}
                      onClick={() => navigate('approvals')}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                      <strong>{item.value ?? '—'}</strong>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                  <button
                    className="primary-dashboard-button"
                    onClick={() => navigate('approvals')}
                  >
                    Open review queue <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Recent bookings</h2>
                    <p>The latest connections on your platform</p>
                  </div>
                  <button
                    className="dashboard-button button-primary"
                    onClick={() => navigate('bookings')}
                  >
                    View All <ArrowRight size={16} />
                  </button>
                </div>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table column-sized-table" style={{ minWidth: 904 }}><colgroup><col style={{ width: 64 }} /><col style={{ width: 240 }} /><col style={{ width: 230 }} /><col style={{ width: 140 }} /><col style={{ width: 110 }} /><col style={{ width: 120 }} /></colgroup>
                    <thead>
                      <tr>
                        <th>S.No.</th>
                        <th>User / Influencer</th>
                        <th>Session</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map((booking, index) => (
                        <tr key={booking.id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="booking-person">
                              <span className="booking-avatar">
                                {initials(booking.userName)}
                              </span>
                              <div>
                                <strong>{booking.userName}</strong>
                                <small>with {booking.influencerName}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {booking.topic || 'Consultation'}
                            <div className="recent-booking-time"><span className="time-slot-badge">{booking.slotLabel || booking.slot || '—'}</span></div>
                          </td>
                          <td>{formatDate(booking.date)}</td>
                          <td className="booking-amount">
                            {money(booking.price)}
                          </td>
                          <td>
                            <span
                              className={`booking-status ${statuses.includes(booking.status) ? booking.status : ''}`}
                            >
                              {booking.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!bookings.length && (
                    <div className="dashboard-empty">
                      <CalendarDays size={28} />
                      <strong>
                        {stats ? 'No bookings yet' : 'Booking data unavailable'}
                      </strong>
                      <p>
                        {stats
                          ? 'New sessions will appear here as users make bookings.'
                          : 'Refresh the dashboard to load your latest bookings.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>
              <div className="dashboard-footnote">
                <span className={error ? 'sync-dot offline' : 'sync-dot'} />
                {updated
                  ? `Last updated ${updated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · Refreshes every 30 seconds`
                  : 'Waiting for the first successful update'}
              </div>
            </>
          ) : (
            <div
              className="dashboard-detail"
            >
              {activeTab === 'account-details' && detailsAccount && (
                <AccountDetailsPage key={`${detailsAccount.role}:${detailsAccount.id}`} account={detailsAccount} />
              )}
              {activeTab === 'edit-profile' && (
                <AdminEditProfile admin={admin}
                  onClose={() => navigateAdmin(accountDetailsParent())}
                  onSaved={(user) => {
                    onProfileUpdated(user);
                    setProfileNotice('Profile updated successfully.');
                    navigateAdmin(accountDetailsParent());
                  }} />
              )}
              {activeTab === 'announcements' && <AnnouncementsIndex detailId={recordDetails?.id} edit={recordDetails?.edit} />}
              {activeTab === 'add-announcement' && (
                <div className="space-y-4">
                  <AnnouncementsView />
                </div>
              )}
              {activeTab === 'approvals' && <ApprovalsView onChange={load} detailId={recordDetails?.id} />}
              {activeTab === 'billing' && <BillingView admin refreshKey={billingRevision} loadTransactions={adminApi.billing.getTransactions} />}
              {activeTab === 'slots' && <SlotsInspectorView />}
              {activeTab === 'bookings' && <BookingsView detailId={recordDetails?.id} />}
              {activeTab === 'conversations' && <ConversationsView detailId={recordDetails?.id} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
