// @ts-check

const num_particles = 2000; // TODO nparticles
const canvas_width = 600;
const delta_time = 0.001;
const particle_radius = 0.002; // Note: side length of canvas is 1.0
const nbuckets = 42;
const histogram_width = 3.0; // TODO better name
const maxDisplayedValue = computeHistogramHeight(num_particles, nbuckets, histogram_width);
const histogramGridStepSize = computeHistogramGridStepSize(maxDisplayedValue);
const maxAnimateCount = 5;
const maxAvCount = 50;

console.log('maxDisplayedValue:', maxDisplayedValue);

let update_animation;
let compute_histogram;
let bucket_vx;
let bucket_vy;
let set_particle;
let fix_particles;
let imageData;
/**  @type {WebAssembly.Memory} */
let memory;
let vsquare;

const graph_of_equilibrium_distribution = {
  /**  @type {number[]} */
  x: [],
  /**  @type {number[]} */
  y: [],
}

/** @type {HTMLCanvasElement} */
// @ts-ignore
const particleCanvas = document.getElementById('particle-canvas');
/** @type {HTMLCanvasElement} */
// @ts-ignore
const vxCanvas = document.getElementById('vx-canvas');
/** @type {HTMLCanvasElement} */
// @ts-ignore
const vyCanvas = document.getElementById('vy-canvas');
/** @type {HTMLCanvasElement} */
// @ts-ignore
const vxAvCanvas = document.getElementById('vx-averaged-canvas');
/** @type {HTMLCanvasElement} */
// @ts-ignore
const vyAvCanvas = document.getElementById('vy-averaged-canvas');

particleCanvas.width = canvas_width;
particleCanvas.height = canvas_width;

vxCanvas.width = vyCanvas.width = vxAvCanvas.width = vyAvCanvas.width = canvas_width / 2;
vxCanvas.height = vyCanvas.height = vxAvCanvas.height = vyAvCanvas.height = canvas_width;

const paticleCtx = particleCanvas.getContext('2d');

///** @type {Partial<BarChartOptions>} */
const commonBarChartOptions = {
  nbuckets,
  xLabel: '(units of std-dev of v_tot)',
}
/** @type {BarChartOptions} */
const vxBarChartOptions = {
  canvas: vxCanvas,
  title: 'Distribution of v_x',
  ...commonBarChartOptions,
}
/** @type {BarChartOptions} */
const vyBarChartOptions = {
  canvas: vyCanvas,
  title: 'Distribution of v_y',
  ...commonBarChartOptions,
}
/** @type {BarChartOptions} */
const vxAvBarChartOptions = {
  canvas: vxAvCanvas,
  title: 'Averaged distr. of v_x',
  ...commonBarChartOptions,
}
/** @type {BarChartOptions} */
const vyAvBarChartOptions = {
  canvas: vyAvCanvas,
  title: 'Averaged distr. of v_y',
  ...commonBarChartOptions,
}

const vxBarChart = new BarChart(vxBarChartOptions);
const vyBarChart = new BarChart(vyBarChartOptions);
const vxAvBarChart = new BarChart(vxAvBarChartOptions);
const vyAvBarChart = new BarChart(vyAvBarChartOptions);

function setup_initial_distribution() {
  let a = -1;
  let b = 0;
  let base = Math.ceil(Math.sqrt(num_particles));
  function grid() {
    a += 1;
    if (a >= base) {
      a = 0;
      b += 1;
    }
    return { x: 0.4*a/base + 0.3, y: 0.4*b/base + 0.3 };
  }

  for (let i = 0; i < num_particles; ++i) {
    //const {x, y} = grid();
    const x = Math.random()*0.4 + 0.3;
    const y = Math.random()*0.4 + 0.3;
    const vx = 1.0*Math.sqrt(2)*(Math.random()*0.01 + 1.0);
    const vy = 0.0*(Math.random()*1.0 - 0.5);
    set_particle(i, x, y, vx, vy);
  }
  //set_particle(num_particles-1, 0.1, 0.5, 1, 0);

  fix_particles();
}

