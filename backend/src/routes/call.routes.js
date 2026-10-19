import express from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireSession } from '../middleware/session.js';
import { mutateRoom } from '../callRooms.js';
const router = express.Router();
router.use(requireSession);
router.use('/:bookingId', (req, res, next) => {
  const booking = db.read().bookings.find(item => item.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  const allowed = req.session.role === 'user' && booking.userId === req.session.id || req.session.role === 'influencer' && booking.influencerId === req.session.id;
  if (!allowed) return res.status(403).json({ error: 'Only the booked participants may join this call.' });
  if (booking.status !== 'confirmed' || booking.meetingType !== 'video') return res.status(409).json({ error: 'Calls require a confirmed video booking.' });
  next();
});
const peerRole = role => role === 'user' ? 'influencer' : 'user';
const active = member => member && Date.now() - member.seen < 45000;
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (error) { res.status(error.status || 503).json({ error: error.message }); } };
const fail = (message, status = 409) => { throw Object.assign(new Error(message), { status }); };
const member = (state, req) => {
  const self = state.members[req.session.role];
  if (!self || self.id !== req.body.sessionId) fail('This call session ended or was opened in another tab.');
  self.seen = Date.now();
  return self;
};
router.post('/:bookingId/join', wrap(async (req, res) => {
  const sessionId = randomUUID();
  await mutateRoom(req.params.bookingId, state => {
    const existing = state.members[req.session.role];
    if (active(existing)) fail('You already have an active call for this booking. Leave it first or wait 45 seconds.');
    state.members[req.session.role] = { id: sessionId, seen: Date.now() };
    state.signals = [];
  });
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) iceServers.push({ urls: process.env.TURN_URL.split(',').map(url => url.trim()), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  res.json({ sessionId, iceServers });
}));
router.post('/:bookingId/poll', wrap(async (req, res) => {
  const result = await mutateRoom(req.params.bookingId, state => {
    const self = member(state, req);
    const peer = state.members[peerRole(req.session.role)];
    return { peerId: active(peer) ? peer.id : null, signals: state.signals.filter(signal => signal.to === self.id && signal.sequence > (Number(req.body.after) || 0)), sequence: state.sequence };
  });
  res.set('Cache-Control', 'no-store').json(result);
}));
router.post('/:bookingId/signal', wrap(async (req, res) => {
  const { type, payload, to } = req.body;
  if (!['offer','answer','candidate'].includes(type) || !payload || JSON.stringify(payload).length > 100000) return res.status(400).json({ error: 'Invalid call signal.' });
  if (type === 'offer' && req.session.role !== 'user' || type === 'answer' && req.session.role !== 'influencer') return res.status(400).json({ error: 'Invalid negotiation role.' });
  await mutateRoom(req.params.bookingId, state => {
    const self = member(state, req), peer = state.members[peerRole(req.session.role)];
    if (!active(peer) || peer.id !== to) fail('The other participant has left.');
    state.signals.push({ sequence: ++state.sequence, from: self.id, to, type, payload });
    state.signals = state.signals.slice(-300);
  });
  res.json({ success: true });
}));
router.post('/:bookingId/leave', wrap(async (req, res) => {
  await mutateRoom(req.params.bookingId, state => {
    if (state.members[req.session.role]?.id === req.body.sessionId) delete state.members[req.session.role];
  });
  res.json({ success: true });
}));
export default router;
