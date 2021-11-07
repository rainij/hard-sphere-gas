#ifndef COLLISION_HPP
#define COLLISION_HPP

#include "defs.h"

// TODO restructure code to make it more apparent that this is the interface for js.

extern "C" {

WASM_EXPORT void init_animation(
  uint pixel_width,
  uint nparticles,
  double particle_radius,
  uint nbuckets,
  double histogram_width
);

WASM_EXPORT void update_animation(double time);
WASM_EXPORT byte* image_buffer();
WASM_EXPORT uint image_width();
WASM_EXPORT uint image_nbytes();
WASM_EXPORT void set_particle(uint index, double x, double y, double vx, double vy);
WASM_EXPORT void fix_particles();

WASM_EXPORT double vsquare();

WASM_EXPORT void compute_histogram();
WASM_EXPORT uint bucket_vx(uint index);
WASM_EXPORT uint bucket_vy(uint index);

}


#endif // COLLISION_HPP
