import React, { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { callAvailability } from '../../../shared/bookingTime';
export default function JoinCallButton({ booking, onJoinCall }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const availability = callAvailability(booking, now);
  return (
    <button
      disabled={!availability.allowed}
      title={`${booking.date}, ${booking.slotLabel || booking.slot} IST`}
      onClick={() => {
        if (callAvailability(booking).allowed) onJoinCall(booking);
      }}
      className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Video size={15} />
      {availability.label}
      <span className="text-[10px] opacity-75">IST</span>
    </button>
  );
}
