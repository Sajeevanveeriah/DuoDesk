// DuoDesk modifications. GPL-3.0. Wire/ordering tests with an in-memory clipboard and bus.
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const P = require('../protocol');
const { Latest } = require('../clipsync');
const { MeshClipImages } = require('../mesh-clipimages');
const settle = async () => { for(let i=0;i<12;i++) await new Promise(setImmediate); };
function png(size=100) { const b=Buffer.alloc(size,7); Buffer.from('89504e470d0a1a0a','hex').copy(b); return b; }
const signature = (b) => crypto.createHash('sha256').update(b).digest('hex');
function network(edges) {
  const nodes=new Map(), trace=[];
  for(const id of new Set(edges.flat())) {
    const bus=new EventEmitter(), peers=new EventEmitter();
    const n={id,bus,peers,clipboard:null,writes:0,cfg:{enabled:true,images:true,send:true,receive:true}, transports:{}, latest:new Latest({selfId:id})};
    nodes.set(id,n);
    bus.connectedIds=()=>edges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
    bus.onPeer=(event,fn)=>peers.on(event,fn);
    bus.send=(to,m)=>{ trace.push({from:id,to,m}); if(n.intercept?.(to,m)===false)return false; nodes.get(to).bus.emit(m.t,m,id); return true; };
    n.images=new MeshClipImages({ownsPolicy:true,bus,latest:n.latest,cfg:()=>n.cfg,session:(to)=>({transport:n.transports[to]||'ip',bufferedAmount:0}),io:{
      read:async()=>n.clipboard&&Buffer.isBuffer(n.clipboard)?{png:n.clipboard,w:16,h:16,sig:signature(n.clipboard)}:null,
      write:async(pic)=>{if(n.writeGate)await n.writeGate; n.clipboard=pic.png; n.writes++; return signature(pic.png);},
    }});
  }
  const close=()=>{for(const n of nodes.values())n.images.destroy();};
  for(const n of nodes.values())n.images.applySettings();
  return {nodes,trace,close};
}
(async()=>{
  let passed=0;
  const test=async(name,fn)=>{await fn();passed++;console.log('passed: '+name);};
  await test('chunked image relays across a chain once, with original clock and no echo',async()=>{
    const w=network([['A','B'],['B','C']]); try {
      const [a,b,c]=['A','B','C'].map(id=>w.nodes.get(id));a.clipboard=png(P.CLIP_IMAGE_PART_BYTES+5);
      assert.equal(await a.images.offerClipboard(false),'sent');await settle();
      assert.deepEqual(c.clipboard,a.clipboard);assert.equal(b.writes,1);assert.equal(c.writes,1);assert.equal(a.writes,0);
      assert.equal(c.latest.cur.o,'A');assert.equal(c.latest.cur.ts,a.latest.cur.ts);
      assert.equal(await c.images.offerClipboard(false),'');
      assert(w.trace.filter(x=>x.m.t===P.T.CLIP_IMAGE_PART).length===4);
    } finally {w.close();}
  });
  await test('triangle deduplicates direct and relayed images',async()=>{
    const w=network([['A','B'],['B','C'],['A','C']]);try{const a=w.nodes.get('A');a.clipboard=png();await a.images.offerClipboard(false);await settle();
      assert.equal(w.nodes.get('B').writes,1);assert.equal(w.nodes.get('C').writes,1);
    }finally{w.close();}
  });
  await test('receive policy and Bluetooth exclude image traffic',async()=>{
    const w=network([['A','B'],['A','C']]);try{const a=w.nodes.get('A'),b=w.nodes.get('B');
      a.transports.C='ble';b.cfg.images=false;b.images.applySettings();a.clipboard=png();
      assert.equal(await a.images.offerClipboard(false),'');assert.equal(w.trace.filter(x=>x.m.t===P.T.CLIP_IMAGE).length,0);
      b.bus.emit(P.T.CLIP_IMAGE,{id:'forbidden',png:png().toString('base64'),ts:1,o:'A'},'A');await settle();assert.equal(b.writes,0);
    }finally{w.close();}
  });
  await test('newer text cancels an image in flight',async()=>{
    const w=network([['A','B']]);try{const a=w.nodes.get('A'),b=w.nodes.get('B');a.clipboard=png(P.CLIP_IMAGE_PART_BYTES*2+5);
      a.intercept=(_to,m)=>{if(m.t===P.T.CLIP_IMAGE_PART&&m.i===0){b.latest.copied('text');b.images.text();b.clipboard='new text';}};
      await a.images.offerClipboard(false);await settle();assert.equal(b.clipboard,'new text');assert.equal(b.writes,0);
    }finally{w.close();}
  });
  await test('oversize, malformed, wrong sender and out-of-order parts are rejected',async()=>{
    const w=network([['A','B'],['C','B']]);try{const b=w.nodes.get('B');
      b.images.header({id:'big',bytes:P.CLIP_IMAGE_MAX_BYTES+1,parts:41},'A');assert.equal(b.images.pending,null);
      b.images.header({id:'bad',png:'not png'},'A');assert.equal(b.images.pending,null);
      b.images.header({id:'x',bytes:100,parts:1},'A');
      b.images.part({id:'x',i:0,data:png().toString('base64')},'C');assert(b.images.pending);
      b.images.part({id:'x',i:1,data:png().toString('base64')},'A');assert.equal(b.images.pending,null);assert.equal(b.writes,0);
    }finally{w.close();}
  });
  await test('private images and failed sends are not reported as sent',async()=>{
    const w=network([['A','B']]);try{const a=w.nodes.get('A');a.clipboard=png();
      assert.equal(await a.images.offerClipboard(true),'skipped a picture marked private');
      a.intercept=()=>false;assert.equal(await a.images.offerClipboard(false),'');assert.equal(w.nodes.get('B').writes,0);
    }finally{w.close();}
  });
  await test('text waits for an already-started async clipboard write',async()=>{
    const w=network([['A','B']]);try{const b=w.nodes.get('B');let release;b.writeGate=new Promise(r=>release=r);
      b.images.header({id:'async',png:png().toString('base64')},'A');b.latest.copied('text');
      const text=b.images.text().then(()=>{b.clipboard='new text';});release();await text;await settle();assert.equal(b.clipboard,'new text');
    }finally{w.close();}
  });
  await test('newer images serialise behind an older asynchronous write',async()=>{
    const w=network([['A','B']]);try{const b=w.nodes.get('B');const jobs=[];
      b.images.o.io.write=(pic)=>new Promise(resolve=>jobs.push(()=>{b.clipboard=pic.png;resolve(signature(pic.png));}));
      const first=png(100),second=png(101);
      b.images.header({id:'first',png:first.toString('base64'),ts:Date.now(),o:'A'},'A');
      b.images.header({id:'second',png:second.toString('base64'),ts:Date.now()+1,o:'A'},'A');
      assert.equal(jobs.length,1,'second clipboard write must not race the first');
      jobs[0]();await settle();assert.equal(jobs.length,2);
      jobs[1]();await settle();assert.deepEqual(b.clipboard,second);
    }finally{w.close();}
  });
  await test('disconnect drops pending image and unknown transport fails closed',async()=>{
    const w=network([['A','B']]);try{const b=w.nodes.get('B');b.images.header({id:'x',bytes:100,parts:1},'A');assert(b.images.pending);
      b.peers.emit('closed','A');assert.equal(b.images.pending,null);b.transports.A='unknown';
      b.images.header({id:'y',png:png().toString('base64')},'A');await settle();assert.equal(b.writes,0);
    }finally{w.close();}
  });
  console.log(passed+' mesh image clipboard tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
