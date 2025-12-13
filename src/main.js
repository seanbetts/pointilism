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
    dotMinSize: 1.5,
    dotMaxSize: 4,
    dotDensity: 1,
    dotSizeCount: 5,
    dotDistribution: 3,
    autoFit: true,
  };

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function getInitialMinSize() {
    const stored = Number(localStorage.getItem('dotMinSize'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return defaults.dotMinSize;
  }

  function getInitialMaxSize() {
    const stored = Number(localStorage.getItem('dotMaxSize'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return defaults.dotMaxSize;
  }

  function getInitialDensity() {
    const stored = Number(localStorage.getItem('dotDensity'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return defaults.dotDensity;
  }

  function getInitialSizeCount() {
    const stored = Number(localStorage.getItem('dotSizeCount'));
    if (Number.isFinite(stored) && stored >= 2) return stored;
    return defaults.dotSizeCount;
  }

  function getInitialDistribution() {
    const stored = Number(localStorage.getItem('dotDistribution'));
    if (Number.isFinite(stored)) return stored;
    return defaults.dotDistribution;
  }

  function getInitialAutoFit() {
    const stored = localStorage.getItem('autoFit');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.autoFit;
  }

  let dotMinSize = getInitialMinSize();
  let dotMaxSize = getInitialMaxSize();
  let dotDensity = getInitialDensity();
  let dotSizeCount = getInitialSizeCount();
  let dotDistribution = getInitialDistribution();
  let autoFit = getInitialAutoFit();

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

  dotField.setDensityScalar(dotDensity);
  dotField.setMinRadius(dotMinSize);
  dotField.setMaxRadius(dotMaxSize);
  dotField.setSizeCount(dotSizeCount);
  dotField.setDistribution(dotDistribution);
  dotField.setAutoFitDensity(autoFit);

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

  const dotMinSizeEl = document.querySelector('#dotMinSize');
  const dotMinSizeValue = document.querySelector('#dotMinSizeValue');
  const dotMaxSizeEl = document.querySelector('#dotMaxSize');
  const dotMaxSizeValue = document.querySelector('#dotMaxSizeValue');
  const dotDensityEl = document.querySelector('#dotDensity');
  const dotDensityValue = document.querySelector('#dotDensityValue');
  const dotSizeCountEl = document.querySelector('#dotSizeCount');
  const dotSizeCountValue = document.querySelector('#dotSizeCountValue');
  const dotDistributionEl = document.querySelector('#dotDistribution');
  const dotDistributionValue = document.querySelector('#dotDistributionValue');
  const autoFitEl = document.querySelector('#autoFit');
  const autoFitValue = document.querySelector('#autoFitValue');
  const resetControls = document.querySelector('#resetControls');

  let dotUpdateScheduled = false;
  function scheduleDotUpdate() {
    if (dotUpdateScheduled) return;
    dotUpdateScheduled = true;
    requestAnimationFrame(() => {
      dotUpdateScheduled = false;
      dotField.setDensityScalar(dotDensity);
      dotField.setMinRadius(dotMinSize);
      dotField.setMaxRadius(dotMaxSize);
      dotField.setSizeCount(dotSizeCount);
      dotField.setDistribution(dotDistribution);
      dotField.setAutoFitDensity(autoFit);
    });
  }

  function clampMinMaxSizes() {
    if (dotMinSize > dotMaxSize) dotMaxSize = dotMinSize;
    if (dotMaxSize < dotMinSize) dotMinSize = dotMaxSize;
  }

  if (dotMinSizeEl instanceof HTMLInputElement) {
    dotMinSizeEl.value = String(dotMinSize);
    if (dotMinSizeValue instanceof HTMLOutputElement) dotMinSizeValue.value = dotMinSize.toFixed(1);
    dotMinSizeEl.addEventListener('input', () => {
      const next = Number(dotMinSizeEl.value);
      if (!Number.isFinite(next)) return;
      dotMinSize = next;
      clampMinMaxSizes();
      localStorage.setItem('dotMinSize', String(dotMinSize));
      localStorage.setItem('dotMaxSize', String(dotMaxSize));
      if (dotMinSizeValue instanceof HTMLOutputElement) dotMinSizeValue.value = dotMinSize.toFixed(1);
      if (dotMaxSizeEl instanceof HTMLInputElement) dotMaxSizeEl.value = String(dotMaxSize);
      if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(1);
      scheduleDotUpdate();
    });
  }

  if (dotMaxSizeEl instanceof HTMLInputElement) {
    dotMaxSizeEl.value = String(dotMaxSize);
    if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(1);
    dotMaxSizeEl.addEventListener('input', () => {
      const next = Number(dotMaxSizeEl.value);
      if (!Number.isFinite(next)) return;
      dotMaxSize = next;
      clampMinMaxSizes();
      localStorage.setItem('dotMinSize', String(dotMinSize));
      localStorage.setItem('dotMaxSize', String(dotMaxSize));
      if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(1);
      if (dotMinSizeEl instanceof HTMLInputElement) dotMinSizeEl.value = String(dotMinSize);
      if (dotMinSizeValue instanceof HTMLOutputElement) dotMinSizeValue.value = dotMinSize.toFixed(1);
      scheduleDotUpdate();
    });
  }

  if (dotDensityEl instanceof HTMLInputElement) {
    dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(2);
    dotDensityEl.addEventListener('input', () => {
      const next = Number(dotDensityEl.value);
      if (!Number.isFinite(next)) return;
      dotDensity = next;
      localStorage.setItem('dotDensity', String(dotDensity));
      if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(2);
      scheduleDotUpdate();
    });
  }

  if (dotSizeCountEl instanceof HTMLInputElement) {
    dotSizeCountEl.value = String(dotSizeCount);
    if (dotSizeCountValue instanceof HTMLOutputElement) dotSizeCountValue.value = String(dotSizeCount);
    dotSizeCountEl.addEventListener('input', () => {
      const next = Number(dotSizeCountEl.value);
      if (!Number.isFinite(next)) return;
      dotSizeCount = next;
      localStorage.setItem('dotSizeCount', String(dotSizeCount));
      if (dotSizeCountValue instanceof HTMLOutputElement) dotSizeCountValue.value = String(dotSizeCount);
      scheduleDotUpdate();
    });
  }

  function distributionLabel(v) {
    switch (v) {
      case 0:
        return 'Small (linear)';
      case 1:
        return 'Small (curved)';
      case 2:
        return 'Bell curve';
      case 3:
        return 'Flat';
      case 4:
        return 'U-shaped';
      case 5:
        return 'Large (linear)';
      case 6:
        return 'Large (curved)';
      default:
        return 'Flat';
    }
  }

  if (dotDistributionEl instanceof HTMLInputElement) {
    dotDistributionEl.value = String(dotDistribution);
    if (dotDistributionValue instanceof HTMLOutputElement) {
      dotDistributionValue.value = distributionLabel(dotDistribution);
    }
    dotDistributionEl.addEventListener('input', () => {
      const next = Number(dotDistributionEl.value);
      if (!Number.isFinite(next)) return;
      dotDistribution = next;
      localStorage.setItem('dotDistribution', String(dotDistribution));
      if (dotDistributionValue instanceof HTMLOutputElement) {
        dotDistributionValue.value = distributionLabel(dotDistribution);
      }
      scheduleDotUpdate();
    });
  }

  if (autoFitEl instanceof HTMLInputElement) {
    autoFitEl.checked = autoFit;
    if (autoFitValue instanceof HTMLOutputElement) autoFitValue.value = autoFit ? 'On' : 'Off';
    autoFitEl.addEventListener('change', () => {
      autoFit = autoFitEl.checked;
      localStorage.setItem('autoFit', String(autoFit));
      if (autoFitValue instanceof HTMLOutputElement) autoFitValue.value = autoFit ? 'On' : 'Off';
      scheduleDotUpdate();
    });
  }

  function syncControlValues() {
    clampMinMaxSizes();
    if (dotMinSizeEl instanceof HTMLInputElement) dotMinSizeEl.value = String(dotMinSize);
    if (dotMinSizeValue instanceof HTMLOutputElement) dotMinSizeValue.value = dotMinSize.toFixed(1);
    if (dotMaxSizeEl instanceof HTMLInputElement) dotMaxSizeEl.value = String(dotMaxSize);
    if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(1);
    if (dotDensityEl instanceof HTMLInputElement) dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(2);
    if (dotSizeCountEl instanceof HTMLInputElement) dotSizeCountEl.value = String(dotSizeCount);
    if (dotSizeCountValue instanceof HTMLOutputElement) dotSizeCountValue.value = String(dotSizeCount);
    if (dotDistributionEl instanceof HTMLInputElement) dotDistributionEl.value = String(dotDistribution);
    if (dotDistributionValue instanceof HTMLOutputElement) dotDistributionValue.value = distributionLabel(dotDistribution);
    if (autoFitEl instanceof HTMLInputElement) autoFitEl.checked = autoFit;
    if (autoFitValue instanceof HTMLOutputElement) autoFitValue.value = autoFit ? 'On' : 'Off';
  }

  resetControls?.addEventListener('click', () => {
    dotMinSize = defaults.dotMinSize;
    dotMaxSize = defaults.dotMaxSize;
    dotDensity = defaults.dotDensity;
    dotSizeCount = defaults.dotSizeCount;
    dotDistribution = defaults.dotDistribution;
    autoFit = defaults.autoFit;

    localStorage.removeItem('dotMinSize');
    localStorage.removeItem('dotMaxSize');
    localStorage.removeItem('dotDensity');
    localStorage.removeItem('dotSizeCount');
    localStorage.removeItem('dotDistribution');
    localStorage.removeItem('autoFit');

    syncControlValues();
    scheduleDotUpdate();
  });

  // Clean up legacy storage keys from earlier slider iterations.
  localStorage.removeItem('dotScale');
  localStorage.removeItem('dotVariance');
  localStorage.removeItem('dotSizeSteps');

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
