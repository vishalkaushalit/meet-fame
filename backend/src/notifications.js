import { randomUUID } from 'node:crypto';
import { bookingWindow } from '../../shared/bookingTime.js';

export function notifyNewBooking(data, booking) {
  data.notifications ||= [];
  const key = `booking:${booking.id}`;
  if (data.notifications.some((item) => item.key === key)) return;
  data.notifications.push({
    id: randomUUID(),
    key,
    kind: 'booking',
    recipientId: booking.influencerId,
    recipientRole: 'influencer',
    bookingId: booking.id,
    title: 'New session booked',
    message: `${booking.userName} booked ${booking.date}, ${booking.slotLabel || booking.slot} IST. Topic: ${booking.topic}.`,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

export function ensureMeetingReminders(data, now = Date.now()) {
  data.notifications ||= [];
  let changed = false;
  for (const booking of data.bookings) {
    const window = bookingWindow(booking);
    if (booking.status !== 'confirmed' || !window || now >= window.end)
      continue;
    for (const [role, id, name] of [
      ['user', booking.userId, booking.influencerName],
      ['influencer', booking.influencerId, booking.userName],
    ]) {
      const key = `reminder:${booking.id}:${window.start}:${role}`;
      if (data.notifications.some((item) => item.key === key)) continue;
      data.notifications.push({
        id: randomUUID(),
        key,
        kind: 'reminder',
        recipientId: id,
        recipientRole: role,
        bookingId: booking.id,
        title: 'Session reminder',
        message: `Your session with ${name} starts at ${booking.slotLabel || booking.slot} IST on ${booking.date}.`,
        createdAt: new Date(window.start - 15 * 60000).toISOString(),
        startsAt: window.start,
        dueAt: window.start - 15 * 60000,
        expiresAt: window.end,
        readAt: null,
      });
      changed = true;
    }
  }
  return changed;
}

export function notificationFeed(data, session, now = Date.now()) {
  const own = (data.notifications || []).filter(
    (item) =>
      item.recipientId === session.id &&
      item.recipientRole === session.role &&
      ['booking', 'reminder', 'update'].includes(item.kind),
  );
  const valid = own.filter((item) => {
    if (item.kind !== 'reminder') return true;
    const booking = data.bookings.find(
      (booking) => booking.id === item.bookingId,
    );
    return (
      booking?.status === 'confirmed' &&
      bookingWindow(booking)?.start === item.startsAt &&
      now < item.expiresAt
    );
  });
  const visible = valid
    .filter((item) => !item.dueAt || item.dueAt <= now)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const nextDueAt = Math.min(
    ...valid.filter((item) => item.dueAt > now).map((item) => item.dueAt),
  );
  return {
    notifications: visible,
    unreadCount: visible.filter((item) => !item.readAt).length,
    serverNow: now,
    nextDueAt: Number.isFinite(nextDueAt) ? nextDueAt : null,
  };
}

// Retain the existing announcement and availability-update producers.
export function addNotification(
  data,
  recipientId,
  recipientRole,
  title,
  message,
  bookingId = null,
) {
  data.notifications ||= [];
  const notification = {
    id: randomUUID(),
    kind: 'update',
    recipientId,
    recipientRole,
    title,
    message,
    bookingId,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  data.notifications.push(notification);
  return notification;
}
