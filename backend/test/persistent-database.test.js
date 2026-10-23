import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDatabaseMiddleware } from '../src/databaseContext.js';
import { db } from '../src/db.js';

const invoke = (store, route) => {
  return new Promise((resolve) => {
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
    createDatabaseMiddleware(store)({}, res, () => {
      return route(res);
    });
  });
};
test('confirmation is withheld until durable changes have committed', async () => {
  let committed = false;
  const store = {
    load: async () => {
      return { state: { bookings: [], influencers: [] } };
    },
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
        load: async () => {
          return { state: { bookings: [], influencers: [] } };
        },
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
  const makeStore = (id) => {
    return {
      load: async () => {
        return { state: { bookings: [{ id }], influencers: [] } };
      },
      commit: async () => {},
    };
  };
  const results = await Promise.all(
    ['one', 'two'].map((id) => {
      return invoke(makeStore(id), (res) => {
        return res.json({ id: db.read().bookings[0].id });
      });
    }),
  );
  assert.deepEqual(
    results.map((result) => {
      return result.body.id;
    }),
    ['one', 'two'],
  );
  const unavailable = await invoke(
    {
      load: async () => {
        throw new Error('offline');
      },
    },
    () => {
      return assert.fail('Routes must not run without durable storage');
    },
  );
  assert.equal(unavailable.status, 503);
});

test('refund ledger can explicitly commit alongside a booking conflict response', async () => {
  let committed = false;
  const request = {};
  const result = await new Promise((resolve) => {
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
    createDatabaseMiddleware({
      load: async () => {
        return { state: { transactions: [], influencers: [] } };
      },
      commit: async (_, state) => {
        assert.equal(state.transactions[0].status, 'refund_pending');
        committed = true;
      },
    })(request, res, () => {
      db.write({
        transactions: [{ id: 't1', status: 'refund_pending' }],
        influencers: [],
      });
      request.persistDatabaseOnError = true;
      res.status(409).json({ error: 'Slot unavailable; refund requested.' });
    });
  });
  assert.equal(result.status, 409);
  assert.equal(committed, true);
});
