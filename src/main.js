import { DotField } from './dotField.js';

(() => {
  const canvas = document.querySelector('#dotfield');
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const root = document.documentElement;

  function getInitialMode() {
    const stored = localStorage.getItem('mode');
    if (stored === 'dark' || stored === 'light') return stored;
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /** @type {'dark' | 'light'} */
  let mode = getInitialMode();
  root.dataset.mode = mode;

  const defaults = {
    dotScale: 1,
    dotDensity: 1,
    dotVariance: 1,
    dotSizeSteps: 0,
  };

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function getInitialDotScale() {
    const stored = Number(localStorage.getItem('dotScale'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return defaults.dotScale;
  }

  function getInitialDensity() {
    const stored = Number(localStorage.getItem('dotDensity'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return defaults.dotDensity;
  }

  function getInitialVariance() {
    const stored = Number(localStorage.getItem('dotVariance'));
    if (Number.isFinite(stored) && stored >= 0) return stored;
    return defaults.dotVariance;
  }

  function getInitialSizeSteps() {
    const stored = Number(localStorage.getItem('dotSizeSteps'));
    if (Number.isFinite(stored) && stored >= 0) return stored;
    return defaults.dotSizeSteps;
  }

  let dotScale = getInitialDotScale();
  let dotDensity = getInitialDensity();
  let dotVariance = getInitialVariance();
  let dotSizeSteps = getInitialSizeSteps();

  let dotField;
  try {
    dotField = new DotField(canvas, {
      mode,
      reducedMotion: prefersReducedMotion.matches,
    });
  } catch {
    root.dataset.dotfield = 'unavailable';
    canvas.remove();
    return;
  }

  dotField.setDotScale(dotScale);
  dotField.setDensityScalar(dotDensity);
  dotField.setSizeVariance(dotVariance);
  dotField.setSizeSteps(dotSizeSteps);

  const headerEl = document.querySelector('.header');
  function updateTopExclusion() {
    if (!(headerEl instanceof HTMLElement)) return;
    const rect = headerEl.getBoundingClientRect();
    dotField.setTopExclusion(rect.bottom + 8);
  }
  updateTopExclusion();
  if (headerEl instanceof HTMLElement) {
    const headerObserver = new ResizeObserver(() => updateTopExclusion());
    headerObserver.observe(headerEl);
  }

  const dotSize = document.querySelector('#dotSize');
  const dotSizeValue = document.querySelector('#dotSizeValue');
  const dotDensityEl = document.querySelector('#dotDensity');
  const dotDensityValue = document.querySelector('#dotDensityValue');
  const dotVarianceEl = document.querySelector('#dotVariance');
  const dotVarianceValue = document.querySelector('#dotVarianceValue');
  const dotSizeStepsEl = document.querySelector('#dotSizeSteps');
  const dotSizeStepsValue = document.querySelector('#dotSizeStepsValue');
  const resetControls = document.querySelector('#resetControls');

  let dotUpdateScheduled = false;
  function scheduleDotUpdate() {
    if (dotUpdateScheduled) return;
    dotUpdateScheduled = true;
    requestAnimationFrame(() => {
      dotUpdateScheduled = false;
      dotField.setDotScale(dotScale);
      dotField.setDensityScalar(dotDensity);
      dotField.setSizeVariance(dotVariance);
      dotField.setSizeSteps(dotSizeSteps);
    });
  }

  if (dotSize instanceof HTMLInputElement) {
    dotSize.value = String(dotScale);
    if (dotSizeValue instanceof HTMLOutputElement) dotSizeValue.value = dotScale.toFixed(1);
    dotSize.addEventListener('input', () => {
      const next = Number(dotSize.value);
      if (!Number.isFinite(next)) return;
      dotScale = next;
      localStorage.setItem('dotScale', String(dotScale));
      if (dotSizeValue instanceof HTMLOutputElement) dotSizeValue.value = dotScale.toFixed(1);
      scheduleDotUpdate();
    });
  }

  if (dotDensityEl instanceof HTMLInputElement) {
    dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(1);
    dotDensityEl.addEventListener('input', () => {
      const next = Number(dotDensityEl.value);
      if (!Number.isFinite(next)) return;
      dotDensity = next;
      localStorage.setItem('dotDensity', String(dotDensity));
      if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(1);
      scheduleDotUpdate();
    });
  }

  if (dotVarianceEl instanceof HTMLInputElement) {
    dotVarianceEl.value = String(dotVariance);
    if (dotVarianceValue instanceof HTMLOutputElement) dotVarianceValue.value = dotVariance.toFixed(1);
    dotVarianceEl.addEventListener('input', () => {
      const next = Number(dotVarianceEl.value);
      if (!Number.isFinite(next)) return;
      dotVariance = next;
      localStorage.setItem('dotVariance', String(dotVariance));
      if (dotVarianceValue instanceof HTMLOutputElement) dotVarianceValue.value = dotVariance.toFixed(1);
      scheduleDotUpdate();
    });
  }

  function formatSizeSteps(value) {
    if (value <= 0) return 'smooth';
    return String(value);
  }

  if (dotSizeStepsEl instanceof HTMLInputElement) {
    dotSizeStepsEl.value = String(dotSizeSteps);
    if (dotSizeStepsValue instanceof HTMLOutputElement) {
      dotSizeStepsValue.value = formatSizeSteps(dotSizeSteps);
    }
    dotSizeStepsEl.addEventListener('input', () => {
      const next = Number(dotSizeStepsEl.value);
      if (!Number.isFinite(next)) return;
      dotSizeSteps = next;
      localStorage.setItem('dotSizeSteps', String(dotSizeSteps));
      if (dotSizeStepsValue instanceof HTMLOutputElement) {
        dotSizeStepsValue.value = formatSizeSteps(dotSizeSteps);
      }
      scheduleDotUpdate();
    });
  }

  function syncControlValues() {
    if (dotSize instanceof HTMLInputElement) dotSize.value = String(dotScale);
    if (dotSizeValue instanceof HTMLOutputElement) dotSizeValue.value = dotScale.toFixed(1);
    if (dotDensityEl instanceof HTMLInputElement) dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(1);
    if (dotVarianceEl instanceof HTMLInputElement) dotVarianceEl.value = String(dotVariance);
    if (dotVarianceValue instanceof HTMLOutputElement) dotVarianceValue.value = dotVariance.toFixed(1);
    if (dotSizeStepsEl instanceof HTMLInputElement) dotSizeStepsEl.value = String(dotSizeSteps);
    if (dotSizeStepsValue instanceof HTMLOutputElement) dotSizeStepsValue.value = formatSizeSteps(dotSizeSteps);
  }

  resetControls?.addEventListener('click', () => {
    dotScale = defaults.dotScale;
    dotDensity = defaults.dotDensity;
    dotVariance = defaults.dotVariance;
    dotSizeSteps = defaults.dotSizeSteps;

    localStorage.removeItem('dotScale');
    localStorage.removeItem('dotDensity');
    localStorage.removeItem('dotVariance');
    localStorage.removeItem('dotSizeSteps');

    syncControlValues();
    scheduleDotUpdate();
  });

  const modeToggle = document.querySelector('#modeToggle');
  function syncModeToggle() {
    if (!modeToggle) return;
    modeToggle.textContent = mode === 'dark' ? 'Switch to light' : 'Switch to dark';
    modeToggle.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
  }
  syncModeToggle();

  modeToggle?.addEventListener('click', () => {
    mode = mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mode', mode);
    root.dataset.mode = mode;
    dotField.invertWithDispersion(mode);
    syncModeToggle();
  });

  prefersReducedMotion.addEventListener('change', (event) => {
    dotField.setReducedMotion(event.matches);
  });

  dotField.setNavActive(true);

  const anchorElements = Array.from(document.querySelectorAll('[data-section], a, button'));

  function collectAnchors() {
    const anchors = anchorElements
      .filter((el) => el.offsetParent !== null)
      .flatMap((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return [];
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const role = el.tagName.toLowerCase();
        return [{ x: cx, y: cy, strength: role === 'section' ? 0.9 : 0.6 }];
      });
    dotField.setInteractiveAnchors(anchors);
  }

  let anchorsScheduled = false;
  function scheduleCollectAnchors() {
    if (anchorsScheduled) return;
    anchorsScheduled = true;
    requestAnimationFrame(() => {
      anchorsScheduled = false;
      collectAnchors();
    });
  }

  const observer = new ResizeObserver(() => scheduleCollectAnchors());
  anchorElements.forEach((el) => observer.observe(el));
  window.addEventListener('scroll', () => scheduleCollectAnchors(), { passive: true });

  const sections = Array.from(document.querySelectorAll('[data-section]'));
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
      if (!visible) return;
      const section = visible.target;
      dotField.setActiveSection(section.dataset.section ?? null);
      const rect = section.getBoundingClientRect();
      dotField.setSectionAnchor({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        strength: 1.05,
      });
    },
    { threshold: [0.2, 0.35, 0.5, 0.65] }
  );
  sections.forEach((s) => io.observe(s));

  function bindHoverAnchors() {
    const interactive = Array.from(document.querySelectorAll('a, button'));
    for (const el of interactive) {
      el.addEventListener('pointerenter', () => dotField.setHotElement(el));
      el.addEventListener('pointerleave', () => dotField.setHotElement(null));
      el.addEventListener('focus', () => dotField.setHotElement(el));
      el.addEventListener('blur', () => dotField.setHotElement(null));
    }
  }

  bindHoverAnchors();
  collectAnchors();
  dotField.start();
  dotField.heroIntro();
})();
