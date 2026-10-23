import useBookings from '../hooks/useBookings';
import CertificatePanel from './influencer/CertificatePanel';
import InfluencerBookings from './influencer/InfluencerBookings';
import AvailabilityPanel from './influencer/AvailabilityPanel';
import { navigate } from '../authRoutes';
import { usePagination } from './Pagination';
import './creator-dashboard.css';
import { normalizeAvailability, dayRanges } from '../../../shared/availability';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import VerifiedBadge from './VerifiedBadge';
import {
  Calendar,
  Clock,
  FileCheck,
  Users,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

export default function InfluencerPanel({ onOpenChat, onJoinCall }) {
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'bookings' | 'certificate' | 'profile'
  useEffect(() => {
    const showBookings = () => {
      return setActiveTab('bookings');
    };
    window.addEventListener('meetfame-show-bookings', showBookings);
    return () => {
      return window.removeEventListener('meetfame-show-bookings', showBookings);
    };
  }, []);
  const [availability, setAvailability] = useState(() => {
    return normalizeAvailability(
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
    );
  });

  const [activeDay, setActiveDay] = useState('monday');
  const [generatedSlots, setGeneratedSlots] = useState({});
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
    if (!user?.id) {
      return;
    }

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

  const {
    bookings,
    loading: loadingBookings,
    error: bookingsError,
  } = useBookings(user?.id, 'influencer', activeTab === 'bookings');

  // Handle slot range modifications
  const handleAddRange = (day) => {
    setAvailability((prev) => {
      return {
        ...prev,
        [day]: {
          ranges: [...dayRanges(prev[day]), { start: '14:00', end: '17:00' }],
        },
      };
    });
  };

  const handleRemoveRange = (day, idx) => {
    setAvailability((prev) => {
      return {
        ...prev,
        [day]: {
          ranges: dayRanges(prev[day]).filter((_, i) => {
            return i !== idx;
          }),
        },
      };
    });
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
      setTimeout(() => {
        return setSaveSuccess('');
      }, 4000);
    } catch (err) {
      console.error('Error saving slots:', err);
    } finally {
      setSavingSlots(false);
    }
  };

  // Certificate Upload
  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certTitle && !certFile) {
      return;
    }

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
        'Certificate submitted! Your credentials will be reviewed for your Instagram-style blue verified badge.',
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
  const totalSlotsCount = Object.values(generatedSlots).reduce((sum, list) => {
    return sum + (list?.length || 0);
  }, 0);
  const totalEarnings = bookings.reduce((sum, b) => {
    return sum + (b.price || 0);
  }, 0);

  const bookingPagination = usePagination(bookings);

  return (
    <div className="creator-dashboard max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="creator-sticky-overview">
        {/* Influencer Profile Top Card */}
        <div className="creator-summary p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

          <div className="creator-summary-content flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={user?.name}
                  className="creator-avatar w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-purple/50 shadow-md"
                />
              </div>

              <div>
                <div className="creator-name flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-white">
                    {user?.name}
                  </h1>
                  {user?.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                      <VerifiedBadge size="md" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                      Standard Profile
                    </span>
                  )}
                </div>

                <p className="text-brand-purple text-sm font-semibold mt-0.5">
                  {user?.specialization || 'Content Influencer & Consultant'}
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
                      ${user?.hourlyRate ?? 150} / hr
                    </strong>
                  </span>
                  <span>•</span>
                  <span
                    className={`creator-status creator-status-${user?.status}`}
                  >
                    <CheckCircle size={14} aria-hidden="true" />
                    {user?.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="creator-metrics flex items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  <Calendar size={20} aria-hidden="true" /> Weekly Slots
                </span>
                <div className="text-2xl font-semibold text-white mt-0.5">
                  {totalSlotsCount}
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  <Users size={20} aria-hidden="true" /> Bookings
                </span>
                <div className="text-2xl font-semibold text-brand-purple mt-0.5">
                  {bookings.length}
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[100px]">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  <DollarSign size={20} aria-hidden="true" /> Revenue
                </span>
                <div className="text-2xl font-semibold text-emerald-400 mt-0.5">
                  ${totalEarnings}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div
          className="creator-tabs flex items-center gap-2 overflow-x-auto"
          role="tablist"
          aria-label="Influencer dashboard sections"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'slots'}
            onClick={() => {
              return setActiveTab('slots');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'slots'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Manage Slots & Availability</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'bookings'}
            onClick={() => {
              return setActiveTab('bookings');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings ({bookings.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'certificate'}
            onClick={() => {
              return setActiveTab('certificate');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
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
          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={() => {
              return navigate('/profile');
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white whitespace-nowrap"
          >
            My Profile
          </button>
        </div>
      </div>

      {/* TAB 1: SLOTS & AVAILABILITY MANAGER */}
      {activeTab === 'slots' && (
        <AvailabilityPanel
          days={days}
          availability={availability}
          generatedSlots={generatedSlots}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          savingSlots={savingSlots}
          saveSuccess={saveSuccess}
          handleSaveAvailability={handleSaveAvailability}
          handleAddRange={handleAddRange}
          handleRemoveRange={handleRemoveRange}
          handleRangeChange={handleRangeChange}
        />
      )}

      {/* TAB 2: BOOKED SESSIONS */}
      {activeTab === 'bookings' && (
        <InfluencerBookings
          bookings={bookings}
          bookingsError={bookingsError}
          loadingBookings={loadingBookings}
          bookingPagination={bookingPagination}
          onJoinCall={onJoinCall}
          onOpenChat={onOpenChat}
        />
      )}

      {/* TAB 3: VERIFICATION & CERTIFICATE */}
      {activeTab === 'certificate' && (
        <CertificatePanel
          user={user}
          certTitle={certTitle}
          setCertTitle={setCertTitle}
          certFile={certFile}
          setCertFile={setCertFile}
          certUploading={certUploading}
          certMessage={certMessage}
          handleCertificateUpload={handleCertificateUpload}
        />
      )}
    </div>
  );
}
