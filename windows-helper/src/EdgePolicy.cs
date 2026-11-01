// DuoDesk modifications, 2026. GPL-3.0; original authors are credited in LICENSE and About.
// Pure geometry/guard decisions: also compiled by the native unit tests without input hooks.
using System;
using System.Drawing;

namespace MacShare
{
    static class EdgePolicy
    {
        public static bool ShouldLog(long now, ref long previous)
        {
            if (now - previous < 2000) return false;
            previous = now; return true;
        }
        public static bool AtEdge(Rectangle[] monitors, int x, int y, string side)
        {
            foreach (Rectangle m in monitors)
            {
                if (!m.Contains(x, y)) continue;
                if (side == "left") return x <= m.Left + 1;
                if (side == "right") return x >= m.Right - 2;
                if (side == "top") return y <= m.Top + 1;
                if (side == "bottom") return y >= m.Bottom - 2;
            }
            return false;
        }

        public static bool Outer(Rectangle[] monitors, int x, int y, string side)
        {
            if (!AtEdge(monitors, x, y, side)) return false;
            Rectangle current = Rectangle.Empty;
            foreach (Rectangle monitor in monitors) if (monitor.Contains(x, y)) { current = monitor; break; }
            foreach (Rectangle m in monitors)
            {
                // Follow the ray, not just the adjacent pixel: display gaps must not become exits.
                if (side == "left" && y >= m.Top && y < m.Bottom && m.Left < current.Left) return false;
                if (side == "right" && y >= m.Top && y < m.Bottom && m.Right > current.Right) return false;
                if (side == "top" && x >= m.Left && x < m.Right && m.Top < current.Top) return false;
                if (side == "bottom" && x >= m.Left && x < m.Right && m.Bottom > current.Bottom) return false;
            }
            return true;
        }

        public static string Refusal(bool outer, bool zone, bool button, double sinceCross, int cooldownMs,
            bool arrivalSide, double sinceArrival, double inward, int guardMs)
        {
            if (!outer) return "notOuterEdge";
            if (!zone) return "outsideZone";
            if (button) return "button";
            if (sinceCross < cooldownMs) return "cooldown";
            if (arrivalSide && sinceArrival < guardMs && inward < 8) return "arrival";
            return null;
        }
    }
}
