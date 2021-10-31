#ifndef COLLIDER_HPP
#define COLLIDER_HPP

#include "defs.h"

// TODO improve WASM_EXPORT
class [[gnu::visibility("default")]] Collider {
public:

  Collider(uint N = 0, double particle_radius = 0.0, uint nbuckets = 10, double histogram_width = 2.0);

  ~Collider();

  // TODO can these functions be const?
  void move(double time);
  void set_particle(uint index, double x, double y, double vx, double vy);
  // After calling this set_particles not possible anymore and some other functions are enabled
  void fix_particles();

  double radius() const;
  double nparticles() const;

  void compute_histogram() const;

  double vx_mean() const;
  double vy_mean() const;
  double vx_square_mean() const;
  double vy_square_mean() const;

  // No bounds check for performance reasons:
  double x(uint index) const { return x_[index]; };
  double y(uint index) const  { return y_[index]; };
  double vx(uint index) const { return vx_[index]; };
  double vy(uint index) const { return vy_[index]; };

  uint bucket_vx(uint index) const;
  uint bucket_vy(uint index) const;

private:
  uint N_; // number of particles
  uint nbuckets;
  double particle_radius;
  double histogram_width; // in units of stddevs

  // Auxiliary vars.
  bool particles_fixed = false;
  // for histogram:
  double vmin, vmax;

  // Position and velocities of particles.
  double * x_;
  double * y_;
  double * vx_;
  double * vy_;

  // arrays of length 'nbuckets'. For histogram.
  uint * buckets_vx;
  uint * buckets_vy;

  void update_positions(double time);
  void update_velocities();

  void init_histogram();
  void purge_buckets() const;
};

#endif // COLLIDER_HPP

