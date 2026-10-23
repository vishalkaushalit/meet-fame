import useBookings from '../hooks/useBookings';
import useDebouncedValue from '../hooks/useDebouncedValue';
import UserBookings from './user/UserBookings';
import InfluencerDirectory from './user/InfluencerDirectory';
import FilterSelect from '../../../shared/FilterSelect';
import BillingView from '../../../shared/BillingView';
import { usePagination } from './Pagination';
import './creator-dashboard.css';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Search, Calendar, Sparkles, DollarSign } from 'lucide-react';

export default function UserPanel({
  onBookInfluencer,
  onOpenChat,
  onJoinCall,
}) {
  const { user } = useAuth();
  const [billingHeaderTarget, setBillingHeaderTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-bookings'
  useEffect(() => {
    const showBookings = () => {
      return setActiveTab('my-bookings');
    };
    window.addEventListener('meetfame-show-bookings', showBookings);
    return () => {
      return window.removeEventListener('meetfame-show-bookings', showBookings);
    };
  }, []);
  const [influencers, setInfluencers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All',
    'Technology & AI',
    'Health & Fitness',
    'Fashion & Lifestyle',
    'Business & Finance',
  ];

  // Ignore stale responses when the category or search changes.
  useEffect(() => {
    let active = true;
    async function loadInfluencers() {
      setLoading(true);
      try {
        const res = await api.influencers.getAll(
          selectedCategory,
          debouncedSearchQuery,
        );
        if (active) {
          setInfluencers(res.influencers || []);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to fetch influencers:', err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadInfluencers();
    return () => {
      active = false;
    };
  }, [selectedCategory, debouncedSearchQuery]);

  // Refresh after a successful booking and while the bookings view is open.
  const {
    bookings: myBookings,
    loading: loadingBookings,
    error: bookingsError,
  } = useBookings(user?.id, 'user', activeTab === 'my-bookings');

  const bookingPagination = usePagination(myBookings);
  const creatorPagination = usePagination(
    influencers,
    `${selectedCategory}:${searchQuery}`,
    12,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="user-sticky-overview">
        {/* User Welcome Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex min-w-0 items-center gap-4 relative z-10">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
              }
              alt={user?.name}
              className="w-16 h-16 shrink-0 rounded-2xl object-cover ring-2 ring-brand-indigo/40"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold leading-snug tracking-tight text-white break-words">
                  Hello, {user?.name || 'Explorer'}
                </h1>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  User
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mt-1">
                Connect 1-on-1 with verified influencers, executives, and
                mentors.
              </p>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 relative z-10">
            <button
              data-app-tab="true"
              data-active={activeTab === 'browse'}
              onClick={() => {
                return setActiveTab('browse');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Discover Influencers</span>
            </button>

            <button
              data-app-tab="true"
              data-active={activeTab === 'my-bookings'}
              onClick={() => {
                return setActiveTab('my-bookings');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'my-bookings'
                  ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Bookings ({myBookings.length})</span>
            </button>
            <button
              data-app-tab="true"
              data-active={activeTab === 'billing'}
              onClick={() => {
                return setActiveTab('billing');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === 'billing' ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Billing</span>
            </button>
          </div>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Sparkles
                    className="w-5 h-5 text-brand-purple"
                    aria-hidden="true"
                  />
                  <span>Discover Influencers</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Find experts and book a session with your favorite
                  influencers.
                </p>
              </div>
              <div className="flex w-full lg:w-auto flex-col sm:flex-row items-center gap-3 lg:ml-auto">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    aria-label="Search influencers"
                    value={searchQuery}
                    onChange={(e) => {
                      return setSearchQuery(e.target.value);
                    }}
                    placeholder="Search by name, expertise, or keyword..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Category Filter */}
                <FilterSelect
                  label="Filter by category"
                  value={selectedCategory}
                  onChange={(event) => {
                    return setSelectedCategory(event.target.value);
                  }}
                >
                  {categories.map((category) => {
                    return (
                      <option key={category} value={category}>
                        {category === 'All' ? 'All categories' : category}
                      </option>
                    );
                  })}
                </FilterSelect>
              </div>
            </div>
          </>
        )}
        {activeTab === 'my-bookings' && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-purple" />
                <span>My Bookings</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Manage your sessions and connect with your influencers.
              </p>
            </div>
          </div>
        )}
        {activeTab === 'billing' && (
          <div className="billing-view" ref={setBillingHeaderTarget} />
        )}
      </div>

      {activeTab === 'billing' && (
        <BillingView
          key={user.id}
          headerTarget={billingHeaderTarget}
          showRefresh={false}
          showSummary={false}
          loadTransactions={api.billing.getTransactions}
        />
      )}

      {/* TAB 1: BROWSE INFLUENCERS */}
      {activeTab === 'browse' && (
        <InfluencerDirectory
          loading={loading}
          influencers={influencers}
          creatorPagination={creatorPagination}
          onBookInfluencer={onBookInfluencer}
        />
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my-bookings' && (
        <UserBookings
          bookingsError={bookingsError}
          loadingBookings={loadingBookings}
          myBookings={myBookings}
          bookingPagination={bookingPagination}
          onJoinCall={onJoinCall}
          onOpenChat={onOpenChat}
        />
      )}
    </div>
  );
}
