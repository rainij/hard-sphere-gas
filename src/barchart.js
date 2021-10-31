// @ts-check

///////////////////////////////////////////////////////////////////////////////
/// Auxiliaries
///////////////////////////////////////////////////////////////////////////////

/**
 * Draw a straight line between point 1 and point 2.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 */
function drawLine(ctx, x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}


/**
 * Draw a solid bar (rectangle) with top left corner at (x,y).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} color
 */
function drawBar(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {string} color
 */
function drawText(ctx, x, y, text, color, fontSize = 10) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Mono`;
  ctx.fillText(text, x, y);
  ctx.restore();
}


class Datas {
  /** @type {number[]} */
  values; // only positive values allowed

  // meta data
  /** @type {number} */
  maxDisplayedValue;
  /** @type {number} */
  gridStepSize;
  /** @type {number} */
  leftBoundary;
  /** @type {number} */
  rightBoundary;
}


///////////////////////////////////////////////////////////////////////////////
/// The BarChart class
///////////////////////////////////////////////////////////////////////////////


/** @typedef {{
 *   canvas: HTMLCanvasElement,
 *   nbuckets: number,
 *   title: string,
 *   xLabel: string,
 *   gridColor?: string,
 *   textColor?: string,
 *   barColor?: string,
 *   criticalBarColor?: string,
 * }}
 *
 * BarChartOptions
 */

/** @typedef {{
 *   values: number[],
 *   maxDisplayedValue: number,
 *   gridStepSize: number,
 *   leftBoundary: number,
 *   rightBoundary: number,
 *   graph?: {x: number[], y: number[]},
 * }}
 *
 * Data
 */

/**
 * A class for drawing histograms to a canvas.
 */
class BarChart {
  /** @type {HTMLCanvasElement} */
  canvas;
  /** @type {CanvasRenderingContext2D} */
  ctx;
  /** @type {number} */
  nbuckets;
  /** @type {string} */
  title;
  /** @type {string} */
  xLabel;
  /** @type {string} */
  gridColor;
  /** @type {string} */
  textColor;
  /** @type {string} */
  barColor;
  /** @type {string} */
  criticalBarColor;

  /** @type {Data} */
  data;

  /** @type {number} */
  topPadding; // the padding near x=0 (recall that x increases downwards)
  /** @type {number} */
  bottomPadding; // the padding of the canvas near maximal x
  /** @type {number} */
  leftPadding;
  /** @type {number} */
  rightPadding;

  /** @param {BarChartOptions} options */
  constructor(options) {
    // Abbreviation
    const o = options;

    this.canvas = o.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.title = o.title;
    this.xLabel = o.xLabel;
    // Histogram
    this.nbuckets = o.nbuckets;

    this.gridColor = o.gridColor ?? '#cccccc';
    this.textColor = o.textColor ?? '#000000';

    this.barColor = o.barColor ?? '#000088'; // blue
    this.criticalBarColor = o.criticalBarColor ?? '#880000'; // red

    // Hardcoded padding
    this.topPadding = 30;
    this.bottomPadding = 35;
    this.leftPadding = 10;
    this.rightPadding = 10;
  }

  /** @param {Data} data */
  draw(data) {
    this.data = data;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    this.drawTitle();
    this.drawGridLines();
    this.drawMidLine();
    this.drawXLabel();
    this.drawTicks();
    this.drawBars();

    if (this.data.graph) {
      this.drawGraph();
    }
  }

  drawGridLines() {
    const actualHeight = this.actualHeight();
    for (let gridValue = 0; gridValue <= this.data.maxDisplayedValue; gridValue += this.data.gridStepSize) {
      const gridY = Math.round(actualHeight * (1 - gridValue/this.data.maxDisplayedValue) + this.topPadding);

      drawLine(
        this.ctx,
        this.leftPadding,
        gridY,
        this.canvas.width - this.rightPadding,
        gridY,
        this.gridColor
      );

      // writing grid markers
      drawText(this.ctx, this.leftPadding + 2, gridY - 2, gridValue.toString(), this.gridColor)
    }
  }

  /** Draw the vertical line with x=0. */
  drawMidLine() {

    const left = this.data.leftBoundary;
    const right = this.data.rightBoundary;

    if (!(left < 0 && right > 0)) {
      // x=0 is not properly within range
      return;
    }

    const baryCoordOfZero = -left / (right - left);
    const mid = Math.round(this.leftPadding + this.actualWidth() * baryCoordOfZero);

    drawLine(
      this.ctx,
      mid,
      this.topPadding,
      mid,
      this.canvas.height - this.bottomPadding,
      this.gridColor
    )
  }

  drawBars() {
    //drawing the bars

    if (this.nbuckets !== this.data.values.length) {
      throw Error(`Invalid data object: data-size=${this.data.values.length} != ${this.nbuckets}=nbuckets.`);
    }

    const actualHeight = this.actualHeight();
    const barWidth = this.actualWidth() / this.nbuckets;

    for (let i = 0; i < this.nbuckets; ++i) {
      const val = this.data.values[i];
      let barHeight = Math.round(actualHeight * val / this.data.maxDisplayedValue);

      let barColor = this.barColor; // default

      if (i === 0 || i === this.nbuckets-1) {
        barColor = this.criticalBarColor;
      }

      if (barHeight > actualHeight) {
        barHeight = actualHeight;
        barColor = this.criticalBarColor;
      }

      drawBar(
        this.ctx,
        this.leftPadding + i * barWidth,
        this.canvas.height - barHeight - this.bottomPadding,
        barWidth,
        barHeight,
        barColor,
      );
    }
  }

  drawTicks() {
    const left = this.data.leftBoundary;
    const right = this.data.rightBoundary;

    if (right <= left) {
      throw Error(`drawTicks: Right boundary must be greater than left boundary.`);
    }

    const roundLeft = Math.ceil(left);
    const roundRight = Math.floor(right);

    const actualWidth = this.actualWidth();
    const tickLen = 5;

    for (let x = roundLeft; x <= roundRight; ++x) {
      const xBary = (x - left) / (right - left); // in ]0, 1[
      const xPixel = this.leftPadding + Math.round(xBary * actualWidth);
      const yPixel = this.canvas.height - this.bottomPadding;

      drawLine(
        this.ctx,
        xPixel,
        yPixel,
        xPixel,
        yPixel + tickLen,
        this.gridColor
      );

      const xStr = x.toString();

      drawText(
        this.ctx,
        xPixel - 3*xStr.length,
        yPixel + tickLen + 12,
        xStr,
        this.gridColor,
      );
    }
  }

  drawTitle() {
    drawText(
      this.ctx,
      this.leftPadding,
      15,
      this.title,
      this.textColor,
      15
    );
  }

  drawXLabel() {
    const text = this.xLabel;

    const xPos = this.leftPadding + Math.round( ( this.actualWidth() - 6*text.length ) / 2 );

    drawText(
      this.ctx,
      xPos,
      this.canvas.height - 5,
      text,
      this.textColor,
      10
    );
  }

  drawGraph() {
    const { x, y } = this.data.graph;
    const { maxDisplayedValue, leftBoundary, rightBoundary } = this.data;

    if (x.length !== y.length || x.length === 0) {
      throw Error(`Invalid graph for drawGraph: x.length=${x.length}, y.length=${y.length}`);
    }

    const len = x.length;
    const actualWidth = this.actualWidth();
    const actualHeight = this.actualHeight();

    const xPix = [];
    const yPix = [];

    for (let i = 0; i < len; ++i) {
      const xReli = Math.min(1.0, Math.max(0.0, (x[i] - leftBoundary) / (rightBoundary - leftBoundary)));
      const xPixi = this.leftPadding + Math.round(xReli * actualWidth);
      xPix[i] = xPixi;

      const yReli = Math.min(1.0, Math.max(0.0, y[i] / maxDisplayedValue));
      const yPixi = this.topPadding + Math.round((1.0 - yReli) * actualHeight);
      yPix[i] = yPixi;
    }

    for (let i = 0; i < len-1; ++i) {
      drawLine(this.ctx, xPix[i], yPix[i], xPix[i+1], yPix[i+1], this.gridColor);
    }
  }

  actualHeight() {
    return this.canvas.height - this.bottomPadding - this.topPadding;
  }

  actualWidth() {
    return this.canvas.width - this.leftPadding - this.rightPadding;
  }
}
