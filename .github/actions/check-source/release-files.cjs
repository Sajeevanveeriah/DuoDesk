'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = path.resolve(process.argv[2] || 'release-files');
const version = require('../../../windows/package.json').version;
assert.equal(process.env.RELEASE_TAG, `v${version}`, 'Tag must match the packaged version');
for (const os of ['mac', 'linux']) assert.equal(require(`../../../${os}/package.json`).version, version);
const android = fs.readFileSync(path.join(__dirname, '../../../android/app/build.gradle.kts'), 'utf8');
assert.ok(android.includes(`versionName = "${version}"`), 'Android version mismatch');
const files = fs.readdirSync(folder).filter(f => fs.statSync(path.join(folder, f)).isFile());
const required = [
  ['Windows x64', f => f === `DuoDesk-Setup-${version}.exe` || f === `DuoDesk-Setup-${version}-x64.exe`],
  ['Windows ARM64', f => f === `DuoDesk-Setup-${version}-arm64.exe`],
  ['Apple silicon DMG', f => f === `DuoDesk-${version}-arm64.dmg`],
  ['Linux AppImage', f => ['x64','amd64','x86_64'].some(a => f === `DuoDesk-${version}-${a}.AppImage`)],
  ['Debian package', f => ['x64','amd64'].some(a => f === `DuoDesk-${version}-${a}.deb`)],
  ['Android standard', f => f === `DuoDesk-${version}.apk`],
  ['Android full', f => f === `DuoDesk-${version}-full.apk`],
  ['Arch package', f => f.endsWith('.pkg.tar.zst')],
  ['Arch recipe', f => f === 'PKGBUILD'],
  ['Arch metadata', f => f === '.SRCINFO'],
];
for (const [label, match] of required) assert.ok(files.some(match), `Missing ${label}`);
const sums = [];
for (const name of files.sort()) {
  const bytes = fs.readFileSync(path.join(folder, name));
  assert.ok(bytes.length > 0, `Empty asset: ${name}`);
  if (name.endsWith('.exe')) assert.equal(bytes.subarray(0, 2).toString(), 'MZ', `Not a PE executable: ${name}`);
  if (name.endsWith('.apk')) assert.equal(bytes.subarray(0, 2).toString(), 'PK', `Not an APK ZIP: ${name}`);
  sums.push(`${crypto.createHash('sha256').update(bytes).digest('hex')}  ${name}`);
}
fs.writeFileSync(path.join(folder, 'SHA256SUMS'), sums.join('\n') + '\n');
console.log(`PASS: ${required.length} required release artefact kinds, ${files.length} nonempty assets, version ${version}. Checksums recorded.`);
