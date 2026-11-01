// DuoDesk GPL-3.0. Synthetic tests: no hooks, injection, network or application startup.
using System;
using System.Drawing;
using MacShare;

class EdgePolicyTests
{
    static int checks;
    static void Check(bool result, string name) { checks++; if (!result) throw new Exception(name); }
    static void Main()
    {
        var one = new[] { new Rectangle(0, 0, 1920, 1080) };
        Check(EdgePolicy.Outer(one, 1919, 500, "right"), "right boundary");
        Check(EdgePolicy.Outer(one, 0, 500, "left"), "left boundary");
        Check(EdgePolicy.Outer(one, 500, 0, "top"), "top boundary");
        Check(EdgePolicy.Outer(one, 500, 1079, "bottom"), "bottom boundary");
        Check(!EdgePolicy.Outer(one, 1000, 500, "right"), "interior is not edge");
        Check(!EdgePolicy.Outer(one, -1, 500, "left"), "outside monitors");
        var right = new[] { one[0], new Rectangle(1920, 0, 1280, 1024) };
        Check(!EdgePolicy.Outer(right, 1919, 500, "right"), "adjacent monitor prevents exit");
        Check(EdgePolicy.Outer(right, 1919, 1050, "right"), "exposed part remains edge");
        var gap = new[] { one[0], new Rectangle(2200, 200, 1280, 800) };
        Check(!EdgePolicy.Outer(gap, 1919, 500, "right"), "monitor beyond gap prevents exit");
        Check(EdgePolicy.Outer(gap, 1919, 100, "right"), "no monitor along ray");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(-1500, 0, 1280, 1080) }, 0, 500, "left"), "negative-coordinate gap");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(0, -1200, 1920, 1080) }, 500, 0, "top"), "top gap");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(0, 1200, 1920, 1080) }, 500, 1079, "bottom"), "bottom gap");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(1000, 0, 1920, 1080) }, 1919, 500, "right"), "overlapping monitor extends right");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(-1000, 0, 1920, 1080) }, 0, 500, "left"), "overlapping monitor extends left");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(0, -500, 1920, 1080) }, 500, 0, "top"), "overlapping monitor extends above");
        Check(!EdgePolicy.Outer(new[] { one[0], new Rectangle(0, 500, 1920, 1080) }, 500, 1079, "bottom"), "overlapping monitor extends below");
        Check(EdgePolicy.Refusal(false, true, false, 1000, 250, false, 1000, 0, 500) == "notOuterEdge", "outer reason");
        Check(EdgePolicy.Refusal(true, false, false, 1000, 250, false, 1000, 0, 500) == "outsideZone", "zone reason");
        Check(EdgePolicy.Refusal(true, true, true, 1000, 250, false, 1000, 0, 500) == "button", "all-button state blocks");
        Check(EdgePolicy.Refusal(true, true, false, 249, 250, false, 1000, 0, 500) == "cooldown", "cooldown boundary");
        Check(EdgePolicy.Refusal(true, true, false, 250, 250, true, 499, 7, 500) == "arrival", "arrival guard");
        Check(EdgePolicy.Refusal(true, true, false, 250, 250, true, 499, 8, 500) == null, "inward motion releases arrival guard");
        Check(EdgePolicy.Refusal(true, true, false, 250, 250, true, 500, 0, 500) == null, "arrival timeout boundary");
        Check(EdgePolicy.Refusal(true, true, false, 100, 250, true, 100, 20, 500) == "cooldown", "inward never bypasses cooldown");
        long logged = -2000;
        Check(EdgePolicy.ShouldLog(0, ref logged), "first rejection is visible");
        Check(!EdgePolicy.ShouldLog(1999, ref logged), "all reasons and sides share two-second rate limit");
        Check(EdgePolicy.ShouldLog(2000, ref logged), "two-second boundary logs");
        Console.WriteLine("PASS " + checks + " native edge-policy checks (synthetic; no input hooks)");
    }
}
