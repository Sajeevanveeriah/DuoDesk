'use strict';
// Read-only release/source guard. It does not start desktop services or native helpers.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const has = (f, token) => assert.ok(read(f).includes(token), `${f}: required compatibility/licence token ${token}`);
has('LICENSE', 'GNU GENERAL PUBLIC LICENSE');
has('THIRD_PARTY_NOTICES', 'Beamer');
has('docs/compatibility.md', 'macshare-sas-v1');
has('android/app/build.gradle.kts', 'applicationId = "com.twindesk.android"');
has('android/app/src/main/java/com/twindesk/android/Store.kt', 'getSharedPreferences("twindesk"');
has('android/app/src/main/java/com/twindesk/android/Proto.kt', '"macshare-sas-v1"');
has('android/app/src/main/AndroidManifest.xml', 'android:scheme="twindesk"');
has('android/app/src/main/java/com/twindesk/android/Updates.kt', 'Sajeevanveeriah/DuoDesk');
for (const file of ['viewer.html', 'remote.html', 'audio.html']) {
  const html = read(`android/app/src/main/assets/web/${file}`);
  assert.ok(html.includes('Content-Security-Policy'), `${file}: CSP missing`);
  assert.ok(html.includes("frame-src 'none'"), `${file}: frames must be blocked`);
}
let parsed = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'vendor', 'build', '.gradle'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(js|cjs)$/.test(entry.name)) {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      parsed++;
    }
  }
}
for (const dir of ['android/app/src/main/assets', '.github/actions']) walk(path.join(root, dir));
console.log(`PASS: compatibility, licence, Android CSP and ${parsed} JavaScript parse checks. Native/runtime tests are separate.`);
