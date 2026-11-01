import test from 'node:test';
import assert from 'node:assert/strict';
import { createReleaseLoader } from '../lib/releases.mjs';
import { createHandler as download } from '../netlify/functions/download.mjs';
import { createHandler as status } from '../netlify/functions/release-status.mjs';
const release = { tag_name: 'v2.5.0', draft: false, prerelease: false, assets: [{name:'DuoDesk-Setup-2.5.0.exe',size:100,browser_download_url:'https://github.com/Sajeevanveeriah/DuoDesk/releases/download/v2.5.0/DuoDesk-Setup-2.5.0.exe'}] };
const request = () => new Request('https://duodesk.netlify.app/api/download?os=win');
test('verified metadata is cached only until its TTL expires', async () => {
  let calls=0, clock=1000;
  const load=createReleaseLoader({now:()=>clock,ttlMs:100,fetcher:async()=>{calls++;return Response.json(release);}});
  const first=await load();assert.equal(await load(),first);assert.equal(calls,1);
  assert.ok(Object.isFrozen(first.assets[0]));
  clock=1099;await load();assert.equal(calls,1);
  clock=1100;await load();assert.equal(calls,2);
});
test('concurrent release lookups share one in-flight request', async () => {
  let calls=0, finish;
  const load=createReleaseLoader({fetcher:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  const a=load(),b=load();assert.equal(calls,1);
  finish(Response.json(release));assert.equal(await a,await b);
});
test('failed request is not cached and next lookup can recover', async () => {
  let calls=0;
  const load=createReleaseLoader({fetcher:async()=>++calls===1?new Response('',{status:503}):Response.json(release)});
  await assert.rejects(load);await load();assert.equal(calls,2);
});
test('invalid metadata, empty assets and untrusted asset URLs are never cached', async () => {
  const invalid=[null,{...release,prerelease:true},{...release,tag_name:'v2.5.0-beta.1'},{...release,assets:[]},
    {...release,assets:[{...release.assets[0],browser_download_url:'https://evil.example/file.exe'}]},
    {...release,assets:[{...release.assets[0],size:0}]}];
  for (const metadata of invalid) {
    let calls=0;
    const load=createReleaseLoader({fetcher:async()=>{calls++;return Response.json(metadata);}});
    await assert.rejects(load);await assert.rejects(load);assert.equal(calls,2);
  }
});
test('expired metadata is not served when refresh fails', async () => {
  let clock=0,calls=0;
  const load=createReleaseLoader({now:()=>clock,ttlMs:10,fetcher:async()=>++calls===1?Response.json(release):new Response('',{status:503})});
  await load();clock=11;await assert.rejects(load);await assert.rejects(load);assert.equal(calls,3);
});
test('never-settling optional count cannot indefinitely block redirect without host context', async () => {
  let calls=0;
  const handler=download({fetcher:async()=>Response.json(release),countTimeoutMs:20,store:{add:()=>{calls++;return new Promise(()=>{});}}});
  const timeout=new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('redirect blocked')),500);t.unref();});
  const response=await Promise.race([handler(request()),timeout]);
  assert.equal(response.status,302);assert.equal(calls,1);
});
test('host context schedules one bounded count after redirect without waiting', async () => {
  let calls=0,background;
  const handler=download({fetcher:async()=>Response.json(release),countTimeoutMs:30,store:{add:()=>{calls++;return new Promise(()=>{});}}});
  const response=await handler(request(),{waitUntil:promise=>{background=promise;}});
  assert.equal(response.status,302);assert.ok(background);assert.equal(calls,1);
  await background;assert.equal(calls,1);
});
test('host scheduling failure also cannot break the download',async()=>{
  const handler=download({fetcher:async()=>Response.json(release),store:{add:async()=>{}}});
  assert.equal((await handler(request(),{waitUntil:()=>{throw new Error('host error');}})).status,302);
});
test('only successful public status responses receive CDN cache headers',async()=>{
  const good=await status(async()=>Response.json(release))(request());
  assert.equal(good.headers.get('Cache-Control'),'public, max-age=30, s-maxage=120');
  assert.equal(good.headers.get('Netlify-CDN-Cache-Control'),'public, s-maxage=120');
  const unavailable=await status(async()=>new Response('',{status:404}))(request());
  assert.equal(unavailable.headers.get('Cache-Control'),'no-store');
});