let avCount = 1;
let vxAvValues = Array.from({length: nbuckets}, () => 0.0);
let vyAvValues = Array.from({length: nbuckets}, () => 0.0);
function drawStatistics() {
  compute_histogram();

  const commonData = {
    maxDisplayedValue,
    gridStepSize: histogramGridStepSize,
    leftBoundary: -histogram_width,
    rightBoundary: histogram_width,
  }

  /** @type {Data} */
  const vxData = {
    values: [],
    ...commonData,
  }

  /** @type {Data} */
  const vyData = {
    values: [],
    ...commonData,
  }

  for (let i = 0; i < nbuckets; ++i) {
    vxData.values[i] = bucket_vx(i);
    vyData.values[i] = bucket_vy(i);
  }

  vxBarChart.draw(vxData);
  vyBarChart.draw(vyData);

  /** @type {Data} */
  const vxAvData = {
    values: [],
    ...commonData,
  }

  /** @type {Data} */
  const vyAvData = {
    values: [],
    ...commonData,
  }

  for (let i = 0; i < nbuckets; ++i) {
    vxAvData.values[i] = ((avCount-1) * vxAvValues[i] + bucket_vx(i)) / avCount;
    vyAvData.values[i] = ((avCount-1) * vyAvValues[i] + bucket_vy(i)) / avCount;

    vxAvValues[i] = vxAvData.values[i];
    vyAvValues[i] = vyAvData.values[i];
  }

  // For comparision
  vxAvData.graph = vyAvData.graph = graph_of_equilibrium_distribution;

  if (avCount < maxAvCount) {
    ++avCount;
  }

  vxAvBarChart.draw(vxAvData);
  vyAvBarChart.draw(vyAvData);
}

let animateCount = 0;
function animate() {
  ++animateCount;

  update_animation(delta_time);
  paticleCtx.putImageData(imageData, 0, 0);

  if (animateCount % maxAnimateCount === 0) {
    drawStatistics();
  }

  requestAnimationFrame(animate);
}

function setup_ideal_equilibrium_distribution() {
  const npoints = 200;

  // Note on sigma:
  // Each direction (x and y) has (ideally) equal share of total energy.
  const sigma = Math.sqrt(1/2);

  const x = [];
  const y = [];

  const stepSize = 2 * histogram_width / (npoints - 1)

  for (let i = 0; i < npoints; ++i) {
    x[i] = -histogram_width + i*stepSize;
    y[i] = num_particles * (2*histogram_width/nbuckets) * gauss(x[i], sigma);
  }

  graph_of_equilibrium_distribution.x = x;
  graph_of_equilibrium_distribution.y = y;
}

const importObject = {
  env: {
    logInt: val => console.log(val),
    logReal: val => console.log(val),
    logString: (ptr, len) => {
      const view8 = new Uint8Array(memory.buffer, ptr, len);
      const text = new TextDecoder('utf8').decode(view8);
      console.log(text);
    },
    sqrt_js: (x) => Math.sqrt(x), // FIXME should not be necessary!!!
  },
};

WebAssembly.instantiateStreaming(fetch('index.wasm'), importObject)
  .then((obj) => {
    // Important to call this first (like ctor)
    // @ts-ignore
    obj.instance.exports.init_animation(canvas_width, num_particles, particle_radius, nbuckets, histogram_width);

    // @ts-ignore
    memory = obj.instance.exports.memory;
    update_animation = obj.instance.exports.update_animation;
    set_particle = obj.instance.exports.set_particle;
    fix_particles = obj.instance.exports.fix_particles;
    compute_histogram = obj.instance.exports.compute_histogram;
    bucket_vx = obj.instance.exports.bucket_vx;
    bucket_vy = obj.instance.exports.bucket_vy;
    vsquare = obj.instance.exports.vsquare;

    // @ts-ignore
    const nbytes = obj.instance.exports.image_nbytes();

    // @ts-ignore
    const image_buffer = obj.instance.exports.image_buffer();
    imageData = new ImageData(new Uint8ClampedArray(memory.buffer, image_buffer, nbytes), canvas_width, canvas_width);
    console.log(`image_buffer = ${image_buffer}`);

    setup_initial_distribution();
    setup_ideal_equilibrium_distribution();

    requestAnimationFrame(animate);
  })
  .catch((e) => console.log(e));
