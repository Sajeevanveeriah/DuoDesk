import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler as download } from '../netlify/functions/download.mjs';
import { createHandler as status } from '../netlify/functions/release-status.mjs';
import { createHandler as view } from '../netlify/functions/view.mjs';
import { createHandler as analytics } from '../netlify/functions/analytics.mjs';
import { countStore } from '../lib/counts.mjs';
const names = ['DuoDesk-Setup-2.5.0.exe', 'DuoDesk-Setup-2.5.0-arm64.exe', 'DuoDesk-2.5.0-arm64.dmg', 'DuoDesk-2.5.0-x64.AppImage', 'DuoDesk-2.5.0.apk', 'DuoDesk-2.5.0-full.apk'];
const release = { tag_name: 'v2.5.0', draft: false, prerelease: false, assets: names.map(name => ({ name, size: 100, browser_download_url: `https://github.com/Sajeevanveeriah/DuoDesk/releases/download/v2.5.0/${name}` })) };
const fetcher = async () => Response.json(release);
const req = (path, init) => new Request(`https://duodesk.netlify.app${path}`, init);
for (const [os, suffix, expected] of [['win', '', names[0]], ['win', '&arch=arm64', names[1]], ['mac', '', names[2]], ['linux', '', names[3]], ['android', '', names[4]]]) {
  test(`download selects ${os}${suffix} stable installer and counts once`, async () => {
    const calls = [];
    const response = await download({ fetcher, store: { add: async (...args) => calls.push(args) } })(req(`/api/download?os=${os}${suffix}`));
    assert.equal(response.status, 302); assert.ok(response.headers.get('location').endsWith(expected));
    assert.deepEqual(calls, [['download', os]]); assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}
test('unsupported OS or architecture is rejected without external lookup', async () => {
  let calls = 0; const handler = download({ fetcher: async () => { calls++; } });
  assert.equal((await handler(req('/api/download?os=ios'))).status, 400);
  assert.equal((await handler(req('/api/download?os=win&arch=wat'))).status, 400);
  assert.equal(calls, 0);
});
test('missing stable release produces honest 503, no redirect or count', async () => {
  let calls = 0;
  const response = await download({ fetcher: async () => new Response('', { status: 404 }), store: { add: async () => calls++ } })(req('/api/download?os=win'));
  assert.equal(response.status, 503); assert.equal(response.headers.get('location'), null); assert.equal(calls, 0);
});
test('Linux accepts the electron-builder x86_64 artefact spelling', async () => {
  const name = 'DuoDesk-2.5.0-x86_64.AppImage';
  const linux = {...release, assets: [{ name, size: 100, browser_download_url: `https://github.com/Sajeevanveeriah/DuoDesk/releases/download/v2.5.0/${name}` }]};
  assert.equal((await download({fetcher:async()=>Response.json(linux),store:{add:async()=>{}}})(req('/api/download?os=linux'))).status,302);
});
test('prerelease and malformed release cannot be used as stable download', async () => {
  for (const value of [{ ...release, prerelease: true }, { ...release, tag_name: 'v2.5.0-beta.1' }, { ...release, assets: [] }]) {
    assert.equal((await download({ fetcher: async () => Response.json(value) })(req('/api/download?os=win'))).status, 503);
  }
});
test('download rejects off-repository asset URLs and wrong architecture', async () => {
  const bad = { ...release, assets: [{ ...release.assets[0], browser_download_url: 'https://evil.example/install.exe' }] };
  assert.equal((await download({ fetcher: async () => Response.json(bad) })(req('/api/download?os=win'))).status, 503);
  const stale = { ...release, assets: [{ ...release.assets[0], browser_download_url: release.assets[0].browser_download_url.replace('/v2.5.0/', '/v2.4.0/') }] };
  assert.equal((await download({ fetcher: async () => Response.json(stale) })(req('/api/download?os=win'))).status, 503);
  assert.equal((await download({ fetcher })(req('/api/download?os=linux&arch=arm64'))).status, 503);
  assert.equal((await download({ fetcher })(req('/api/download?os=mac&arch=x64'))).status, 503);
});
test('analytics failure does not break installer availability or retry', async () => {
  let calls = 0;
  assert.equal((await download({ fetcher, store: { add: async () => { calls++; throw new Error('unknown write outcome'); } } })(req('/api/download?os=win'))).status, 302);
  assert.equal(calls, 1);
});
test('privacy headers skip download counting', async () => {
  let calls = 0;
  const handler = download({ fetcher, store: { add: async () => calls++ } });
  assert.equal((await handler(req('/api/download?os=win', { headers: { 'Sec-GPC': '1' } }))).status, 302);
  assert.equal(calls, 0);
});
test('status reports actual stable version/platforms or unavailability', async () => {
  assert.deepEqual(await (await status(fetcher)(req('/api/release-status'))).json(), { available: true, analyticsEnabled: false, version: '2.5.0', platforms: ['win','mac','linux','android'] });
  assert.equal((await (await status(async () => { throw new Error('offline'); })(req('/api/release-status'))).json()).available, false);
});
test('view rejects cross-origin/oversize and stores only normalised OS', async () => {
  const calls = []; const handler = view({ add: async (...args) => calls.push(args) });
  assert.equal((await handler(req('/api/view', { method: 'POST', body: '{}' }))).status, 403);
  assert.equal((await handler(req('/api/view', { method: 'POST', headers: { Origin: 'https://duodesk.netlify.app' }, body: 'x'.repeat(101) }))).status, 413);
  assert.equal((await handler(req('/api/view', { method: 'POST', headers: { Origin: 'https://duodesk.netlify.app' }, body: '{"os":"bad","ip":"discard me"}' }))).status, 200);
  assert.deepEqual(calls, [['view','unknown']]);
});
test('admin denies missing/wrong auth before querying storage', async () => {
  let reads = 0;
  const handler = analytics({ getEnv: () => 'test-only-password', store: { read: async () => { reads++; return []; } } });
  assert.equal((await handler(req('/api/analytics'))).status, 401);
  assert.equal((await handler(req('/api/analytics', { headers: { Authorization: 'Bearer wrong' } }))).status, 401);
  assert.equal(reads, 0);
  const good = await handler(req('/api/analytics', { headers: { Authorization: 'Bearer test-only-password' } }));
  assert.equal(good.status, 200); assert.equal(reads, 1); assert.equal(good.headers.get('set-cookie'), null);
});
test('admin fails closed without config and when storage is unavailable', async () => {
  assert.equal((await analytics({ getEnv: () => undefined })(req('/api/analytics'))).status, 503);
  assert.equal((await analytics({ getEnv: () => 'test', store: { read: async () => { throw new Error('private connection details'); } } })(req('/api/analytics', { headers: { Authorization: 'Bearer test' } }))).status, 503);
});
test('database adapter uses parameterised aggregate-only query with no retry', async () => {
  const calls = []; const sql = async (parts, ...values) => { calls.push({ text: parts.join('?'), values }); return []; };
  const store = countStore(key => key === 'ANALYTICS_ENABLED' ? 'true' : 'test-only-url', () => sql);
  await store.add('download', 'win'); await store.read();
  assert.deepEqual(calls[0].values, ['download', 'win']);
  assert.match(calls[0].text, /ON CONFLICT/); assert.doesNotMatch(calls[0].text, /visitor|user_agent|ip_address/i);
  await assert.rejects(() => store.add('arbitrary', 'win'));
  assert.equal(calls.length, 2);
});
test('all endpoints enforce HTTP method', async () => {
  assert.equal((await download({fetcher})(req('/api/download?os=win', {method:'POST'}))).status, 405);
  assert.equal((await view({})(req('/api/view'))).status, 405);
  assert.equal((await analytics({})(req('/api/analytics',{method:'POST'}))).status, 405);
});

test('analytics stays disabled unless explicitly enabled by deployment', async () => {
 const disabled=await (await status(async()=>{throw new Error('no release');})(req('/api/release-status'))).json();
 assert.equal(disabled.analyticsEnabled,false);
 const enabled=await (await status(fetcher,key=>key==='ANALYTICS_ENABLED'?'true':undefined)(req('/api/release-status'))).json();
 assert.equal(enabled.analyticsEnabled,true);
});
