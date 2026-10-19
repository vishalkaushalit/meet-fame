import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import bookings from '../src/routes/booking.routes.js';
const response = () => ({
  code: 200,
  status(code) {
    this.code = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
const handler = (path, method) =>
  bookings.stack
    .find((layer) => layer.route?.path === path && layer.route.methods[method])
    .route.stack.at(-1).handle;
test('all slots are shown with past slots marked using IST and rejected on booking', () => {
  const read = db.read,
    write = db.write,
    now = Date.now;
  Date.now = () => Date.parse('2026-10-19T12:30:00+05:30');
  const data = {
    influencers: [
      {
        id: 'i1',
        name: 'Creator',
        availability: { monday: [{ start: '11:00', end: '15:00' }] },
      },
    ],
    users: [{ id: 'u1', name: 'Client' }],
    bookings: [],
    messages: [],
  };
  db.read = () => data;
  db.write = () => assert.fail('Invalid bookings must not write data');
  try {
    const res = response();
    handler('/slots', 'get')(
      { query: { influencerId: 'i1', date: '2026-10-19' } },
      res,
    );
    assert.deepEqual(
      res.body.slots.map((slot) => slot.slot),
      ['11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00'],
    );
    assert.deepEqual(
      res.body.slots.map((slot) => slot.isPast),
      [true, true, false, false],
    );
    assert.equal(res.body.availableSlotsCount, 2);
    assert.equal(res.body.serverNow, Date.now());
    const create = (slot) => {
      const result = response();
      handler('/', 'post')(
        {
          session: { id: 'u1', role: 'user' },
          body: { userId: 'u1', influencerId: 'i1', date: '2026-10-19', slot },
        },
        result,
      );
      return result;
    };
    assert.equal(create('12:00 - 13:00').code, 409);
    assert.equal(create('17:00 - 18:00').code, 400);
    Date.now = () => Date.parse('2026-10-19T13:00:00+05:30');
    assert.equal(create('13:00 - 14:00').code, 409);
  } finally {
    db.read = read;
    db.write = write;
    Date.now = now;
  }
});
