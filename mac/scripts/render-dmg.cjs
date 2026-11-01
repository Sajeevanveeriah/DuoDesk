// DuoDesk DMG background renderer, local content and fonts only. GPL-3.0.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 660, height: 440, show: false, useContentSize: true,
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false, sandbox: true } });
  await win.loadFile(path.join(__dirname, '..', 'dmg', 'background.html'));
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
  const shot = await win.webContents.capturePage({ x: 0, y: 0, width: 660, height: 440 });
  if (shot.isEmpty()) throw new Error('DMG background render was empty');
  fs.writeFileSync(path.join(__dirname, '..', 'dmg', 'background.png'), shot.toPNG());
  win.destroy(); app.quit();
}).catch((error) => { console.error(error); app.exit(1); });
