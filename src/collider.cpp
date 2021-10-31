#include "collider.h"

#include "defs.h"
#include "memory.h"
#include "util.h"

extern "C" void logReal(double);


Collider::Collider(uint N, double particle_radius, uint nbuckets, double histogram_width)
: N_{N}, nbuckets{nbuckets}, particle_radius{particle_radius}, histogram_width{histogram_width} {
  if (histogram_width <= 0.0) {
    trap("histogram_width must be positive.");
  }

  if (particle_radius <= 0.0 && particle_radius >= 0.5) {
    trap("particle_radius must be in intervall ]0.0, 0.5[.");
  }

  if (N_ != 0) {
    x_ = (double*) malloc(N * sizeof(double));
    y_ = (double*) malloc(N * sizeof(double));
    vx_ = (double*) malloc(N * sizeof(double));
    vy_ = (double*) malloc(N * sizeof(double));
  }

  if (nbuckets != 0) {
    buckets_vx = (uint*) malloc(nbuckets * sizeof(uint));
    buckets_vy = (uint*) malloc(nbuckets * sizeof(uint));
  }
};


Collider::~Collider() {
  if (N_ != 0) {
    free(x_);
    free(y_);
    free(vx_);
    free(vy_);
  }

  if (nbuckets != 0) {
    free(buckets_vx);
    free(buckets_vy);
  }
}


void Collider::move(double time) {
  update_positions(time);
  update_velocities();
}


void Collider::update_positions(double time) {
  for (uint i = 0; i < N_; ++i) {
    x_[i] += vx_[i] * time;
    y_[i] += vy_[i] * time;
  }
}


void Collider::update_velocities() {
  // Wall Collisions:
  double const L = 0.0 + particle_radius;
  double const U = 1.0 - particle_radius;
  for (uint i = 0; i < N_; ++i) {
    if (x_[i] < L && vx_[i] < 0.0) vx_[i] *= -1.0;
    if (x_[i] > U && vx_[i] > 0.0) vx_[i] *= -1.0;

    if (y_[i] < L && vy_[i] < 0.0) vy_[i] *= -1.0;
    if (y_[i] > U && vy_[i] > 0.0) vy_[i] *= -1.0;
  }

  // Particle-Particle Collisions
  for (uint i = 0; i < N_; ++i) {
    for (uint j = i+1; j < N_; ++j) {
      double const eps2 = 1e-12;
      double const D2 = 4 * particle_radius * particle_radius;
      double const dij2 = dist2(x_[i], y_[i], x_[j], y_[j]);
      if (dij2 <= D2 && dij2 > eps2) {
        // The eps2 condition is a simplification to avoid problems with numerics

        // TODO better docstring
        // The law of reflection:
        // - momentum and energy must be preserved
        // - change of velocity only possible by force-impulse in the direction from one particle center to the other.
        // - apply reflection only if particles i and j approach each other (not at departure).

        double const xij = x_[j] - x_[i];
        double const yij = y_[j] - y_[i];

        double const norm = sqrt(dij2);

        double const ex = xij / norm;
        double const ey = yij / norm;

        double const vi1_x = (vx_[i]*ex + vy_[i]*ey) * ex;
        double const vi1_y = (vx_[i]*ex + vy_[i]*ey) * ey;
        double const vi2_x = vx_[i] - vi1_x;
        double const vi2_y = vy_[i] - vi1_y;

        double const vj1_x = (vx_[j]*ex + vy_[j]*ey) * ex;
        double const vj1_y = (vx_[j]*ex + vy_[j]*ey) * ey;
        double const vj2_x = vx_[j] - vj1_x;
        double const vj2_y = vy_[j] - vj1_y;

        double const sprod = (vi1_x - vj1_x) * ex + (vi1_y - vj1_y) * ey;

        if (sprod > 0) {
          vx_[i] = vj1_x + vi2_x;
          vy_[i] = vj1_y + vi2_y;
          vx_[j] = vi1_x + vj2_x;
          vy_[j] = vi1_y + vj2_y;
        }
      }
    }
  }
}


double Collider::radius() const {
  return this->particle_radius;
}


double Collider::nparticles() const {
  return N_;
}


void Collider::set_particle(uint index, double x, double y, double vx, double vy) {
  if (index >= this->N_) {
    trap("Index for set_particle to high!");
  }

  if (particles_fixed) {
    trap("Calling set_paticles after calling fix_particles not allowed.");
  }

  this->x_[index] = x;
  this->y_[index] = y;
  this->vx_[index] = vx;
  this->vy_[index] = vy;
}


void Collider::fix_particles() {
  particles_fixed = true;
  init_histogram();
}


void Collider::purge_buckets() const {
  for (uint i = 0; i < nbuckets; ++i) {
    buckets_vx[i] = 0;
    buckets_vy[i] = 0;
  }
}


void Collider::init_histogram() {
  double const vstd = sqrt(vx_square_mean() + vy_square_mean());

  if (vstd == 0) {
    trap("Fatal: energy of particles cloud must not be zero!");
  }

  vmax = +vstd * histogram_width;
  vmin = -vstd * histogram_width;
}


void Collider::compute_histogram() const {
  if (!particles_fixed) {
    trap("Calling compute_histogram before fix_particles not allowed.");
  }

  purge_buckets();

  for (uint i = 0; i < N_; ++i) {
    double v = vx_[i];

    double const frac = min(1.0, max(0.0, (v - vmin) / (vmax - vmin)));
    uint const bucket_index = (frac * (nbuckets-1)) + 0.5; // Note: rounding double -> uint by truncation

    buckets_vx[bucket_index] += 1;
  }

  for (uint i = 0; i < N_; ++i) { // FIXME remove code duplication
    double v = vy_[i];

    double const frac = min(1.0, max(0.0, (v - vmin) / (vmax - vmin)));
    uint const bucket_index = (frac * (nbuckets-1)) + 0.5; // Note: rounding double -> uint by truncation

    buckets_vy[bucket_index] += 1;
  }
}


double Collider::vx_mean() const {
  return mean(vx_, N_);
}


double Collider::vy_mean() const {
  return mean(vy_, N_);
}


double Collider::vx_square_mean() const {
  return square_mean(vx_, N_);
}


double Collider::vy_square_mean() const {
  return square_mean(vy_, N_);
}


uint Collider::bucket_vx(uint index) const {
  if (index >= nbuckets) {
    trap("Out of bounds access to bucket_vx.");
  }
  return buckets_vx[index];
}


uint Collider::bucket_vy(uint index) const {
  if (index >= nbuckets) {
    trap("Out of bounds access to bucket_vy.");
  }
  return buckets_vy[index];
}
