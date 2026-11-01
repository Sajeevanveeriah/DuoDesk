// DuoDesk modifications. GPL-3.0. Pure tests: no display or input device access.
#include "../src/edge-policy.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
int main(void) {
  EdgeRect a[] = {{0,0,1920,1080}, {2200,0,1920,1080}};
  assert(!edge_outer(a, 2, 1919, 500, 1)); // a gap must not become an exit
  assert(edge_outer(a, 2, 4119, 500, 1));
  assert(!edge_outer(a, 2, 2200, 500, 0));
  assert(edge_outer(a, 2, 0, 500, 0));
  EdgeRect l[] = {{-1920,-200,1920,1080},{0,0,2560,1440}};
  assert(!edge_outer(l, 2, -1, 500, 1));
  assert(edge_outer(l, 2, -1, -100, 1)); // exposed part of L shape
  assert(!edge_outer(l, 2, 0, 500, 0));
  assert(edge_outer(l, 2, 0, 1200, 0));
  EdgeRect vertical[] = {{0,0,100,100},{0,150,100,100}};
  assert(!edge_outer(vertical, 2, 50,99,3));
  assert(!edge_outer(vertical, 2, 50,150,2));
  assert(edge_outer(vertical, 2, 50,249,3));
  assert(!edge_outer(vertical, 2, 50,50,1));
  assert(!edge_outer(vertical, 2, 1000,1000,1));
  assert(!edge_outer(vertical, 0, 0,0,0));
  assert(!edge_outer(vertical, 2, 0,0,-1));
  assert(strcmp(edge_refusal(0,1,0,1000,250,0),"notOuterEdge")==0);
  assert(strcmp(edge_refusal(1,0,0,1000,250,0),"outsideZone")==0);
  for (int button = 1; button <= 5; button++) assert(strcmp(edge_refusal(1,1,button,1000,250,0),"button")==0);
  assert(strcmp(edge_refusal(1,1,0,249,250,0),"cooldown")==0);
  assert(strcmp(edge_refusal(1,1,0,250,250,1),"arrival")==0);
  assert(edge_refusal(1,1,0,250,250,0)==0);
  double last = -2000;
  assert(edge_log_due(0,&last));
  assert(!edge_log_due(1999,&last));
  assert(edge_log_due(2000,&last));
  assert(!edge_log_due(2001,&last));
  puts("passed: edge policy geometry, 5 button states, zone, cooldown and arrival");
  return 0;
}
