// DuoDesk GPL-3.0. Return-edge guard for the ADB-driven phone, independent of its renderer.
'use strict';
function refusal(kvm, outward, now, cooldown = 250) {
  if (outward < 0) kvm.inward = (kvm.inward || 0) - outward;
  if (kvm.heldButtons && kvm.heldButtons.size) return 'button';
  const elapsed = now - kvm.arrivedAt;
  if (elapsed < cooldown) return 'cooldown';
  if (elapsed < 500 && (kvm.inward || 0) < 8) return 'arrival';
  return '';
}
module.exports = { refusal };
