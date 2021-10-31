
/**
 * This function heuristically computes a natural hight for the histograms of the velocity distibutions.
 * The hight is chosen in such a way that the equilibrium distribution (gaussian) looks nice and that
 * some larger deviations from this distribution are also easily visible if they occure.
 *
 * @param {number} num_particles
 * @param {number} nbuckets
 * @param {number} histogram_width
 */
function computeHistogramHeight(num_particles, nbuckets, histogram_width) { // TODO improve this function
  // Some parameter for manual adjustment
  const alpha = 2.0;

  // Note:
  // - 1.649 is the square root of eulers number
  // - 0.68 is the probability to be within one standard deviation for a normal distribution
  const beta = 0.68 * 1.649;

  const barWidth = histogram_width / nbuckets;

  rawHeight = alpha * beta * barWidth * num_particles;

  return Math.min(num_particles, Math.round(rawHeight));
}


const possibleGridScales = [
  1, 2, 5,
  10, 20, 50,
  100, 200, 500,
  1000, 2000, 5000,
];


/**
 * @param {number} maxDisplayedValue
 */
function computeHistogramGridStepSize(maxDisplayedValue) {
  const nDesiredGridLines = 20;

  const rawGridScale = maxDisplayedValue / nDesiredGridLines;

  let index = 0;
  for (let scale of possibleGridScales) {
    if (scale > rawGridScale) break;
    ++index;
  }

  if (index >= possibleGridScales.length) {
    index = possibleGridScales.length - 1;
  }

  return possibleGridScales[index];
}

const cGauss = 1 / Math.sqrt(2*Math.PI);

function gauss(x, sigma=1.0) {
  return (cGauss / sigma) * Math.exp(- x * x / 2 / sigma / sigma);
}
