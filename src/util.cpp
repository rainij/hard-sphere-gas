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


double sum(double const * numbers, uint size) {
  double result = 0.0;
  for (uint i = 0; i < size; ++i) {
    result += numbers[i];
  }
  return result;
}


double square_sum(double const * numbers, uint size) {
  double result = 0.0;
  for (uint i = 0; i < size; ++i) {
    result += numbers[i] * numbers[i];
  }
  return result;
}


double mean(double const * numbers, uint size) {
  return sum(numbers, size) / size;
}



double square_mean(double const * numbers, uint size) {
  return square_sum(numbers, size) / size;
}
