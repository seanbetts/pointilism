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
 * @typedef {{ x: number; y: number; vx: number; vy: number; r: number }} Dot
 */

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

  #minRadiusCssPx = 2.2;
  #maxRadiusCssPx = 8;
  #bufferPx = 1.5;
  #edgePadCssPx = 3;
  #density = 1;
  #stability = 0.965;
  #maxV = 0.25;

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

    const area = rect.width * rect.height;
    const baseDots = area < 30_000 ? 90 : area < 70_000 ? 150 : area < 120_000 ? 220 : 300;
    const count = Math.floor(baseDots * this.#density);
    this.#dots = this.#spawnDots(count);
    this.#draw();
  }

  /** @param {number} count */
  #spawnDots(count) {
    const minR = this.#minRadiusCssPx * this.#dpr;
    const maxR = this.#maxRadiusCssPx * this.#dpr;
    const edgePad = this.#edgePadCssPx * this.#dpr;
    const cellSize = Math.max(6, 2 * maxR + (this.#bufferPx + this.#edgePadCssPx) * this.#dpr);

    /** @type {Map<string, Dot[]>} */
    const grid = new Map();
    /** @type {Dot[]} */
    const dots = [];

    const perDotAttempts = 140;
    for (let i = 0; i < count; i++) {
      const r = lerp(minR, maxR, Math.random());
      let placed = false;
      for (let tries = 0; tries < perDotAttempts; tries++) {
        const x = lerp(r + edgePad, this.#width - r - edgePad, Math.random());
        const y = lerp(r + edgePad, this.#height - r - edgePad, Math.random());
        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);

        let ok = true;
        for (let oy = -1; oy <= 1 && ok; oy++) {
          for (let ox = -1; ox <= 1 && ok; ox++) {
            const bucket = grid.get(`${cx + ox},${cy + oy}`);
            if (!bucket) continue;
            for (const other of bucket) {
              const dx = x - other.x;
              const dy = y - other.y;
              const minDist = r + other.r + this.#bufferPx * this.#dpr;
              if (dx * dx + dy * dy < minDist * minDist) {
                ok = false;
                break;
              }
            }
          }
        }
        if (!ok) continue;

        /** @type {Dot} */
        const dot = {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r,
        };
        const key = `${cx},${cy}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(dot);
        else grid.set(key, [dot]);
        dots.push(dot);
        placed = true;
        break;
      }
      if (!placed && dots.length > 24) break;
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

