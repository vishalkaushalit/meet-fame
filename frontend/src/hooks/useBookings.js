import { useEffect, useState } from 'react';
import { api } from '../api';

// Both dashboards use the same refresh events and booking polling policy.
export default function useBookings(accountId, role, polling) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accountId) return;
    let active = true;
    let pending = false;
    let refreshQueued = false;

    const load = async (showLoading = false) => {
      // Focus and booking events can arrive together; share the pending refresh.
      if (pending) {
        refreshQueued = true;
        return;
      }
      pending = true;
      if (showLoading) setLoading(true);
      try {
        const key = role === 'influencer' ? 'influencerId' : 'userId';
        const result = await api.bookings.getMyBookings({ [key]: accountId });
        if (active) {
          setBookings(result.bookings || []);
          setError('');
        }
      } catch {
        if (active) setError('Unable to load bookings. Please try again.');
      } finally {
        pending = false;
        if (active && showLoading) setLoading(false);
        if (active && refreshQueued) {
          refreshQueued = false;
          load();
        }
      }
    };

    const refresh = () => load();
    load(true);
    window.addEventListener('meetfame-bookings-updated', refresh);
    window.addEventListener('focus', refresh);
    const timer = polling ? setInterval(refresh, 15000) : null;

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('meetfame-bookings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [accountId, role, polling]);

  return { bookings, loading, error };
}
