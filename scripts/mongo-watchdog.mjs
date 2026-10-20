import { pathToFileURL } from 'node:url';

export async function runWatchdog({
  env = process.env,
  request = fetch,
  pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
} = {}) {
  if (!env.MEETFAME_URL) throw new Error('Set the MEETFAME_URL repository variable.');
  const base = new URL(env.MEETFAME_URL);
  if (base.protocol !== 'https:') throw new Error('MEETFAME_URL must use HTTPS.');
  const endpoint = new URL('/api/health', base);
  const headers = env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? { 'x-vercel-protection-bypass': env.VERCEL_AUTOMATION_BYPASS_SECRET }
    : {};
  let databaseFailures = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await pause(20000);
    try {
      const response = await request(endpoint, {
        headers, redirect: 'error', signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (body.app !== 'MeetFame API') {
        log('Health endpoint did not return the MeetFame API response.');
        continue;
      }
      if (response.ok && body.status === 'healthy' && body.mongoConnected === true) {
        log('MongoDB health check passed.');
        return 'healthy';
      }
      // Do not redeploy for wrong URLs, authentication, or missing credentials.
      if (response.status === 503 && body.mongoConnected === false &&
          body.database?.configured === true &&
          ['network_unreachable', 'connection_failed'].includes(body.database?.issue)) {
        databaseFailures++;
      }
      log('Backend health check failed.');
    } catch {
      log('Unable to read backend health; no database diagnosis available.');
    }
  }
  if (databaseFailures !== 3) {
    throw new Error('Health checks failed without three confirmed MongoDB connection failures. No deployment triggered.');
  }
  if (!env.VERCEL_DEPLOY_HOOK_URL) {
    throw new Error('MongoDB connection failed repeatedly. Set VERCEL_DEPLOY_HOOK_URL to enable recovery.');
  }
  const hook = new URL(env.VERCEL_DEPLOY_HOOK_URL);
  if (hook.protocol !== 'https:' || hook.hostname !== 'api.vercel.com' ||
      !hook.pathname.startsWith('/v1/integrations/deploy/')) {
    throw new Error('Invalid Vercel Deploy Hook URL.');
  }
  const recovery = await request(hook, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  if (!recovery.ok) throw new Error('Vercel rejected the recovery deployment.');
  log('Recovery deployment requested. Recovery is not yet verified; check Vercel and the next scheduled run.');
  return 'deployment_requested';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWatchdog().catch((error) => {
    // Never log fetch errors or hook URLs: deploy hooks contain credentials.
    console.error(error instanceof TypeError ? 'Invalid watchdog configuration or request failure.' : error.message);
    process.exitCode = 1;
  });
}
