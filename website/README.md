# DuoDesk website

Plain HTML/CSS/JS with modern Netlify Request/Response functions. Deploy only from this folder; publish `public`, with functions outside it. Git builds are skipped by `build.ignore`; the primary agent owns explicit manual deployments.

Run `npm ci`, `npm test`, then `npm run build`. Tests inject fake GitHub responses and fake SQL functions. They never access the real database or require secrets.

Functions:

- `/api/release-status`: public stable GitHub version/platform availability.
- `/api/download?os=win|mac|linux|android`: verified GitHub release-asset redirect. Optional `arch=arm64` for Windows. macOS is Apple silicon; Linux is x64 AppImage. Missing release/asset returns 503 without a fabricated link.
- `/api/view`: same-origin POST with normalised OS only.
- `/api/analytics`: password-authenticated read of daily aggregate counts. `/admin.html` is the public login shell; analytics data stays private. Password is sent in an HTTPS Authorization header, not a URL or browser storage.

Runtime configuration is `ADMIN_PASSWORD`, `DATABASE_URL` and `ANALYTICS_ENABLED=true`, with Functions scope. Secret values are entered by the user through the hosting environment-variable UI, not put into chat or source files. Tests inject fakes and do not read production secret values. Configuration presence is not proof of live analytics; verify a known event and the protected dashboard after deployment.

Deployment handoff: the primary agent reports that the first site version is deployed and that the user-approved Neon schema was created with its columns verified in project `patient-darkness-71096266`. This implementation worker did not execute remote SQL or perform deployment. `schema.sql` remains the reviewable schema definition; no build or application startup applies it automatically. Further schema changes require their own scoped approval. Missing analytics configuration disables counting and returns a clear private-dashboard error, while downloads continue to work.

Download counting is best effort and never blocks a valid installer redirect indefinitely. Netlify's `context.waitUntil` runs one bounded count attempt after the 302; without that context the fallback waits at most 250 ms. Database requests have a fresh 2 s deadline. An aborted write can have an unknown outcome, so the code never retries it. Counts can be lower than actual redirects when storage is unavailable or slow.

Only verified stable release metadata is cached for 120 s in a warm function; concurrent requests share one fetch. Errors, malformed metadata and untrusted asset URLs are not cached, and expired metadata is not served after a failed refresh. Successful public release-status responses have 30 s browser/120 s CDN caching. This reduces anonymous GitHub API usage; separate cold instances can still consume additional requests. Downloads always return `no-store` so cached redirects do not suppress counts. Release visibility can lag the new upstream release by the cache TTL.

Only Melbourne calendar day, event kind, normalised OS and aggregate count are stored. No cookies, IPs, persistent visitor IDs, referrers or full user agents are retained by this analytics code. Counts are events, not unique visitors or completed installs. Public request counts can include bots. Hosting providers may retain operational logs separately. Browser privacy signals skip the page-view request and download counting.

`public/images/duodesk-mock-window.jpg` is an inspected, populated desktop test-window capture, copied byte-for-byte from the root harness output. The page labels it as an actual app-window capture with mock device data, not a physical cross-device test. A fallback message appears if the image is unavailable.

Sources used for implementation: Netlify Functions coding context, and https://neon.com/docs/serverless/serverless-driver. No website deploy or database execution is performed by the implementation worker.

Saj has chosen to leave analytics disabled for now. No runtime database URL or dashboard password is configured; the approved schema remains available for later activation.
