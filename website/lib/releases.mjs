export const repository = 'Sajeevanveeriah/DuoDesk';
export const RELEASE_TTL_MS = 120_000;
const loaders = new WeakMap();
function trustedAsset(asset, tag) {
  if (!asset || typeof asset.name !== 'string' || !Number.isSafeInteger(asset.size) || asset.size <= 0 || typeof asset.browser_download_url !== 'string') return false;
  try {
    const url = new URL(asset.browser_download_url);
    const expected = `/${repository}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(asset.name)}`;
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname === expected && !url.search && !url.hash;
  } catch { return false; }
}
async function fetchLatest(fetcher) {
  const res = await fetcher(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'DuoDesk-Website' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error('No release available');
  const release = await res.json();
  if (!release || release.draft !== false || release.prerelease !== false || !/^v?\d+\.\d+\.\d+$/.test(release.tag_name || '') || !Array.isArray(release.assets) || !release.assets.length || !release.assets.every(asset => trustedAsset(asset, release.tag_name))) throw new Error('No verified stable release');
  // Cache only the validated fields consumers use, and prevent accidental mutation.
  return Object.freeze({ tag_name: release.tag_name, draft: false, prerelease: false,
    assets: Object.freeze(release.assets.map(({name, size, browser_download_url}) => Object.freeze({name, size, browser_download_url}))) });
}
export function createReleaseLoader({ fetcher = fetch, now = Date.now, ttlMs = RELEASE_TTL_MS } = {}) {
  let cached = null, expires = 0, pending = null;
  return async () => {
    if (cached && now() < expires) return cached;
    if (pending) return pending;
    pending = fetchLatest(fetcher).then(release => {
      cached = release; expires = now() + ttlMs; return release;
    }).finally(() => { pending = null; });
    // Rejected/invalid responses are never cached or served as stale release metadata.
    return pending;
  };
}
export function latest(fetcher = fetch) {
  if (!loaders.has(fetcher)) loaders.set(fetcher, createReleaseLoader({ fetcher }));
  return loaders.get(fetcher)();
}
export function assetFor(release, os, arch = 'x64') {
  const version = release.tag_name.replace(/^v/, '');
  const matches = (release.assets || []).filter(asset => {
    const name = asset.name || '';
    if (!(asset.size > 0)) return false;
    if (os === 'win') return arch === 'arm64' ? name === `DuoDesk-Setup-${version}-arm64.exe` : [ `DuoDesk-Setup-${version}.exe`, `DuoDesk-Setup-${version}-x64.exe` ].includes(name);
    if (os === 'mac') return arch === 'arm64' && name === `DuoDesk-${version}-arm64.dmg`;
    if (os === 'linux') return arch === 'x64' && [`DuoDesk-${version}-x64.AppImage`, `DuoDesk-${version}-amd64.AppImage`, `DuoDesk-${version}-x86_64.AppImage`].includes(name);
    if (os === 'android') return name === `DuoDesk-${version}.apk`;
    return false;
  });
  for (const asset of matches) {
    try {
      const url = new URL(asset.browser_download_url);
      const exactPath = `/${repository}/releases/download/${encodeURIComponent(release.tag_name)}/${encodeURIComponent(asset.name)}`;
      if (url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname === exactPath && !url.search && !url.hash) return asset;
    } catch { /* Ignore malformed release metadata. */ }
  }
  return null;
}
