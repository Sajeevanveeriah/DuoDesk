'use strict';
const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const output = path.join(__dirname, 'output');
const go = (page, id) => page.evaluate(tab => window.dispatchEvent(new CustomEvent('macshare-go', { detail: tab })), id);
async function command(page, label) {
  await page.keyboard.press('Control+k');
  await page.locator('.dd-command-input').fill(label);
  await page.locator('.dd-result').filter({hasText:label}).first().click();
  await page.waitForFunction(() => !document.querySelector('.dd-dialog').open);
}
async function privacy(page, prefix) {
  await go(page, 'feedback');
  const form = page.locator('#page-feedback');
  await form.getByLabel('Your feedback', {exact:true}).fill('Synthetic feedback for a simulated desk.');
  const consent = form.locator('input[type=checkbox]');
  assert.equal(await consent.isChecked(), false, 'system details are opt-in');
  await form.getByRole('button', {name:'Preview draft',exact:true}).click();
  let draft = await form.locator('pre').innerText();
  assert.ok(!draft.includes('System information') && !draft.includes('2.5.0'), 'default draft excludes version and OS');
  await form.getByRole('button', {name:'Copy draft',exact:true}).click();
  let audit = await page.evaluate(() => window.DuoDeskHarness.audit());
  assert.equal(audit.actions.filter(a => a.name === 'copyText').at(-1).args[0], draft);
  await consent.check();
  await form.getByRole('button', {name:'Preview draft',exact:true}).click();
  draft = await form.locator('pre').innerText();
  assert.ok(draft.includes('System information (included by choice)') && draft.includes('2.5.0'));
  assert.ok(!/192\.0\.2\.|Studio PC|Studio MacBook|Studio Linux|Synthetic CPU|Pixel demo/.test(draft), 'opt-in does not attach identities or addresses');
  await page.screenshot({type:'jpeg',quality:80,scale:'css',animations:'disabled',path:path.join(output, prefix+'-feedback-optin.jpg')});
  await form.getByRole('button', {name:'Copy draft',exact:true}).click();
  audit = await page.evaluate(() => window.DuoDeskHarness.audit());
  assert.equal(audit.actions.filter(a => a.name === 'copyText').at(-1).args[0], draft);
  assert.ok(!audit.actions.some(a => a.name === 'openLink'), 'feedback never submits or opens a site itself');
}
(async () => {
  fs.mkdirSync(output, {recursive:true});
  const report = [];
  for (const os of ['windows','mac','linux']) for (const mode of ['pair','mesh']) for (const scenario of ['desktop','offline','phone']) {
    const prefix = `${os}-${mode}-${scenario}`;
    if (process.env.DUODESK_QA_FILTER && !prefix.includes(process.env.DUODESK_QA_FILTER)) continue;
    let app, page; const errors = []; const captured = [], skipped = [];
    try {
      app = await electron.launch({args:[path.join(__dirname,'window.js')],env:{...process.env,DUODESK_TEST_OS:os,DUODESK_TEST_MODE:mode,DUODESK_TEST_SCENARIO:scenario}});
      page = await app.firstWindow();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.waitForSelector('#nav button');
      // Simulate the target renderer platform, not its operating system or native services.
      await page.addInitScript(platform => Object.defineProperty(navigator, 'platform', {get:() => platform}), {windows:'Win32',mac:'MacIntel',linux:'Linux x86_64'}[os]);
      await page.reload();
      await page.waitForSelector('#nav button');
      await page.waitForFunction(() => window.UI && UI.state && window.DuoDeskHarness);
      await page.waitForTimeout(150);
      const tabs = await page.evaluate(mode => UI.tabs.map(tab => {
        const kind = UI.isPhone(UI.state) ? 'phone' : window.SidebarModel ? SidebarModel.selectedKind(UI.state.peers) : 'computer';
        const reason = tab.navHidden ? 'legacy/non-navigation page' : tab.hidden && tab.hidden(UI.state) ? 'not applicable to fixture' : mode==='mesh' && window.SidebarModel && !SidebarModel.sectionVisible(tab.id,kind) ? 'not applicable to selected device kind' : '';
        return {id:tab.id,title:tab.title,reason};
      }),mode);
      for (const tab of tabs) {
        if (tab.reason) { skipped.push(tab); continue; }
        await go(page,tab.id);
        await page.waitForTimeout(['media','messages','calls','pfiles'].includes(tab.id)?250:40);
        const visible = await page.locator('#page-'+tab.id).isVisible();
        if (!visible) { errors.push(`Requested ${tab.id} was not visible (silent redirect)`); continue; }
        const shown = await page.locator('.page:visible').getAttribute('id');
        assert.equal(shown,'page-'+tab.id,'the requested page is the one actually shown');
        if (scenario==='phone') {
          const populated={calls:'Alex (demo)',messages:'The mock desk is ready.',pfiles:'Desk-notes.txt'}[tab.id];
          if (populated) assert.ok((await page.locator('#page-'+tab.id).innerText()).includes(populated),tab.id+' contains realistic phone data');
          if (tab.id==='messages') { await page.locator('#page-messages .hub-thread').first().click(); await page.waitForTimeout(40); }
          if (tab.id==='media') assert.equal(await page.locator('#page-media .hub-tile').count(),1,'photo grid is populated');
          if (tab.id==='papps') assert.ok((await page.locator('#page-papps').innerText()).includes('Notes'),'phone app grid is populated');
        }
        await page.screenshot({type:'jpeg',quality:80,scale:'css',animations:'disabled',path:path.join(output,`${prefix}-${tab.id}.jpg`)});
        captured.push(tab.id);
      }
      if(scenario==='phone') for(const required of ['calls','messages','media','pfiles','mirror','papps']) assert.ok(captured.includes(required),'phone scenario actually rendered '+required);
      if(scenario==='offline') assert.ok(!captured.includes('overview'),'offline overview is explicitly inapplicable');
      await command(page,'Turn off clipboard');
      await page.waitForFunction(() => UI.state.clipboard.enabled === false);
      await command(page,'Turn on clipboard');
      await page.waitForFunction(() => UI.state.clipboard.enabled === true);
      await privacy(page,prefix);
      await go(page,'connection');
      await page.emulateMedia({reducedMotion:'reduce'});
      const motion=await page.evaluate(() => ({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,animated:[...document.querySelectorAll('.dd-radar,.dd-signal')].some(el=>[getComputedStyle(el),getComputedStyle(el,'::after')].some(s=>s.animationName!=='none'))}));
      assert.ok(motion.matches && !motion.animated,'reduced motion suppresses decorative animation');
      await page.screenshot({type:'jpeg',quality:80,scale:'css',animations:'disabled',path:path.join(output,prefix+'-reduced-motion.jpg')});
      const audit=await page.evaluate(() => window.DuoDeskHarness.audit());
      errors.push(...audit.errors);
      assert.equal(audit.blockedRequests.length,0,'renderer made no external network requests');
      assert.equal(audit.nativeLaunchAttempts.length,0,'renderer never launches native helpers');
    } catch(error) { errors.push(error.stack || error.message); if(page) await page.screenshot({type:'jpeg',quality:80,scale:'css',animations:'disabled',path:path.join(output,prefix+'-failure.jpg')}).catch(()=>{}); }
    finally { if(app) await app.close().catch(error=>errors.push('Failed to close isolated app: '+error.message)); }
    const item={os,mode,scenario,host:({win32:'Windows',darwin:'macOS',linux:'Linux'}[process.platform]||process.platform)+'; target renderer simulated',captured,skipped,errors:[...new Set(errors)]};report.push(item);
    console.log(`${prefix}: ${captured.length} visible pages, ${skipped.length} explicitly skipped, ${item.errors.length} errors`);
    if(item.errors.length) console.log(item.errors.join('\n'));
    fs.writeFileSync(path.join(output,'results-expanded'+(process.env.DUODESK_QA_FILTER?'--'+process.env.DUODESK_QA_FILTER.replace(/[^a-z-]/g,''):'')+'.json'),JSON.stringify(report,null,2));
  }
  process.exitCode=report.some(r=>r.errors.length)?1:0;
})().catch(error=>{console.error(error);process.exitCode=1;});
