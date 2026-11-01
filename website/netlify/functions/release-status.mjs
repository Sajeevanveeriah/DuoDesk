import { latest, assetFor } from '../../lib/releases.mjs';
import { json, env } from '../../lib/http.mjs';
export function createHandler(fetcher = fetch, getEnv = env) {
  return async req => {
    if (req.method !== 'GET') return json({ error: 'Use GET' }, 405);
    const analyticsEnabled = getEnv('ANALYTICS_ENABLED') === 'true';
    try {
      const release = await latest(fetcher);
      const response = json({ available: true, analyticsEnabled, version: release.tag_name.replace(/^v/, ''),
        platforms: ['win', 'mac', 'linux', 'android'].filter(os => assetFor(release, os, os === 'mac' ? 'arm64' : 'x64')) });
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120');
      response.headers.set('Netlify-CDN-Cache-Control', 'public, s-maxage=120');
      return response;
    } catch { return json({ available: false, analyticsEnabled, version: null, platforms: [] }); }
  };
}
export default createHandler();
export const config = { path: '/api/release-status' };
