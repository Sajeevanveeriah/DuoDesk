// DuoDesk modifications, 2026. GPL-3.0; preserves the upstream kvm.displays protocol.
'use strict';
const P = require('../../shared/protocol');
const G = require('../../shared/kvm-geom');
const { normalizeDisplays } = require('../../shared/screen-mesh');

class MeshGeometry {
  constructor({ bus, screen, edges, changed }) {
    Object.assign(this, { bus, screen, edges, changed });
    this.peers = new Map();
    this.mine = [];
    this.refresh = () => {
      this.mine = screen ? normalizeDisplays(screen.getAllDisplays().map((d) => ({ id: String(d.id), x: d.bounds.x,
        y: d.bounds.y, w: d.bounds.width, h: d.bounds.height, scale: d.scaleFactor }))) : [];
      for (const id of bus.connectedIds()) this.send(id);
      changed();
    };
    if (screen) {
      this.mine = normalizeDisplays(screen.getAllDisplays().map((d) => ({ id: String(d.id), x: d.bounds.x,
        y: d.bounds.y, w: d.bounds.width, h: d.bounds.height, scale: d.scaleFactor })));
      for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(event, this.refresh);
    }
    bus.on(P.T.KVM_DISPLAYS, (msg, id) => { this.peers.set(id, normalizeDisplays(msg.displays)); changed(); });
    bus.onPeer('welcome', (id) => { this.peers.delete(id); this.send(id); changed(); });
    bus.onPeer('closed', (id) => { this.peers.delete(id); changed(); });
  }
  send(id) { this.bus.send(id, { t: P.T.KVM_DISPLAYS, displays: this.mine }); }
  arrangement(id, side) { return G.normalize({ side, along: null }, this.mine, this.peers.get(id) || []); }
  zones(sides) {
    const edges = this.edges();
    return Object.fromEntries(sides.map((side) => [side, G.zonesText(this.mine, this.peers.get(edges[side]) || [], this.arrangement(edges[side], side))]));
  }
  toPeer(id, side, offset) {
    if (!id || !side || typeof offset !== 'number') return offset;
    return G.mapOffset(this.mine, this.peers.get(id) || [], this.arrangement(id, side), offset);
  }
  destroy() {
    if (this.screen) for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) this.screen.removeListener(event, this.refresh);
  }
}
module.exports = { MeshGeometry };
