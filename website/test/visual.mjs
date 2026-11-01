import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '../../node_modules/playwright/index.mjs';
const publicDir = path.resolve('public');
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/release-status') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({available:false,platforms:[]})); return; }
  if (pathname === '/api/view') { res.setHeader('Content-Type','application/json'); res.end('{"counted":false}'); return; }
  if (pathname === '/api/analytics') { res.statusCode=401;res.setHeader('Content-Type','application/json');res.end('{"error":"Sign-in failed."}');return; }
  const file = path.resolve(publicDir, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(publicDir + path.sep)) {res.statusCode=403;res.end();return;}
  try {
    res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf'})[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'");
    res.end(await readFile(file));
  } catch {res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge',headless:true}:{headless:true});
await mkdir('test/output',{recursive:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.goto(origin);await page.locator('#app-figure').waitFor({state:'visible'});await page.locator('#release-label').filter({hasText:'In development'}).waitFor();
  await page.locator('#tab-clipboard').click();await page.locator('#try-feature').click();
  assert.equal(await page.locator('#demo-state').textContent(),'Sample text pasted');
  await page.locator('#tab-clipboard').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-screen').getAttribute('aria-selected'),'true');
  await page.locator('#tab-phone').click();await page.locator('#try-feature').click();
  assert.match(await page.locator('#right-content').textContent(),/Sample message/);
  await page.locator('#system').selectOption('win-arm');
  assert.match(await page.locator('#download-link').getAttribute('href'),/os=win&arch=arm64/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#tab-mouse').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test/output/website-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test/output/website-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.aurora').evaluate(el=>getComputedStyle(el,':after').animationName),'none');
  await page.goto(origin+'/admin.html');await page.locator('#password').fill('test-only-password');await page.locator('button[type=submit]').click();
  await page.locator('#message').filter({hasText:'Sign-in failed'}).waitFor();
  assert.equal(await page.locator('#password').inputValue(),'');assert.equal(await page.locator('#data').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop/mobile layouts, four feature controls, keyboard tab navigation, OS download selection, reduced motion and private login failure; no page errors. Local fake API only.');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
