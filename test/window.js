'use strict';
// Synthetic renderer only: never load a production main process, helper, device or clipboard.
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { fixture, phoneAssets, hubResponses } = require('./fixture');
const mode = process.env.DUODESK_TEST_MODE || 'pair';
const os = process.env.DUODESK_TEST_OS || 'windows';
const scenario = process.env.DUODESK_TEST_SCENARIO || 'desktop';
if (!['windows', 'mac', 'linux'].includes(os) || !['pair', 'mesh'].includes(mode) || !['desktop', 'offline', 'phone'].includes(scenario)) throw new Error('Invalid harness target');
app.setPath('userData', path.join(__dirname, 'profiles', `${process.pid}-${os}-${mode}-${scenario}`));
const state = fixture(mode, os, scenario);
const actions = [], errors = [], blockedRequests = [], nativeLaunchAttempts = [];
const childProcess = require('node:child_process');
for (const method of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) childProcess[method] = (...args) => {
  nativeLaunchAttempts.push({ method, command: String(args[0]) }); throw new Error('Native processes are forbidden in the renderer harness');
};
let win;
function sender(event) { if (!win || event.sender !== win.webContents) throw new Error('Unexpected harness sender'); }
ipcMain.handle('mock:audit', (event) => { sender(event); return { os, mode, scenario, actions, errors, blockedRequests, nativeLaunchAttempts }; });
ipcMain.handle('mock:call', (event, name, args) => {
  sender(event);
  if (name === 'getState') return state;
  if (name === 'phoneAssets') return scenario === 'phone' ? phoneAssets : { apps: [], wallpaper: '' };
  if (name === 'phoneListCameras') return [{ id: 'demo-back', facing: 'back', name: 'Back camera (demo)' }];
  if (['listApps', 'listPcApps', 'getApps'].includes(name)) return [];
  if (name === 'getIcons') return {};
  if (name === 'qrPair') return { url: '', why: 'QR pairing is not active in this isolated test' };
  actions.push({ name, args });
  if (name === 'hub' && args[0]?.do === 'send') {
    for (const reply of scenario === 'phone' ? hubResponses(args[0].msg || {}) : []) setTimeout(() => {
      if (win && !win.isDestroyed()) win.webContents.send('mock:onHub', reply);
    }, 10);
    return { ok: true, mock: true };
  }
  const section = { setClipboard: 'clipboard', setKvm: 'kvm', setKeys: 'keys', setAudio: 'audio', setFiles: 'files', setNet: 'net', setApp: 'app', setOverview: 'overview', setNotifs: 'notifs' }[name];
  if (section) state[section] = { ...state[section], ...args[0] };
  if (name === 'setPhone') state.phone.settings = { ...state.phone.settings, ...args[0] };
  if (name === 'setTab') state.ui.tab = args[0];
  if (name === 'camera') state.camera = { ...state.camera, ...(args[0].do === 'share' ? { share: !!args[0].on } : { on: !!args[0].on }) };
  if (section || ['setTab', 'setPhone', 'camera'].includes(name)) win.webContents.send('mock:onState', state);
  return { ok: true, mock: true };
});
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const cancel = !/^(file|data|blob):/.test(details.url);
    if (cancel) blockedRequests.push(details.url);
    callback({ cancel });
  });
  win = new BrowserWindow({ width: 1280, height: 900, show: process.env.DUODESK_TEST_VISIBLE === '1', title: 'DuoDesk - isolated simulated renderer',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('console-message', (_event, level, message) => { if (level === 3) errors.push(message); });
  win.webContents.on('render-process-gone', (_event, details) => errors.push('Renderer exited: ' + details.reason));
  const leaf = os === 'mac' ? 'control.html' : 'app.html';
  await win.loadFile(path.join(__dirname, '..', os, mode === 'mesh' ? 'mesh' : '', leaf));
  win.webContents.on('will-navigate', (event, url) => { if (url !== win.webContents.getURL()) event.preventDefault(); });
}).catch((error) => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => app.quit());
