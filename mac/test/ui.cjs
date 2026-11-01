// DuoDesk Mac renderer smoke check in isolated mock windows. GPL-3.0.
'use strict';
const { _electron } = require('../../node_modules/playwright');
const path = require('node:path'); const fs = require('node:fs');
(async () => {
  const results = []; const output = path.join(__dirname, 'output'); fs.mkdirSync(output, { recursive: true });
  for (const mode of ['pair', 'mesh']) {
    const env = { ...process.env, DUODESK_TEST_OS: 'mac', DUODESK_TEST_MODE: mode }; delete env.ELECTRON_RUN_AS_NODE;
    const app = await _electron.launch({ args: [path.join(__dirname, '..', '..', 'test', 'window.js')], env });
    try {
      const page = await app.firstWindow(); const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.waitForSelector('#nav button', { timeout: 15000 });
      const tabs = await page.evaluate(() => UI.tabs.map(t => t.id));
      for (const id of tabs) { await page.evaluate(id => UI.go(id), id); await page.waitForTimeout(35); }
      await page.evaluate(() => UI.go('desk')); await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(output, 'mac-' + mode + '.png') });
      results.push({ mode, pages: tabs, errors });
    } finally { await app.close(); }
  }
  fs.writeFileSync(path.join(output, 'renderer-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2)); process.exitCode = results.some(r => r.errors.length) ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
