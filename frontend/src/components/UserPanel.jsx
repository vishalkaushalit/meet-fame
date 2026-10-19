import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
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
  Video
} from 'lucide-react';

export default function UserPanel({ onBookInfluencer, onOpenChat, onJoinCall }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-bookings'
  const [influencers, setInfluencers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const categories = [
    'All',
    'Technology & AI',
    'Health & Fitness',
    'Fashion & Lifestyle',
    'Business & Finance'
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

  // Fetch user's bookings
  useEffect(() => {
    if (!user?.id) return;
    async function loadBookings() {
      setLoadingBookings(true);
      try {
        const res = await api.bookings.getMyBookings({ userId: user.id });
        setMyBookings(res.bookings || []);
      } catch (err) {
        console.error('Failed to load user bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    }

    loadBookings();
  }, [user?.id, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* User Welcome Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-indigo/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Hello, {user?.name || 'Explorer'}</h1>
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Influencer Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading verified influencers...</div>
          ) : influencers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
              <p className="text-sm font-semibold">No influencers found matching your criteria.</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting another category or clearing search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers.map((inf) => (
                <div
                  key={inf.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-brand-purple/40 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group"
                >
                  <div>
                    {/* Header: Avatar, Name, Verified Badge, Category */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={inf.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
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
                          <h3 className="font-bold text-white text-base truncate">{inf.name}</h3>
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

                    {/* Rate & Slots metadata */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">1-Hour Session</span>
                        <span className="font-black text-emerald-400 text-sm">${inf.hourlyRate || 150}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Availability</span>
                        <span className="font-semibold text-slate-300 text-xs">{inf.totalWeeklySlots || 12} slots/week</span>
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
                      <span>Book 1-Hour Slot</span>
                    </button>

                    <button
                      onClick={() => onOpenChat(inf, 'influencer')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                      title="Chat with Influencer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my-bookings' && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-purple" />
                <span>My Booked Consultations</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Your upcoming and confirmed 1-hour sessions with influencers.
              </p>
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading bookings...</div>
          ) : myBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              You haven't booked any sessions yet. Browse creators to schedule your first 1-hour slot!
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 md:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{b.influencerName}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-1">
                        Topic: <span className="text-white">{b.topic}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Date: <strong className="text-white">{b.date}</strong> ({b.dayOfWeek})</span>
                        <span>•</span>
                        <span>Time Slot: <strong className="text-brand-purple font-mono">{b.slotLabel || b.slot}</strong></span>
                        <span>•</span>
                        <span>Type: <strong className="text-indigo-400 uppercase">{b.meetingType}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {b.status === 'confirmed' && b.meetingType === 'video' && <button onClick={() => onJoinCall(b)} className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold flex items-center gap-2"><Video size={15} />Join call</button>}
                    <button
                      onClick={() => onOpenChat && onOpenChat({ id: b.influencerId, name: b.influencerName }, 'influencer')}
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with {b.influencerName}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
