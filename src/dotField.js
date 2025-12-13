/**
 * @typedef {'dark' | 'light'} Mode
 * @typedef {{ x: number; y: number; strength: number }} Anchor
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
 * @typedef {{ x: number; y: number; vx: number; vy: number; r: number; r0: number; a: number; ds: number; stick: number }} Dot
 */

function keyForCell(cx, cy) {
  return `${cx},${cy}`;
}

function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function hash3i(x, y, s) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function noise2(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const n00 = hash3i(xi, yi, seed);
  const n10 = hash3i(xi + 1, yi, seed);
  const n01 = hash3i(xi, yi + 1, seed);
  const n11 = hash3i(xi + 1, yi + 1, seed);

  const nx0 = lerp(n00, n10, u);
  const nx1 = lerp(n01, n11, u);
  return lerp(nx0, nx1, v);
}

function quantizeLabel(index) {
  switch (index) {
    case 0:
      return 'small-linear';
    case 1:
      return 'small-curved';
    case 2:
      return 'bell';
    case 3:
      return 'flat';
    case 4:
      return 'u-shaped';
    case 5:
      return 'large-linear';
    case 6:
      return 'large-curved';
    default:
      return 'flat';
  }
}

function distributionWeights(mode, n) {
  const mid = (n - 1) / 2;
  const sigma = Math.max(0.55, n / 5);

  /** @type {number[]} */
  const w = new Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    const x = i - mid;
    if (mode === 'flat') w[i] = 1;
    else if (mode === 'bell') w[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    else if (mode === 'small-linear') w[i] = n - i;
    else if (mode === 'small-curved') w[i] = Math.pow(n - i, 2);
    else if (mode === 'large-linear') w[i] = i + 1;
    else if (mode === 'large-curved') w[i] = Math.pow(i + 1, 2);
    else if (mode === 'u-shaped') w[i] = Math.pow(Math.abs(x) + 1, 2);
    else w[i] = 1;
  }
  return w;
}

function quotasFromWeights(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const n = weights.length;

  /** @type {number[]} */
  const raw = weights.map((w) => (sum <= 0 ? total / n : (w / sum) * total));
  /** @type {number[]} */
  const q = raw.map((v) => Math.floor(v));
  let remaining = total - q.reduce((a, b) => a + b, 0);

  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i);

  for (let k = 0; k < order.length && remaining > 0; k++) {
    q[order[k]]++;
    remaining--;
  }

  return q;
}

export class DotField {
  /** @type {HTMLCanvasElement} */
  #canvas;
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  /** @type {Palette} */
  #palette;
  /** @type {Mode} */
  #mode;
  /** @type {boolean} */
  #reducedMotion;

  /** @type {Dot[]} */
  #dots = [];
  #dpr = 1;
  #width = 0;
  #height = 0;
  #setupScheduled = false;

  #lastT = nowMs();
  /** @type {number | null} */
  #raf = null;
  #running = false;
  #paused = false;
  /** @type {number | null} */
  #introUntilMs = null;

  #navActive = false;
  /** @type {string | null} */
  #activeSection = null;
  /** @type {Anchor | null} */
  #sectionAnchor = null;
  /** @type {DOMRect | null} */
  #hotElementRect = null;
  /** @type {Anchor[]} */
  #interactiveAnchors = [];

  #cohesion = 0.12;
  #stability = 0.92;
  #noise = 0.22;
  #maxV = 0.9;
  #densityScalar = 1;
  #bufferPx = 1.5;
  #edgePaddingCssPx = 2;
  #excludeTopCssPx = 0;
  #minRadiusCssPx = 1.5;
  #maxRadiusCssPx = 4;
  #sizeCount = 5;
  #distribution = 'flat';
  #autoFit = true;
  #reactToUi = true;
  #speed = 0.35;
  #physicsEnabled = true;

  #breathingEnabled = false;
  /** @type {number | null} */
  #breathStartMs = null;

