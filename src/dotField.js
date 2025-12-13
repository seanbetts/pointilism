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
 * @typedef {{ x: number; y: number; vx: number; vy: number; r: number; a: number }} Dot
 */

function keyForCell(cx, cy) {
  return `${cx},${cy}`;
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
  #dotScale = 1;
  #bufferPx = 1.5;
  #excludeTopCssPx = 0;
  #sizeVariance = 1;
  #sizeSteps = 0;

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
      else if (this.#running) this.start();
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

  /** @param {number} scale */
  setDotScale(scale) {
    const next = clamp(scale, 0.4, 100);
    this.#dotScale = next;
    this.#scheduleSetup();
  }

  /** @param {number} scalar */
  setDensityScalar(scalar) {
    const next = clamp(scalar, 0.1, 3);
    this.#densityScalar = next;
    this.#scheduleSetup();
  }

  /** @param {number} variance */
  setSizeVariance(variance) {
    const next = clamp(variance, 0, 50);
    this.#sizeVariance = next;
    this.#scheduleSetup();
  }

  /** @param {number} steps */
  setSizeSteps(steps) {
    const next = Math.round(clamp(steps, 0, 256));
    this.#sizeSteps = next;
    this.#scheduleSetup();
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
    if (this.#reducedMotion) {
      this.#draw(true);
      return;
    }
    if (this.#raf != null) return;
    this.#lastT = nowMs();
    this.#raf = requestAnimationFrame((t) => this.#frame(t));
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
    const maxR = 1.8 * this.#dpr;
    const maxRequired = 2 * maxR * this.#dotScale + this.#bufferPx * this.#dpr;
    const cellSize = Math.max(6, maxRequired);
    const excludeTop = this.#excludeTopCssPx * this.#dpr;
    const meanR = 1.3 * this.#dpr;
    const halfRange = 0.5 * this.#dpr;
    const minR = 0.8 * this.#dpr;
    const maxBaseR = 1.8 * this.#dpr;
    const steps = this.#sizeSteps;

    /** @type {Map<string, Dot[]>} */
    const grid = new Map();
    /** @type {Dot[]} */
    const dots = [];

    const maxAttempts = Math.max(4000, count * 90);
    let attempts = 0;

    while (dots.length < count && attempts < maxAttempts) {
      attempts++;

      const r = clamp(
        meanR + (Math.random() - 0.5) * 2 * halfRange * this.#sizeVariance,
        minR,
        maxBaseR
      );
      const quantizedR =
        steps <= 0
          ? r
          : steps === 1
            ? meanR
            : (() => {
                const t = clamp((r - minR) / (maxBaseR - minR), 0, 1);
                const idx = Math.round(t * (steps - 1));
                return minR + (idx * (maxBaseR - minR)) / (steps - 1);
              })();
      const rScaled = quantizedR * this.#dotScale;
      const x = lerp(rScaled, this.#width - rScaled, Math.random());
      const y = lerp(excludeTop + rScaled, this.#height - rScaled, Math.random());

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
            const minDist = (quantizedR + other.r) * this.#dotScale + this.#bufferPx * this.#dpr;
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
        r: quantizedR,
        a: 1,
      };
      const key = keyForCell(cx, cy);
      const bucket = grid.get(key);
      if (bucket) bucket.push(dot);
      else grid.set(key, [dot]);
      dots.push(dot);
    }

    return dots;
  }

  #getAnchors() {
    /** @type {Anchor[]} */
    const anchors = [];

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
    const s = this.#activeSection;
    const intro = this.#introUntilMs != null && nowMs() < this.#introUntilMs;
    if (s === 'proof') {
      this.#stability = 0.965;
      this.#noise = 0.08;
      this.#cohesion = 0.16;
      this.#maxV = 0.6;
      return;
    }
    if (s === 'hero') {
      this.#stability = 0.93;
      this.#noise = intro ? 0.55 : 0.2;
      this.#cohesion = intro ? 0.05 : 0.12;
      this.#maxV = 0.95;
      return;
    }
    if (s && s !== 'footer') {
      this.#stability = 0.935;
      this.#noise = 0.18;
      this.#cohesion = 0.135;
      this.#maxV = 0.9;
      return;
    }
    if (s === 'footer') {
      this.#stability = 0.93;
      this.#noise = 0.18;
      this.#cohesion = 0.08;
      this.#maxV = 0.9;
      return;
    }
    this.#stability = 0.92;
    this.#noise = 0.22;
    this.#cohesion = 0.11;
    this.#maxV = 0.95;
  }

  #frame(t) {
    this.#raf = requestAnimationFrame((tt) => this.#frame(tt));
    const dtMs = clamp(t - this.#lastT, 0, 34);
    this.#lastT = t;
    const dt = dtMs / 16.6667;

    this.#sectionTuning();
    const anchors = this.#getAnchors();
    const { cohesion, stability, noise, maxV } = this;

    for (const dot of this.#dots) {
      const jitter = (Math.random() - 0.5) * noise;
      dot.vx += jitter * 0.22 * dt;
      dot.vy += jitter * 0.22 * dt;

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

      dot.x += dot.vx * this.#dpr * 2.2 * dt;
      dot.y += dot.vy * this.#dpr * 2.2 * dt;

      const rScaled = dot.r * this.#dotScale;
      const excludeTop = this.#excludeTopCssPx * this.#dpr;
      if (dot.x < rScaled) {
        dot.x = rScaled;
        dot.vx = Math.abs(dot.vx) * 0.5;
      } else if (dot.x > this.#width - rScaled) {
        dot.x = this.#width - rScaled;
        dot.vx = -Math.abs(dot.vx) * 0.5;
      }
      if (dot.y < excludeTop + rScaled) {
        dot.y = excludeTop + rScaled;
        dot.vy = Math.abs(dot.vy) * 0.5;
      } else if (dot.y > this.#height - rScaled) {
        dot.y = this.#height - rScaled;
        dot.vy = -Math.abs(dot.vy) * 0.5;
      }
    }

    this.#resolveOverlaps();
    this.#draw(false);
  }

  #resolveOverlaps() {
    if (this.#dots.length < 2) return;

    const maxR = 1.8 * this.#dpr;
    const maxRequired = 2 * maxR * this.#dotScale + this.#bufferPx * this.#dpr;
    const cellSize = Math.max(6, maxRequired);
    const excludeTop = this.#excludeTopCssPx * this.#dpr;

    for (let iter = 0; iter < 2; iter++) {
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
              const minDist = (dot.r + other.r) * this.#dotScale + this.#bufferPx * this.#dpr;
              const minDist2 = minDist * minDist;
              if (dist2 >= minDist2) continue;

              const dist = Math.sqrt(Math.max(1e-6, dist2));
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const push = overlap * 0.5;

              dot.x -= nx * push;
              dot.y -= ny * push;
              other.x += nx * push;
              other.y += ny * push;

              dot.vx *= 0.92;
              dot.vy *= 0.92;
              other.vx *= 0.92;
              other.vy *= 0.92;
            }
          }
        }
      }
    }

    for (const dot of this.#dots) {
      const rScaled = dot.r * this.#dotScale;
      dot.x = clamp(dot.x, rScaled, this.#width - rScaled);
      dot.y = clamp(dot.y, excludeTop + rScaled, this.#height - rScaled);
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
    for (const dot of this.#dots) {
      const radius = Math.max(1, Math.round(dot.r * this.#dotScale));
      this.#ctx.beginPath();
      this.#ctx.arc(Math.round(dot.x), Math.round(dot.y), radius, 0, Math.PI * 2);
      this.#ctx.fill();
    }
  }
}
