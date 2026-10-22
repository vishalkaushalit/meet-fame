import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordTransaction, backfillTransactions, visibleTransactions } from '../src/transactions.js';
import { Transaction } from '../src/models/Transaction.js';
import routes from '../src/routes/booking.routes.js';
import { db } from '../src/db.js';

test('ledger updates one order and preserves payment and refund references', async () => {
  const data = {};
  recordTransaction(data, { orderId: 'o1', userId: 'u1', influencerId: 'i1', amount: 20000, currency: 'INR', status: 'pending' });
  const created = data.transactions[0].createdAt;
  recordTransaction(data, { orderId: 'o1', paymentId: 'p1', bookingId: 'b1', status: 'paid' });
  recordTransaction(data, { orderId: 'o1', refundId: 'r1', status: 'refund_pending' });
  assert.equal(data.transactions.length, 1);
  assert.equal(data.transactions[0].createdAt, created);
  assert.equal(data.transactions[0].paymentId, 'p1');
  assert.equal(data.transactions[0].amount, 20000);
  await new Transaction(data.transactions[0]).validate();
});
test('backfill includes verified legacy payments once and never invents refunds', () => {
  const data = { bookings: [
    { id: 'b1', userId: 'u1', influencerId: 'i1', paymentId: 'p1', paymentOrderId: 'o1', paymentStatus: 'paid', paymentAmount: 12500, price: 150, currency: 'INR', status: 'cancelled', createdAt: '2026-10-20T10:00:00Z' },
    { id: 'b2', price: 100, status: 'confirmed' },
  ] };
  assert.equal(backfillTransactions(data), true);
  assert.equal(backfillTransactions(data), false);
  assert.equal(data.transactions.length, 1);
  assert.equal(data.transactions[0].amount, 1250000);
  assert.equal(data.transactions[0].status, 'paid');
  assert.equal(data.transactions[0].createdAt, data.bookings[0].createdAt);
});
test('user history cannot expose another customer while admin can see all', () => {
  const data = { transactions: [{ id: 't1', userId: 'u1' }, { id: 't2', userId: 'u2' }] };
  assert.deepEqual(visibleTransactions(data, { role: 'user', id: 'u1' }).map((t) => t.id), ['t1']);
  assert.equal(visibleTransactions(data, { role: 'admin', id: 'a' }).length, 2);
  assert.equal(visibleTransactions(data, { role: 'influencer', id: 'u1' }), null);
});
test('billing endpoint uses session ownership even when query asks for another user', () => {
  const original = db.read;
  db.read = () => ({ bookings: [], transactions: [{ id: 't1', userId: 'u1' }, { id: 't2', userId: 'u2' }] });
  const handler = routes.stack.find((layer) => layer.route?.path === '/transactions').route.stack.at(-1).handle;
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  try {
    handler({ session: { role: 'user', id: 'u1' }, query: { userId: 'u2' } }, res);
    assert.deepEqual(res.body.transactions.map((t) => t.id), ['t1']);
    handler({ session: { role: 'influencer', id: 'i1' } }, res);
    assert.equal(res.code, 403);
  } finally { db.read = original; }
});

test('historical INR payments gain a USD reporting amount while retaining original charge', () => {
  const data = {
    bookings: [{ id: 'b1', userId: 'u1', paymentOrderId: 'o1', price: 250 }],
    transactions: [
      { orderId: 'o1', userId: 'u1', amount: 2361750, currency: 'INR', status: 'paid' },
      { orderId: 'o2', userId: 'u1', amount: 5000, currency: 'USD', status: 'paid' },
      { orderId: 'o3', userId: 'u1', amount: 10000, currency: 'INR', status: 'pending' },
    ],
  };
  assert.equal(backfillTransactions(data), true);
  assert.equal(data.transactions[0].usdAmount, 25000);
  assert.equal(data.transactions[0].amount, 2361750);
  assert.equal(data.transactions[0].currency, 'INR');
  assert.equal(data.transactions[1].usdAmount, 5000);
  assert.equal(data.transactions[2].usdAmount, undefined);
  assert.equal(backfillTransactions(data), false);
});
