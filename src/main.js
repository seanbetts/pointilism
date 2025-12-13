import { DotField } from './dotField.js';

(() => {
  const canvas = document.querySelector('#dotfield');
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const root = document.documentElement;

  const SETTINGS_VERSION = '2025-12-13-defaults-v6';
  const storedSettingsVersion = localStorage.getItem('settingsVersion');
  if (storedSettingsVersion !== SETTINGS_VERSION) {
    localStorage.removeItem('dotMinSize');
    localStorage.removeItem('dotMaxSize');
    localStorage.removeItem('dotDensity');
    localStorage.removeItem('dotSizeCount');
    localStorage.removeItem('dotDistribution');
    localStorage.removeItem('speed');
    localStorage.setItem('settingsVersion', SETTINGS_VERSION);
  }

  function getInitialMode() {
    const stored = localStorage.getItem('mode');
    if (stored === 'dark' || stored === 'light') return stored;
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /** @type {'dark' | 'light'} */
  let mode = getInitialMode();
  root.dataset.mode = mode;

  const defaults = {
    dotMinSize: 4.5,
    dotMaxSize: 50,
    dotDensity: 0.5,
    dotSizeCount: 10,
    dotDistribution: 1,
    speed: 1,
    breathingEnabled: true,
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
    if (Number.isFinite(stored) && stored > 0) return Math.max(0.2, Math.min(1, stored));
    return defaults.dotDensity;
  }

  function getInitialSizeCount() {
    const stored = Number(localStorage.getItem('dotSizeCount'));
    if (Number.isFinite(stored) && stored >= 2) return stored;
    return defaults.dotSizeCount;
  }

  function getInitialDistribution() {
    const raw = localStorage.getItem('dotDistribution');
    if (raw == null) return defaults.dotDistribution;
    const stored = Number(raw);
    if (Number.isFinite(stored)) return Math.max(0, Math.min(6, Math.round(stored)));
    return defaults.dotDistribution;
  }

  function getInitialAutoFit() {
    const stored = localStorage.getItem('autoFit');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return true;
  }

  function getInitialReactToUi() {
    const stored = localStorage.getItem('reactToUi');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return false;
  }

  function getInitialSpeed() {
    const raw = localStorage.getItem('speed');
    if (raw == null) return defaults.speed;
    const stored = Number(raw);
    if (Number.isFinite(stored)) {
      // Migration: older builds stored a 0..1 "internal speed" value.
      const maybeOldInternal = stored <= 1.0001;
      const next = maybeOldInternal ? stored / 0.35 : stored;
      return Math.max(0, Math.min(3, next));
    }
    return defaults.speed;
  }

  function getInitialBreathingEnabled() {
    const stored = localStorage.getItem('breathingEnabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.breathingEnabled;
  }

  let dotMinSize = getInitialMinSize();
  let dotMaxSize = Math.round(getInitialMaxSize());
  let dotDensity = getInitialDensity();
  let dotSizeCount = getInitialSizeCount();
  let dotDistribution = getInitialDistribution();
  let speed = getInitialSpeed();
  let breathingEnabled = getInitialBreathingEnabled();
  const autoFit = true;
  const reactToUi = false;

  function speedInternal() {
    return Math.max(0, Math.min(1, speed * 0.35));
  }

  let dotField;
  // Title container removed.
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

  // Title container removed.

  dotField.setDensityScalar(dotDensity);
  dotField.setMinRadius(dotMinSize);
  dotField.setMaxRadius(dotMaxSize);
  dotField.setSizeCount(dotSizeCount);
  dotField.setDistribution(dotDistribution);
  dotField.setAutoFitDensity(autoFit);
  dotField.setReactToUi(reactToUi);
  dotField.setSpeed(speedInternal());
  dotField.setBreathingEnabled(breathingEnabled);

  dotField.setExclusionRects([]);

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
  const speedEl = document.querySelector('#speed');
  const speedValue = document.querySelector('#speedValue');
  const breathingEnabledEl = document.querySelector('#breathingEnabled');
  const breathingEnabledValue = document.querySelector('#breathingEnabledValue');
  const gravityDrop = document.querySelector('#gravityDrop');
  const restartControls = document.querySelector('#restartControls');
  const pauseControls = document.querySelector('#pauseControls');
  const controlsPanel = document.querySelector('#controlsPanel');
  const toggleControls = document.querySelector('#toggleControls');

  let paused = false;
  function syncPauseControls() {
    if (!(pauseControls instanceof HTMLButtonElement)) return;
    pauseControls.textContent = paused ? 'Start' : 'Stop';
    pauseControls.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  let controlsVisible = false;
  {
    const stored = localStorage.getItem('controlsVisible');
    if (stored === '1' || stored === 'true') controlsVisible = true;
  }
  function layoutControlsPanel() {
    if (!(controlsPanel instanceof HTMLElement)) return;
    const copy = document.querySelector('.copy.shield');
    if (!(copy instanceof HTMLElement)) return;
    const rect = copy.getBoundingClientRect();
    const gap = 14;
    controlsPanel.style.left = `${Math.round(rect.left)}px`;
    controlsPanel.style.top = `${Math.round(rect.bottom + gap)}px`;
    controlsPanel.style.width = `${Math.round(rect.width)}px`;
  }
  function syncControlsPanel() {
    if (controlsPanel instanceof HTMLElement && controlsVisible) layoutControlsPanel();
    if (controlsPanel instanceof HTMLElement) controlsPanel.hidden = !controlsVisible;
    if (toggleControls instanceof HTMLElement) toggleControls.setAttribute('aria-expanded', controlsVisible ? 'true' : 'false');
    if (toggleControls instanceof HTMLElement) toggleControls.classList.toggle('is-active', controlsVisible);
  }
  syncControlsPanel();

  toggleControls?.addEventListener('click', (event) => {
    event.preventDefault();
    controlsVisible = !controlsVisible;
    localStorage.setItem('controlsVisible', controlsVisible ? '1' : '0');
    syncControlsPanel();
  });

  {
    const copy = document.querySelector('.copy.shield');
    if (copy instanceof HTMLElement) {
      const obs = new ResizeObserver(() => {
        if (!controlsVisible) return;
        layoutControlsPanel();
      });
      obs.observe(copy);
    }
    window.addEventListener(
      'resize',
      () => {
        if (!controlsVisible) return;
        layoutControlsPanel();
      },
      { passive: true }
    );
    window.addEventListener(
      'scroll',
      () => {
        if (!controlsVisible) return;
        layoutControlsPanel();
      },
      { passive: true }
    );
  }

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
      dotField.setReactToUi(reactToUi);
      dotField.setSpeed(speedInternal());
      dotField.setBreathingEnabled(breathingEnabled);
    });
  }

  function clampMinMaxSizes() {
    dotMinSize = Math.max(1, Math.min(10, dotMinSize));
    dotMaxSize = Math.max(5, Math.min(100, Math.round(dotMaxSize)));
    if (dotMinSize > dotMaxSize) dotMaxSize = Math.ceil(dotMinSize);
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
      if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(0);
      scheduleDotUpdate();
    });
  }

  if (dotMaxSizeEl instanceof HTMLInputElement) {
    dotMaxSizeEl.value = String(dotMaxSize);
    if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(0);
    dotMaxSizeEl.addEventListener('input', () => {
      const next = Number(dotMaxSizeEl.value);
      if (!Number.isFinite(next)) return;
      dotMaxSize = Math.round(next);
      clampMinMaxSizes();
      localStorage.setItem('dotMinSize', String(dotMinSize));
      localStorage.setItem('dotMaxSize', String(dotMaxSize));
      if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(0);
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

  if (speedEl instanceof HTMLInputElement) {
    speedEl.value = String(speed);
    if (speedValue instanceof HTMLOutputElement) speedValue.value = speed.toFixed(2);
    speedEl.addEventListener('input', () => {
      const next = Number(speedEl.value);
      if (!Number.isFinite(next)) return;
      speed = next;
      localStorage.setItem('speed', String(speed));
      if (speedValue instanceof HTMLOutputElement) speedValue.value = speed.toFixed(2);
      dotField.setSpeed(speedInternal());
    });
  }

  if (breathingEnabledEl instanceof HTMLInputElement) {
    breathingEnabledEl.checked = breathingEnabled;
    if (breathingEnabledValue instanceof HTMLOutputElement) {
      breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
    }
    breathingEnabledEl.addEventListener('change', () => {
      breathingEnabled = breathingEnabledEl.checked;
      localStorage.setItem('breathingEnabled', String(breathingEnabled));
      if (breathingEnabledValue instanceof HTMLOutputElement) {
        breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
      }
      dotField.setBreathingEnabled(breathingEnabled);
    });
  }

  gravityDrop?.addEventListener('click', () => dotField.dropToBottom());

  function syncControlValues() {
    clampMinMaxSizes();
    if (dotMinSizeEl instanceof HTMLInputElement) dotMinSizeEl.value = String(dotMinSize);
    if (dotMinSizeValue instanceof HTMLOutputElement) dotMinSizeValue.value = dotMinSize.toFixed(1);
    if (dotMaxSizeEl instanceof HTMLInputElement) dotMaxSizeEl.value = String(dotMaxSize);
    if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(0);
    if (dotDensityEl instanceof HTMLInputElement) dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(2);
    if (dotSizeCountEl instanceof HTMLInputElement) dotSizeCountEl.value = String(dotSizeCount);
    if (dotSizeCountValue instanceof HTMLOutputElement) dotSizeCountValue.value = String(dotSizeCount);
    if (dotDistributionEl instanceof HTMLInputElement) dotDistributionEl.value = String(dotDistribution);
    if (dotDistributionValue instanceof HTMLOutputElement) dotDistributionValue.value = distributionLabel(dotDistribution);
    if (speedEl instanceof HTMLInputElement) speedEl.value = String(speed);
    if (speedValue instanceof HTMLOutputElement) speedValue.value = speed.toFixed(2);
    if (breathingEnabledEl instanceof HTMLInputElement) breathingEnabledEl.checked = breathingEnabled;
    if (breathingEnabledValue instanceof HTMLOutputElement) breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
  }

  restartControls?.addEventListener('click', () => {
    dotMinSize = defaults.dotMinSize;
    dotMaxSize = defaults.dotMaxSize;
    dotDensity = defaults.dotDensity;
    dotSizeCount = defaults.dotSizeCount;
    dotDistribution = defaults.dotDistribution;
    speed = defaults.speed;
    breathingEnabled = defaults.breathingEnabled;

    localStorage.removeItem('dotMinSize');
    localStorage.removeItem('dotMaxSize');
    localStorage.removeItem('dotDensity');
    localStorage.removeItem('dotSizeCount');
    localStorage.removeItem('dotDistribution');
    localStorage.removeItem('speed');
    localStorage.removeItem('breathingEnabled');

    syncControlValues();
    scheduleDotUpdate();
    dotField.restart();
    dotField.heroIntro();
    // no-op: title container removed
  });

  pauseControls?.addEventListener('click', () => {
    paused = !paused;
    if (paused) {
      dotField.pause();
      // no-op: title container removed
    } else {
      dotField.resume();
      // no-op: title container removed
    }
    syncPauseControls();
  });

  syncControlValues();
  syncPauseControls();

  // Clean up legacy storage keys from earlier slider iterations.
  localStorage.removeItem('dotScale');
  localStorage.removeItem('dotVariance');
  localStorage.removeItem('dotSizeSteps');
  localStorage.removeItem('motionStyle');
  localStorage.removeItem('motionAmount');
  localStorage.removeItem('contactFeel');
  localStorage.removeItem('motionEnabled');
  localStorage.removeItem('physicsEnabled');
  localStorage.removeItem('contactMode');
  localStorage.removeItem('gravityEnabled');
  localStorage.removeItem('autoFit');
  localStorage.removeItem('reactToUi');

  const modeToggle = document.querySelector('#modeToggle');
  const modeValue = document.querySelector('#modeValue');
  function syncModeToggle() {
    if (!(modeToggle instanceof HTMLInputElement)) return;
    modeToggle.checked = mode === 'dark';
    if (modeValue instanceof HTMLOutputElement) modeValue.textContent = mode === 'dark' ? 'Dark' : 'Light';
  }
  syncModeToggle();

  modeToggle?.addEventListener('change', () => {
    if (!(modeToggle instanceof HTMLInputElement)) return;
    mode = modeToggle.checked ? 'dark' : 'light';
    localStorage.setItem('mode', mode);
    root.dataset.mode = mode;
    dotField.invertWithDispersion(mode);
    syncModeToggle();
  });

  prefersReducedMotion.addEventListener('change', (event) => {
    dotField.setReducedMotion(event.matches);
  });

  dotField.start();
  dotField.heroIntro();
})();
