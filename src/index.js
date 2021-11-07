// @ts-check

const canvas_width = 600;

// TODO put into object, e.g. wasm
let update_animation;
let init_animation;
let compute_histogram;
let bucket_vx;
let bucket_vy;
let set_particle;
let fix_particles;
let image_nbytes;
let image_buffer;
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

/** @type {HTMLSelectElement} */
// @ts-ignore
const experimentSelect = document.getElementById('select-experiment');
/** @type {Experiment} */
let currentExperiment = null;

/** @type {HTMLLabelElement} */
// @ts-ignore
const infoBox = document.getElementById('info-box');

/** @type {HTMLButtonElement} */
// @ts-ignore
const btnTogglePause = document.getElementById('btn-toggle-pause-resume');
/** @type {HTMLButtonElement} */
// @ts-ignore
const btnReset = document.getElementById('btn-reset');

btnTogglePause.onclick = onTogglePause;
btnReset.onclick = onReset;

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

/** @type {BarChart} */
let vxBarChart = null;
let vyBarChart = null;
let vxAvBarChart = null;
let vyAvBarChart = null;

function setup_initial_distribution() {
  currentExperiment.setupDist(currentExperiment.params, set_particle);
  fix_particles();
}

/** @type {Data} */
let vxData;
/** @type {Data} */
let vyData;
/** @type {Data} */
let vxAvData;
/** @type {Data} */
let vyAvData;
function initStatistics() {
  const params = currentExperiment.params;

  const maxDisplayedValue = computeHistogramHeight(params.nParticles, params.nBuckets, params.histogramWidth);
  const commonData = {
    maxDisplayedValue,
    gridStepSize: computeHistogramGridStepSize(maxDisplayedValue),
    leftBoundary: -params.histogramWidth,
    rightBoundary: params.histogramWidth,
    graph: graph_of_equilibrium_distribution, // For comparision
  }

  vxData = {
    values: [],
    ...commonData,
  }

  vyData = {
    values: [],
    ...commonData,
  }

  vxAvData = {
    values: Array.from({length: params.nBuckets}, () => 0.0),
    ...commonData,
  }

  vyAvData = {
    values: Array.from({length: params.nBuckets}, () => 0.0),
    ...commonData,
  }
}


function computeStatistics() {
  const params = currentExperiment.params;
  const weight = params.averagingWeight;

  compute_histogram();

  for (let i = 0; i < params.nBuckets; ++i) {
    const vxi = vxData.values[i] = bucket_vx(i);
    const vyi = vyData.values[i] = bucket_vy(i);

    vxAvData.values[i] = ((weight-1) * vxAvData.values[i] + vxi) / weight;
    vyAvData.values[i] = ((weight-1) * vyAvData.values[i] + vyi) / weight;
  }
}

function drawStatistics() {
  vxBarChart.draw(vxData);
  vyBarChart.draw(vyData);

  vxAvBarChart.draw(vxAvData);
  vyAvBarChart.draw(vyAvData);
}

// TODO If possible: the amount the particles move within one second should not depend on refresh rate.
// Take into account natural behaviour for Pause and Resume!
// If possible be as robust as possible with respect to time reversal.
let isPaused = true;
let animateCount = 0;
function animate() {
  const params = currentExperiment.params;

  update_animation(params.deltaTime);
  paticleCtx.putImageData(imageData, 0, 0);

  computeStatistics();

  if (animateCount % params.histogramDelay === 0) {
    drawStatistics();
  }
  ++animateCount;

  if (!isPaused) {
    requestAnimationFrame(animate);
  }
}

function onTogglePause() {
  isPaused = !isPaused;

  if (!isPaused) {
    btnTogglePause.innerHTML = "Pause";
    requestAnimationFrame(animate);
  } else {
    btnTogglePause.innerHTML = "Resume";
  }
}

function onReset() {
  startFreshAnimation();
}

