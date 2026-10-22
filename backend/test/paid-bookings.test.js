import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import routes from '../src/routes/booking.routes.js';

test('both My Bookings views return only paid sessions without deleting records', () => {
  const original = db.read;
  const data = { bookings: [
    { id: 'paid', userId: 'u1', influencerId: 'i1', paymentStatus: 'paid', date: '2026-10-25' },
    { id: 'pending', userId: 'u1', influencerId: 'i1', paymentStatus: 'pending', date: '2026-10-25' },
    { id: 'legacy', userId: 'u1', influencerId: 'i1', date: '2026-10-25' },
    { id: 'other', userId: 'u2', influencerId: 'i2', paymentStatus: 'paid', date: '2026-10-25' },
  ] };
  db.read = () => structuredClone(data);
  const handler = routes.stack.find((layer) => layer.route?.path === '/my-bookings').route.stack.at(-1).handle;
  try {
    for (const query of [{ userId: 'u1' }, { influencerId: 'i1' }]) {
      const res = { json(body) { this.body = body; return this; } };
      handler({ query }, res);
      assert.deepEqual(res.body.bookings.map((booking) => booking.id), ['paid']);
    }
    assert.equal(data.bookings.length, 4);
  } finally { db.read = original; }
});
