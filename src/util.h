#ifndef UTIL_HPP
#define UTIL_HPP

#include "defs.h"

extern "C" void logString (const char* ptr, uint len);

uint min(uint a, uint b);

/// Quick way to terminate wasm execution
void trap(const char* reason = nullptr);

double dist2(double x1, double y1, double x2, double y2);

double sqrt(double x);

#endif // UTIL_HPP
