import AppPage from './components/layout/AppPage';
import useFeaturedInfluencers from './hooks/useFeaturedInfluencers';
import AppHeader from './components/layout/AppHeader';
import ThemeToggle from './components/ThemeToggle';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authPath, matchAuthRoute, navigate } from './authRoutes';
import StatusAlertModal from './components/StatusAlertModal';
import Logo from './components/Logo';
import LogoLoader from './components/LogoLoader';
import { api } from './api';

const AuthPage = lazy(() => import('./components/AuthPage'));
const VideoCall = lazy(() => import('./components/VideoCall'));
const ChatModal = lazy(() => import('./components/ChatModal'));
const PasswordRecovery = lazy(() => import('../../shared/PasswordRecovery'));

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
  const authTab = authRoute?.tab;
  useEffect(() => {
    if (
      user &&
      authTab &&
      !['forgot-password', 'reset-password'].includes(authTab)
    ) {
      const destination = sessionStorage.getItem('meetfame-booking-return');
      sessionStorage.removeItem('meetfame-booking-return');
      navigate(
        destination && /^\/book\/[^/]+$/.test(destination) ? destination : '/',
        { replace: true },
      );
    }
  }, [user, authTab]);

  const bookingRoute = /^\/book\/([^/]+)\/?$/.exec(path);
  const profileRoute = /^\/profile(?:\/edit)?\/?$/.test(path);
  useEffect(() => {
    if (!loading && !user && profileRoute) navigate(authPath('user'));
  }, [loading, user, profileRoute]);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatTargetRole, setChatTargetRole] = useState('influencer');

  const showHomepage = !user || /^\/home\/?$/.test(path);
  const featured = useFeaturedInfluencers(
    !loading && showHomepage && !authRoute && !bookingRoute && !profileRoute,
  );

  const handleOpenAuth = (role = 'user', tab = 'login') => {
    navigate(authPath(role, tab));
  };

  const handleBookInfluencer = (influencer) => {
    const destination = `/book/${encodeURIComponent(influencer.id)}`;
    if (!user) {
      sessionStorage.setItem('meetfame-booking-return', destination);
      handleOpenAuth('user', 'login');
      return;
    }
    navigate(destination);
  };

  const handleOpenChat = (target, targetRole) => {
    if (!user) {
      handleOpenAuth('user', 'login');
      return;
    }
    setChatTarget(target);
    setChatTargetRole(targetRole);
    setChatModalOpen(true);
  };

  if (loading) return <LogoLoader />;
  if (
    authRoute &&
    ['forgot-password', 'reset-password'].includes(authRoute.tab)
  )
    return (
      <PasswordRecovery
        header={
          <>
            <Logo size="header" />
            <ThemeToggle />
          </>
        }
        key={`${authRoute.role}:${authRoute.tab}`}
        role={authRoute.role}
        reset={authRoute.tab === 'reset-password'}
        requestReset={api.auth.forgotPassword}
        verifyOtp={api.auth.verifyOtp}
        savePassword={api.auth.resetPassword}
        loginUrl={authPath(authRoute.role)}
      />
    );
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
        <AppHeader
          user={user}
          role={role}
          onLogout={() => {
            setCallBooking(null);
            logout();
          }}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 social-background-host${user ? ' pt-20' : ''}`}>
        <Suspense fallback={<LogoLoader />}>
          <AppPage
            path={path}
            user={user}
            role={role}
            featured={featured}
            onBookInfluencer={handleBookInfluencer}
            onOpenChat={handleOpenChat}
            onJoinCall={setCallBooking}
            onBookingLogin={() => {
              sessionStorage.setItem('meetfame-booking-return', path);
              handleOpenAuth('user', 'login');
            }}
          />
        </Suspense>
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

      {chatModalOpen && (
        <Suspense fallback={<LogoLoader />}>
          <ChatModal
            isOpen={chatModalOpen}
            targetUser={chatTarget}
            targetRole={chatTargetRole}
            onClose={() => setChatModalOpen(false)}
          />
        </Suspense>
      )}

      <StatusAlertModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LogoLoader />}>
        <AppContent />
      </Suspense>
    </AuthProvider>
  );
}
