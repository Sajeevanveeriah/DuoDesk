// DuoDesk modifications. GPL-3.0. Uses TwinDesk's existing bounded image protocol.
'use strict';
const crypto = require('crypto');
const P = require('./protocol');
const { ImageIn, pngOf, sigOf, isPng } = require('./clipimage');
const { validStamp } = require('./clipsync');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const delay = () => new Promise((resolve) => setTimeout(resolve, 15));

class MeshClipImages {
  // session(id) supplies authenticated transport/backlog. Unknown transport fails closed.
  // io is optional: tests inject read() -> {png,w,h,sig}, write(pic) -> signature.
  constructor(o) {
    this.o = o;
    this.policy = new Map();
    this.seen = new Set();
    this.epoch = 0;
    this.pending = null;
    this.sentSig = this.receivedSig = '';
    this.disposed = false;
    this.busy = false;
    this.listeners = [];
    const on = (type, fn) => { o.bus.on(type, fn); this.listeners.push([type, fn]); };
    on(P.T.CLIP_POLICY, (m, id) => {
      this.policy.set(id, { accept: m.accept !== false, images: m.images === true });
      if (!this.accept) this.text();
      o.onChange?.();
    });
    on(P.T.CLIP_IMAGE, (m, id) => this.header(m, id));
    on(P.T.CLIP_IMAGE_PART, (m, id) => this.part(m, id));
    o.bus.onPeer('welcome', (id) => { this.policy.delete(id); if (o.ownsPolicy) this._policy(id); });
    o.bus.onPeer('closed', (id) => {
      this.policy.delete(id);
      if (this.pending?.from === id) this.text();
    });
    o.bus.onPeer('transport', (id) => { if (!this._ip(id) && this.pending?.from === id) this.text(); });
  }
  get accept() { const c = this.o.cfg(); return !this.disposed && !!(c.enabled && c.images && c.receive); }
  get peerImages() { return this.o.bus.connectedIds().some((id) => this._takes(id)); }
  _session(id) { return this.o.session ? this.o.session(id) : null; }
  _ip(id) { const t = this._session(id)?.transport; return t === 'ip' || t === 'usb' || t === 'wired'; }
  _connected(id) { return this.o.bus.connectedIds().includes(id); }
  _takes(id) { const p = this.policy.get(id); return this._connected(id) && this._ip(id) && !!p?.accept && !!p?.images; }
  _policy(id) { this.o.bus.send(id, {t:P.T.CLIP_POLICY, accept: !!(this.o.cfg().enabled && this.o.cfg().receive), images:this.accept}); }
  applySettings() {
    if (!this.accept || !this.o.cfg().send) this.text();
    if (this.o.ownsPolicy) for (const id of this.o.bus.connectedIds()) this._policy(id);
  }
  text() { this.epoch++; clearTimeout(this.expiry); this.pending?.input.drop(); this.pending = null; return this.writing || Promise.resolve(); }
  _remember(key) {
    this.seen.add(key);
    while (this.seen.size > 256) this.seen.delete(this.seen.values().next().value);
  }
  _current(stamp, id) {
    const c = this.o.latest.cur;
    return c && c.kind === 'image' && c.o === stamp.o && c.ts === stamp.ts && c.id === id;
  }
  async _read() {
    if (this.o.io) return this.o.io.read();
    const e = this.o.nativeImage ? this.o : require('electron');
    const cb = this.o.clipboard || e.clipboard;
    let image;
    if (typeof cb.readImage === 'function') image = cb.readImage();
    else for (const item of await cb.read()) {
      if (!item.types.includes('image/png')) continue;
      image = e.nativeImage.createFromBuffer(Buffer.from(await (await item.getType('image/png')).arrayBuffer()));
      break;
    }
    const pic = image && pngOf(image);
    return pic ? {...pic, sig:sigOf(image)} : null;
  }
  async _write(pic) {
    if (this.o.io) return this.o.io.write(pic);
    const e = this.o.nativeImage ? this.o : require('electron');
    const cb = this.o.clipboard || e.clipboard;
    const image = e.nativeImage.createFromBuffer(pic.png);
    if (image.isEmpty()) return '';
    if (typeof cb.writeImage === 'function') cb.writeImage(image);
    else {
      const { ClipboardItem } = require('electron');
      await cb.write([new ClipboardItem({'image/png':new Blob([pic.png], {type:'image/png'})})]);
    }
    return sigOf(image);
  }
  async offerClipboard(concealed) {
    const c = this.o.cfg();
    if (this.busy || this.writing || this.disposed || !c.enabled || !c.images || !c.send || !this.peerImages) return '';
    this.busy = true;
    try {
      const revision = this.epoch;
      const pic = await this._read();
      if (!pic || revision !== this.epoch || !isPng(pic.png) || pic.png.length > P.CLIP_IMAGE_MAX_BYTES) return '';
      if (pic.sig === this.sentSig || pic.sig === this.receivedSig) return '';
      if (concealed) return 'skipped a picture marked private';
      this.text();
      const id = crypto.randomBytes(16).toString('hex');
      const stamp = this.o.latest.copied('image', id);
      this.sentSig = pic.sig;
      this._remember(stamp.o + ':' + id);
      const ok = await this._fan({...pic,id}, stamp, '', this.epoch);
      if (!ok) this.sentSig = '';
      this.o.onChange?.();
      return ok ? 'sent' : '';
    } finally { this.busy = false; }
  }
  header(m, from) {
    if (!this.accept || !this._connected(from) || !this._ip(from)) return;
    const input = new ImageIn();
    const pic = input.header(m);
    if (!pic && !input.cur) return; // validates declared memory and part bounds before accepting a stamp
    const origin = validStamp(m) ? m.o : from;
    const key = origin + ':' + m.id;
    if (this.seen.has(key)) return;
    if (!this.o.latest.accept({...m, from}, 'image', m.id)) return;
    this.text();
    this._remember(key);
    const c = this.o.latest.cur;
    const pending = this.pending = {from,input,id:m.id,stamp:{ts:c.ts,o:c.o},epoch:this.epoch};
    this.expiry = setTimeout(() => { if (this.pending === pending) this.text(); }, 60000);
    this.expiry.unref?.();
    if (pic) this._got(pic,pending).catch((e) => this._error(e));
  }
  part(m, from) {
    const p = this.pending;
    if (!p || p.from !== from || !this.accept || !this._ip(from) || !this._connected(from)) return;
    const pic = p.input.part(m);
    if (pic) this._got(pic,p).catch((e) => this._error(e));
    else if (!p.input.cur) this.pending = null;
  }
  async _got(pic, p) {
    if (this.writing) await this.writing.catch(() => {});
    if (p.epoch !== this.epoch || !this._current(p.stamp,p.id) || !this.accept) return;
    this.pending = null;
    clearTimeout(this.expiry);
    const writing = this.writing = this._write(pic);
    let signature;
    try { signature = await writing; } finally { if (this.writing === writing) this.writing = null; }
    if (!signature || p.epoch !== this.epoch || !this._current(p.stamp,p.id)) return;
    this.receivedSig = signature;
    this.o.onChange?.();
    // Relay only a complete validated PNG, preserving its original clock/id. No partial fan-out.
    if (this.o.cfg().send) await this._fan(pic,p.stamp,p.from,p.epoch);
  }
  async _fan(pic, stamp, from, epoch) {
    const ids = this.o.bus.connectedIds().filter((id) => id !== from && id !== stamp.o && this._takes(id)).slice(0,P.MAX_DEVICES || 10);
    const results = await Promise.all(ids.map(async (id) => {
      const live = () => !this.disposed && epoch === this.epoch && this._current(stamp,pic.id) && this.o.cfg().enabled && this.o.cfg().images && this.o.cfg().send && this._takes(id);
      const parts = Math.ceil(pic.png.length/P.CLIP_IMAGE_PART_BYTES);
      if (!live() || this.o.bus.send(id,{t:P.T.CLIP_IMAGE,id:pic.id,w:pic.w,h:pic.h,bytes:pic.png.length,parts,...stamp}) === false) return false;
      for (let i=0;i<parts;i++) {
        const start = Date.now();
        while ((this._session(id)?.bufferedAmount || 0) > 512*1024) {
          if (!live() || Date.now()-start > 5000) return false;
          await delay();
        }
        if (!live()) return false;
        const data=pic.png.subarray(i*P.CLIP_IMAGE_PART_BYTES,(i+1)*P.CLIP_IMAGE_PART_BYTES).toString('base64');
        if (this.o.bus.send(id,{t:P.T.CLIP_IMAGE_PART,id:pic.id,i,data}) === false) return false;
        await tick(); // yields to text copies, cancellation and input between parts
      }
      return true;
    }));
    return results.some(Boolean);
  }
  _error(e) { console.warn('[clipboard] image not applied: ' + e.message); }
  destroy() {
    this.disposed = true; this.text(); this.policy.clear(); this.seen.clear();
    for (const [type, fn] of this.listeners) this.o.bus.off?.(type,fn);
  }
}
module.exports = { MeshClipImages };
