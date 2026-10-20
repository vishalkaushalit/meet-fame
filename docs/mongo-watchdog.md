# MongoDB connection watchdog

The GitHub Actions workflow checks the production Vercel `/api/health` endpoint
hourly, at minute 17. It reuses the application's connection instead of opening
another MongoDB client. Three confirmed database connection failures, 20 seconds
apart, trigger one Vercel deployment per run. Healthy checks do nothing.

## Activate

1. Push the workflow, script, and connection pool changes to the repository's
   default branch. Deploy the pool changes to Vercel.
2. The production origin defaults to `https://meet-fame.vercel.app` and the health
   endpoint is `https://meet-fame.vercel.app/api/health`. To change it, set the
   GitHub Actions repository variable `MEETFAME_URL`.
3. In the Vercel project → Settings → Git → Deploy Hooks, create a hook for the
   production branch. Store its URL as the GitHub Actions secret
   `VERCEL_DEPLOY_HOOK_URL`. Anyone holding that URL can trigger deployments.
4. If deployment protection covers production, add the Vercel automation bypass
   secret as the GitHub Actions secret `VERCEL_AUTOMATION_BYPASS_SECRET`.
5. Run **MongoDB connection watchdog** manually from GitHub's Actions tab to
   verify configuration. Enable workflow failure notifications in GitHub.

The workflow does not read Atlas connection counts or react directly to Atlas
alert emails. It detects loss of database connectivity. Missing configuration,
authentication failures, unreachable HTTP endpoints, and unexpected responses
fail the run without triggering a deployment. A successful hook request means
deployment was requested, not that service recovered. Check Vercel deployment
status and the next health check.

Redeploying is a recovery attempt, not a guarantee that existing Vercel instances
or other applications release their connections. The shared pool and idle socket
cleanup reduce connection usage; persistent exhaustion needs Atlas metrics and
an inventory of applications using the cluster. GitHub schedules can be delayed
and consume Actions minutes. Disable the workflow in Actions to stop it.
