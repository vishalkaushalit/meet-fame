import IntroVideo from './IntroVideo';
import Pagination, { usePagination } from './Pagination';
import './creator-dashboard.css';
import LogoLoader from './LogoLoader';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import JoinCallButton from './JoinCallButton';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Video,
  Info,
} from 'lucide-react';

export default function UserPanel({
  onBookInfluencer,
  onOpenChat,
  onJoinCall,
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-bookings'
  useEffect(() => {
    const showBookings = () => setActiveTab('my-bookings');
    window.addEventListener('meetfame-show-bookings', showBookings);
    return () =>
      window.removeEventListener('meetfame-show-bookings', showBookings);
  }, []);
  const [influencers, setInfluencers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  const categories = [
    'All',
    'Technology & AI',
    'Health & Fitness',
    'Fashion & Lifestyle',
    'Business & Finance',
  ];

  // Fetch approved influencers
  useEffect(() => {
    async function loadInfluencers() {
      setLoading(true);
      try {
        const res = await api.influencers.getAll(selectedCategory, searchQuery);
        setInfluencers(res.influencers || []);
      } catch (err) {
        console.error('Failed to fetch influencers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInfluencers();
  }, [selectedCategory, searchQuery]);

  // Refresh after a successful booking and while the bookings view is open.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const load = async (showLoading = false) => {
      if (showLoading) setLoadingBookings(true);
      try {
        const result = await api.bookings.getMyBookings({ userId: user.id });
        if (active) {
          setMyBookings(result.bookings || []);
          setBookingsError('');
        }
      } catch {
        if (active)
          setBookingsError('Unable to load bookings. Please try again.');
      } finally {
        if (active && showLoading) setLoadingBookings(false);
      }
    };
    const refresh = () => load();
    load(true);
    window.addEventListener('meetfame-bookings-updated', refresh);
    window.addEventListener('focus', refresh);
    const timer =
      activeTab === 'my-bookings' ? setInterval(refresh, 15000) : null;
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('meetfame-bookings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.id, activeTab]);

  const bookingPagination = usePagination(myBookings);
  const creatorPagination = usePagination(
    influencers,
    `${selectedCategory}:${searchQuery}`,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* User Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
            }
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-indigo/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">
                Hello, {user?.name || 'Explorer'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                User
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Connect 1-on-1 with verified creators, executives, and mentors.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 relative z-10">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Influencers</span>
          </button>

          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-bookings'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings ({myBookings.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE INFLUENCERS */}
      {activeTab === 'browse' && (
        <div>
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, expertise, or keyword..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-inset ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-brand-indigo to-brand-purple border-transparent text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Influencer Grid */}
          {loading ? (
            <LogoLoader
              variant="inline"
              label="Loading verified influencers..."
            />
          ) : influencers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
              <p className="text-sm font-semibold">
                No influencers found matching your criteria.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting another category or clearing search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatorPagination.items.map((inf) => (
                <div
                  key={inf.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-brand-purple/40 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group"
                >
                  <div>
                    {/* Header: Avatar, Name, Verified Badge, Category */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            inf.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={inf.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-purple/30 group-hover:ring-brand-purple transition-all"
                        />
                        {inf.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-slate-900 p-0.5 rounded-full">
                            <VerifiedBadge size="sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base truncate">
                            {inf.name}
                          </h3>
                          {inf.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-brand-purple text-xs font-semibold mt-0.5 truncate">
                          {inf.specialization}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-[10px] font-semibold mt-1 border border-slate-800">
                          {inf.category}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 mb-4">
                      {inf.bio}
                    </p>

                    <IntroVideo influencer={inf} card />

                    {/* Rate & Slots metadata */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          1-Hour Session
                        </span>
                        <span className="font-black text-emerald-400 text-sm">
                          ${inf.hourlyRate || 150}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                          Availability
                        </span>
                        <span className="font-semibold text-slate-300 text-xs">
                          {inf.totalWeeklySlots || 12} slots/week
                        </span>
                      </div>
                    </div>
                  </div>

                    {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => onBookInfluencer(inf)}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Book Slot</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <Pagination pagination={creatorPagination} label="influencers" />
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my-bookings' && (
        <div className="user-bookings creator-appointments p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-purple" />
                <span>My Bookings</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Manage your sessions and connect with your influencers.
              </p>
            </div>
          </div>

          {bookingsError && (
            <div
              role="alert"
              className="p-3 mb-4 text-xs text-rose-300 border border-rose-500/30 rounded-xl"
            >
              {bookingsError}
              <button
                className="ml-3 underline"
                onClick={() =>
                  window.dispatchEvent(new Event('meetfame-bookings-updated'))
                }
              >
                Retry
              </button>
            </div>
          )}
          {loadingBookings ? (
            <LogoLoader variant="inline" label="Loading bookings..." />
          ) : bookingsError &&
            myBookings.length === 0 ? null : myBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              You haven't booked any sessions yet. Browse creators to schedule
              your first 1-hour slot!
            </div>
          ) : (
            <div className="space-y-3">
              {bookingPagination.items.map((b) => (
                <article key={b.id} className="creator-appointment">
                  <div className="creator-client">
                    <span className="creator-client-avatar" aria-hidden="true">
                      {b.influencerName?.charAt(0) || 'I'}
                    </span>
                    <div>
                      <h4>{b.influencerName}</h4>
                      <p>
                        Influencer ·{' '}
                        {b.meetingType === 'video'
                          ? 'Video session'
                          : 'In-person session'}
                      </p>
                    </div>
                  </div>
                  <div className="creator-session-info">
                    <div className="creator-topic">
                      <MessageSquare size={17} aria-hidden="true" />
                      <div>
                        <span>Topic</span>
                        <strong>{b.topic || '1-on-1 session'}</strong>
                      </div>
                    </div>
                    <div className="creator-session-time">
                      <span>
                        <Calendar size={16} aria-hidden="true" />
                        {b.date}{' '}
                        <span className="capitalize">({b.dayOfWeek})</span>
                      </span>
                      <span>
                        <Clock size={16} aria-hidden="true" />
                        {b.slotLabel || b.slot} <small>IST</small>
                      </span>
                    </div>
                  </div>
                  <div className="creator-session-meta">
                    <span
                      className={`creator-status creator-status-${b.status}`}
                    >
                      <CheckCircle size={13} aria-hidden="true" />
                      {b.status}
                    </span>
                    <div className="creator-fee">
                      <DollarSign size={16} aria-hidden="true" />
                      <div>
                        <span>Fee</span>
                        <strong>${b.price ?? 0}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="creator-session-actions">
                    {b.status === 'confirmed' && b.meetingType === 'video' && (
                      <JoinCallButton booking={b} onJoinCall={onJoinCall} />
                    )}
                    <button
                      className="creator-chat-button"
                      onClick={() =>
                        onOpenChat?.(
                          { id: b.influencerId, name: b.influencerName },
                          'influencer',
                        )
                      }
                    >
                      <MessageSquare size={17} aria-hidden="true" />
                      Chat with Influencer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!loadingBookings && (
            <Pagination pagination={bookingPagination} label="bookings" />
          )}
          <p className="creator-session-note">
            <Info size={18} aria-hidden="true" />
            You can join the meeting at the scheduled time or chat with the
            influencer for any updates.
          </p>
        </div>
      )}
    </div>
  );
}
