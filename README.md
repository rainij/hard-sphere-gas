# Hard Sphere Gas

**This is a work in progress!**

This tiny application visualizes a simulation of a two dimensional gas in a rectangular domain. The particles are modelled as hard (two dimensional) spheres of equal mass. There is no rotation involved, hence each particle has only two degrees of freedom. The distribution of the velocities in x and y directions are plotted in real time (histograms).

The user can choose between a number of predefined experiments, each starting with a different initial distribution for particle positions and velocities. It can be seen that for almost all initial distributions an equilibrium is reached after some time. In this equilibrium all particles are spatially uniformly distributed (no surprise) and the velocity *components* obey a gaussian distribution. The later is a famous result typically attributed to *Maxwell* (see [wikipedia](https://en.wikipedia.org/wiki/Maxwell%E2%80%93Boltzmann_distribution#Distribution_for_the_velocity_vector)).

Maxwell's proof requires at least two spatial dimensions. In fact the theorem is wrong in one dimension (this is not hard to see). We include an experiment demonstrating this.

## Motivation

This application is implemented in `javascript` (GUI) and `C++` (Physics) utilizing `WebAssembly`. We do not use any libraries, neither js packages from npm nor the standard library of C++. So, although this is a really interesting physics topic, our main motivation to build all this was to learn about low level programming. In particular we want to understand how to use C++ in the web without relying on third party frameworks like `emscripten`. For some (simple) applications it can be nice to be able to avoid emscipten's (or other frameworks) overhead, and in all other situations it is helpfull to know the basics.
