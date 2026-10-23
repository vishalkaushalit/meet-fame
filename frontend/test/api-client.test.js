import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createApiClient } from '../../shared/apiClient.js';

test('reads current tokens, preserves explicit auth, and returns response data', async () => {
  let token = 'first';
  const client = createApiClient(axios, {
    baseURL: 'https://example.test/api',
    getToken: () => {
      return token;
    },
  });
  const headers = [];
  client.defaults.adapter = async (config) => {
    headers.push(config.headers.get('Authorization'));
    return { data: { ok: true }, status: 200, headers: {}, config };
  };
  assert.deepEqual(await client.get('/me'), { ok: true });
  token = 'second';
  await client.get('/me');
  await client.post('/login', {}, { authenticated: false });
  await client.post(
    '/leave',
    {},
    { headers: { Authorization: 'Bearer session-token' } },
  );
  assert.deepEqual(headers, [
    'Bearer first',
    'Bearer second',
    undefined,
    'Bearer session-token',
  ]);
});
test('preserves account-status and validation details while keeping HTTP errors usable', async () => {
  const client = createApiClient(axios, {
    getToken: () => {
      return null;
    },
  });
  client.defaults.adapter = async () => {
    throw {
      response: {
        status: 403,
        data: {
          error: 'Under review',
          status: 'pending_review',
          fields: { email: 'Invalid' },
        },
      },
    };
  };
  await assert.rejects(client.get('/me'), (error) => {
    return (
      error.message === 'Under review' &&
      error.status === 'pending_review' &&
      error.fields.email === 'Invalid'
    );
  });
  client.defaults.adapter = async () => {
    throw { response: { status: 409, data: { error: 'Call unavailable' } } };
  };
  await assert.rejects(client.post('/calls'), (error) => {
    return error.status === 409 && error.message === 'Call unavailable';
  });
});

test('Axios preserves keepalive and explicit session tokens for unload requests', async () => {
  let request;
  const client = createApiClient(axios, {
    baseURL: 'https://example.test/api',
    getToken: () => {
      return 'current-token';
    },
  });
  const result = await client.post(
    '/calls/booking/leave',
    { sessionId: 'session' },
    {
      adapter: 'fetch',
      fetchOptions: { keepalive: true },
      headers: { Authorization: 'Bearer leave-token' },
      env: {
        fetch: async (value) => {
          request = value;
          return new Response(JSON.stringify({ left: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
      },
    },
  );
  assert.equal(request.keepalive, true);
  assert.equal(request.headers.get('authorization'), 'Bearer leave-token');
  assert.deepEqual(JSON.parse(await request.text()), { sessionId: 'session' });
  assert.deepEqual(result, { left: true });
});

test('multipart payloads remain FormData rather than becoming JSON', async () => {
  const client = createApiClient(axios, {
    getToken: () => {
      return 'token';
    },
  });
  const payload = new FormData();
  payload.append('certificateFile', new Blob(['certificate']), 'proof.pdf');
  client.defaults.adapter = async (config) => {
    assert.equal(config.data, payload);
    assert.notEqual(config.headers.getContentType(), 'application/json');
    return { data: { uploaded: true }, status: 200, headers: {}, config };
  };
  assert.deepEqual(await client.post('/certificate', payload), {
    uploaded: true,
  });
});
