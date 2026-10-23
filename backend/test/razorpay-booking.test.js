import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import routes from '../src/routes/booking.routes.js';
const handler = routes.stack.find((layer) => {
    return layer.route?.path === '/' && layer.route.methods.post;
  }).route.stack.at(-1).handle;
test('booking rejects missing proof and refuses authorized but uncaptured payments', async () => {
  const original = {
    read: db.read,
    write: db.write,
    fetch: globalThis.fetch,
    key: process.env.RAZORPAY_KEY_ID,
    secret: process.env.RAZORPAY_KEY_SECRET,
  };
  process.env.RAZORPAY_KEY_ID = 'test';
  process.env.RAZORPAY_KEY_SECRET = 'secret';
  const data = {
    users: [{ id: 'u', name: 'User' }],
    influencers: [
      {
        id: 'i',
        name: 'Creator',
        hourlyRate: 10,
        availability: { monday: [{ start: '09:00', end: '11:00' }] },
      },
    ],
    bookings: [],
    messages: [],
  };
  db.read = () => {
    return data;
  };
  db.write = () => {
    return assert.fail('Unpaid bookings must never persist');
  };
  const req = {
    session: { role: 'user', id: 'u' },
    body: {
      userId: 'u',
      influencerId: 'i',
      date: '2099-01-05',
      slot: '09:00 - 10:00',
    },
  };
  const response = () => {
    return {
      code: 200,
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
  };
  try {
    const missing = response();
    await handler(req, missing);
    assert.equal(missing.code, 400);
    const { createHmac } = await import('node:crypto');
    req.body.payment = {
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_456',
      razorpay_signature: createHmac('sha256', 'secret').update('order_123|pay_456').digest('hex'),
    };
    globalThis.fetch = async (url) => {
      return {
        ok: true,
        json: async () => {
          return url.includes('/orders/')
            ? {
                id: 'order_123',
                amount: 1000,
                currency: 'USD',
                notes: {
                  userId: 'u',
                  influencerId: 'i',
                  date: req.body.date,
                  slot: req.body.slot,
                },
              }
            : {
                id: 'pay_456',
                order_id: 'order_123',
                amount: 1000,
                currency: 'USD',
                status: 'authorized',
              };
        },
      };
    };
    const unpaid = response();
    await handler(req, unpaid);
    assert.equal(unpaid.code, 409);
    assert.match(unpaid.body.error, /not captured/);
  } finally {
    db.read = original.read;
    db.write = original.write;
    globalThis.fetch = original.fetch;
    for (const [name, value] of [
      ['RAZORPAY_KEY_ID', original.key],
      ['RAZORPAY_KEY_SECRET', original.secret],
    ]) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

test('captured checkout saves a paid ledger row with the booking and retries do not duplicate it', async () => {
  const original = {
    read: db.read,
    write: db.write,
    fetch: globalThis.fetch,
    key: process.env.RAZORPAY_KEY_ID,
    secret: process.env.RAZORPAY_KEY_SECRET,
  };
  process.env.RAZORPAY_KEY_ID = 'test';
  process.env.RAZORPAY_KEY_SECRET = 'secret';
  let data = {
    users: [{ id: 'u', name: 'User' }],
    influencers: [
      {
        id: 'i',
        name: 'Creator',
        hourlyRate: 10,
        availability: { monday: [{ start: '09:00', end: '11:00' }] },
      },
    ],
    bookings: [],
    messages: [],
  };
  db.read = () => {
    return data;
  };
  db.write = (state) => {
    data = state;
    return true;
  };
  const { createHmac } = await import('node:crypto');
  const body = {
    userId: 'u',
    influencerId: 'i',
    date: '2099-01-05',
    slot: '09:00 - 10:00',
    payment: {
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_456',
      razorpay_signature: createHmac('sha256', 'secret').update('order_123|pay_456').digest('hex'),
    },
  };
  globalThis.fetch = async (url) => {
    return {
      ok: true,
      json: async () => {
        return url.includes('/orders/')
          ? {
              id: 'order_123',
              amount: 1000,
              currency: 'USD',
              notes: {
                userId: 'u',
                influencerId: 'i',
                date: body.date,
                slot: body.slot,
              },
            }
          : {
              id: 'pay_456',
              order_id: 'order_123',
              amount: 1000,
              currency: 'USD',
              status: 'captured',
            };
      },
    };
  };
  const response = () => {
    return {
      code: 200,
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
  };
  try {
    const res = response();
    await handler({ session: { role: 'user', id: 'u' }, body }, res);
    assert.equal(res.code, 201);
    assert.equal(data.transactions.length, 1);
    assert.equal(data.transactions[0].bookingId, res.body.booking.id);
    assert.equal(data.transactions[0].paymentId, 'pay_456');
    assert.equal(data.transactions[0].amount, 1000);
    assert.equal(data.transactions[0].status, 'paid');
    await handler({ session: { role: 'user', id: 'u' }, body }, response());
    assert.equal(data.transactions.length, 1);
    assert.equal(data.bookings.length, 1);
  } finally {
    db.read = original.read;
    db.write = original.write;
    globalThis.fetch = original.fetch;
    for (const [name, value] of [
      ['RAZORPAY_KEY_ID', original.key],
      ['RAZORPAY_KEY_SECRET', original.secret],
    ]) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});
