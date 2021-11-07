// @ts-check

/**
 * @typedef {{
 *   nParticles: number,
 *   deltaTime: number,
 *   particleRadius: number,
 *   nBuckets: number,
 *   histogramWidth: number,
 *   histogramDelay: number,
 *   averagingWeight: number,
 * }} Params
 */

/**
 * @typedef {{ (i: number, x: number, y: number, vx: number, vy: number) : void }} SetParticleFn
 */

/**
 * @typedef {{ (params: Params, set_particle: SetParticleFn) : void }} DistFn
 */

/**
 * @typedef {{params: Params, setupDist: DistFn}} Experiment
 */


/** @type {Params} */
const commonParams = {
  nParticles: 2000,
  deltaTime: 0.001,
  particleRadius: 0.002,
  nBuckets: 42,
  histogramWidth: 3.0,
  histogramDelay: 1,
  averagingWeight: 300,
}


/** @type {{[x: string]: Experiment}} */
const experiments = {
  /**
   * A Square moving uniformly to the right. No y movement.
   */
  move_right: {
    params: {
      ...commonParams,
    },
    setupDist: function (params, set_particle) {
      const nParticles = params.nParticles;
      for (let i = 0; i < nParticles; ++i) {
        const x = Math.random()*0.4 + 0.3;
        const y = Math.random()*0.4 + 0.3;
        const vx = 1.0*Math.sqrt(2)*(Math.random()*0.01 + 1.0);
        const vy = 0.0*(Math.random()*1.0 - 0.5);
        set_particle(i, x, y, vx, vy);
      }
    },
  },
  /**
   * Uniform distribution for position and velocity.
   */
   uniform: {
    params: {
      ...commonParams,
    },
    setupDist: setupDist_uniform,
  },
  /**
   * Uniform distribution for position and velocity but spatially localized at center.
   */
   uniform_central: {
    params: {
      ...commonParams,
    },
    setupDist: function (params, set_particle) {
      const nParticles = params.nParticles;
      for (let i = 0; i < nParticles; ++i) {
        const x = Math.random()*0.4 + 0.3;
        const y = Math.random()*0.4 + 0.3;
        const vx = 1.0*(Math.random() - 0.5);
        const vy = 1.0*(Math.random() - 0.5);
        set_particle(i, x, y, vx, vy);
      }
    },
  },
  /**
   * One very fast particle hitting a cluster of slowly moving particles.
   */
   bullet: {
    params: {
      ...commonParams,
      nParticles: 1000,
      particleRadius: 0.008,
    },
    setupDist: function (params, set_particle) {
      const nParticles = params.nParticles;
      for (let i = 0; i < nParticles; ++i) {
        const x = Math.random()*0.5 + 0.4;
        const y = Math.random()*0.6 + 0.2;
        const vx = 0.1*(Math.random() - 0.5);
        const vy = 0.1*(Math.random() - 0.5);
        set_particle(i, x, y, vx, vy);
      }
      // The one very fast particle:
      set_particle(nParticles-1, 0.1, 0.5, 30.0, 0.0);
    },
  },
  /**
   * Collision of two clusters.
   */
   two_clusters_colliding: {
    params: {
      ...commonParams,
      particleRadius: 0.004,
    },
    setupDist: function (params, set_particle) {
      const nParticles = params.nParticles;
      const mid = Math.ceil(nParticles/2);
      for (let i = 0; i < mid; ++i) {
        const x = Math.random()*0.4 + 0.0;
        const y = Math.random()*0.4 + 0.3;
        const vx = 2.0*(Math.random()*0.1 + 1.0);
        const vy = 0.1*(Math.random() - 0.5);
        set_particle(i, x, y, vx, vy);
      }
      for (let i = mid; i < nParticles; ++i) {
        const x = Math.random()*0.4 + 0.6;
        const y = Math.random()*0.4 + 0.3;
        const vx = 2.0*(Math.random()*0.1 - 1.0);
        const vy = 0.1*(Math.random() - 0.5);
        set_particle(i, x, y, vx, vy);
      }
    },
  },
  /**
   * Essentially multiple 1D gases.
   */
   oneD_big: {
    params: {
      ...commonParams,
      nParticles: 300,
      deltaTime: 0.01,
      particleRadius: 0.01,
      nBuckets: 21,
      averagingWeight: 2000
    },
    setupDist: setupDist_oneD,
  },
  /**
   * Essentially multiple 1D gases.
   */
   oneD_many: {
    params: {
      ...commonParams,
      nParticles: 2000,
      deltaTime: 0.005,
      particleRadius: 0.004,
      nBuckets: 21,
      averagingWeight: 600,
    },
    setupDist: setupDist_oneD,
  },
  /**
   * A few big particles
   */
   big_particles: {
    params: {
      ...commonParams,
      nParticles: 30,
      deltaTime: 0.01,
      particleRadius: 0.05,
      nBuckets: 21,
      averagingWeight: 1000,
    },
    setupDist: setupDist_uniform,
  },
  /**
   * Implosion
   */
   implosion: {
    params: {
      ...commonParams,
    },
    setupDist: function (params, set_particle) {
      const nParticles = params.nParticles;

      const rMin = 0.2;
      const rMax = 0.25;

      for (let i = 0; i < nParticles; ++i) {
        const phi = 2 * Math.PI * Math.random();
        const r = rMin + (rMax - rMin) * Math.random();

        const x = 0.5 + r * Math.cos(phi);
        const y = 0.5 + r * Math.sin(phi);

        const vx = - Math.cos(phi);
        const vy = - Math.sin(phi);

        set_particle(i, x, y, vx, vy);
      }
    },
  },
}


/** @type {DistFn} */
function setupDist_uniform (params, set_particle) {
  const nParticles = params.nParticles;
  for (let i = 0; i < nParticles; ++i) {
    const x = Math.random();
    const y = Math.random();
    const vx = 1.0*(Math.random() - 0.5);
    const vy = 1.0*(Math.random() - 0.5);
    set_particle(i, x, y, vx, vy);
  }
}


/** @type {DistFn} */
function setupDist_oneD (params, set_particle) {
  const nParticles = params.nParticles;
  const particleRadius = params.particleRadius;

  const nRows = Math.max(1, 0.25 / particleRadius);

  for (let i = 0; i < nParticles; ++i) {
    const x = Math.random();
    const y = (1 + Math.floor(nRows * Math.random())) / (nRows + 1);
    const vx = 1.0*(Math.random() - 0.5);
    const vy = 0.0;
    set_particle(i, x, y, vx, vy);
  }
}
