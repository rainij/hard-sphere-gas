#include "memory.h"

// See https://dassur.ma/things/c-to-webassembly/
extern void * __data_end;
extern void * __heap_base;

// TODO this is a wip which suffices for a demo:
// - has no free
// - no alignment
byte* bump_pointer = (byte*) &__heap_base;
void* malloc(uint n) {
  byte* r = bump_pointer;
  bump_pointer += n;
  return (void *)r;
}

void free(void* p) {
  // not possible since malloc is too simple
}
