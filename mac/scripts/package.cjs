// DuoDesk packaging. GPL-3.0.
'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
if (process.platform !== 'darwin') throw new Error('macOS packaging requires a Mac runner.');
const cwd = path.join(__dirname, '..');
const arch = process.argv[2] || 'arm64';
if (!['arm64', 'x64'].includes(arch)) throw new Error('Unsupported architecture');
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
function run(exe, args) {
  const r = spawnSync(exe, args, { cwd, env, stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status || 1);
}
run('/bin/sh', ['build-app.sh', arch]);
run(require('electron'), [path.join(__dirname, 'render-dmg.cjs')]);
run(process.execPath, [require.resolve('electron-builder/cli.js'), '--config', 'electron-builder.json',
  '--prepackaged', path.join(cwd, 'dist', 'DuoDesk.app'), '--mac', 'dmg', '--' + arch, '--publish', 'never']);