function setup_ideal_equilibrium_distribution() {
  const npoints = 200;
  const params = currentExperiment.params;

  // Note on sigma:
  // Each direction (x and y) has (in equilibrium) equal share of total energy.
  const sigma = Math.sqrt(1/2);

  const x = [];
  const y = [];

  const stepSize = 2 * params.histogramWidth / (npoints - 1)

  for (let i = 0; i < npoints; ++i) {
    x[i] = -params.histogramWidth + i*stepSize;
    y[i] = params.nParticles * (2*params.histogramWidth/params.nBuckets) * gauss(x[i], sigma);
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

function initFreshAnimation() {
  const params = currentExperiment.params;
  // Important to call this first (like ctor)
  init_animation(canvas_width, params.nParticles, params.particleRadius, params.nBuckets, params.histogramWidth);

  animateCount = 0;

  // @ts-ignore
  const nbytes = image_nbytes();

  // @ts-ignore
  const imageBuffer = image_buffer();
  imageData = new ImageData(new Uint8ClampedArray(memory.buffer, imageBuffer, nbytes), canvas_width, canvas_width);
  console.log(`imageBuffer = ${imageBuffer}`);

  setup_initial_distribution();
  setup_ideal_equilibrium_distribution();
}

function startFreshAnimation() {
  try {
    setParamsFromGui();
    initStatistics();
    initBarCharts();
    initFreshAnimation();
  } catch (error) {
    console.log(error.message);
    infoBox.innerHTML = error.message;
    isPaused = true;
    btnTogglePause.innerHTML = "Resume"; // FIXME this is ugly!
    return;
  }

  infoBox.innerHTML = "";

  isPaused = true; // important!
  btnTogglePause.innerHTML = "Resume"; // FIXME this is ugly!
  requestAnimationFrame(animate);
}

/** @type {HTMLInputElement} */
// @ts-ignore
const nParticlesElement = document.getElementById('nParticles');
/** @type {HTMLInputElement} */
// @ts-ignore
const deltaTimeElement = document.getElementById('deltaTime');
/** @type {HTMLInputElement} */
// @ts-ignore
const particleRadiusElement = document.getElementById('particleRadius');
/** @type {HTMLInputElement} */
// @ts-ignore
const nBucketsElement = document.getElementById('nBuckets');
/** @type {HTMLInputElement} */
// @ts-ignore
const histogramWidthElement = document.getElementById('histogramWidth');
/** @type {HTMLInputElement} */
// @ts-ignore
const histogramDelayElement = document.getElementById('histogramDelay');
/** @type {HTMLInputElement} */
// @ts-ignore
const averagingWeightElement = document.getElementById('averagingWeight');

function setParamsFromGui() {
  const nParticles = parseFloat(nParticlesElement.value);
  assertValidInt(nParticles, 1, 5000, 'nParticles');
  const deltaTime = parseFloat(deltaTimeElement.value);
  assertValidFloat(deltaTime, 1e-6, 1e+1, 'deltaTime');
  const particleRadius = parseFloat(particleRadiusElement.value);
  assertValidFloat(particleRadius, 1e-4, 0.5, 'particleRadius'); // Note: side length of canvas is 1.0
  const nBuckets = parseFloat(nBucketsElement.value);
  assertValidInt(nBuckets, 1, 1000, 'nBuckets');
  const histogramWidth = parseFloat(histogramWidthElement.value);
  assertValidFloat(histogramWidth, 1e-1, 10.0, 'histogramWidth');
  const histogramDelay = parseFloat(histogramDelayElement.value);
  assertValidInt(histogramDelay, 1, 120, 'histogramDelay');
  const averagingWeight = parseFloat(averagingWeightElement.value);
  assertValidInt(averagingWeight, 1, 1e4, 'averagingWeight');

  // Set the values
  const params = currentExperiment.params;
  params.nParticles = nParticles;
  params.deltaTime = deltaTime;
  params.nBuckets = nBuckets;
  params.particleRadius = particleRadius;
  params.histogramWidth = histogramWidth;
  params.histogramDelay = histogramDelay;
  params.averagingWeight = averagingWeight;
}

function initBarCharts() {
  const params = currentExperiment.params;

  ///** @type {Partial<BarChartOptions>} */
  const commonBarChartOptions = {
    nbuckets: params.nBuckets,
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

  vxBarChart = new BarChart(vxBarChartOptions);
  vyBarChart = new BarChart(vyBarChartOptions);
  vxAvBarChart = new BarChart(vxAvBarChartOptions);
  vyAvBarChart = new BarChart(vyAvBarChartOptions);
}


/**
 * @param {Params} params
 */
function pushParamsToGui(params) {
  nParticlesElement.value = params.nParticles.toString();
  deltaTimeElement.value = params.deltaTime.toString();
  particleRadiusElement.value = params.particleRadius.toString();
  nBucketsElement.value = params.nBuckets.toString();
  histogramWidthElement.value = params.histogramWidth.toString();
  histogramDelayElement.value = params.histogramDelay.toString();
  averagingWeightElement.value = params.averagingWeight.toString();
}


function setCurrentExperiment(name) {
  if (experiments[name] !== undefined) {
    currentExperiment = experiments[name];
    pushParamsToGui(currentExperiment.params);
    onReset();
  }
}


// Setup select-experiment
(function () {
  for (let name of Object.keys(experiments)) {
    const option = document.createElement('option');
    option.text = name;
    option.value = name;
    experimentSelect.add(option);
  }
  experimentSelect.value = Object.keys(experiments)[0];
  setCurrentExperiment(experimentSelect.value);
})();


WebAssembly.instantiateStreaming(fetch('index.wasm'), importObject)
  .then((obj) => {
    init_animation = obj.instance.exports.init_animation;
    // @ts-ignore
    memory = obj.instance.exports.memory;
    update_animation = obj.instance.exports.update_animation;
    set_particle = obj.instance.exports.set_particle;
    fix_particles = obj.instance.exports.fix_particles;
    compute_histogram = obj.instance.exports.compute_histogram;
    bucket_vx = obj.instance.exports.bucket_vx;
    bucket_vy = obj.instance.exports.bucket_vy;
    vsquare = obj.instance.exports.vsquare;
    image_buffer = obj.instance.exports.image_buffer;
    image_nbytes = obj.instance.exports.image_nbytes;

    startFreshAnimation();
  })
  .catch((e) => console.log(e));
