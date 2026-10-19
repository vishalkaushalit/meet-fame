import LogoLoader from './LogoLoader';
import { normalizeAvailability, dayRanges } from '../../../shared/availability';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import JoinCallButton from './JoinCallButton';
import {
  Video,
  Calendar,
  Clock,
  Upload,
  FileCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Users,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Save,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function InfluencerPanel({ onOpenChat, onJoinCall }) {
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'bookings' | 'certificate' | 'profile'
  useEffect(() => {
    const showBookings = () => setActiveTab('bookings');
    window.addEventListener('meetfame-show-bookings', showBookings);
    return () =>
      window.removeEventListener('meetfame-show-bookings', showBookings);
  }, []);
  const [availability, setAvailability] = useState(() =>
    normalizeAvailability(
      user?.availability || {
        monday: [
          { start: '09:00', end: '12:00' },
          { start: '17:00', end: '20:00' },
        ],
        tuesday: [{ start: '10:00', end: '14:00' }],
        wednesday: [{ start: '09:00', end: '12:00' }],
        thursday: [{ start: '11:00', end: '15:00' }],
        friday: [{ start: '09:00', end: '13:00' }],
        saturday: [{ start: '10:00', end: '12:00' }],
        sunday: [],
      },
    ),
  );

  const [activeDay, setActiveDay] = useState('monday');
  const [generatedSlots, setGeneratedSlots] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savingSlots, setSavingSlots] = useState(false);

  // Certificate upload
  const [certTitle, setCertTitle] = useState(user?.certification?.title || '');
  const [certFile, setCertFile] = useState(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certMessage, setCertMessage] = useState('');

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  // Fetch full details and bookings
  useEffect(() => {
    if (!user?.id) return;

    async function loadData() {
      try {
        const infData = await api.influencers.getById(user.id);
        if (infData.influencer?.availability) {
          setAvailability(
            normalizeAvailability(infData.influencer.availability),
          );
        }
        if (infData.generatedSlotsByDay) {
          setGeneratedSlots(infData.generatedSlotsByDay);
        }
      } catch (err) {
        console.error('Failed to load influencer data:', err);
      }
    }

    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const load = async (showLoading = false) => {
      if (showLoading) setLoadingBookings(true);
      try {
        const result = await api.bookings.getMyBookings({
          influencerId: user.id,
        });
        if (active) {
          setBookings(result.bookings || []);
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
    const timer = activeTab === 'bookings' ? setInterval(refresh, 15000) : null;
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('meetfame-bookings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.id, activeTab]);

  // Handle slot range modifications
  const handleAddRange = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ranges: [...dayRanges(prev[day]), { start: '14:00', end: '17:00' }],
      },
    }));
  };

  const handleRemoveRange = (day, idx) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ranges: dayRanges(prev[day]).filter((_, i) => i !== idx) },
    }));
  };

  const handleRangeChange = (day, idx, field, val) => {
    setAvailability((prev) => {
      const dayList = [...dayRanges(prev[day])];
      dayList[idx] = { ...dayList[idx], [field]: val };
      return { ...prev, [day]: { ranges: dayList } };
    });
  };

  // Save availability to backend and recalculate 1-hour slots
  const handleSaveAvailability = async () => {
    setSavingSlots(true);
    setSaveSuccess('');
    try {
      const res = await api.influencers.updateAvailability(
        user.id,
        availability,
      );
      setGeneratedSlots(res.generatedSlotsByDay);
      updateUserProfile({ availability: res.availability });
      setSaveSuccess(
        'Availability updated! 1-hour slots re-generated successfully.',
      );
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving slots:', err);
    } finally {
      setSavingSlots(false);
    }
  };

  // Certificate Upload
  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certTitle && !certFile) return;

    setCertUploading(true);
    setCertMessage('');
    try {
      const formData = new FormData();
      formData.append('title', certTitle);
      if (certFile) {
        formData.append('certificateFile', certFile);
      }

      const res = await api.influencers.uploadCertificate(user.id, formData);
      setCertMessage(
        'Certificate submitted! Admin will review to award your Instagram-style blue verified badge.',
      );
      updateUserProfile({
        certification: res.certification,
        certificateStatus: 'pending',
      });
      setCertFile(null);
    } catch (err) {
      console.error('Failed to upload certificate:', err);
      setCertMessage('Failed to upload certificate');
    } finally {
      setCertUploading(false);
    }
  };

  // Stats calculation
  const totalSlotsCount = Object.values(generatedSlots).reduce(
    (sum, list) => sum + (list?.length || 0),
    0,
  );
  const totalEarnings = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Influencer Profile Top Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                }
                alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-purple/50 shadow-md"
              />
              {user?.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-slate-900 p-0.5 rounded-full">
                  <VerifiedBadge size="md" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user?.name}</h1>
                {user?.isVerified ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    <VerifiedBadge size="sm" />
                    <span>Verified Creator</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                    Standard Profile
                  </span>
                )}
              </div>

              <p className="text-brand-purple text-sm font-semibold mt-0.5">
                {user?.specialization || 'Content Creator & Consultant'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span>
                  Category:{' '}
                  <strong className="text-white">{user?.category}</strong>
                </span>
                <span>•</span>
                <span>
                  Rate:{' '}
                  <strong className="text-emerald-400">
                    ${user?.hourlyRate || 150} / hr
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Status:{' '}
                  <strong className="text-emerald-400 uppercase">
                    {user?.status}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Weekly Slots
              </span>
              <div className="text-2xl font-black text-white mt-0.5">
                {totalSlotsCount}
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Bookings
              </span>
              <div className="text-2xl font-black text-brand-purple mt-0.5">
                {bookings.length}
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Revenue
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                ${totalEarnings}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'slots'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Manage Slots & Availability</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booked Sessions ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificate')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'certificate'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Verification & Certificate</span>
            {user?.isVerified ? (
              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                Verified
              </span>
            ) : user?.certificateStatus === 'pending' ? (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                Pending
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* TAB 1: SLOTS & AVAILABILITY MANAGER */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-purple" />
                  <span>Day-Wise Availability & 1-Hour Slot Generator</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Example: Enter Monday from 9am to 12pm & 5pm to 8pm — MeetFame
                  will autogenerate 1-hour bookable slots (9-10, 10-11, 11-12,
                  5-6, 6-7, 7-8).
                </p>
              </div>

              <button
                onClick={handleSaveAvailability}
                disabled={savingSlots}
                className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 shadow-md flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingSlots ? (
                    <LogoLoader variant="button" label="Saving…" />
                  ) : (
                    'Save Availability & Generate Slots'
                  )}
                </span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* Day Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
              {days.map((d) => {
                const count = dayRanges(availability[d]).length || 0;
                const slotCount = generatedSlots[d]?.length || 0;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDay(d)}
                    className={`px-4 py-3 rounded-2xl font-bold capitalize text-xs transition-all whitespace-nowrap border text-left min-w-[120px] ${
                      activeDay === d
                        ? 'bg-slate-800 border-brand-purple text-white shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{d}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}
                      >
                        {count} windows
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-1">
                      {slotCount} slots generated
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Window Editor for Active Day */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Time Ranges for</span>
                  <span className="text-brand-purple capitalize">
                    {activeDay}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddRange(activeDay)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-coral" />
                  <span>Add Time Window</span>
                </button>
              </div>

              {dayRanges(availability[activeDay]).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  You are marked unavailable on {activeDay}s. Click "Add Time
                  Window" to open booking slots.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayRanges(availability[activeDay]).map((range, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          Available from:
                        </span>
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) =>
                            handleRangeChange(
                              activeDay,
                              idx,
                              'start',
                              e.target.value,
                            )
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">until:</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) =>
                            handleRangeChange(
                              activeDay,
                              idx,
                              'end',
                              e.target.value,
                            )
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRange(activeDay, idx)}
                        className="ml-auto text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated 1-Hour Slots Showcase */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Preview: Auto-Generated 1-Hour Slots for {activeDay}
                </span>
                <span className="text-xs text-indigo-400 font-bold">
                  {generatedSlots[activeDay]?.length || 0} Total 1-Hour Slots
                </span>
              </div>

              {generatedSlots[activeDay]?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {generatedSlots[activeDay]?.map((s) => (
                    <div
                      key={s.slotId}
                      className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-medium flex items-center gap-2 shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5 text-brand-purple" />
                      <span>
                        {s.label} ({s.slotId})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No slots currently generated. Add time windows above and save
                  to create slots.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKED SESSIONS */}
      {activeTab === 'bookings' && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-purple" />
                <span>Client Appointments & Booked Slots</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                View confirmed 1-hour sessions booked by users.
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
            <LogoLoader variant="inline" label="Loading appointments..." />
          ) : bookingsError &&
            bookings.length === 0 ? null : bookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No sessions booked yet. Once clients book your slots, they will
              appear here!
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 md:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {b.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">
                          {b.userName}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          ({b.userEmail})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-1">
                        Topic: <span className="text-white">{b.topic}</span>
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>
                          Date: <strong className="text-white">{b.date}</strong>{' '}
                          ({b.dayOfWeek})
                        </span>
                        <span>•</span>
                        <span>
                          Time:{' '}
                          <strong className="text-brand-purple font-mono">
                            {b.slotLabel || b.slot}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Fee:{' '}
                          <strong className="text-emerald-400">
                            ${b.price}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {b.status === 'confirmed' && b.meetingType === 'video' && (
                      <JoinCallButton booking={b} onJoinCall={onJoinCall} />
                    )}
                    <button
                      onClick={() =>
                        onOpenChat &&
                        onOpenChat({ id: b.userId, name: b.userName }, 'user')
                      }
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with Client</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFICATION & CERTIFICATE */}
      {activeTab === 'certificate' && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0095F6] flex items-center justify-center border border-blue-500/30">
              <VerifiedBadge size="lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Instagram-Style Verified Badge
              </h3>
              <p className="text-slate-400 text-xs">
                Upload your specialization credentials. Upon admin approval, the
                blue badge is displayed next to your name platform-wide.
              </p>
            </div>
          </div>

          {/* Current Status Box */}
          <div
            className={`p-4 rounded-2xl mb-6 border ${
              user?.isVerified
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : user?.certificateStatus === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {user?.isVerified ? (
                  <CheckCircle className="w-5 h-5 text-[#0095F6]" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-sm">
                  {user?.isVerified
                    ? 'Verified Badge Active (Approved by Admin)'
                    : user?.certificateStatus === 'pending'
                      ? 'Certificate Under Admin Review'
                      : 'No Certificate Submitted Yet'}
                </span>
              </div>
              {user?.isVerified && <VerifiedBadge size="md" />}
            </div>

            {user?.certification?.title && (
              <div className="mt-2 text-xs text-slate-300">
                Submitted Credential:{' '}
                <strong>{user.certification.title}</strong>
              </div>
            )}
          </div>

          {/* Upload New / Update Certificate Form */}
          <form onSubmit={handleCertificateUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Certificate / Qualification Title
              </label>
              <input
                type="text"
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. Stanford AI Fellow, NASM Certified Master Trainer"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Attach Document / Certificate (PDF, PNG, JPG)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-brand-purple bg-slate-950 text-xs text-slate-400 hover:text-white transition-colors">
                  <Upload className="w-4 h-4 text-brand-purple" />
                  <span>
                    {certFile ? certFile.name : 'Select Certificate File'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setCertFile(e.target.files[0] || null)}
                  />
                </label>
                {certFile && (
                  <button
                    type="button"
                    onClick={() => setCertFile(null)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {certMessage && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
                {certMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={certUploading || (!certTitle && !certFile)}
              className="py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 shadow-md disabled:opacity-40 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>
                {certUploading ? (
                  <LogoLoader variant="button" label="Submitting…" />
                ) : (
                  'Submit Certificate for Verification'
                )}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
