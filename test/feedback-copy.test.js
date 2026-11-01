'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const {createRequire}=require('node:module');
for(const platform of ['windows','mac','linux'])for(const mode of ['','mesh/'])test(`${platform}/${mode}copyText acknowledges full feedback and rejects oversized input`,()=>{
 const filename=path.join(__dirname,'..',platform,mode,'ipc.js');const handlers=new Map(),writes=[];const wc={mainFrame:{}};
 const electron={ipcMain:{handle:(name,fn)=>handlers.set(name,fn),on(){}},clipboard:{writeText:text=>writes.push(text)},app:{},BrowserWindow:{}};
 const mod={exports:{}};const actual=createRequire(filename);
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module:mod,exports:mod.exports,require:n=>n==='electron'?electron:actual(n),__dirname:path.dirname(filename),process:{env:{}},console});
 const setup=typeof mod.exports==='function'?mod.exports:mod.exports.setupIpc;
 setup({state:{connect:{}},settings:{},mainWindow:()=>({isDestroyed:()=>false,webContents:wc})});
 const event={sender:wc,senderFrame:wc.mainFrame};const copy=handlers.get('copyText');assert.equal(typeof copy,'function');
 const draft='Idea\n\n'+'x'.repeat(12000)+'\nSystem: Windows';assert.equal(copy(event,draft),true);assert.deepEqual(writes,[draft]);
 assert.throws(()=>copy(event,'x'.repeat(16385)),/invalid or too long/);assert.equal(writes.length,1);assert.throws(()=>copy(event,{}),/invalid or too long/);
});
