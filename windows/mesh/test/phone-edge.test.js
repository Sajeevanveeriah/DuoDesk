// DuoDesk GPL-3.0. The phone's return edge follows the same held-button and arrival rules.
'use strict';
const assert = require('node:assert/strict');
const { refusal } = require('../../phone-edge');
for (let button = 0; button < 5; button++) assert.equal(refusal({ heldButtons: new Set([button]), arrivedAt: 0 }, 1, 1000), 'button');
assert.equal(refusal({ arrivedAt: 0 }, 1, 249), 'cooldown');
assert.equal(refusal({ arrivedAt: 0, inward: 0 }, 1, 300), 'arrival');
assert.equal(refusal({ arrivedAt: 0, inward: 8 }, 1, 300), '');
console.log('PASS 8 phone return-edge guard checks');
