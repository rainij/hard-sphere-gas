#include "memory.h"

// Implementing memory management by "bump allocator".
// - Simple and fast
// - has no free, but freeing of all allocated memory still possible.
//
// See https://dassur.ma/things/c-to-webassembly/
extern void * __data_end;
extern void * __heap_base;


// TODO This implementaion could probably be improved.
byte* bump_pointer = (byte*) &__heap_base;
void* malloc(uint n) {
  // We implement a fixed alignment of 8 bytes (but seems to be not so important).

  // TODO Currently can't implement alignment.
  // clang generates import for memcpy if we uncomment next line - Why?
  //uint const n_align = (n + 7u) & ~7u; // n_align is smallest multiple of 8 being at least n.
  uint const n_align = n;
  byte* next = bump_pointer;
  bump_pointer = next + n_align;
  return (void *) next;
}


void free(void* p) {
  // Bump allocator has no free.
  // We still implement the interface, to be *formally* usable.
}


// IMPORTANT: All dynamically allocated objects are invalidated after this operation.
void free_all() {
  bump_pointer = (byte*) &__heap_base;
}
