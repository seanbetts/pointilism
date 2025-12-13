/**
 * @typedef {'dark' | 'light'} Mode
 * @typedef {{ mode: Mode; reducedMotion: boolean }} Options
 * @typedef {{ bg: string; dot: string }} Palette
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function nowMs() {
  return performance.now();
}

/**
 * @typedef {{ x: number; y: number; vx: number; vy: number; r: number; hx: number; hy: number; isLetter?: boolean }} Dot
 */

const DOT_FONT_5x7 = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
};

export class ContainedDotField {
  /** @type {HTMLCanvasElement} */
  #canvas;
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  /** @type {HTMLElement} */
  #container;

  /** @type {Mode} */
  #mode;
  /** @type {boolean} */
  #reducedMotion;
  /** @type {Palette} */
  #palette;

  /** @type {Dot[]} */
  #dots = [];

  #dpr = 1;
  #width = 0;
  #height = 0;
  #raf = null;
  #paused = false;
  #lastT = nowMs();

  #minRadiusCssPx = 1.6;
  #maxRadiusCssPx = 5;
  #bufferPx = 1.5;
  #edgePadCssPx = 2;
  #density = 1;
  #stability = 0.965;
  #maxV = 0.25;
  #gridStrength = 0.018;
  #gridJitter = 0.06;
  #word = 'POINTILISM';

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} container
   * @param {Options} options
   */
  constructor(canvas, container, options) {
    this.#canvas = canvas;
    this.#container = container;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D not available');
    this.#ctx = ctx;
    this.#mode = options.mode;
    this.#reducedMotion = options.reducedMotion;
    this.#palette = this.#mode === 'light' ? { bg: 'transparent', dot: '#000' } : { bg: 'transparent', dot: '#fff' };

    this.#setup();
    const ro = new ResizeObserver(() => this.#setup());
    ro.observe(container);
  }

  /** @param {boolean} reduced */
  setReducedMotion(reduced) {
    this.#reducedMotion = reduced;
    if (reduced) {
      this.stop();
      this.#draw();
    } else {
      this.start();
    }
  }

  /** @param {Mode} mode */
  setMode(mode) {
    this.#mode = mode;
    this.#palette = this.#mode === 'light' ? { bg: 'transparent', dot: '#000' } : { bg: 'transparent', dot: '#fff' };
    this.#draw();
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    this.#paused = false;
    this.start();
  }

  restart() {
    this.#setup();
    if (this.#reducedMotion) this.#draw();
  }

  start() {
    if (this.#reducedMotion) return;
    if (this.#raf != null) return;
    this.#lastT = nowMs();
    this.#raf = requestAnimationFrame((t) => this.#frame(t));
  }

  stop() {
    if (this.#raf != null) cancelAnimationFrame(this.#raf);
    this.#raf = null;
  }

  #setup() {
    const rect = this.#container.getBoundingClientRect();
    this.#dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.#width = Math.max(1, Math.floor(rect.width * this.#dpr));
    this.#height = Math.max(1, Math.floor(rect.height * this.#dpr));
    this.#canvas.width = this.#width;
    this.#canvas.height = this.#height;

    this.#dots = this.#spawnDotsGrid();
    this.#draw();
  }

  #spawnDotsGrid() {
    const minR = this.#minRadiusCssPx * this.#dpr;
    const maxR = this.#maxRadiusCssPx * this.#dpr;
    const edgePad = this.#edgePadCssPx * this.#dpr;
    const bgMaxR = minR + (maxR - minR) * 0.35;

    const usableW = Math.max(1, this.#width - 2 * edgePad);
    const usableH = Math.max(1, this.#height - 2 * edgePad);
    const spacing = Math.max(6, 2 * maxR + this.#bufferPx * this.#dpr);
    const cols = Math.max(1, Math.floor(usableW / spacing));
    const rows = Math.max(1, Math.floor(usableH / spacing));
    const totalCells = cols * rows;

    const offsetX = edgePad + (usableW - (cols - 1) * spacing) * 0.5;
    const offsetY = edgePad + (usableH - (rows - 1) * spacing) * 0.5;

    const fontH = 7;
    const fontW = 5;
    const letterGap = 1;
    const wordW = this.#word.length * fontW + (this.#word.length - 1) * letterGap;
    const scale = clamp(Math.min(Math.floor(rows / fontH), Math.floor(cols / wordW)), 1, 3);
    const blockW = wordW * scale;
    const blockH = fontH * scale;
    const startCol = Math.floor((cols - blockW) * 0.5);
    const startRow = Math.floor((rows - blockH) * 0.5);

    /** @type {boolean[]} */
    const letterCells = new Array(totalCells).fill(false);
    for (let li = 0; li < this.#word.length; li++) {
      const ch = this.#word[li];
      const glyph = DOT_FONT_5x7[ch];
      if (!glyph) continue;
      const x0 = startCol + li * (fontW + letterGap) * scale;
      const y0 = startRow;
      for (let gy = 0; gy < fontH; gy++) {
        const rowStr = glyph[gy] ?? '000';
        for (let gx = 0; gx < fontW; gx++) {
          if (rowStr[gx] !== '1') continue;
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const cx = x0 + gx * scale + sx;
              const cy = y0 + gy * scale + sy;
              if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
              letterCells[cx + cy * cols] = true;
            }
          }
        }
      }
    }

    /** @type {number[]} */
    const backgroundIndices = [];
    for (let i = 0; i < totalCells; i++) {
      if (!letterCells[i]) backgroundIndices.push(i);
    }
    for (let i = backgroundIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [backgroundIndices[i], backgroundIndices[j]] = [backgroundIndices[j], backgroundIndices[i]];
    }

    const bgDensity = 0.45;
    const bgTarget = Math.max(0, Math.min(backgroundIndices.length, Math.floor(backgroundIndices.length * bgDensity)));

    /** @type {Dot[]} */
    const dots = [];

    const centerX = startCol + blockW * 0.5;
    const centerY = startRow + blockH * 0.5;
    let maxLetterDist = 0.0001;
    for (let i = 0; i < totalCells; i++) {
      if (!letterCells[i]) continue;
      const cx = i % cols;
      const cy = Math.floor(i / cols);
      const dx = cx + 0.5 - centerX;
      const dy = cy + 0.5 - centerY;
      maxLetterDist = Math.max(maxLetterDist, Math.hypot(dx, dy));
    }

    for (let i = 0; i < totalCells; i++) {
      if (!letterCells[i]) continue;
      const cx = i % cols;
      const cy = Math.floor(i / cols);
      const hx = offsetX + cx * spacing;
      const hy = offsetY + cy * spacing;
      const dx = cx + 0.5 - centerX;
      const dy = cy + 0.5 - centerY;
      const t = clamp(Math.hypot(dx, dy) / maxLetterDist, 0, 1);
      const mult = lerp(1.35, 0.95, t) * lerp(0.98, 1.02, Math.random());
      const r = maxR * mult;

      /** @type {Dot} */
      const dot = {
        x: hx,
        y: hy,
        hx,
        hy,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        r,
        isLetter: true,
      };
      dots.push(dot);
    }

    for (let n = 0; n < bgTarget; n++) {
      const idx = backgroundIndices[n];
      const cx = idx % cols;
      const cy = Math.floor(idx / cols);
      const hx = offsetX + cx * spacing;
      const hy = offsetY + cy * spacing;
      const r = lerp(minR, bgMaxR, Math.random());

      /** @type {Dot} */
      const dot = {
        x: hx,
        y: hy,
        hx,
        hy,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        r,
      };
      dots.push(dot);
    }

    return dots;
  }

  /** @param {number} t */
  #frame(t) {
    this.#raf = requestAnimationFrame((tt) => this.#frame(tt));
    const dtMs = clamp(t - this.#lastT, 0, 34);
    this.#lastT = t;
    const dt = dtMs / 16.6667;

    if (!this.#paused) {
      for (const dot of this.#dots) {
        const dx = dot.hx - dot.x;
        const dy = dot.hy - dot.y;
        const strength = dot.isLetter ? this.#gridStrength * 1.8 : this.#gridStrength;
        const jitterAmp = dot.isLetter ? this.#gridJitter * 0.12 : this.#gridJitter;
        dot.vx += dx * strength * dt;
        dot.vy += dy * strength * dt;

        const jitter = (Math.random() - 0.5) * jitterAmp;
        dot.vx += jitter * 0.07 * dt;
        dot.vy += jitter * 0.07 * dt;

        dot.vx *= this.#stability;
        dot.vy *= this.#stability;
        dot.vx = clamp(dot.vx, -this.#maxV, this.#maxV);
        dot.vy = clamp(dot.vy, -this.#maxV, this.#maxV);

        dot.x += dot.vx * this.#dpr * 1.8 * dt;
        dot.y += dot.vy * this.#dpr * 1.8 * dt;

        const edgePad = this.#edgePadCssPx * this.#dpr;
        if (dot.x < dot.r + edgePad) {
          dot.x = dot.r + edgePad;
          dot.vx = Math.abs(dot.vx) * 0.7;
        } else if (dot.x > this.#width - dot.r - edgePad) {
          dot.x = this.#width - dot.r - edgePad;
          dot.vx = -Math.abs(dot.vx) * 0.7;
        }
        if (dot.y < dot.r + edgePad) {
          dot.y = dot.r + edgePad;
          dot.vy = Math.abs(dot.vy) * 0.7;
        } else if (dot.y > this.#height - dot.r - edgePad) {
          dot.y = this.#height - dot.r - edgePad;
          dot.vy = -Math.abs(dot.vy) * 0.7;
        }
      }
    }

    this.#draw();
  }

  #draw() {
    this.#ctx.clearRect(0, 0, this.#width, this.#height);
    this.#ctx.fillStyle = this.#palette.dot;
    this.#ctx.globalAlpha = 1;
    for (const dot of this.#dots) {
      this.#ctx.beginPath();
      this.#ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      this.#ctx.fill();
    }
  }
}
