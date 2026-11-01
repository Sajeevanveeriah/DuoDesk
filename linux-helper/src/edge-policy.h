// DuoDesk modifications. GPL-3.0; upstream notices remain in their owning files.
#ifndef DUODESK_EDGE_POLICY_H
#define DUODESK_EDGE_POLICY_H
typedef struct { int x, y, w, h; } EdgeRect;

static inline int edge_contains(const EdgeRect *r, int x, int y) {
  return x >= r->x && x < r->x + r->w && y >= r->y && y < r->y + r->h;
}
static inline int edge_at(const EdgeRect *r, int x, int y, int side) {
  if (!edge_contains(r, x, y)) return 0;
  switch (side) {
    case 0: return x <= r->x + 1;
    case 1: return x >= r->x + r->w - 2;
    case 2: return y <= r->y + 1;
    case 3: return y >= r->y + r->h - 2;
    default: return 0;
  }
}
// A farther monitor on the same coordinate ray blocks crossing even across a gap.
static inline int edge_outer(const EdgeRect *rects, int count, int x, int y, int side) {
  const EdgeRect *here = 0;
  for (int i = 0; i < count; i++) if (edge_contains(rects + i, x, y)) { here = rects + i; break; }
  if (!here || !edge_at(here, x, y, side)) return 0;
  for (int i = 0; i < count; i++) {
    const EdgeRect *r = rects + i;
    if (r == here) continue;
    if (side == 0 && y >= r->y && y < r->y + r->h && r->x < here->x) return 0;
    if (side == 1 && y >= r->y && y < r->y + r->h && r->x + r->w > here->x + here->w) return 0;
    if (side == 2 && x >= r->x && x < r->x + r->w && r->y < here->y) return 0;
    if (side == 3 && x >= r->x && x < r->x + r->w && r->y + r->h > here->y + here->h) return 0;
  }
  return 1;
}
static inline const char *edge_refusal(int outer, int zone, int buttons, double elapsed, double cooldown, int arriving) {
  if (!outer) return "notOuterEdge";
  if (!zone) return "outsideZone";
  if (buttons) return "button";
  if (elapsed < cooldown) return "cooldown";
  if (arriving) return "arrival";
  return 0;
}
static inline int edge_log_due(double now, double *last) {
  if (now - *last < 2000) return 0;
  *last = now;
  return 1;
}
#endif
