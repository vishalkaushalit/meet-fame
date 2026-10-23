import React from 'react';
import { Clock } from 'lucide-react';
import Pagination from '../Pagination';
import LogoLoader from '../LogoLoader';
import IntroVideo from '../IntroVideo';
import VerifiedBadge from '../VerifiedBadge';

export default function InfluencerDirectory({
  loading,
  influencers,
  creatorPagination,
  onBookInfluencer,
}) {
  return (
    <div>
      {/* Influencer Grid */}
      {loading ? (
        <LogoLoader variant="inline" label="Loading verified influencers..." />
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
          {creatorPagination.items.map((inf) => {
            return (
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
                        <div className="verified-avatar-overlay absolute -bottom-1 -right-1 bg-slate-900 rounded-full">
                          <VerifiedBadge size="sm" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-white text-base truncate">
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
                      <span className="font-semibold text-emerald-400 text-sm">
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
                    onClick={() => {
                      return onBookInfluencer(inf);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Book Slot</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && (
        <Pagination pagination={creatorPagination} label="influencers" />
      )}
    </div>
  );
}
