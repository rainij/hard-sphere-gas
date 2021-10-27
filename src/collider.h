#ifndef COLLIDER_HPP
#define COLLIDER_HPP

#include "defs.h"

// TODO improve WASM_EXPORT
class [[gnu::visibility("default")]] Collider {
public:

  Collider(uint N = 0, double particle_radius = 0.0);

  ~Collider();

  void move(double time);

  double radius() const;

  bool validate();

  void set_particle(uint index, double x, double y, double vx, double vy);

  // No bounds check for performance reasons:
  double x(uint index) const { return x_[index]; };
  double y(uint index) const  { return y_[index]; };
  double vx(uint index) const { return vx_[index]; };
  double vy(uint index) const { return vy_[index]; };

private:
  uint N_; // number of particles
  double particle_radius;

  // Position and velocities of particles.
  double * x_;
  double * y_;
  double * vx_;
  double * vy_;

  void update_positions(double time);
  void update_velocities();
};

#endif // COLLIDER_HPP

