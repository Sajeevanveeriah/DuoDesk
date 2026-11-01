import { json, sameOrigin, osValues } from '../../lib/http.mjs';
import { countStore } from '../../lib/counts.mjs';
export function createHandler(store = countStore()) {
  return async req => {
    if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
    if (!sameOrigin(req)) return json({ error: 'Same-origin requests only' }, 403);
    if (req.headers.get('content-length') > 100) return json({ error: 'Body too large' }, 413);
    try {
      const text = await req.text();
      if (text.length > 100) return json({ error: 'Body too large' }, 413);
      const body = JSON.parse(text);
      const os = osValues.has(body.os) ? body.os : 'unknown';
      await store.add('view', os);
      return json({ counted: true });
    } catch { return json({ counted: false }, 503); }
  };
}
export default createHandler();
export const config = { path: '/api/view', rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowSize: 60, windowLimit: 600 } };
