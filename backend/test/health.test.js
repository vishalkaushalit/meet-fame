import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHealthHandler } from '../src/health.js';
const response = () => {
  return {
    code: 200,
    set() {
      return this;
    },
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
test('health waits for the connection instead of reporting a cold start as disconnected', async () => {
  let state = 'connecting',
    release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  const manager = {
    status: () => {
      return { configured: true, state, issue: null };
    },
    connect: async () => {
      await ready;
      state = 'connected';
    },
  };
  const res = response(),
    pending = createHealthHandler(manager, {})({}, res);
  assert.equal(res.body, undefined);
  release();
  await pending;
  assert.equal(res.code, 200);
  assert.equal(res.body.mongoConnected, true);
  assert.equal(res.body.database.state, 'connected');
});
test('failed connection reports a degraded health response and safe failure category', async () => {
  const manager = {
    status: () => {
      return {
        configured: true,
        state: 'disconnected',
        issue: 'authentication_failed',
      };
    },
    connect: async () => {
      throw new Error('hidden details');
    },
  };
  const res = response();
  await createHealthHandler(manager, {})({}, res);
  assert.equal(res.code, 503);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.database.issue, 'authentication_failed');
  assert.ok(!JSON.stringify(res.body).includes('hidden details'));
});
