import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import InfluencerPanel from './components/InfluencerPanel';
import UserPanel from './components/UserPanel';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import ChatModal from './components/ChatModal';
import StatusAlertModal from './components/StatusAlertModal';
import Logo from './components/Logo';
import VerifiedBadge from './components/VerifiedBadge';
import { api } from './api';
import { LogOut, User, Sparkles, ExternalLink } from 'lucide-react';

function AppContent() {
  const { user, role, logout } = useAuth();

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState('user');
  const [authTab, setAuthTab] = useState('login');

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
    setAuthRole(r);
    setAuthTab(tab);
    setAuthModalOpen(true);
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

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 selection:bg-brand-purple selection:text-white flex flex-col">
      {/* If logged in, show app top bar */}
      {user && (
        <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" showTagline={false} />
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
                {role === 'influencer' ? 'Creator Dashboard' : 'Client Portal'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={import.meta.env.VITE_ADMIN_PANEL_URL || (import.meta.env.PROD ? '/admin' : 'http://localhost:5174')}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="Open Admin Command Center in new tab"
              >
                <span>Admin Panel</span>
                <ExternalLink className="w-3 h-3 text-brand-purple" />
              </a>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                />
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>{user.name}</span>
                    {user.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {!user ? (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onBookInfluencer={handleBookInfluencer}
            onOpenChat={handleOpenChat}
            featuredInfluencers={featured}
          />
        ) : role === 'influencer' ? (
          <InfluencerPanel onOpenChat={handleOpenChat} />
        ) : (
          <UserPanel
            onBookInfluencer={handleBookInfluencer}
            onOpenChat={handleOpenChat}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authRole}
        initialTab={authTab}
      />

      <BookingModal
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
