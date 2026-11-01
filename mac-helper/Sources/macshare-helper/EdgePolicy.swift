// DuoDesk modifications, 2026. GPL-3.0; see LICENSE.
// Pure geometry shared by the native crossing checks and executable Swift tests.
struct EdgeRect {
  let x: Double, y: Double, width: Double, height: Double
  var right: Double { x + width }
  var bottom: Double { y + height }
  func contains(_ px: Double, _ py: Double) -> Bool {
    px >= x && px < right && py >= y && py < bottom
  }
}

enum EdgePolicy {
  static func arrivalBlocked(elapsed: Double, inward: Double, window: Double) -> Bool {
    elapsed < window && inward < 8
  }
  static func inZone(_ offset: Double, _ zones: [ClosedRange<Double>]?) -> Bool {
    zones.map { ranges in ranges.contains { $0.contains(offset) } } ?? true
  }
  static func guardReason(buttonsHeld: Bool, elapsed: Double, cooldown: Double) -> String? {
    if buttonsHeld { return "button" }
    if elapsed < cooldown { return "cooldown" }
    return nil
  }
  static func atEdge(_ x: Double, _ y: Double, side: String, displays: [EdgeRect]) -> Bool {
    guard let d = displays.first(where: { $0.contains(x, y) }) else { return false }
    switch side {
    case "right": return x >= d.right - 1.5
    case "left": return x <= d.x + 0.5
    case "bottom": return y >= d.bottom - 1.5
    case "top": return y <= d.y + 0.5
    default: return false
    }
  }

  static func isOuter(_ x: Double, _ y: Double, side: String, displays: [EdgeRect]) -> Bool {
    guard atEdge(x, y, side: side, displays: displays),
          let d = displays.first(where: { $0.contains(x, y) }) else { return false }
    // Look along the entire outward ray, including offset, overlapping and gapped layouts.
    switch side {
    case "right": return !displays.contains { $0.right > d.right && y >= $0.y && y < $0.bottom }
    case "left": return !displays.contains { $0.x < d.x && y >= $0.y && y < $0.bottom }
    case "bottom": return !displays.contains { $0.bottom > d.bottom && x >= $0.x && x < $0.right }
    case "top": return !displays.contains { $0.y < d.y && x >= $0.x && x < $0.right }
    default: return false
    }
  }
}

struct EdgeLogLimiter {
  private var last = -Double.infinity
  mutating func allow(_ now: Double) -> Bool {
    guard now - last >= 2 else { return false }
    last = now
    return true
  }
}
