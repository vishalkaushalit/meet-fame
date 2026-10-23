import OverviewPanel from './admin/OverviewPanel';
import { money, initials } from './admin/dashboardFormatters';
import {
  adminPath,
  matchAdminRecord,
  navigateAdmin,
  navigateAccountDetails,
  matchAccountDetails,
  accountDetailsParent,
  navigateAdminAction,
} from '../routes';
import ThemeToggle from './ThemeToggle';
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Logo from './Logo';
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
  ArrowLeft,
  RefreshCw,
  Menu,
  X,
  AlertCircle,
  ChevronDown,
  UserRound,
  Megaphone,
  Pencil,
} from 'lucide-react';
import './dashboard.css';

const BillingView = lazy(() => {
  return import('../../../shared/BillingView');
});
const AnnouncementsIndex = lazy(() => {
  return import('./AnnouncementsIndex');
});
const ApprovalsView = lazy(() => {
  return import('./ApprovalsView');
});
const AnnouncementsView = lazy(() => {
  return import('./AnnouncementsView');
});
const AccountDetailsPage = lazy(() => {
  return import('./AccountDetailsPage');
});
const AdminEditProfile = lazy(() => {
  return import('./AdminEditProfile');
});
const SlotsInspectorView = lazy(() => {
  return import('./SlotsInspectorView');
});
const BookingsView = lazy(() => {
  return import('./BookingsView');
});
const ConversationsView = lazy(() => {
  return import('./ConversationsView');
});

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
  {
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    description: 'Review customer payments and transaction history.',
  },
];
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
    if (!profileMenuOpen) {
      return;
    }
    const outsideClick = (event) => {
      if (!profileMenu.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
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
    setBillingRevision((value) => {
      return value + 1;
    });
    try {
      const [overview, result] = await Promise.allSettled([
        adminApi.stats.getOverview(),
        adminApi.bookings.getAll(),
      ]);
      if (request !== refreshRequest.current) {
        return;
      }
      if (overview.status === 'fulfilled') {
        setStats(overview.value);
      }
      if (result.status === 'fulfilled') {
        setBookings(result.value.bookings || []);
      }
      if (overview.status === 'fulfilled' && result.status === 'fulfilled') {
        setUpdated(new Date());
        setError('');
      } else {
        setError(
          'Some dashboard data could not be refreshed. Please try again.',
        );
      }
    } catch {
      setError(
        'Unable to refresh dashboard data. Check your connection and try again.',
      );
    } finally {
      if (request === refreshRequest.current) {
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    const timer = setInterval(load, 30000);
    return () => {
      return clearInterval(timer);
    };
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
  const navigationTab =
    activeTab === 'add-announcement'
      ? 'announcements'
      : activeTab === 'edit-profile'
        ? 'overview'
        : activeTab;
  const actionPages = {
    'edit-profile': {
      label: 'Edit profile',
      description: 'Update your account information.',
    },
    'add-announcement': {
      label: 'Add announcement',
      description: 'Create a notification for your community.',
    },
  };
  const current = actionPages[activeTab] ||
    navigation.find((item) => {
      return item.id === navigationTab;
    }) || {
      label: 'Account details',
      description: 'Profile, credentials, and availability.',
    };
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
      count: bookings.filter((booking) => {
        return booking.date === key;
      }).length,
    };
  });
  const maximum = Math.max(
    4,
    Math.ceil(
      Math.max(
        0,
        ...activity.map((day) => {
          return day.count;
        }),
      ) / 4,
    ) * 4,
  );
  const statuses = ['confirmed', 'completed', 'cancelled'];

  return (
    <div className="dashboard-shell">
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => {
            return setMobileOpen(false);
          }}
        />
      )}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo size="sm" />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => {
              return setMobileOpen(false);
            }}
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
            {navigation.map((item) => {
              return (
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
                    ) {
                      return;
                    }
                    event.preventDefault();
                    navigate(item.id);
                  }}
                  className={`nav-item ${navigationTab === item.id ? 'selected' : ''}`}
                  aria-current={navigationTab === item.id ? 'page' : undefined}
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                </a>
              );
            })}
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
              onClick={() => {
                return setMobileOpen(true);
              }}
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
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setProfileMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                ref={profileTrigger}
                className="admin-profile profile-menu-trigger"
                aria-label="Admin account options"
                aria-expanded={profileMenuOpen}
                aria-controls="admin-profile-options"
                onClick={() => {
                  return setProfileMenuOpen((open) => {
                    return !open;
                  });
                }}
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
          <div className="dashboard-page-heading">
            <div className="admin-heading-leading">
              <button
                type="button"
                className="dashboard-button admin-back-button admin-back-icon"
                aria-label="Go back"
                title="Back"
                onClick={() => {
                  if (recordDetails) {
                    navigateAdmin(recordDetails.page);
                  } else if (
                    detailsAccount ||
                    ['edit-profile', 'add-announcement'].includes(activeTab)
                  ) {
                    navigateAdmin(accountDetailsParent());
                  } else if (window.history.state?.adminNavigation) {
                    window.history.back();
                  } else {
                    navigateAdmin('overview', { replace: true });
                  }
                }}
              >
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
            <OverviewPanel
              metrics={metrics}
              days={days}
              setDays={setDays}
              stats={stats}
              activity={activity}
              maximum={maximum}
              pending={pending}
              navigate={navigate}
              bookings={bookings}
              statuses={statuses}
              error={error}
              updated={updated}
            />
          ) : (
            <div className="dashboard-detail">
              <Suspense
                fallback={
                  <p role="status" className="p-6 text-sm">
                    Loading page…
                  </p>
                }
              >
                {activeTab === 'account-details' && detailsAccount && (
                  <AccountDetailsPage
                    key={`${detailsAccount.role}:${detailsAccount.id}`}
                    account={detailsAccount}
                  />
                )}
                {activeTab === 'edit-profile' && (
                  <AdminEditProfile
                    admin={admin}
                    onClose={() => {
                      return navigateAdmin(accountDetailsParent());
                    }}
                    onSaved={(user) => {
                      onProfileUpdated(user);
                      setProfileNotice('Profile updated successfully.');
                      navigateAdmin(accountDetailsParent());
                    }}
                  />
                )}
                {activeTab === 'announcements' && (
                  <AnnouncementsIndex
                    detailId={recordDetails?.id}
                    edit={recordDetails?.edit}
                  />
                )}
                {activeTab === 'add-announcement' && (
                  <div className="space-y-4">
                    <AnnouncementsView />
                  </div>
                )}
                {activeTab === 'approvals' && (
                  <ApprovalsView onChange={load} detailId={recordDetails?.id} />
                )}
                {activeTab === 'billing' && (
                  <BillingView
                    admin
                    refreshKey={billingRevision}
                    loadTransactions={adminApi.billing.getTransactions}
                  />
                )}
                {activeTab === 'slots' && <SlotsInspectorView />}
                {activeTab === 'bookings' && (
                  <BookingsView detailId={recordDetails?.id} />
                )}
                {activeTab === 'conversations' && (
                  <ConversationsView detailId={recordDetails?.id} />
                )}
              </Suspense>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
