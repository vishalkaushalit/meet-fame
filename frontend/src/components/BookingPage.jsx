import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import BookingModal from './BookingModal';
import LogoLoader from './LogoLoader';

export default function BookingPage({ influencerId, onClose, onLogin }) {
  const { user } = useAuth();
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await api.influencers.getAll();
        const selected = (result.influencers || []).find(
          (item) => encodeURIComponent(item.id) === influencerId,
        );
        if (active) {
          setInfluencer(selected);
          if (!selected) setError('This influencer is no longer available.');
        }
      } catch {
        if (active) setError('Unable to load this booking page. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [influencerId]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button type="button" onClick={onClose} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to portal
      </button>
      <h1 className="text-3xl font-semibold text-white">Book a slot</h1>
      {loading ? <LogoLoader label="Loading booking…" /> : error ? (
        <p role="alert" className="mt-6 text-rose-400">{error}</p>
      ) : !user ? (
        <button type="button" onClick={onLogin} className="mt-6 px-6 py-3 rounded-xl bg-brand-purple text-white">Log in to book a slot</button>
      ) : (
        <BookingModal
          key={influencerId}
          page
          isOpen
          influencer={influencer}
          onClose={onClose}
          onBookingSuccess={() => window.dispatchEvent(new Event('meetfame-bookings-updated'))}
        />
      )}
    </section>
  );
}
