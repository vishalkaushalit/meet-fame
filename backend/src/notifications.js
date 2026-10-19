import { randomUUID } from 'node:crypto';

export function addNotification(data, recipientId, recipientRole, title, message, bookingId = null) {
  data.notifications ||= [];
  data.notifications.push({ id: randomUUID(), recipientId, recipientRole, title, message, bookingId, createdAt: new Date().toISOString(), readAt: null });
}

export function notifyBooking(data, booking, title) {
  const summary = `${booking.date}, ${booking.slotLabel || booking.slot}. ${booking.topic}. Status: ${booking.status}.`;
  addNotification(data, booking.userId, 'user', title, `Session with ${booking.influencerName}: ${summary}`, booking.id);
  addNotification(data, booking.influencerId, 'influencer', title, `Session with ${booking.userName}: ${summary}`, booking.id);
}
