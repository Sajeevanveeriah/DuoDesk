// DuoDesk modifications: 2026-11-01; original notices retained.
// TwinDesk — Copyright (C) 2026 inukaasith. GPL-3.0, see LICENSE.
// Tests for shared/kvm-moves.js: moves summed per turn, held while backed up, flushed before a click.
// Run with: node shared/test/kvm-moves.js
'use strict';

const assert = require('assert');
const { KvmMoves } = require('../kvm-moves.js');

const turn = () => new Promise((r) => setImmediate(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // One message per turn, summed.
  {
    const out = [];
    const m = new KvmMoves({ send: (x) => out.push(x) });
    m.add(1, 2);
    m.add(3, 4);
    assert.deepStrictEqual(out, [], 'not before the turn ends');
    await turn();
    assert.deepStrictEqual(out, [{ dx: 4, dy: 6 }]);
    m.add(1, 1);
    await turn();
    assert.strictEqual(out.length, 2, 'the next turn: the next message');
  }

  // flush: at once (a click goes after the moves before it); drop: forgotten.
  {
    const out = [];
    const m = new KvmMoves({ send: (x) => out.push(x) });
    m.add(5, 0);
    m.flush();
    assert.deepStrictEqual(out, [{ dx: 5, dy: 0 }]);
    await turn();
    assert.strictEqual(out.length, 1, 'nothing left to send');
    m.add(7, 0);
    m.drop();
    await turn();
    assert.strictEqual(out.length, 1, 'dropped');
  }

  // Backed up: summed while it is, then one message once there's room.
  {
    const out = [];
    let backlog = 100000;
    const m = new KvmMoves({ send: (x) => out.push(x), backlog: () => backlog, limit: () => 16384, maxWait: () => Infinity });
    for (let i = 0; i < 50; i++) {
      m.add(1, 0);
      await wait(1);
    }
    assert.deepStrictEqual(out, [], 'held while backed up');
    backlog = 0;
    await wait(10);
    assert.deepStrictEqual(out, [{ dx: 50, dy: 0 }], 'one message with all of it');
  }

  // Persistent backpressure: exercise the 16 ms deadline with a controlled clock, rather
  // than assuming Windows schedules a particular number of 1 ms timers in 200 ms.
  {
    const out = [];
    const m = new KvmMoves({ send: x => out.push(x), backlog: () => 1e6, limit: () => 16384, maxWait: () => 16 });
    const originalNow = Date.now;
    let now = 1000;
    Date.now = () => now;
    m._schedule = () => {}; // the test advances scheduling explicitly
    try {
      m.add(3, 2); m._try();
      now += 15; m.add(4, 1); m._try();
      assert.deepStrictEqual(out, [], 'backpressure holds movement before the deadline');
      now += 1; m._try();
      assert.deepStrictEqual(out, [{ dx: 7, dy: 3 }], 'deadline releases all accumulated movement');
      now += 1; m.add(5, 6); m._try();
      now += 16; m._try();
      assert.deepStrictEqual(out, [{ dx: 7, dy: 3 }, { dx: 5, dy: 6 }], 'next batch has its own deadline');
      assert.strictEqual(out.reduce((sum, x) => sum + x.dx, 0), 12, 'nothing lost');
    } finally { m.drop(); Date.now = originalNow; }
  }

  // Through Bluetooth: every delay ms, and held (no maxWait) while the radio is behind.
  {
    const out = [];
    let backlog = 0;
    const m = new KvmMoves({ send: (x) => out.push(x), delay: () => 16, backlog: () => backlog, limit: () => 512 });
    m.add(1, 0);
    await turn();
    assert.strictEqual(out.length, 0, 'waits the delay');
    await wait(25);
    assert.strictEqual(out.length, 1);
    backlog = 1000;
    m.add(1, 0);
    await wait(80);
    assert.strictEqual(out.length, 1, 'held while the radio is behind');
    backlog = 0;
    await wait(25);
    assert.strictEqual(out.length, 2);
  }

  console.log('kvm-moves: ok');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
