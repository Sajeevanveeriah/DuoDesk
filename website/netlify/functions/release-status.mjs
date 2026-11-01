import { latest, assetFor } from '../../lib/releases.mjs';
import { json } from '../../lib/http.mjs';
export function createHandler(fetcher = fetch) {
  return async req => {
    if (req.method !== 'GET') return json({ error: 'Use GET' }, 405);
    try {
      const release = await latest(fetcher);
      const response = json({ available: true, version: release.tag_name.replace(/^v/, ''),
        platforms: ['win', 'mac', 'linux', 'android'].filter(os => assetFor(release, os, os === 'mac' ? 'arm64' : 'x64')) });
      response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120');
      response.headers.set('Netlify-CDN-Cache-Control', 'public, s-maxage=120');
      return response;
    } catch { return json({ available: false, version: null, platforms: [] }); }
  };
}
export default createHandler();
export const config = { path: '/api/release-status' };
