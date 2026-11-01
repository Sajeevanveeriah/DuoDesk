// DuoDesk regression tests. GPL-3.0.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function bridge(file) {
  let api; const sent = [];
  const electron = { contextBridge: { exposeInMainWorld: (_name, value) => { api = value; } },
    ipcRenderer: { send: (...args) => sent.push(args), invoke() {}, on() {} }, webUtils: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { require: () => electron });
  return { api, sent };
}
const mesh = bridge('mesh/preload-control.js');
assert.equal(typeof mesh.api.setMesh, 'function');
mesh.api.setMesh({ autoJoin: false });
assert.equal(mesh.sent[0][0], 'setMesh');
assert.equal(mesh.sent[0][1].autoJoin, false);
mesh.api.setStreamTarget('peer-b', { mode: 'mirror', displayId: '42' });
assert.equal(mesh.sent[1][0], 'setStreamTarget');
assert.equal(mesh.sent[1][1].id, 'peer-b');
assert.equal(mesh.sent[1][1].choice.displayId, '42');
assert.equal(mesh.sent[1][1].choice.mode, 'mirror');
assert.equal(mesh.api.send, undefined, 'no unrestricted IPC sender');
assert.equal(mesh.api.require, undefined);
const pair = bridge('preload-control.js');
pair.api.setClipboard({ enabled: true });
assert.equal(pair.sent[0][0], 'setClipboard');
assert.equal(pair.sent[0][1].enabled, true);
console.log('PASS Mac preload regression: mesh toggle, targeted screen choice, constrained API, pair clipboard');

// Exercise the actual IPC handler, including the preload's serialised request.
const handlers = new Map();
const fakeElectron = { ipcMain: { handle() {}, on: (name, fn) => handlers.set(name, fn) } };
const ipcModule = { exports: {} };
const actualRequire = require('node:module').createRequire(path.join(__dirname, '..', 'mesh', 'ipc.js'));
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'mesh', 'ipc.js'), 'utf8'), {
  module: ipcModule, exports: ipcModule.exports,
  require: (name) => name === 'electron' ? fakeElectron : name === './store' ? { saveSettings() {} } : name.endsWith('/about.js') ? { LINKS: {} } : actualRequire(name),
});
let target;
const settings = { mesh: { autoJoin: true } };
ipcModule.exports.setupIpc({ state: { connect: {} }, settings, pushState() {},
  stream: { setTarget: (id, choice) => { target = { id, choice }; } } });
handlers.get('setStreamTarget')({}, mesh.sent[1][1]);
assert.equal(target.id, 'peer-b');
assert.equal(target.choice.mode, 'mirror');
assert.equal(target.choice.displayId, '42');
handlers.get('setMesh')({}, { autoJoin: false });
assert.equal(settings.mesh.autoJoin, false);
console.log('PASS Mac IPC integration: target id/choice survive preload, joining switch updates settings');

// File handoff must not call _take or change cursor ownership.
for (const file of ['kvm.js', 'mesh/kvm.js']) {
  const { Kvm } = require(path.join(__dirname, '..', file));
  const k = Object.create(Kvm.prototype); const sent = [];
  k.getSettings = () => ({ kvm: {} }); k.mode = 'home';
  k.fileSend = { dragOn: true, sendBatch: (...args) => sent.push(args) };
  k.server = { current: { deviceId: 'other' } };
  k.hub = { selectedId: 'other', select: () => true };
  k.layoutSync = { neighbors: () => ({ right: 'other' }) };
  k._take = () => { throw new Error('file handoff changed cursor ownership'); };
  k._onHelper('fileHandoff', { side: 'right', paths: ['/Users/example/document.pdf', 42, '../bad'] });
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], [['/Users/example/document.pdf'], 'send']);
  assert.equal(k.mode, 'home');
  k.mode = 'driven';
  k._onHelper('fileHandoff', { side: 'right', paths: ['/Users/example/document.pdf'] });
  assert.equal(sent.length, 1, 'no handoff while remotely driven');
}
console.log('PASS Mac staged file handoff: copy only on home route, no cursor ownership switch');
