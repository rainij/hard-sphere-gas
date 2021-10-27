#ifndef COLLISION_HPP
#define COLLISION_HPP

#include "defs.h"

WASM_EXPORT void init_animation(
  uint num_particles,
  uint pixel_width,
  double particle_radius
);

WASM_EXPORT void update_animation(double time);
WASM_EXPORT byte* get_image_buffer();
WASM_EXPORT uint image_width();
WASM_EXPORT uint image_nbytes();
WASM_EXPORT void set_particle(uint index, double x, double y, double vx, double vy);


#endif // COLLISION_HPP
