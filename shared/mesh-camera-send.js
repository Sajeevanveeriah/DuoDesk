// DuoDesk modifications, 2026. GPL-3.0. One capture stream, one encrypted WebRTC connection per viewer.
'use strict';
class MeshCameraSender {
  constructor({ media, PeerConnection, send }) {
    Object.assign(this, { media, PeerConnection, send });
    this.peers = new Map(); this.stream = null; this.pendingCapture = null; this.generation = 0;
  }
  async capture(deviceId, alive = () => true) {
    if (!alive()) throw new Error('Capture cancelled');
    if (this.stream) return this.stream;
    if (this.pendingCapture) { try { await this.pendingCapture; } catch (_) { /* prior capture cancelled */ } return this.capture(deviceId, alive); }
    const generation = this.generation;
    const video = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } };
    if (deviceId) video.deviceId = { exact: deviceId };
    const pending = this.media.getUserMedia({ video, audio: false }).then((stream) => {
      if (generation !== this.generation) { stream.getTracks().forEach((t) => t.stop()); throw new Error('Capture cancelled'); }
      this.stream = stream;
      for (const track of stream.getTracks()) track.onended = () => this.failAll('The camera disconnected or permission was revoked');
      return stream;
    });
    this.pendingCapture = pending;
    try { return await pending; } finally { if (this.pendingCapture === pending) this.pendingCapture = null; }
  }
  async add(id, deviceId = '') {
    if (this.peers.has(id)) return;
    const peer = { pc: null, ice: [], token: {} }; this.peers.set(id, peer);
    const alive = () => this.peers.get(id) === peer;
    try {
      const stream = await this.capture(deviceId, alive);
      if (!alive()) return;
      const pc = peer.pc = new this.PeerConnection({ iceServers: [] });
      for (const track of stream.getVideoTracks()) pc.addTransceiver(track, { direction: 'sendonly', streams: [stream] });
      pc.onicecandidate = (event) => event.candidate && alive() && this.send({ t: 'ice', peer: id, candidate: event.candidate.toJSON() });
      pc.onconnectionstatechange = () => {
        if (!alive()) return;
        if (pc.connectionState === 'connected') this.send({ t: 'status', peer: id, status: 'live' });
        else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          this.send({ t: 'status', peer: id, status: 'failed', error: 'Camera connection ended' }); this.remove(id);
        }
      };
      await pc.setLocalDescription(await pc.createOffer());
      if (alive()) this.send({ t: 'offer', peer: id, sdp: pc.localDescription.sdp });
    } catch (error) {
      if (!alive()) return;
      this.send({ t: 'status', peer: id, status: 'failed', error: String(error.message || error).slice(0, 200) });
      this.remove(id);
    }
  }
  async answer(id, sdp) {
    const peer = this.peers.get(id); if (!peer || !peer.pc) return;
    try {
      await peer.pc.setRemoteDescription({ type: 'answer', sdp });
      if (this.peers.get(id) !== peer) return;
      for (const candidate of peer.ice.splice(0)) await peer.pc.addIceCandidate(candidate);
    } catch (error) { this.send({ t: 'status', peer: id, status: 'failed', error: String(error.message).slice(0, 200) }); this.remove(id); }
  }
  async ice(id, candidate) {
    const peer = this.peers.get(id); if (!peer) return;
    if (!peer.pc || !peer.pc.remoteDescription) { if (peer.ice.length < 100) peer.ice.push(candidate); return; }
    try { await peer.pc.addIceCandidate(candidate); } catch (_) { /* obsolete candidate */ }
  }
  remove(id) {
    const peer = this.peers.get(id); if (!peer) return;
    this.peers.delete(id); if (peer.pc) peer.pc.close();
    if (!this.peers.size) this.stopCapture();
  }
  stopCapture() {
    this.generation++;
    const stream = this.stream; this.stream = null;
    if (stream) for (const track of stream.getTracks()) { track.onended = null; track.stop(); }
  }
  stop() {
    const peers = [...this.peers.values()]; this.peers.clear();
    for (const peer of peers) if (peer.pc) peer.pc.close();
    this.stopCapture();
  }
  failAll(error) {
    for (const id of this.peers.keys()) this.send({ t: 'status', peer: id, status: 'failed', error });
    this.stop();
  }
  async devices() {
    try { this.send({ t: 'devices', list: (await this.media.enumerateDevices()).filter((d) => d.kind === 'videoinput').map((d) => ({ id: d.deviceId, label: d.label })) }); }
    catch (error) { this.send({ t: 'devices', list: [] }); }
  }
}
if (typeof module !== 'undefined') module.exports = { MeshCameraSender };
else {
  const sender = new MeshCameraSender({ media: navigator.mediaDevices, PeerConnection: RTCPeerConnection, send: (m) => window.cam.send(m) });
  window.cam.on((m) => {
    if (!m) return;
    if (m.t === 'add') sender.add(m.peer, m.deviceId);
    else if (m.t === 'remove') sender.remove(m.peer);
    else if (m.t === 'stop') sender.stop();
    else if (m.t === 'answer') sender.answer(m.peer, m.sdp);
    else if (m.t === 'ice') sender.ice(m.peer, m.candidate);
    else if (m.t === 'devices') sender.devices();
  });
  window.addEventListener('beforeunload', () => sender.stop());
  navigator.mediaDevices.addEventListener('devicechange', () => sender.devices());
  window.cam.send({ t: 'ready' });
}