  #gravityEnabled = false;
  /** @type {number | null} */
  #gravityDropUntilMs = null;
  /** @type {number | null} */
  #gravityMaskUntilMs = null;
  /** @type {number | null} */
  #gravityMaskStartMs = null;
  /** @type {number | null} */
  #gravityActiveUntilMs = null;
  /** @type {number | null} */
  #settleBoostUntilMs = null;
  /** @type {number | null} */
  #settleBoostStartMs = null;

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Options} options
   */
  constructor(canvas, options) {
    this.#canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D not available');
    this.#ctx = ctx;
    this.#mode = options.mode;
    this.#reducedMotion = options.reducedMotion;
    this.#palette = this.#mode === 'light' ? { bg: '#fff', dot: '#000' } : { bg: '#000', dot: '#fff' };

    this.#setup();
    window.addEventListener('resize', () => this.#setup(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (this.#running && !this.#paused) this.start();
    });
  }

  /** @param {boolean} reduced */
  setReducedMotion(reduced) {
    this.#reducedMotion = reduced;
    if (reduced) {
      this.stop();
      this.#draw(true);
    } else if (this.#running) {
      this.start();
    }
  }

  /** @param {boolean} active */
  setNavActive(active) {
    this.#navActive = active;
    if (this.#reducedMotion) this.#draw(true);
  }

  /** @param {string | null} section */
  setActiveSection(section) {
    this.#activeSection = section;
    if (this.#reducedMotion) this.#draw(true);
  }

  /** @param {Anchor | null} anchor */
  setSectionAnchor(anchor) {
    this.#sectionAnchor = anchor;
    if (this.#reducedMotion) this.#draw(true);
  }

  /** @param {HTMLElement | null} el */
  setHotElement(el) {
    this.#hotElementRect = el ? el.getBoundingClientRect() : null;
    if (this.#reducedMotion) this.#draw(true);
  }

  /** @param {Anchor[]} anchors */
  setInteractiveAnchors(anchors) {
    this.#interactiveAnchors = anchors;
    if (this.#reducedMotion) this.#draw(true);
  }

  /** @param {number} scalar */
  setDensityScalar(scalar) {
    const next = clamp(scalar, 0.1, 3);
    this.#densityScalar = next;
    this.#scheduleSetup();
  }

  /** @param {number} cssPx */
  setMinRadius(cssPx) {
    const next = clamp(cssPx, 0.5, 200);
    this.#minRadiusCssPx = next;
    if (this.#minRadiusCssPx > this.#maxRadiusCssPx) this.#maxRadiusCssPx = this.#minRadiusCssPx;
    this.#scheduleSetup();
  }

  /** @param {number} cssPx */
  setMaxRadius(cssPx) {
    const next = clamp(cssPx, 1, 400);
    this.#maxRadiusCssPx = next;
    if (this.#maxRadiusCssPx < this.#minRadiusCssPx) this.#maxRadiusCssPx = this.#minRadiusCssPx;
    this.#scheduleSetup();
  }

  /** @param {number} count */
  setSizeCount(count) {
    const next = Math.round(clamp(count, 2, 15));
    this.#sizeCount = next;
    this.#scheduleSetup();
  }

  /** @param {number | string} mode */
  setDistribution(mode) {
    const next = typeof mode === 'number' ? quantizeLabel(mode) : String(mode);
    this.#distribution = next;
    this.#scheduleSetup();
  }

  /** @param {boolean} enabled */
  setAutoFitDensity(enabled) {
    this.#autoFit = Boolean(enabled);
    this.#scheduleSetup();
  }

  /** @param {boolean} enabled */
  setReactToUi(enabled) {
    this.#reactToUi = Boolean(enabled);
  }

  /** @param {number} speed */
  setSpeed(speed) {
    this.#speed = clamp(speed, 0, 1);
  }

  /** @param {boolean} enabled */
  setBreathingEnabled(enabled) {
    const next = Boolean(enabled);
    if (next === this.#breathingEnabled) return;
    this.#breathingEnabled = next;
    this.#breathStartMs = next ? nowMs() : null;
  }

  /** @param {boolean} enabled */
  setGravityEnabled(enabled) {
    this.#gravityEnabled = Boolean(enabled);
    if (!this.#gravityEnabled) {
      this.#gravityDropUntilMs = null;
      this.#gravityActiveUntilMs = null;
      this.#settleBoostUntilMs = null;
      this.#settleBoostStartMs = null;
    }
  }

  /** @param {{ activeMs?: number; dropMs?: number; settleDelayMs?: number; settleBoostMs?: number; maskDelayMs?: number; maskMs?: number }=} options */
  dropToBottom(options) {
    this.#gravityEnabled = true;
    if (this.#reducedMotion) {
      this.#draw(true);
      return;
    }
    const t0 = nowMs();
    const dropMs = clamp(options?.dropMs ?? 1200, 100, 20_000);
    const activeMs = clamp(options?.activeMs ?? 1000, dropMs, 30_000);
    const settleDelayMs = clamp(options?.settleDelayMs ?? 250, 0, 10_000);
    const settleBoostMs = clamp(options?.settleBoostMs ?? 1400, 0, 10_000);
    const maskDelayMs = clamp(options?.maskDelayMs ?? 0, 0, 30_000);
    // If maskMs is 0, keep the mask visible until the next Drop / reset.
    const maskMs = clamp(options?.maskMs ?? 0, 0, 60_000);
    this.#gravityDropUntilMs = t0 + dropMs;
    this.#gravityActiveUntilMs = t0 + activeMs;
    this.#settleBoostStartMs = this.#gravityDropUntilMs + settleDelayMs;
    this.#settleBoostUntilMs = this.#settleBoostStartMs + settleBoostMs;
    this.#gravityMaskStartMs = t0 + maskDelayMs;
    this.#gravityMaskUntilMs = maskMs <= 0 ? null : this.#gravityMaskStartMs + maskMs;

    for (const dot of this.#dots) {
      dot.vy = Math.max(0, dot.vy);
    }
  }

  /** @param {number} cssPx */
  setTopExclusion(cssPx) {
    const next = clamp(cssPx, 0, 10_000);
    if (Math.abs(next - this.#excludeTopCssPx) < 0.5) return;
    this.#excludeTopCssPx = next;
    this.#scheduleSetup();
  }

  #scheduleSetup() {
    if (this.#setupScheduled) return;
    this.#setupScheduled = true;
    requestAnimationFrame(() => {
      this.#setupScheduled = false;
      this.#setup();
    });
  }

  /** @param {Mode} mode */
  invertWithDispersion(mode) {
    this.#mode = mode;
    if (this.#reducedMotion) {
      this.#palette = mode === 'light' ? { bg: '#fff', dot: '#000' } : { bg: '#000', dot: '#fff' };
      this.#draw(true);
      return;
    }
    const start = nowMs();
    const prev = { cohesion: this.#cohesion, noise: this.#noise };
    this.#cohesion = 0.02;
    this.#noise = 0.6;
    const switchAt = start + 160;
    const endAt = start + 380;
    let switched = false;

    const tick = () => {
      const t = nowMs();
      if (!switched && t >= switchAt) {
        this.#palette = mode === 'light' ? { bg: '#fff', dot: '#000' } : { bg: '#000', dot: '#fff' };
        switched = true;
      }
      if (t >= endAt) {
        this.#cohesion = prev.cohesion;
        this.#noise = prev.noise;
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  heroIntro() {
    if (this.#reducedMotion) return;
    this.#introUntilMs = nowMs() + 900;
  }

  start() {
    this.#running = true;
    this.#paused = false;
    if (this.#reducedMotion) {
      this.#draw(true);
      return;
    }
    if (this.#raf != null) return;
    this.#lastT = nowMs();
    this.#raf = requestAnimationFrame((t) => this.#frame(t));
  }

  pause() {
    this.#paused = true;
    this.stop();
  }

  resume() {
    this.#paused = false;
    this.start();
  }

  restart() {
    this.#setup();
    if (this.#paused || this.#reducedMotion) {
      this.stop();
      this.#draw(true);
      return;
    }
    this.start();
  }

  stop() {
    if (this.#raf != null) cancelAnimationFrame(this.#raf);
    this.#raf = null;
  }

  #setup() {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    this.#dpr = clamp(devicePixelRatio || 1, 1, 2);
    this.#width = Math.floor(innerWidth * this.#dpr);
    this.#height = Math.floor(innerHeight * this.#dpr);
    this.#canvas.width = this.#width;
    this.#canvas.height = this.#height;
    this.#canvas.style.background = this.#palette.bg;

    const area = innerWidth * innerHeight;
    const baseDots =
      area < 420_000 ? 420 : area < 1_000_000 ? 820 : area < 1_800_000 ? 1200 : 1650;
    const dots = Math.floor(baseDots * this.#densityScalar);
    this.#dots = this.#spawnDots(dots);
    this.#draw(true);
  }

  /** @param {number} count */
  #spawnDots(count) {
    const attemptCounts = this.#autoFit
      ? [count, Math.floor(count * 0.92), Math.floor(count * 0.84), Math.floor(count * 0.76), Math.floor(count * 0.68)]
      : [count];

    for (const target of attemptCounts) {
      const result = this.#trySpawnDots(target);
      if (!this.#autoFit) return result;
      if (result.length === target) return result;
    }

    return this.#trySpawnDots(Math.max(40, Math.floor(count * 0.6)));
  }

  /** @param {number} target */
  #trySpawnDots(target) {
    const minR = this.#minRadiusCssPx * this.#dpr;
    const maxR = this.#maxRadiusCssPx * this.#dpr * 1.06;
    const maxRequired = 2 * maxR + this.#bufferPx * this.#dpr;
    const cellSize = Math.max(6, maxRequired);
    const excludeTop = this.#excludeTopCssPx * this.#dpr;
    const edgePad = this.#edgePaddingCssPx * this.#dpr;

    const sizes = Array.from({ length: this.#sizeCount }, (_, i) => {
      return minR + (i * (maxR - minR)) / (this.#sizeCount - 1);
    });

    const weights = distributionWeights(this.#distribution, this.#sizeCount);
    const quotas = quotasFromWeights(target, weights);

    /** @type {number[]} */
    const radii = [];
    for (let i = 0; i < sizes.length; i++) {
      for (let k = 0; k < quotas[i]; k++) radii.push(sizes[i]);
    }
    radii.sort((a, b) => b - a);

    /** @type {Map<string, Dot[]>} */
    const grid = new Map();
    /** @type {Dot[]} */
    const dots = [];

    const perDotAttempts = clampInt(120, 20, 320);

    for (const r of radii) {
      let placed = false;
      for (let tries = 0; tries < perDotAttempts; tries++) {
        const x = lerp(r + edgePad, this.#width - r - edgePad, Math.random());
        const y = lerp(excludeTop + r + edgePad, this.#height - r - edgePad, Math.random());
        const cx = Math.floor(x / cellSize);
        const cy = Math.floor(y / cellSize);

        let ok = true;
        for (let oy = -1; oy <= 1 && ok; oy++) {
          for (let ox = -1; ox <= 1 && ok; ox++) {
            const bucket = grid.get(keyForCell(cx + ox, cy + oy));
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
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r,
          r0: r,
          a: 1,
          ds: lerp(0.75, 1.25, Math.random()),
          stick: Math.random(),
        };
        const key = keyForCell(cx, cy);
        const bucket = grid.get(key);
        if (bucket) bucket.push(dot);
        else grid.set(key, [dot]);
        dots.push(dot);
        placed = true;
        break;
      }
      if (!placed) continue;
    }

    return dots;
  }

  #getAnchors() {
    /** @type {Anchor[]} */
    const anchors = [];

    if (!this.#reactToUi) return anchors;

    if (this.#navActive) {
      anchors.push({ x: this.#width * 0.2, y: this.#height * 0.08, strength: 0.9 });
      anchors.push({ x: this.#width * 0.5, y: this.#height * 0.08, strength: 0.9 });
      anchors.push({ x: this.#width * 0.8, y: this.#height * 0.08, strength: 0.9 });
    } else {
      anchors.push({ x: this.#width * 0.5, y: this.#height * 0.06, strength: 0.22 });
    }

    if (this.#hotElementRect) {
      const r = this.#hotElementRect;
      anchors.push({
        x: (r.left + r.width / 2) * this.#dpr,
        y: (r.top + r.height / 2) * this.#dpr,
        strength: 1.1,
      });
    }

    if (this.#sectionAnchor) {
      anchors.push({
        x: this.#sectionAnchor.x * this.#dpr,
        y: this.#sectionAnchor.y * this.#dpr,
        strength: this.#sectionAnchor.strength,
      });
    }

    for (const a of this.#interactiveAnchors.slice(0, 18)) {
      anchors.push({ x: a.x * this.#dpr, y: a.y * this.#dpr, strength: a.strength });
    }

    if (this.#activeSection === 'proof') {
      anchors.push({ x: this.#width * 0.35, y: this.#height * 0.55, strength: 0.9 });
      anchors.push({ x: this.#width * 0.65, y: this.#height * 0.55, strength: 0.9 });
    }

    if (this.#activeSection === 'footer') {
      anchors.push({ x: this.#width * 0.5, y: this.#height * 0.92, strength: 0.55 });
    }

    return anchors;
  }

  #sectionTuning() {
    const speed = this.#speed;
    const react = this.#reactToUi;

    // Single baseline: calm drift + optional anchor pull.
    this.#noise = 0;
    this.#stability = lerp(0.992, 0.94, speed);
    this.#maxV = lerp(0.02, 0.42, speed);
    this.#cohesion = react ? lerp(0.0, 0.08, speed) : 0;
  }

  #frame(t) {
    this.#raf = requestAnimationFrame((tt) => this.#frame(tt));
    const dtMs = clamp(t - this.#lastT, 0, 34);
    this.#lastT = t;
    const dt = dtMs / 16.6667;
    const dtSec = dtMs / 1000;
    const tNow = nowMs();

    this.#sectionTuning();
    const dropping = this.#gravityDropUntilMs != null && tNow < this.#gravityDropUntilMs;
    const gravityActive =
      this.#gravityEnabled && (this.#gravityActiveUntilMs == null || tNow < this.#gravityActiveUntilMs);
    if (this.#gravityEnabled && !gravityActive) {
      this.setGravityEnabled(false);
    }
    const anchors = dropping || gravityActive ? [] : this.#getAnchors();
    const { cohesion, stability, noise, maxV } = this;

    const speed = this.#speed;
    const minR = this.#minRadiusCssPx * this.#dpr;
    const maxR = this.#maxRadiusCssPx * this.#dpr * 1.06;
    const edgePad = this.#edgePaddingCssPx * this.#dpr;

    const breathEnabled = this.#breathingEnabled && !this.#reducedMotion && !gravityActive;
    const breathPeriodMs = 4200;
    const breathAmp = 0.08;
    const breathThresholdCss = Math.min(
      this.#maxRadiusCssPx,
      Math.max(this.#minRadiusCssPx + 2, this.#maxRadiusCssPx * 0.25)
    );
    const breathThresholdR = breathThresholdCss * this.#dpr;
    const breathT0 = this.#breathStartMs ?? tNow;
    // Start at midpoint (current size) and move into the downward curve (inward breath).
    const phase = ((tNow - breathT0) / breathPeriodMs) * Math.PI * 2 + Math.PI;
    const breath = Math.sin(phase);
    const exhale = Math.max(0, breath);
    // Soft-start the exhale force so it ramps up gently and doesn't spike near the peak.
    const exhaleForce = exhale * exhale;
    let driftSeed0 = 0;
    let driftSeed1 = 0;
    let driftT = 0;
    let driftScale = 1;
    let driftBandSeed = 0;
    let driftForce = 0;
    if (speed > 0) {
      const periodMs = 8000;
      const s0 = Math.floor(t / periodMs);
      const s1 = s0 + 1;
      const tt = (t - s0 * periodMs) / periodMs;
      driftSeed0 = s0;
      driftSeed1 = s1;
      driftT = smoothstep(tt);
      driftBandSeed = s0 * 8191 + 17;
      driftScale = 1 / (520 * this.#dpr);
      driftForce = lerp(0, 0.095, speed) * this.#dpr;
    }

    for (const dot of this.#dots) {
      dot.r = dot.r0;
      if (breathEnabled && dot.r0 >= breathThresholdR) {
        dot.r = Math.max(0.5 * this.#dpr, dot.r0 * (1 + breathAmp * breath));
      }

      const jitter = (Math.random() - 0.5) * noise;
      dot.vx += jitter * 0.22 * dt;
      dot.vy += jitter * 0.22 * dt;

      if (!this.#paused && !dropping && !gravityActive && speed > 0) {
        const sx = dot.x * driftScale;
        const sy = dot.y * driftScale;
        const n1a = noise2(sx, sy, driftSeed0);
        const n1b = noise2(sx, sy, driftSeed1);
        const n2a = noise2(sx + 19.17, sy - 11.83, driftSeed0 + 101);
        const n2b = noise2(sx + 19.17, sy - 11.83, driftSeed1 + 101);
        const vx = lerp(n1a, n1b, driftT) - 0.5;
        const vy = lerp(n2a, n2b, driftT) - 0.5;
        const len = Math.sqrt(vx * vx + vy * vy) || 1;

        const bandA = noise2(sx - 7.3, sy + 5.1, driftBandSeed);
        const bandB = noise2(sx - 7.3, sy + 5.1, driftBandSeed + 1);
        const band = lerp(bandA, bandB, driftT);
        const speed = lerp(0.65, 1.25, band) * dot.ds;
        const fx = (vx / len) * driftForce * speed;
        const fy = (vy / len) * driftForce * speed;
        const denom = Math.max(1e-6, maxR - minR);
        const t = clamp((dot.r0 - minR) / denom, 0, 1);
        const sizeBias = lerp(0.6, 1.025, t);
        const fyProjected = gravityActive ? 0 : fy;
        if (this.#physicsEnabled) {
          const mass = 1 + dot.r0 * dot.r0 * 0.025;
          dot.vx += (fx / mass) * sizeBias * dt;
          dot.vy += (fyProjected / mass) * sizeBias * dt;
        } else {
          dot.vx += fx * sizeBias * dt;
          dot.vy += fyProjected * sizeBias * dt;
        }
      }

      if (!this.#paused && gravityActive && speed > 0) {
        // Gravity drop is positional so all dots fall at the same speed regardless of size.
        const baseline = Math.max(0.35, speed);
        const dropPxPerSec = dropping ? lerp(0, 9000, baseline) : lerp(0, 240, baseline);
        dot.y += dropPxPerSec * dtSec * this.#dpr;
        dot.vy = 0;
        dot.vx *= Math.pow(0.94, dt);
      }

      if (anchors.length > 0) {
        let pullX = 0;
        let pullY = 0;
        for (const a of anchors) {
          const dx = a.x - dot.x;
          const dy = a.y - dot.y;
          const d2 = dx * dx + dy * dy + 1;
          const inv = 1 / d2;
          const w = a.strength * inv;
          pullX += dx * w;
          pullY += dy * w;
        }
        dot.vx += pullX * cohesion * dt;
        dot.vy += pullY * cohesion * dt;
      }

      dot.vx *= stability;
      dot.vy *= stability;
      dot.vx = clamp(dot.vx, -maxV, maxV);
      dot.vy = clamp(dot.vy, -maxV, maxV);

      if (!this.#paused) {
        dot.x += dot.vx * this.#dpr * 2.2 * dt;
        dot.y += dot.vy * this.#dpr * 2.2 * dt;
      }

      const rScaled = dot.r;
      const excludeTop = this.#excludeTopCssPx * this.#dpr;
      const edgePad = this.#edgePaddingCssPx * this.#dpr;
      if (dot.x < rScaled) {
        dot.x = rScaled + edgePad;
        dot.vx = Math.abs(dot.vx) * 0.5;
      } else if (dot.x > this.#width - rScaled - edgePad) {
        dot.x = this.#width - rScaled - edgePad;
        dot.vx = -Math.abs(dot.vx) * 0.5;
      }
      if (dot.y < excludeTop + rScaled + edgePad) {
        dot.y = excludeTop + rScaled + edgePad;
        dot.vy = Math.abs(dot.vy) * 0.5;
      } else if (dot.y > this.#height - rScaled - edgePad) {
        dot.y = this.#height - rScaled - edgePad;
        dot.vy = gravityActive ? 0 : -Math.abs(dot.vy) * 0.5;
      }

      // "Sleep" grounded dots during gravity so the pile doesn't jitter.
      if (gravityActive) {
        const bottom = this.#height - rScaled - edgePad;
        if (dot.y >= bottom - 0.5 * this.#dpr) {
          if (dot.vy > 0) dot.vy = 0;
          const speed2 = dot.vx * dot.vx + dot.vy * dot.vy;
          if (speed2 < 0.0009) {
            dot.vx = 0;
            dot.vy = 0;
          } else {
            const damp = Math.pow(0.72, dt);
            dot.vx *= damp;
          }
        }
      }
    }

    const settling =
      this.#settleBoostStartMs != null &&
      this.#settleBoostUntilMs != null &&
      tNow >= this.#settleBoostStartMs &&
      tNow < this.#settleBoostUntilMs;
    const overlapIterations = dropping ? 28 : settling ? 16 : 2;
    const pushScale = dropping ? 1.95 : settling ? 1.65 : 1;
    this.#resolveOverlaps(dt, overlapIterations, pushScale, breathEnabled ? exhaleForce : 0, breathThresholdR);
    this.#draw(false);
  }

  /**
   * @param {number} dt
   * @param {number} iterations
   * @param {number} pushScale
   * @param {number} breathExhale
   * @param {number} breathThresholdR
   */
  #resolveOverlaps(dt, iterations = 2, pushScale = 1, breathExhale = 0, breathThresholdR = Infinity) {
    if (this.#dots.length < 2) return;

    const maxR = this.#maxRadiusCssPx * this.#dpr * 1.06;
    const maxRequired = 2 * maxR + this.#bufferPx * this.#dpr;
    const cellSize = Math.max(6, maxRequired);
    const excludeTop = this.#excludeTopCssPx * this.#dpr;
    const edgePad = this.#edgePaddingCssPx * this.#dpr;

    const physics = this.#physicsEnabled && !this.#gravityEnabled;
    const breathing = this.#breathingEnabled;
    const allowCoupling = !breathing;
    const adhesionBand = physics ? 6 * this.#dpr : 0;
    const breathBand = breathExhale > 0 ? 18 * this.#dpr : 0;

    for (let iter = 0; iter < iterations; iter++) {
      /** @type {Map<string, Dot[]>} */
      const grid = new Map();
      for (const dot of this.#dots) {
        const cx = Math.floor(dot.x / cellSize);
        const cy = Math.floor(dot.y / cellSize);
        const key = keyForCell(cx, cy);
        const bucket = grid.get(key);
        if (bucket) bucket.push(dot);
        else grid.set(key, [dot]);
      }

      for (const dot of this.#dots) {
        const cx = Math.floor(dot.x / cellSize);
        const cy = Math.floor(dot.y / cellSize);

        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const bucket = grid.get(keyForCell(cx + ox, cy + oy));
            if (!bucket) continue;
            for (const other of bucket) {
              if (other === dot) continue;
              if (other.x < dot.x) continue;
              if (other.x === dot.x && other.y <= dot.y) continue;

              const dx = other.x - dot.x;
              const dy = other.y - dot.y;
              const dist2 = dx * dx + dy * dy;
              const minDist = dot.r + other.r + this.#bufferPx * this.#dpr;
              const minDist2 = minDist * minDist;
              const stickRaw = physics ? (dot.stick + other.stick) * 0.5 : 0;
              const stick = breathing ? 0 : stickRaw;
              const restitution = physics ? lerp(1.25, 0.05, stick) : 0;
              const friction = physics ? lerp(0.06, 0.7, stick) : 1;
              const adhesionStrength = physics ? 0.05 * stick : 0;
              const coupleStrength = physics && allowCoupling ? 0.9 * stick : 0;
              if (dist2 >= minDist2) {
                if (breathBand > 0) {
                  const band2 = (minDist + breathBand) * (minDist + breathBand);
                  if (dist2 < band2 && (dot.r0 >= breathThresholdR || other.r0 >= breathThresholdR)) {
                    const dist = Math.sqrt(Math.max(1e-6, dist2));
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const gap = dist - minDist;
                    const t = clamp(1 - gap / breathBand, 0, 1);
                    // Progressive "exhale" pressure: gently separate nearby dots as the breathing dot expands,
                    // so we don't get a single snap when the radius peaks.
                    const push = breathExhale * t * 0.55 * this.#dpr * dt;
                    dot.x -= nx * push;
                    dot.y -= ny * push;
                    other.x += nx * push;
                    other.y += ny * push;
                  }
                }
                const band2 = (minDist + adhesionBand) * (minDist + adhesionBand);
                if (dist2 < band2) {
                  const dist = Math.sqrt(Math.max(1e-6, dist2));
                  const nx = dx / dist;
                  const ny = dy / dist;
                  const gap = dist - minDist;

                  if (adhesionStrength > 0) {
                    const pull = clamp(adhesionStrength * (1 - gap / adhesionBand), 0, adhesionStrength);
                    dot.vx += nx * pull * dt;
                    dot.vy += ny * pull * dt;
                    other.vx -= nx * pull * dt;
                    other.vy -= ny * pull * dt;
                  }

                  // "Attachment": suppress relative jitter so clusters move as a unit.
                  if (coupleStrength > 0.001) {
                    const avgVx = (dot.vx + other.vx) * 0.5;
                    const avgVy = (dot.vy + other.vy) * 0.5;
                    const t = clamp(coupleStrength * (1 - gap / adhesionBand), 0, coupleStrength);
                    dot.vx = lerp(dot.vx, avgVx, t);
                    dot.vy = lerp(dot.vy, avgVy, t);
                    other.vx = lerp(other.vx, avgVx, t);
                    other.vy = lerp(other.vy, avgVy, t);
                  }
                }
                continue;
              }

              const dist = Math.sqrt(Math.max(1e-6, dist2));
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const push = overlap * 0.5 * clamp(pushScale, 0.5, 2);

              dot.x -= nx * push;
              dot.y -= ny * push;
              other.x += nx * push;
              other.y += ny * push;

              const rvx = other.vx - dot.vx;
              const rvy = other.vy - dot.vy;
              const vn = rvx * nx + rvy * ny;
              if (vn < 0) {
                const j = -(1 + restitution) * vn * 0.5;
                dot.vx -= j * nx;
                dot.vy -= j * ny;
                other.vx += j * nx;
                other.vy += j * ny;
              }

              const tvx = rvx - vn * nx;
              const tvy = rvy - vn * ny;
              dot.vx += tvx * (0.5 - friction * 0.5);
              dot.vy += tvy * (0.5 - friction * 0.5);
              other.vx -= tvx * (0.5 - friction * 0.5);
              other.vy -= tvy * (0.5 - friction * 0.5);

              const dampBase = !physics ? 1 : lerp(0.99, 0.94, friction);
              const damp = Math.pow(dampBase, dt);
              dot.vx *= damp;
              dot.vy *= damp;
              other.vx *= damp;
              other.vy *= damp;
            }
          }
        }
      }
    }

    for (const dot of this.#dots) {
      const rScaled = dot.r;
      dot.x = clamp(dot.x, rScaled + edgePad, this.#width - rScaled - edgePad);
      dot.y = clamp(dot.y, excludeTop + rScaled + edgePad, this.#height - rScaled - edgePad);
    }
  }

  get cohesion() {
    return this.#cohesion;
  }
  get stability() {
    return this.#stability;
  }
  get noise() {
    return this.#noise;
  }
  get maxV() {
    return this.#maxV;
  }

  #draw(_force) {
    this.#ctx.fillStyle = this.#palette.bg;
    this.#ctx.fillRect(0, 0, this.#width, this.#height);

    this.#ctx.fillStyle = this.#palette.dot;
    this.#ctx.globalAlpha = 1;
    this.#ctx.shadowBlur = 0;
    for (const dot of this.#dots) {
      const radius = Math.max(0.5, dot.r);
      this.#ctx.beginPath();
      this.#ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      this.#ctx.fill();
    }
  }
}
