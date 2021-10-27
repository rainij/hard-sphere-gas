#include "animate.h"

#include "collider.h"
#include "memory.h"
#include "util.h"

// this needs to provided by embedder:
extern "C" void logInt(uint);
extern "C" void logReal(double);


constexpr uint BLACK = 0xff000000;
constexpr uint WHITE = 0xffffffff;
constexpr uint RED   = 0xff0000ff;


class Animator {
public:
  Animator(uint N = 0, uint image_width = 0, double particle_radius = 0.0);

  ~Animator();

  uint img_width() const;
  uint img_npixels() const;
  uint img_nbytes() const;

  byte* get_image_buffer();

  void set_particle(uint index, double x, double y, double vx, double vy);

  void move(double time);

  bool validate();

private:
  uint N;
  uint image_width;

  Collider collider;

  // TODO problem with strict aliasing rule?
  byte* image_buffer = nullptr;

  void clear_image();
  void draw_particles();

  void set_color(uint index, uint color_code);
  void draw_particle(double x, double y, double radius);
};


Animator::Animator(uint N, uint pixel_width, double particle_radius)
: N{N}, image_width{pixel_width}, collider{N, particle_radius}
{
  if (this->img_nbytes() == 0) return;
  this->image_buffer = (byte*) malloc(this->img_nbytes());
}


Animator::~Animator() {
  if (this->img_nbytes() == 0) return;
  free(this->image_buffer);
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


byte* Animator::get_image_buffer() {
  return this->image_buffer;
}


void Animator::set_color(uint index, uint color_code) {
  ((uint*) this->image_buffer)[index] = color_code; // FIXME is this OK ???
}


void Animator::set_particle(uint index, double x, double y, double vx, double vy) {
  this->collider.set_particle(index, x, y, vx, vy);
}


void Animator::move(double time) {
  this->collider.move(time);
  this->clear_image();
  this->draw_particles();
  // TODO
}


void Animator::clear_image() {
  uint const npixels = this->img_npixels();
  for (uint i = 0; i < npixels; ++i) {
    this->set_color(i, BLACK);
  }
}


void Animator::draw_particles() {
  for (uint i = 0; i < this->N; ++i) {
    this->draw_particle(
      this->collider.x(i),
      this->collider.y(i),
      this->collider.radius()
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


bool Animator::validate() {
  return this->collider.validate();
}

//////////////////////////////////////////////////////////////////////////////
/// Implementation of API
//////////////////////////////////////////////////////////////////////////////


bool animator_is_initialized = false;
Animator animator;


void init_animation(
  uint num_particles,
  uint pixel_width,
  double particle_radius
) {
  if (animator_is_initialized) return; // TODO throw error
  animator = Animator(num_particles, pixel_width, particle_radius);
  animator_is_initialized = true;
}


bool validate_state() {
  return animator.validate();
}


uint image_width() {
  return animator.img_width();
}


uint image_nbytes() {
  return animator.img_nbytes();
}


byte* get_image_buffer() {
  return animator.get_image_buffer();
}


void update_animation(double time) {
  animator.move(time);
}


void set_particle(uint index, double x, double y, double vx, double vy) {
  animator.set_particle(index, x, y, vx, vy);
}
