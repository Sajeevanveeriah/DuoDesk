// DuoDesk GPL-3.0. File handoff must never acquire cursor ownership.
'use strict';
const assert = require('node:assert/strict');
const PairKvm = require('../../kvm');
const MeshKvm = require('../kvm');
const sent = [];
const fileDrop = { sendBatch: (...args) => sent.push(args) };
const noCapture = () => { throw new Error('File handoff must not capture input'); };
const pair = { mode: 'home', connected: true, crossingSide: 'right', _dragsOut: () => true, fileDrop,
  helper: { send: noCapture }, _take: noCapture };
PairKvm.prototype._onHelper.call(pair, 'fileHandoff', { side: 'right', paths: ['C:\\example.txt'] });
assert.deepEqual(sent, [[['C:\\example.txt'], 'send']]);
PairKvm.prototype._onHelper.call(pair, 'fileHandoff', { side: 'left', paths: ['C:\\example.txt'] });
assert.equal(sent.length, 1, 'wrong edge does not send');
pair.mode = 'driven';
PairKvm.prototype._onHelper.call(pair, 'fileHandoff', { side: 'right', paths: ['C:\\example.txt'] });
assert.equal(sent.length, 1, 'remote ownership does not stage local files');
let selected;
const mesh = { ...pair, mode: 'home', edges: { right: 'peer' }, _connectedTo: () => true,
  hub: { select(id) { selected = id; return true; } } };
MeshKvm.prototype._onHelper.call(mesh, 'fileHandoff', { side: 'right', paths: ['C:\\example.txt'] });
assert.equal(selected, 'peer'); assert.equal(sent.length, 2);
mesh._connectedTo = () => false;
MeshKvm.prototype._onHelper.call(mesh, 'fileHandoff', { side: 'right', paths: ['C:\\example.txt'] });
assert.equal(sent.length, 2, 'offline peer does not receive');
console.log('PASS explicit file handoff, correct destination, no cursor capture, offline rejection');
