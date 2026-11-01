import { createHash, timingSafeEqual } from 'node:crypto';
import { json, env } from '../../lib/http.mjs';
import { countStore } from '../../lib/counts.mjs';
const hash = value => createHash('sha256').update(value).digest();
export function createHandler({ getEnv = env, store = countStore() } = {}) {
  return async req => {
    if (req.method !== 'GET') return json({ error: 'Use GET' }, 405);
    const password = getEnv('ADMIN_PASSWORD');
    if (!password) return json({ error: 'Private dashboard is not configured.' }, 503);
    const auth = req.headers.get('authorization') || '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (provided.length > 1024 || !timingSafeEqual(hash(provided), hash(password))) return json({ error: 'Sign-in failed.' }, 401);
    try { return json({ rows: await store.read(), timezone: 'Australia/Melbourne', windowDays: 31 }); }
    catch { return json({ error: 'Analytics storage is not configured or unavailable.' }, 503); }
  };
}
export default createHandler();
export const config = { path: '/api/analytics', rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowSize: 60, windowLimit: 30 } };
