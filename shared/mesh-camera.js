// DuoDesk modifications, 2026. GPL-3.0. Uses the original cam.* messages and viewer.
'use strict';
const path = require('path');
const { T } = require('./protocol');

class MeshCamera {
  constructor({ hub, cfg, save, popup, onChange, askPermission, beforeStart = () => {}, electron, ViewerClass }) {
    Object.assign(this, { hub, cfg, save, popup, onChange, askPermission, beforeStart });
    this.electron = electron || require('electron');
    this.watchers = new Map(); this.policies = new Map(); this.devices = []; this.sender = null;
    this.shareError = ''; this.viewerPeer = null; this.permissionEpoch = 0;
    const handlers = new Map();
    const link = {
      on: (type, fn) => { const list = handlers.get(type) || []; list.push(fn); handlers.set(type, list); },
      send: (msg) => { const id = this.viewerPeer; return id && hub.bus.send(id, msg); },
      connected: () => this.connected(this.viewerPeer || hub.selectedId),
      ble: () => this.ble(this.viewerPeer || hub.selectedId),
      closed: (fn) => { this.viewerClosed = fn; },
    };
    const Viewer = ViewerClass || require('./camshare').CamShare;
    // Viewer-only facade: it never receives cam.open or welcome and cannot share a camera.
    this.viewClient = new Viewer({ link, cfg: () => ({ ...cfg(), share: false }), save: () => {}, popup,
      peerName: () => this.name(this.viewerPeer || hub.selectedId), onChange });
    this.viewMessage = (type, msg) => { for (const fn of handlers.get(type) || []) fn(msg); };
    const bus = hub.bus;
    bus.on(T.CAM_POLICY, (m, id) => { this.policies.set(id, m && m.share === true); if (id === (this.viewerPeer || hub.selectedId)) this.viewMessage(T.CAM_POLICY, m); onChange(); });
    bus.on(T.CAM_OPEN, (_m, id) => this.open(id));
    bus.on(T.CAM_CLOSE, (_m, id) => { this.remove(id); if (id === this.viewerPeer) this.viewMessage(T.CAM_CLOSE, {}); });
    bus.on(T.CAM_ANSWER, (m, id) => { if (this.watchers.has(id) && m && typeof m.sdp === 'string' && m.sdp.length < 262144) this.toSender({ t: 'answer', peer: id, sdp: m.sdp }); });
    bus.on(T.CAM_OFFER, (m, id) => { if (id === this.viewerPeer && m && typeof m.sdp === 'string' && m.sdp.length < 262144) this.viewMessage(T.CAM_OFFER, m); });
    bus.on(T.CAM_ICE, (m, id) => {
      if (!m || !m.candidate) return;
      if (m.from === 'view' && this.watchers.has(id)) this.toSender({ t: 'ice', peer: id, candidate: m.candidate });
      else if (m.from === 'send' && id === this.viewerPeer) this.viewMessage(T.CAM_ICE, m);
    });
    bus.on(T.CAM_STATE, (m, id) => { if (id === this.viewerPeer) this.viewMessage(T.CAM_STATE, m); });
    bus.onPeer('welcome', (id) => { this.policies.delete(id); this.sendPolicy(id); });
    bus.onPeer('closed', (id) => { this.policies.delete(id); this.remove(id); if (id === this.viewerPeer) { this.closeView(); if (this.viewerClosed) this.viewerClosed(); } onChange(); });
    bus.onPeer('transport', (id) => { if (this.ble(id)) { this.remove(id, true); if (id === this.viewerPeer) this.closeView(); } });
    hub.on('selected', (id) => { if (this.viewerPeer && this.viewerPeer !== id) this.closeView(); this.viewMessage(T.CAM_POLICY, { share: this.policies.get(id) === true }); onChange(); });
    this.out = (event, message) => {
      const s = this.sender;
      if (!s || s.win.isDestroyed() || event.sender !== s.win.webContents || !message || typeof message !== 'object') return;
      this.fromSender(message);
    };
    this.electron.ipcMain.on('cam:out', this.out);
    this.electron.app.on('before-quit', () => this.destroy());
  }
  connected(id) { const session = id && this.hub.sessions.get(id); return !!session && session.connected; }
  ble(id) { const session = id && this.hub.sessions.get(id); return !!session && session.transport === 'ble'; }
  name(id) { const session = id && this.hub.sessions.get(id); return session && ((typeof session.displayName === 'function' && session.displayName()) || session.name || (session.ctx && session.ctx.name)) || id || 'Device'; }
  get share() { return this.cfg().on !== false && this.cfg().share === true; }
  sendPolicy(id) { for (const peer of id ? [id] : this.hub.bus.connectedIds()) this.hub.bus.send(peer, { t: T.CAM_POLICY, share: this.share }); }
  async setShare(on, askFirst = this.askPermission) {
    const epoch = ++this.permissionEpoch;
    this.shareError = '';
    if (on && askFirst && !(await askFirst())) { if (epoch === this.permissionEpoch) { this.shareError = 'Allow DuoDesk to use the camera in system privacy settings'; this.onChange(); } return; }
    if (epoch !== this.permissionEpoch) return;
    if (on) { this.closeView(); this.beforeStart('send'); }
    this.cfg().share = !!on; this.save();
    if (!on) this.stopSending();
    this.sendPolicy(); this.onChange();
  }
  setDevice(id) {
    const selected = typeof id === 'string' ? id.slice(0, 200) : '';
    if (selected === this.cfg().device) return;
    this.cfg().device = selected; this.save();
    const peers = [...this.watchers.keys()];
    this.stopSending();
    for (const peer of peers) this.open(peer);
    this.onChange();
  }
  listDevices() { this.toSender({ t: 'devices' }, true); }
  open(id) {
    if (!this.connected(id)) return;
    if (!this.share) return this.hub.bus.send(id, { t: T.CAM_STATE, status: 'refused' });
    if (this.ble(id)) return this.hub.bus.send(id, { t: T.CAM_STATE, status: 'failed', error: 'Camera needs Wi-Fi or a cable' });
    this.beforeStart('send');
    if (this.watchers.has(id)) this.remove(id);
    this.watchers.set(id, { id, name: this.name(id), status: 'starting' });
    this.toSender({ t: 'add', peer: id, deviceId: this.cfg().device || '' }, true);
    this.hub.bus.send(id, { t: T.CAM_STATE, status: 'starting' });
    this.popup('driven', this.name(id) + ' is watching your camera'); this.onChange();
  }
  remove(id, tell = false) {
    if (!this.watchers.delete(id)) return;
    this.toSender({ t: 'remove', peer: id });
    if (tell && this.connected(id)) this.hub.bus.send(id, { t: T.CAM_CLOSE });
    if (!this.watchers.size) this.closeSender();
    this.onChange();
  }
  stopSending(tell = true) {
    this.permissionEpoch++; // Stop/master-off invalidates an outstanding OS permission request.
    for (const id of this.watchers.keys()) if (tell && this.connected(id)) this.hub.bus.send(id, { t: T.CAM_CLOSE });
    this.watchers.clear(); this.closeSender(); this.onChange();
  }
  closeSender() {
    const sender = this.sender; this.sender = null;
    // Destroying the renderer is also the fail-safe for pending getUserMedia/permission requests.
    if (sender && !sender.win.isDestroyed()) sender.win.destroy();
  }
  toSender(message, create = false) {
    if (!this.sender || this.sender.win.isDestroyed()) {
      if (!create) return;
      const win = new this.electron.BrowserWindow({ show: false, webPreferences: { preload: path.join(__dirname, 'preload-camera.js'),
        contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
      const sender = this.sender = { win, ready: false, queue: [] };
      win.loadFile(path.join(__dirname, 'mesh-camera-send.html'));
      win.webContents.on('render-process-gone', () => {
        if (this.sender !== sender) return;
        for (const id of this.watchers.keys()) this.hub.bus.send(id, { t: T.CAM_STATE, status: 'failed', error: 'Camera process stopped' });
        this.stopSending(false);
      });
      win.on('closed', () => {
        if (this.sender !== sender) return;
        this.sender = null; const peers = [...this.watchers.keys()]; this.watchers.clear();
        for (const id of peers) this.hub.bus.send(id, { t: T.CAM_STATE, status: 'failed', error: 'Camera process stopped' });
        this.onChange();
      });
    }
    if (this.sender.ready) this.sender.win.webContents.send('cam:in', message);
    else this.sender.queue.push(message);
  }
  fromSender(message) {
    if (message.t === 'ready') { this.sender.ready = true; for (const m of this.sender.queue.splice(0)) this.sender.win.webContents.send('cam:in', m); return; }
    if (message.t === 'devices' && Array.isArray(message.list)) {
      this.devices = message.list.slice(0, 30).map((d, index) => ({ id: String(d.id || '').slice(0, 200), label: String(d.label || 'Camera ' + (index + 1)).slice(0, 100) }));
      if (!this.watchers.size) this.closeSender(); this.onChange(); return;
    }
    const id = message.peer;
    if (!this.watchers.has(id) || !this.share) return;
    if (message.t === 'offer' && typeof message.sdp === 'string') this.hub.bus.send(id, { t: T.CAM_OFFER, sdp: message.sdp });
    else if (message.t === 'ice' && message.candidate) this.hub.bus.send(id, { t: T.CAM_ICE, from: 'send', candidate: message.candidate });
    else if (message.t === 'status') {
      const status = message.status === 'live' ? 'live' : 'failed';
      this.watchers.get(id).status = status;
      this.hub.bus.send(id, { t: T.CAM_STATE, status, error: String(message.error || '').slice(0, 200) });
      if (status === 'failed') this.remove(id); this.onChange();
    }
  }
  view(show = false) {
    const id = this.hub.selectedId;
    if (!id || !this.connected(id) || this.cfg().on === false) return;
    this.setShare(false); this.beforeStart('view');
    if (this.viewerPeer && this.viewerPeer !== id) this.closeView();
    this.viewerPeer = id; this.viewClient.view(show);
  }
  closeView() { const id = this.viewerPeer; this.viewClient.closeView(); this.viewerPeer = null; if (id && this.connected(id)) this.hub.bus.send(id, { t: T.CAM_CLOSE }); }
  get state() {
    const selected = this.hub.selectedId;
    return { ...this.viewClient.state, on: this.cfg().on !== false, connected: this.connected(selected), ble: this.ble(selected),
      peerShares: this.policies.get(selected) === true, share: this.share, shareError: this.shareError,
      device: this.cfg().device || '', devices: this.devices, watchers: [...this.watchers.values()],
      sending: this.watchers.size > 0, sendLive: [...this.watchers.values()].some((p) => p.status === 'live') };
  }
  destroy() { this.permissionEpoch++; this.stopSending(false); this.closeView(); this.electron.ipcMain.removeListener('cam:out', this.out); }
}
module.exports = { MeshCamera };
