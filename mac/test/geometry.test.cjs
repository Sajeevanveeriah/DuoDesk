// DuoDesk mesh geometry regression. GPL-3.0.
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { MeshGeometry } = require('../mesh/geometry');
const P = require('../../shared/protocol');
const messages = new Map(); const lifecycle = new Map(); const sent = [];
const screen = new EventEmitter(); screen.getAllDisplays = () => [{id:1,bounds:{x:0,y:0,width:1920,height:1080},scaleFactor:1}];
let changes = 0;
const g = new MeshGeometry({ bus: { on:(t,f)=>messages.set(t,f),onPeer:(t,f)=>lifecycle.set(t,f),connectedIds:()=>['small','wide'],send:(id,m)=>sent.push({id,m}) }, screen,
  edges:()=>({right:'small',top:'wide'}),changed:()=>changes++ });
messages.get(P.T.KVM_DISPLAYS)({displays:[{id:'small',x:0,y:0,w:800,h:600,scale:1}]},'small');
messages.get(P.T.KVM_DISPLAYS)({displays:[{id:'wide',x:0,y:0,w:3000,h:1200,scale:1}]},'wide');
const z=g.zones(['right','top']);
assert.notEqual(z.right,z.top,'each edge uses its own peer geometry');
assert.equal(g.toPeer('small','right',0.5),0.5,'centres map together');
lifecycle.get('welcome')('new'); assert.equal(sent.at(-1).m.t,P.T.KVM_DISPLAYS);
screen.emit('display-metrics-changed'); assert.ok(changes>=3); assert.equal(sent.at(-1).m.displays.length,1);
g.destroy(); assert.equal(screen.listenerCount('display-metrics-changed'),0);
console.log('PASS Mac mesh per-side geometry, offset mapping and display change lifecycle');
