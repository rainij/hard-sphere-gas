#ifndef MEMORY_HPP
#define MEMORY_HPP

#include "defs.h"

// FIXME how to avoid exporting this *globally* (in the final wasm file)?
WASM_EXPORT void* malloc(uint n);
WASM_EXPORT void free(void* p) ;

#endif // MEMORY_HPP
