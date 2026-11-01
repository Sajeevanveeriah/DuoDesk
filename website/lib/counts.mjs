import { neon } from '@neondatabase/serverless';
import { env, osValues } from './http.mjs';
export function countStore(getEnv = env, makeSql = neon) {
  function sql() {
    const url = getEnv('DATABASE_URL');
    if (getEnv('ANALYTICS_ENABLED') !== 'true' || !url) throw new Error('Analytics not configured');
    // Every operation gets a fresh deadline. An aborted write may have committed; never retry it.
    return makeSql(url, { fetchOptions: { signal: AbortSignal.timeout(2000) } });
  }
  return {
    async add(event, os) {
      if (!['view', 'download'].includes(event)) throw new Error('Invalid event');
      const platform = osValues.has(os) ? os : 'unknown';
      const query = sql();
      // One atomic increment. No retries if the write outcome is unknown.
      await query`INSERT INTO duodesk_counts (day, event, os, count)
        VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date, ${event}, ${platform}, 1)
        ON CONFLICT (day, event, os) DO UPDATE SET count = duodesk_counts.count + 1`;
    },
    async read() {
      const query = sql();
      return query`SELECT day::text, event, os, count::text FROM duodesk_counts
        WHERE day >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Australia/Melbourne')::date - 30)
        ORDER BY day DESC, event, os`;
    },
  };
}
