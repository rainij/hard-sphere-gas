#include "util.h"

extern "C" double sqrt_js(double);

uint strlen(const char* start) {
  const char* end = start;
  for( ; *end != '\0'; ++end) {
    // Hack to avoid infinite loop if cstring is not null-terminated:
    if (end - start > 1000) {
      break;
    }
  }
  return end - start;
}


uint min(uint a, uint b) {
  return (a < b) ? a : b;
}


void trap(const char* reason) {
  if (reason != nullptr) logString(reason, strlen(reason));
  __builtin_trap();
}


double dist2(double x1, double y1, double x2, double y2) {
  return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
}


// FIXME this is shit:
double sqrt(double x) {
  return sqrt_js(x);
}
