import AuthSocialBackground from '@shared/AuthSocialBackground';
import ThemeToggle from './components/ThemeToggle';
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import InfluencerPanel from './components/InfluencerPanel';
import UserPanel from './components/UserPanel';
import AuthPage from './components/AuthPage';
import { authPath, matchAuthRoute, navigate } from './authRoutes';
import BookingModal from './components/BookingModal';
import ChatModal from './components/ChatModal';
import StatusAlertModal from './components/StatusAlertModal';
import Logo from './components/Logo';
import LogoLoader from './components/LogoLoader';
import Notifications from './components/Notifications';
import VideoCall from './components/VideoCall';
import VerifiedBadge from './components/VerifiedBadge';
import { api } from './api';
import { LogOut, User, Sparkles, ExternalLink } from 'lucide-react';

function AppContent() {
  const { user, role, logout, loading } = useAuth();

  // Modals state
  const [callBooking, setCallBooking] = useState(null);
  const [path, setPath] = useState(() => window.location.pathname);
  const authRoute = matchAuthRoute(path);
  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);
  useEffect(() => {
    if (user && authRoute) navigate('/', { replace: true });
  }, [user, path]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatTargetRole, setChatTargetRole] = useState('influencer');

  // Featured influencers for landing page
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.influencers.getAll();
        setFeatured(res.influencers || []);
      } catch (err) {
        console.error('Failed to load featured influencers:', err);
      }
    }
    loadFeatured();
  }, []);

  const handleOpenAuth = (r = 'user', tab = 'login') => {
    navigate(authPath(r, tab));
  };

  const handleBookInfluencer = (influencer) => {
    if (!user) {
      handleOpenAuth('user', 'login');
      return;
    }
    setSelectedInfluencer(influencer);
    setBookingModalOpen(true);
  };

  const handleOpenChat = (target, targetR) => {
    if (!user) {
      handleOpenAuth('user', 'login');
      return;
    }
    setChatTarget(target);
    setChatTargetRole(targetR);
    setChatModalOpen(true);
  };

  if (loading) return <LogoLoader />;
  if (authRoute)
    return (
      <AuthPage
        key={`${authRoute.role}:${authRoute.tab}`}
        role={authRoute.role}
        tab={authRoute.tab}
      />
    );

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 selection:bg-brand-purple selection:text-white flex flex-col">
      {/* If logged in, show app top bar */}
      {user && (
        <header
          className={`${role === 'influencer' ? 'creator-site-header ' : ''}sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-slate-800`}
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

              <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:pl-4 lg:border-l border-slate-800">
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                  }
                  alt={user.name}
                  className="w-9 h-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-700"
                />
                <div className="hidden sm:block min-w-0 max-w-[160px] xl:max-w-[220px] text-left text-xs">
                  <div className="font-semibold text-white flex min-w-0 items-center gap-1">
                    <span className="truncate" title={user.name}>
                      {user.name}
                    </span>
                    {user.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="mt-1 text-[10px] leading-4 text-slate-400 capitalize">
                    {user.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCallBooking(null);
                    logout();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Sign Out"
                  aria-label="Sign out"
                  type="button"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 social-background-host">
        {user && <AuthSocialBackground page />}
        {!user ? (
          <LandingPage
            onBookInfluencer={handleBookInfluencer}
            onOpenChat={handleOpenChat}
            featuredInfluencers={featured}
          />
        ) : role === 'influencer' ? (
          <InfluencerPanel
            onOpenChat={handleOpenChat}
            onJoinCall={setCallBooking}
          />
        ) : (
          <UserPanel
            onBookInfluencer={handleBookInfluencer}
            onOpenChat={handleOpenChat}
            onJoinCall={setCallBooking}
          />
        )}
      </main>

      {user && callBooking && (
        <VideoCall
          key={`${user.id}:${callBooking.id}`}
          booking={callBooking}
          role={role}
          onClose={() => setCallBooking(null)}
        />
      )}
      {/* Modals & Dialogs */}

      <BookingModal
        onBookingSuccess={() =>
          window.dispatchEvent(new Event('meetfame-bookings-updated'))
        }
        isOpen={bookingModalOpen}
        influencer={selectedInfluencer}
        onClose={() => setBookingModalOpen(false)}
      />

      <ChatModal
        isOpen={chatModalOpen}
        targetUser={chatTarget}
        targetRole={chatTargetRole}
        onClose={() => setChatModalOpen(false)}
      />

      <StatusAlertModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
