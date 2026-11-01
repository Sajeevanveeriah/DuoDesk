import { latest, assetFor } from '../../lib/releases.mjs';
import { headers, json, osValues } from '../../lib/http.mjs';
import { countStore } from '../../lib/counts.mjs';
function bestEffort(work, timeoutMs) {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, timeoutMs);
    Promise.resolve().then(work).then(() => { clearTimeout(timer); resolve(); }, () => { clearTimeout(timer); resolve(); });
  });
}
export function createHandler({ fetcher = fetch, store = countStore(), countTimeoutMs = 2000 } = {}) {
  return async (req, context) => {
    if (req.method !== 'GET') return json({ error: 'Use GET' }, 405);
    const params = new URL(req.url).searchParams;
    const os = params.get('os');
    const arch = params.get('arch') || (os === 'mac' ? 'arm64' : 'x64');
    if (!osValues.has(os) || !['x64', 'arm64'].includes(arch)) return json({ error: 'Choose win, mac, linux or android and a supported architecture.' }, 400);
    try {
      const release = await latest(fetcher);
      const asset = assetFor(release, os, arch);
      if (!asset) return json({ error: 'A public installer for this system is not available yet.' }, 503);
      if (req.headers.get('dnt') !== '1' && req.headers.get('sec-gpc') !== '1') {
        // Netlify keeps the one bounded attempt alive after returning the redirect.
        // Without a host context, the fallback waits at most 250 ms. Never retry an unknown outcome.
        const background = typeof context?.waitUntil === 'function';
        const count = bestEffort(() => store.add('download', os), background ? countTimeoutMs : Math.min(250, countTimeoutMs));
        if (background) { try { context.waitUntil(count); } catch { /* A host scheduling error cannot break downloads. */ } }
        else await count;
      }
      return new Response(null, { status: 302, headers: { ...headers, Location: asset.browser_download_url } });
    } catch {
      return json({ error: 'DuoDesk has no available stable download right now. Please check back after the release build completes.' }, 503);
    }
  };
}
export default createHandler();
export const config = { path: '/api/download' };
