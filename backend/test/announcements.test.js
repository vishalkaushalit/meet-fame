import { test } from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/routes/admin.routes.js';
import { db } from '../src/db.js';
import { notificationFeed } from '../src/notifications.js';
const invoke = (method, path, req = {}) => {
  const handler = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack[0].handle;
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  handler(req, res);
  return res;
};
test('announcements persist, respect activation/expiry, update notifications, and delete', () => {
  const read = db.read, write = db.write;
  const data = { admins: [], users: [{ id: 'u1', status: 'approved' }], influencers: [], bookings: [], notifications: [] };
  db.read = () => data; db.write = () => true;
  try {
    const body = { title: 'Demo', message: 'Message', audience: 'all', activeFrom: '2026-10-21T00:00:00Z', expiresAt: '2026-10-28T00:00:00Z' };
    assert.equal(invoke('post', '/announcements', { body: { ...body, expiresAt: body.activeFrom } }).code, 400);
    assert.equal(invoke('post', '/announcements', { body, adminId: 'a1' }).code, 201);
    const id = data.announcements[0].id;
    const createdAt = data.announcements[0].createdAt;
    assert.ok(data.announcements[0].updatedAt);
    assert.equal(invoke('post', '/announcements', { body: { ...body, activeFrom: '' } }).code, 400);
    const feed = time => notificationFeed(data, { id: 'u1', role: 'user' }, Date.parse(time)).notifications;
    assert.equal(feed('2026-10-20T00:00:00Z').length, 0);
    assert.equal(feed('2026-10-22T00:00:00Z').length, 1);
    assert.equal(feed('2026-10-29T00:00:00Z').length, 0);
    assert.equal(invoke('get', '/announcements').body.announcements.length, 1);
    assert.equal(invoke('get', '/announcements/:id', { params: { id } }).body.announcement.id, id);
    assert.equal(invoke('put', '/announcements/:id', { params: { id }, body: { ...body, title: 'Edited' } }).code, 200);
    assert.equal(data.notifications[0].title, 'Edited');
    assert.equal(data.announcements[0].createdAt, createdAt);
    assert.ok(data.announcements[0].updatedAt);
    assert.equal(invoke('delete', '/announcements/:id', { params: { id } }).code, 200);
    assert.equal(data.announcements.length, 0);
    assert.equal(data.notifications.length, 0);
    assert.equal(invoke('post', '/announcements', { body: { ...body, expiresAt: null } }).code, 201);
    assert.equal(data.announcements[0].expiresAt, null);
    assert.equal(feed('2027-01-01T00:00:00Z').length, 1);
  } finally { db.read = read; db.write = write; }
});

test('notification announcements respect audience, schedule, expiry and read state', () => {
  const now = Date.parse('2026-10-22T00:00:00Z');
  const data = { bookings: [], notifications: [], announcements: [
    { id: 'all', audience: 'all', title: 'Everyone', message: 'Hello', activeFrom: '2026-10-21T00:00:00Z' },
    { id: 'user', audience: 'user', title: 'Users', message: 'Hello', activeFrom: '2026-10-21T00:00:00Z' },
    { id: 'future', audience: 'all', title: 'Future', activeFrom: '2026-10-23T00:00:00Z' },
    { id: 'expired', audience: 'all', title: 'Expired', activeFrom: '2026-10-20T00:00:00Z', expiresAt: '2026-10-21T00:00:00Z' },
  ] };
  const user = { id: 'u1', role: 'user' };
  const feed = notificationFeed(data, user, now);
  assert.equal(feed.notifications.length, 2);
  assert.equal(notificationFeed(data, { id: 'i1', role: 'influencer' }, now).notifications.length, 1);
  data.notifications.push({ ...feed.notifications[0], readAt: new Date(now).toISOString() });
  assert.equal(notificationFeed(data, user, now).notifications.length, 2);
  assert.equal(notificationFeed(data, user, now).unreadCount, 1);
});
