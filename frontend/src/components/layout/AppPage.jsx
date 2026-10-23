import React, { lazy } from 'react';
import { navigate } from '../../authRoutes';

const LandingPage = lazy(() => {
  return import('../LandingPage');
});
const InfluencerPanel = lazy(() => {
  return import('../InfluencerPanel');
});
const UserPanel = lazy(() => {
  return import('../UserPanel');
});
const BookingPage = lazy(() => {
  return import('../BookingPage');
});
const ProfilePage = lazy(() => {
  return import('../ProfilePage');
});

// Keep page selection explicit. Authentication redirects live in App.jsx.
export default function AppPage({
  path,
  user,
  role,
  featured,
  onBookInfluencer,
  onOpenChat,
  onJoinCall,
  onBookingLogin,
}) {
  if (user && /^\/profile(?:\/edit)?\/?$/.test(path)) {
    return <ProfilePage edit={/\/edit\/?$/.test(path)} />;
  }

  const bookingRoute = /^\/book\/([^/]+)\/?$/.exec(path);
  if (bookingRoute) {
    return (
      <BookingPage
        key={bookingRoute[1]}
        influencerId={bookingRoute[1]}
        onClose={() => {
          return navigate('/');
        }}
        onLogin={onBookingLogin}
      />
    );
  }

  if (!user || /^\/home\/?$/.test(path)) {
    return (
      <LandingPage
        hideHeader={Boolean(user)}
        onBookInfluencer={onBookInfluencer}
        onOpenChat={onOpenChat}
        featuredInfluencers={featured}
      />
    );
  }

  if (role === 'influencer') {
    return <InfluencerPanel onOpenChat={onOpenChat} onJoinCall={onJoinCall} />;
  }

  return (
    <UserPanel
      onBookInfluencer={onBookInfluencer}
      onOpenChat={onOpenChat}
      onJoinCall={onJoinCall}
    />
  );
}
