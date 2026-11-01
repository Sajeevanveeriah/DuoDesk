// DuoDesk GPL-3.0. Lifecycle tests run without Electron, camera access or network.
'use strict';
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { MeshCameraSender } = require('../mesh-camera-send');
const { MeshCamera } = require('../mesh-camera');
const { T } = require('../protocol');
const flush = () => new Promise((resolve) => setImmediate(resolve));
let checks = 0;
const check = (condition, name) => { assert.ok(condition, name); checks++; };
class RTC {
  constructor() { this.connectionState = 'new'; this.remoteDescription = null; }
  addTransceiver() {}
  async createOffer() { return { type: 'offer', sdp: 'synthetic-offer' }; }
  async setLocalDescription(desc) { this.localDescription = desc; }
  async setRemoteDescription(desc) { this.remoteDescription = desc; }
  async addIceCandidate() {}
  close() { this.closed = true; }
}
function stream() {
  const track = { stopped: 0, stop() { this.stopped++; }, onended: null };
  return { track, getTracks: () => [track], getVideoTracks: () => [track] };
}
async function senderTests() {
  let requests = 0; const capture = stream(); const sent = [];
  const sender = new MeshCameraSender({ media: { async getUserMedia() { requests++; return capture; } }, PeerConnection: RTC, send: (m) => sent.push(m) });
  await Promise.all([sender.add('A'), sender.add('B')]);
  check(requests === 1, 'two viewers acquire one physical camera');
  check(sent.filter((m) => m.t === 'offer').length === 2, 'each viewer has its own offer');
  await sender.ice('A', { candidate: 'one' });
  await sender.answer('A', 'answer');
  check(sender.peers.get('A').ice.length === 0, 'early ICE drains after answer');
  sender.remove('A'); check(capture.track.stopped === 0, 'remaining viewer keeps capture');
  sender.remove('B'); check(capture.track.stopped === 1, 'last viewer stops physical track');
  sender.stop(); check(capture.track.stopped === 1, 'stop is idempotent');

  const pending = []; const captures = [];
  const race = new MeshCameraSender({ media: { getUserMedia() { return new Promise((resolve) => pending.push(resolve)); } }, PeerConnection: RTC, send() {} });
  const first = race.add('old'); race.stop(); const second = race.add('new');
  check(pending.length === 1, 'cancelled permission request is serialised before reacquiring');
  captures[0] = stream(); pending[0](captures[0]); await flush();
  check(captures[0].track.stopped === 1, 'late cancelled capture is stopped');
  check(pending.length === 2, 'replacement starts only after old capture settles');
  captures[1] = stream(); pending[1](captures[1]); await Promise.all([first, second]);
  check(race.peers.size === 1 && race.peers.has('new'), 'cancelled viewer never resurrects');
  captures[1].track.onended();
  check(race.peers.size === 0 && captures[1].track.stopped === 1, 'device loss stops all peers and tracks');
  let resolveCancelled, cancelledCalls = 0;
  const cancelled = new MeshCameraSender({ media: { getUserMedia() { cancelledCalls++; return new Promise((r) => { resolveCancelled = r; }); } }, PeerConnection: RTC, send() {} });
  const a = cancelled.add('A'), b = cancelled.add('B');
  cancelled.remove('A'); cancelled.remove('B');
  const late = stream(); resolveCancelled(late); await Promise.all([a, b]);
  check(cancelledCalls === 1 && cancelled.peers.size === 0 && cancelled.stream === null && late.track.stopped === 1,
    'all pending viewers cancelled never reacquires an orphan camera');
}
class Window extends EventEmitter {
  constructor(options) { super(); this.options = options; this.messages = []; this.webContents = new EventEmitter(); this.webContents.send = (...m) => this.messages.push(m); Window.all.push(this); }
  loadFile(file) { this.file = file; }
  isDestroyed() { return !!this.dead; }
  destroy() { this.dead = true; this.emit('closed'); }
}
Window.all = [];
class Viewer {
  constructor(options) { Object.assign(this, options); this.state = {}; }
  view() { this.state.viewing = true; this.link.send({ t: T.CAM_OPEN }); }
  closeView() { if (this.state.viewing) this.link.send({ t: T.CAM_CLOSE }); this.state.viewing = false; }
}
function fixture() {
  const events = new Map(), life = new Map(), sent = [];
  const hub = new EventEmitter(); hub.selectedId = 'A';
  hub.sessions = new Map([['A', { connected: true, name: 'MacBook', transport: 'ip' }], ['B', { connected: true, name: 'Linux', transport: 'ip' }]]);
  hub.bus = { on(t, fn) { events.set(t, fn); }, onPeer(t, fn) { life.set(t, fn); }, connectedIds: () => [...hub.sessions.keys()], send: (id, msg) => { sent.push({ id, ...msg }); return true; } };
  const cfg = { on: true, share: true, device: '' }; const ipcMain = new EventEmitter();
  const camera = new MeshCamera({ hub, cfg: () => cfg, save() {}, popup() {}, onChange() {},
    electron: { BrowserWindow: Window, ipcMain, app: new EventEmitter() }, ViewerClass: Viewer });
  return { camera, hub, cfg, events, life, sent, ipcMain };
}
async function controllerTests() {
  const f = fixture();
  f.events.get(T.CAM_OPEN)({}, 'A'); f.events.get(T.CAM_OPEN)({}, 'B');
  check(f.camera.state.watchers.length === 2, 'controller names every viewer');
  const win = f.camera.sender.win;
  check(win.options.webPreferences.contextIsolation && !win.options.webPreferences.nodeIntegration && win.options.webPreferences.sandbox, 'sender window is isolated');
  f.ipcMain.emit('cam:out', { sender: {} }, { t: 'ready' });
  check(!f.camera.sender.ready, 'untrusted renderer cannot control sender');
  f.ipcMain.emit('cam:out', { sender: win.webContents }, { t: 'ready' });
  check(win.messages.filter((m) => m[1].t === 'add').length === 2, 'one sender window serves two peers');
  f.life.get('closed')('A');
  check(f.camera.watchers.size === 1 && !win.dead, 'one disconnect leaves other viewer');
  await f.camera.setShare(false);
  check(win.dead && f.camera.watchers.size === 0, 'permission switch destroys capture renderer');
  f.events.get(T.CAM_OPEN)({}, 'A');
  check(f.sent.at(-1).status === 'refused', 'off refuses new viewers');
  await f.camera.setShare(true); f.hub.sessions.get('B').transport = 'ble'; f.events.get(T.CAM_OPEN)({}, 'B');
  check(f.sent.at(-1).status === 'failed' && f.camera.watchers.size === 0, 'Bluetooth does not start a capture');
  f.camera.view(); const beforeSelection = f.sent.length; f.hub.selectedId = 'B'; f.hub.emit('selected', 'B');
  check(f.sent.slice(beforeSelection).filter((m) => m.t === T.CAM_CLOSE).every((m) => m.id === 'A'), 'selection changes close old viewer');
  const previous = f.sent.length; f.camera.viewClient.link.send({ t: T.CAM_CLOSE });
  check(f.sent.length === previous, 'late old viewer message never targets new selection');
  let resolve; const permission = f.camera.setShare(true, () => new Promise((r) => { resolve = r; }));
  await f.camera.setShare(false); resolve(true); await permission;
  check(!f.cfg.share, 'late permission grant cannot undo a later off');
  let releasePermission; const pendingMaster = f.camera.setShare(true, () => new Promise((r) => { releasePermission = r; }));
  f.cfg.on = false; f.camera.stopSending(); releasePermission(true); await pendingMaster;
  check(!f.cfg.share, 'master off cancels pending permission instead of arming future sharing');
  f.camera.destroy();
}
(async () => { await senderTests(); await controllerTests(); console.log('PASS ' + checks + ' mesh camera lifecycle checks (mock media, no camera/network)'); })().catch((error) => { console.error(error); process.exitCode = 1; });
