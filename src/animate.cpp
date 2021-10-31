#include "animate.h"

#include "collider.h"
#include "memory.h"
#include "util.h"

// TODO put this into separate header
// this needs to provided by embedder:
extern "C" void logInt(uint);
extern "C" void logReal(double);


constexpr uint BLACK = 0xff000000;
constexpr uint WHITE = 0xffffffff;
//constexpr uint RED   = 0xff0000ff;


class Animator {
public:
  Animator(uint image_width = 0);

  ~Animator();

  uint img_width() const;
  uint img_npixels() const;
  uint img_nbytes() const;

  byte* image_buffer(); // TODO const correctness
  Collider& collider();

  void clear_image();
  void draw_particles();

private:
  uint image_width;

  Collider collider_;

  // TODO problem with strict aliasing rule?
  byte* image_buffer_ = nullptr;

  void set_color(uint index, uint color_code);
  void draw_particle(double x, double y, double radius);
};


Animator::Animator(uint pixel_width)
: image_width{pixel_width}
{
  if (this->img_nbytes() == 0) return;
  this->image_buffer_ = (byte*) malloc(this->img_nbytes());
}


Animator::~Animator() {
  if (this->img_nbytes() == 0) return;
  free(this->image_buffer_);
}


uint Animator::img_width() const {
  return this->image_width;
}


uint Animator::img_npixels() const {
  uint width = this->img_width();
  return width * width;
}


uint Animator::img_nbytes() const {
  uint size = this->img_npixels();
  // Four bytes per pixel (opacity + rgb)
  return size * 4;
}


byte* Animator::image_buffer() {
  return this->image_buffer_;
}


Collider& Animator::collider() {
  return collider_;
}


void Animator::set_color(uint index, uint color_code) {
  ((uint*) this->image_buffer_)[index] = color_code; // FIXME is this OK ???
}


void Animator::clear_image() {
  uint const npixels = this->img_npixels();
  for (uint i = 0; i < npixels; ++i) {
    this->set_color(i, BLACK);
  }
}


void Animator::draw_particles() {
  uint const N = collider_.nparticles();
  for (uint i = 0; i < N; ++i) {
    this->draw_particle(
      this->collider_.x(i),
      this->collider_.y(i),
      this->collider_.radius()
    );
  }
}


void Animator::draw_particle(double x, double y, double radius) {
  uint width = this->img_width();

  uint radius_pix = radius * width + 1;
  uint x_pix = x * width;
  uint y_pix = y * width;

  uint xl = (x_pix >= radius_pix) ? x_pix - radius_pix : 0;
  uint yl = (y_pix >= radius_pix) ? y_pix - radius_pix : 0;

  uint xu = min(x_pix + radius_pix, width-1);
  uint yu = min(y_pix + radius_pix, width-1);

  for (uint iy = yl; iy <= yu; ++iy) {
    uint const offset = iy * width;
    for (uint ix = xl; ix <= xu; ++ix) {
      uint dist2 = (ix-x_pix)*(ix-x_pix) + (iy-y_pix)*(iy-y_pix);
      if (dist2 < radius_pix * radius_pix) {
        uint i = offset + ix;
        this->set_color(i, WHITE);
      }
    }
  }
}


//////////////////////////////////////////////////////////////////////////////
/// Implementation of API
//////////////////////////////////////////////////////////////////////////////


// TODO make this static?
bool animator_is_initialized = false;
Animator animator;


void init_animation(
  // Display parameters
  uint pixel_width,
  // Physics parameters
  uint num_particles,
  double particle_radius,
  // Other parameters
  uint nbuckets,
  double histogram_width
) {
  if (animator_is_initialized) {
    trap("It is not allowed to call init_animation twice.");
  }

  Collider collider{num_particles, particle_radius, nbuckets, histogram_width};

  animator = Animator(pixel_width);
  animator.collider() = collider; // TODO is this correct handling?
  animator_is_initialized = true;
}


uint image_width() {
  return animator.img_width();
}


uint image_nbytes() {
  return animator.img_nbytes();
}


byte* image_buffer() {
  return animator.image_buffer();
}


void update_animation(double time) {
  animator.collider().move(time);
  animator.clear_image();
  animator.draw_particles();
}


void set_particle(uint index, double x, double y, double vx, double vy) {
  animator.collider().set_particle(index, x, y, vx, vy);
}


void compute_histogram() {
  animator.collider().compute_histogram();
}


uint bucket_vx(uint index) {
  return animator.collider().bucket_vx(index);
}


uint bucket_vy(uint index) {
  return animator.collider().bucket_vy(index);
}


void fix_particles() {
  animator.collider().fix_particles();
}


double vsquare() {
  double const vxsm = animator.collider().vx_square_mean();
  double const vysm = animator.collider().vy_square_mean();

  return vxsm + vysm;
}
