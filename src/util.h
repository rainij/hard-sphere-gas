#ifndef UTIL_HPP
#define UTIL_HPP

#include "defs.h"

extern "C" void logString (const char* ptr, uint len);

template <typename T> T min(T a, T b) { return (a < b) ? a : b; }
template <typename T> T max(T a, T b) { return (a > b) ? a : b; }

/// Quick way to terminate wasm execution
void trap(const char* reason = nullptr);

double dist2(double x1, double y1, double x2, double y2);

double sqrt(double x);

double sum(double const * numbers, uint size);
double square_sum(double const * numbers, uint size);
double mean(double const * numbers, uint size);
double square_mean(double const * numbers, uint size);

#endif // UTIL_HPP
