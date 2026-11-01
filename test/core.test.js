'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');const path=require('node:path');
for(const name of require('node:fs').readdirSync(path.join(__dirname,'..','shared','test')).filter(n=>n.endsWith('.js')&&n!=='movebench.js').map(n=>n.slice(0,-3))){
 test(name,()=>{const r=spawnSync(process.execPath,[path.join(__dirname,'..','shared','test',name+'.js')],{encoding:'utf8',timeout:60000,env:{...process.env,NODE_PATH:path.join(__dirname,'..','node_modules')}});assert.equal(r.status,0,r.stdout+'\n'+r.stderr);});
}
