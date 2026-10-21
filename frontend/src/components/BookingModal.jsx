import IntroVideo from './IntroVideo';
import LogoLoader from './LogoLoader';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { bookingWindow } from '../../../shared/bookingTime';
import VerifiedBadge from './VerifiedBadge';
import {
  X,
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export default function BookingModal({
  influencer,
  isOpen,
  onClose,
  onBookingSuccess,
}) {
  const { user } = useAuth();

  const dateInput = useRef(null);
  const indiaDate = (days = 0) =>
    new Date(Date.now() + 19800000 + days * 86400000)
      .toISOString()
      .slice(0, 10);
  const [date, setDate] = useState(() => indiaDate(1));
  const weekday = date
    ? new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-IN', {
        weekday: 'long',
        timeZone: 'Asia/Kolkata',
      })
    : '';
  const openDatePicker = () => {
    const input = dateInput.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === 'function') input.showPicker();
      else input.focus();
    } catch {
      input.focus();
    }
  };

  const [slotsData, setSlotsData] = useState(null);
  const [clock, setClock] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);
  const serverTime = clock
    ? clock.serverNow + (performance.now() - clock.receivedAt)
    : Date.now();
  const visibleSlots = (slotsData?.slots || []).map((slot) => {
    const window = bookingWindow({ date, slot: slot.slot });
    return { ...slot, isPast: !window || window.start <= serverTime };
  });

  const [selectedSlot, setSelectedSlot] = useState('');
  const [topic, setTopic] = useState('1-on-1 Strategy & Mentorship Session');
  const [meetingType, setMeetingType] = useState('video');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch slots whenever influencer or date changes
  useEffect(() => {
    if (!influencer?.id || !date || !isOpen) return;

    let active = true;
    async function loadSlots() {
      setLoadingSlots(true);
      setSlotsData(null);
      setSelectedSlot('');
      setError('');
      try {
        const res = await api.bookings.getSlots(influencer.id, date);
        if (!active) return;
        setClock({
          serverNow: res.serverNow || Date.now(),
          receivedAt: performance.now(),
        });
        setSlotsData(res);
        // Find first available slot
        const firstAvailable = res.slots?.find((s) => !s.isBooked && !s.isPast);
        setSelectedSlot(firstAvailable ? firstAvailable.slot : '');
      } catch (err) {
        if (!active) return;
        console.error('Error fetching slots:', err);
        setError('Failed to load slots for this date');
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      active = false;
    };
  }, [influencer?.id, date, isOpen]);

  useEffect(() => {
    if (!slotsData || !selectedSlot) return;
    if (
      !visibleSlots.some(
        (slot) => slot.slot === selectedSlot && !slot.isBooked && !slot.isPast,
      )
    )
      setSelectedSlot('');
  }, [tick, slotsData, selectedSlot, date]);

  if (!isOpen || !influencer) return null;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in as a user to book an appointment.');
      return;
    }
    if (
      !selectedSlot ||
      !visibleSlots.some(
        (slot) => slot.slot === selectedSlot && !slot.isBooked && !slot.isPast,
      )
    ) {
      setError('Please select an available 1-hour time slot.');
      return;
    }

    setSubmitting(true);
    setError('');

    const chosen = slotsData?.slots?.find((s) => s.slot === selectedSlot);

    try {
      await api.bookings.create({
        influencerId: influencer.id,
        userId: user.id,
        date,
        slot: selectedSlot,
        slotLabel: chosen?.label || selectedSlot,
        topic,
        meetingType,
      });

      setSuccess(true);
      if (onBookingSuccess) onBookingSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.error || err.message || 'Failed to book slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Influencer Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <img
            src={
              influencer.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
            alt={influencer.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-purple/40 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">
                {influencer.name}
              </h3>
              {influencer.isVerified && <VerifiedBadge size="md" />}
            </div>
            <p className="text-brand-purple text-xs font-semibold">
              {influencer.specialization}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 font-medium">
                {influencer.category}
              </span>
              <span className="text-xs font-bold text-emerald-400">
                ${influencer.hourlyRate || 150} / 1-Hour Slot
              </span>
            </div>
          </div>
        </div>

        <IntroVideo influencer={influencer} />
        {success ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">
              Slot Booked Successfully!
            </h4>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Your 1-hour session with {influencer.name} on {date} at{' '}
              {selectedSlot} has been confirmed. A message thread has been
              opened in your chat.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBook} className="mt-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label
                htmlFor="booking-date"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-coral" />
                  Select Date
                </span>
                {weekday && (
                  <span className="text-brand-purple text-xs font-semibold capitalize">
                    {weekday}
                  </span>
                )}
              </label>
              <div className="booking-date-picker">
                <input
                  ref={dateInput}
                  id="booking-date"
                  type="date"
                  required
                  value={date}
                  min={indiaDate()}
                  onClick={openDatePicker}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlotsData(null);
                    setSelectedSlot('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-4 pr-14 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  aria-label="Open booking date picker"
                  title="Choose date"
                  onClick={openDatePicker}
                >
                  <Calendar size={19} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* 1-Hour Slots Dropdown (Per Prompt Requirement) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-purple" />
                  Select 1-Hour Slot
                </span>
                <span className="text-[11px] text-slate-400">
                  {slotsData
                    ? `${visibleSlots.filter((slot) => !slot.isBooked && !slot.isPast).length} of ${visibleSlots.length} available · IST`
                    : ''}
                </span>
              </label>

              {loadingSlots ? (
                <LogoLoader
                  variant="inline"
                  label="Checking auto-generated slots & availability..."
                />
              ) : slotsData && visibleSlots.length === 0 ? (
                <div className="p-4 text-center text-xs text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  No slots are configured for this date. Please pick another
                  date.
                </div>
              ) : (
                <>
                  {/* The Dropdown with Booked Slots Disabled (as specified in prompt) */}
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-purple mb-3"
                  >
                    <option value="" disabled>
                      -- Select a 1-Hour Time Slot --
                    </option>
                    {visibleSlots.map((slotItem) => (
                      <option
                        key={slotItem.slot}
                        value={slotItem.slot}
                        disabled={slotItem.isBooked || slotItem.isPast}
                        className={
                          slotItem.isBooked || slotItem.isPast
                            ? 'bg-slate-900 text-slate-500 line-through'
                            : 'bg-slate-900 text-white'
                        }
                      >
                        {slotItem.label}{' '}
                        {slotItem.isBooked
                          ? '— [Already Booked]'
                          : slotItem.isPast
                            ? '— [Past]'
                            : '— [Available]'}
                      </option>
                    ))}
                  </select>

                  {/* Interactive Visual Slots Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {visibleSlots.map((s) => {
                      const isSelected = selectedSlot === s.slot;
                      return (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={s.isBooked || s.isPast}
                          onClick={() => setSelectedSlot(s.slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            s.isBooked || s.isPast
                              ? 'bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed line-through'
                              : isSelected
                                ? 'bg-gradient-to-r from-brand-indigo to-brand-purple border-brand-purple text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:border-brand-purple/60 hover:text-white'
                          }`}
                        >
                          <div className="font-mono">{s.slot}</div>
                          <div
                            className={`text-[10px] mt-0.5 ${s.isBooked ? 'text-rose-500/80' : isSelected ? 'text-white/90' : 'text-slate-400'}`}
                          >
                            {s.isBooked
                              ? 'Booked'
                              : s.isPast
                                ? 'Past'
                                : 'Available'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Meeting Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingType('video')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    meetingType === 'video'
                      ? 'bg-brand-indigo/20 border-brand-indigo text-brand-indigo'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>1-on-1 Video Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType('in-person')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    meetingType === 'in-person'
                      ? 'bg-brand-coral/20 border-brand-coral text-brand-coral'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>In-Person Meeting</span>
                </button>
              </div>
            </div>

            {/* Consultation Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Session Objective / Topic
              </label>
              <textarea
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss or seek advice on..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple"
              />
            </div>

            {/* Summary & Submit */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">
                  Total Investment:
                </span>
                <div className="text-xl font-black text-white">
                  ${influencer.hourlyRate || 150}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    / 1 hour
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSlot || loadingSlots}
                className="py-3 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-indigo via-brand-purple to-brand-coral hover:opacity-95 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <span>Confirming...</span>
                ) : (
                  'Confirm & Book Slot'
                )}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
