import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabaseMiddleware } from '../src/databaseContext.js';
import { db } from '../src/db.js';

const invoke = (store, route) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
        return this;
      },
    };
    createDatabaseMiddleware(store)({}, res, () => route(res));
  });
test('confirmation is withheld until durable changes have committed', async () => {
  let committed = false;
  const store = {
    load: async () => ({ state: { bookings: [], influencers: [] } }),
    commit: async (snapshot, state) => {
      assert.equal(snapshot.state.bookings.length, 0);
      assert.equal(state.bookings.length, 1);
      await Promise.resolve();
      committed = true;
    },
  };
  const result = await invoke(store, (res) => {
    const data = db.read();
    data.bookings.push({ id: 'test' });
    assert.equal(db.write(data), true);
    res.json({ success: true });
  });
  assert.equal(committed, true);
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});
test('failed durable writes return an error instead of a false booking confirmation', async () => {
  for (const [code, status] of [
    ['CONNECTION_ERROR', 503],
    ['WRITE_CONFLICT', 409],
    [11000, 409],
  ]) {
    const result = await invoke(
      {
        load: async () => ({ state: { bookings: [], influencers: [] } }),
        commit: async () => {
          throw Object.assign(new Error('test'), { code });
        },
      },
      (res) => {
        db.write({ bookings: [{ id: 'test' }], influencers: [] });
        res.status(201).json({ success: true });
      },
    );
    assert.equal(result.status, status);
    assert.equal(result.body.success, undefined);
    assert.ok(result.body.error);
  }
});
test('request snapshots are isolated and database outages do not fall back to seed bookings', async () => {
  const makeStore = (id) => ({
    load: async () => ({ state: { bookings: [{ id }], influencers: [] } }),
    commit: async () => {},
  });
  const results = await Promise.all(
    ['one', 'two'].map((id) =>
      invoke(makeStore(id), (res) =>
        res.json({ id: db.read().bookings[0].id }),
      ),
    ),
  );
  assert.deepEqual(
    results.map((result) => result.body.id),
    ['one', 'two'],
  );
  const unavailable = await invoke(
    {
      load: async () => {
        throw new Error('offline');
      },
    },
    () => assert.fail('Routes must not run without durable storage'),
  );
  assert.equal(unavailable.status, 503);
});
