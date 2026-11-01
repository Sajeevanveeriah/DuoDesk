export const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer',
};
export const json = (data, status = 200) => Response.json(data, { status, headers });
export const env = key => globalThis.Netlify?.env?.get(key);
export const osValues = new Set(['win', 'mac', 'linux', 'android']);
export const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin;
