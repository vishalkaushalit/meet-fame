// Existing MeetFame schedules use India time; never use the server/browser timezone.
export const BOOKING_TIME_ZONE_LABEL = 'IST';
export function bookingWindow(booking) {
  const match = /^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/.exec(booking.slot || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date || '') || !match) return null;
  const [, sh, sm, eh, em] = match.map((value, index) => index ? Number(value) : value);
  if (sh > 23 || sm > 59 || eh > 24 || em > 59 || eh === 24 && em !== 0) return null;
  const midnight = Date.parse(`${booking.date}T00:00:00+05:30`);
  if (!Number.isFinite(midnight) || new Date(midnight + 19800000).toISOString().slice(0,10) !== booking.date) return null;
  const start = midnight + (sh * 60 + sm) * 60000;
  const end = midnight + (eh * 60 + em) * 60000;
  return end > start ? { start, end } : null;
}
export function callAvailability(booking, now = Date.now()) {
  const window = bookingWindow(booking);
  if (!window) return { allowed: false, label: 'Schedule unavailable' };
  if (now < window.start) return { allowed: false, label: 'Not started' };
  if (now >= window.end) return { allowed: false, label: 'Session ended' };
  return { allowed: true, label: 'Join call' };
}
