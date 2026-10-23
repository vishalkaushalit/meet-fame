import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runWatchdog } from '../../scripts/mongo-watchdog.mjs';

const env = {
  MEETFAME_URL: 'https://example.vercel.app',
  VERCEL_DEPLOY_HOOK_URL:
    'https://api.vercel.com/v1/integrations/deploy/test/secret',
};
const health = (issue) => {
  return {
    ok: !issue,
    status: issue ? 503 : 200,
    json: async () => {
      return {
        app: 'MeetFame API',
        status: issue ? 'degraded' : 'healthy',
        mongoConnected: !issue,
        database: { configured: true, issue },
      };
    },
  };
};
const defaults = { env, pause: async () => {}, log: () => {} };

test('healthy backend never triggers deployment', async () => {
  let calls = 0;
  assert.equal(
    await runWatchdog({
      ...defaults,
      request: async () => {
        calls++;
        return health();
      },
    }),
    'healthy',
  );
  assert.equal(calls, 1);
});

test('three confirmed connection failures trigger exactly one deployment', async () => {
  const calls = [];
  assert.equal(
    await runWatchdog({
      ...defaults,
      request: async (url, options) => {
        calls.push({ url: String(url), method: options.method });
        return options.method === 'POST'
          ? { ok: true }
          : health('network_unreachable');
      },
    }),
    'deployment_requested',
  );
  assert.equal(calls.length, 4);
  assert.equal(
    calls.filter((call) => {
      return call.method === 'POST';
    }).length,
    1,
  );
});

test('authentication failures and HTTP outages never trigger deployment', async () => {
  for (const issue of [
    'authentication_failed',
    'missing_configuration',
    'http_outage',
  ]) {
    let posts = 0;
    await assert.rejects(
      runWatchdog({
        ...defaults,
        request: async (url, options) => {
          if (options.method === 'POST') {
            posts++;
          }
          if (issue === 'http_outage') {
            throw new Error('offline');
          }
          return health(issue);
        },
      }),
    );
    assert.equal(posts, 0);
  }
});

test('transient failure followed by recovery does not deploy', async () => {
  let calls = 0;
  assert.equal(
    await runWatchdog({
      ...defaults,
      request: async () => {
        return health(++calls === 1 ? 'network_unreachable' : undefined);
      },
    }),
    'healthy',
  );
  assert.equal(calls, 2);
});
