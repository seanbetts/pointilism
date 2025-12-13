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
    reactToUi: true,
    motionEnabled: true,
    physicsEnabled: true,
    contactMode: 'bounce',
    gravityEnabled: false,
    breathingEnabled: false,
    speed: 0.35,
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

  function getInitialReactToUi() {
    const stored = localStorage.getItem('reactToUi');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.reactToUi;
  }

  function getInitialMotionEnabled() {
    const stored = localStorage.getItem('motionEnabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.motionEnabled;
  }

  function getInitialPhysicsEnabled() {
    const stored = localStorage.getItem('physicsEnabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.physicsEnabled;
  }

  function getInitialContactMode() {
    const stored = localStorage.getItem('contactMode');
    if (stored === 'bounce' || stored === 'stick' || stored === 'both') return stored;
    return defaults.contactMode;
  }

  function getInitialGravityEnabled() {
    const stored = localStorage.getItem('gravityEnabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.gravityEnabled;
  }

  function getInitialBreathingEnabled() {
    const stored = localStorage.getItem('breathingEnabled');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults.breathingEnabled;
  }

  function getInitialSpeed() {
    const stored = Number(localStorage.getItem('speed'));
    if (Number.isFinite(stored)) return stored;
    return defaults.speed;
  }

  let dotMinSize = getInitialMinSize();
  let dotMaxSize = Math.round(getInitialMaxSize());
  let dotDensity = getInitialDensity();
  let dotSizeCount = getInitialSizeCount();
  let dotDistribution = getInitialDistribution();
  let autoFit = getInitialAutoFit();
  let reactToUi = getInitialReactToUi();
  let motionEnabled = getInitialMotionEnabled();
  let physicsEnabled = getInitialPhysicsEnabled();
  let contactMode = getInitialContactMode();
  let gravityEnabled = getInitialGravityEnabled();
  let breathingEnabled = getInitialBreathingEnabled();
  let speed = getInitialSpeed();

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
  dotField.setReactToUi(reactToUi);
  dotField.setMotionEnabled(motionEnabled);
  dotField.setPhysicsEnabled(physicsEnabled);
  dotField.setContactMode(contactMode);
  dotField.setGravityEnabled(gravityEnabled);
  dotField.setBreathingEnabled(breathingEnabled);
  dotField.setSpeed(speed);

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
  const motionEnabledEl = document.querySelector('#motionEnabled');
  const motionEnabledValue = document.querySelector('#motionEnabledValue');
  const physicsEnabledEl = document.querySelector('#physicsEnabled');
  const physicsEnabledValue = document.querySelector('#physicsEnabledValue');
  const contactModeGroup = document.querySelector('#contactModeGroup');
  const contactModeEls = Array.from(document.querySelectorAll('input[name="contactMode"]'));
  const gravityGroup = document.querySelector('#gravityGroup');
  const gravityEnabledEl = document.querySelector('#gravityEnabled');
  const gravityEnabledValue = document.querySelector('#gravityEnabledValue');
  const breathingEnabledEl = document.querySelector('#breathingEnabled');
  const breathingEnabledValue = document.querySelector('#breathingEnabledValue');
  const speedEl = document.querySelector('#speed');
  const speedValue = document.querySelector('#speedValue');
  const reactToUiEl = document.querySelector('#reactToUi');
  const reactToUiValue = document.querySelector('#reactToUiValue');
  const autoFitEl = document.querySelector('#autoFit');
  const autoFitValue = document.querySelector('#autoFitValue');
  const resetControls = document.querySelector('#resetControls');
  const restartControls = document.querySelector('#restartControls');

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
      dotField.setMotionEnabled(motionEnabled);
      dotField.setPhysicsEnabled(physicsEnabled);
      dotField.setContactMode(contactMode);
      dotField.setGravityEnabled(gravityEnabled);
      dotField.setBreathingEnabled(breathingEnabled);
      dotField.setSpeed(speed);
    });
  }

  function clampMinMaxSizes() {
    dotMaxSize = Math.max(1, Math.round(dotMaxSize));
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

  function syncPhysicsGating() {
    const disabled = !physicsEnabled;
    if (contactModeGroup instanceof HTMLElement) contactModeGroup.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    for (const el of contactModeEls) {
      if (el instanceof HTMLInputElement) el.disabled = disabled;
    }
    if (gravityGroup instanceof HTMLElement) gravityGroup.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    if (gravityEnabledEl instanceof HTMLInputElement) gravityEnabledEl.disabled = disabled;
  }

  if (motionEnabledEl instanceof HTMLInputElement) {
    motionEnabledEl.checked = motionEnabled;
    if (motionEnabledValue instanceof HTMLOutputElement) motionEnabledValue.value = motionEnabled ? 'On' : 'Off';
    motionEnabledEl.addEventListener('change', () => {
      motionEnabled = motionEnabledEl.checked;
      localStorage.setItem('motionEnabled', String(motionEnabled));
      if (motionEnabledValue instanceof HTMLOutputElement) motionEnabledValue.value = motionEnabled ? 'On' : 'Off';
      scheduleDotUpdate();
    });
  }

  if (physicsEnabledEl instanceof HTMLInputElement) {
    physicsEnabledEl.checked = physicsEnabled;
    if (physicsEnabledValue instanceof HTMLOutputElement) physicsEnabledValue.value = physicsEnabled ? 'On' : 'Off';
    physicsEnabledEl.addEventListener('change', () => {
      physicsEnabled = physicsEnabledEl.checked;
      if (!physicsEnabled) {
        gravityEnabled = false;
        contactMode = 'bounce';
      }
      localStorage.setItem('physicsEnabled', String(physicsEnabled));
      localStorage.setItem('gravityEnabled', String(gravityEnabled));
      localStorage.setItem('contactMode', contactMode);
      if (physicsEnabledValue instanceof HTMLOutputElement) physicsEnabledValue.value = physicsEnabled ? 'On' : 'Off';
      syncControlValues();
      scheduleDotUpdate();
    });
  }

  for (const el of contactModeEls) {
    if (!(el instanceof HTMLInputElement)) continue;
    el.checked = el.value === contactMode;
    el.addEventListener('change', () => {
      if (!physicsEnabled) return;
      const next = el.value;
      if (next !== 'bounce' && next !== 'stick' && next !== 'both') return;
      contactMode = next;
      localStorage.setItem('contactMode', contactMode);
      scheduleDotUpdate();
    });
  }

  if (gravityEnabledEl instanceof HTMLInputElement) {
    gravityEnabledEl.checked = gravityEnabled;
    if (gravityEnabledValue instanceof HTMLOutputElement) gravityEnabledValue.value = gravityEnabled ? 'On' : 'Off';
    gravityEnabledEl.addEventListener('change', () => {
      if (!physicsEnabled) return;
      gravityEnabled = gravityEnabledEl.checked;
      localStorage.setItem('gravityEnabled', String(gravityEnabled));
      if (gravityEnabledValue instanceof HTMLOutputElement) gravityEnabledValue.value = gravityEnabled ? 'On' : 'Off';
      scheduleDotUpdate();
    });
  }

  if (breathingEnabledEl instanceof HTMLInputElement) {
    breathingEnabledEl.checked = breathingEnabled;
    if (breathingEnabledValue instanceof HTMLOutputElement) breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
    breathingEnabledEl.addEventListener('change', () => {
      breathingEnabled = breathingEnabledEl.checked;
      localStorage.setItem('breathingEnabled', String(breathingEnabled));
      if (breathingEnabledValue instanceof HTMLOutputElement) breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
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
      scheduleDotUpdate();
    });
  }

  if (reactToUiEl instanceof HTMLInputElement) {
    reactToUiEl.checked = reactToUi;
    if (reactToUiValue instanceof HTMLOutputElement) reactToUiValue.value = reactToUi ? 'On' : 'Off';
    reactToUiEl.addEventListener('change', () => {
      reactToUi = reactToUiEl.checked;
      localStorage.setItem('reactToUi', String(reactToUi));
      if (reactToUiValue instanceof HTMLOutputElement) reactToUiValue.value = reactToUi ? 'On' : 'Off';
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
    if (dotMaxSizeValue instanceof HTMLOutputElement) dotMaxSizeValue.value = dotMaxSize.toFixed(0);
    if (dotDensityEl instanceof HTMLInputElement) dotDensityEl.value = String(dotDensity);
    if (dotDensityValue instanceof HTMLOutputElement) dotDensityValue.value = dotDensity.toFixed(2);
    if (dotSizeCountEl instanceof HTMLInputElement) dotSizeCountEl.value = String(dotSizeCount);
    if (dotSizeCountValue instanceof HTMLOutputElement) dotSizeCountValue.value = String(dotSizeCount);
    if (dotDistributionEl instanceof HTMLInputElement) dotDistributionEl.value = String(dotDistribution);
    if (dotDistributionValue instanceof HTMLOutputElement) dotDistributionValue.value = distributionLabel(dotDistribution);
    if (motionEnabledEl instanceof HTMLInputElement) motionEnabledEl.checked = motionEnabled;
    if (motionEnabledValue instanceof HTMLOutputElement) motionEnabledValue.value = motionEnabled ? 'On' : 'Off';
    if (physicsEnabledEl instanceof HTMLInputElement) physicsEnabledEl.checked = physicsEnabled;
    if (physicsEnabledValue instanceof HTMLOutputElement) physicsEnabledValue.value = physicsEnabled ? 'On' : 'Off';
    for (const el of contactModeEls) {
      if (el instanceof HTMLInputElement) el.checked = el.value === contactMode;
    }
    if (gravityEnabledEl instanceof HTMLInputElement) gravityEnabledEl.checked = gravityEnabled;
    if (gravityEnabledValue instanceof HTMLOutputElement) gravityEnabledValue.value = gravityEnabled ? 'On' : 'Off';
    if (breathingEnabledEl instanceof HTMLInputElement) breathingEnabledEl.checked = breathingEnabled;
    if (breathingEnabledValue instanceof HTMLOutputElement) breathingEnabledValue.value = breathingEnabled ? 'On' : 'Off';
    if (speedEl instanceof HTMLInputElement) speedEl.value = String(speed);
    if (speedValue instanceof HTMLOutputElement) speedValue.value = speed.toFixed(2);
    if (reactToUiEl instanceof HTMLInputElement) reactToUiEl.checked = reactToUi;
    if (reactToUiValue instanceof HTMLOutputElement) reactToUiValue.value = reactToUi ? 'On' : 'Off';
    if (autoFitEl instanceof HTMLInputElement) autoFitEl.checked = autoFit;
    if (autoFitValue instanceof HTMLOutputElement) autoFitValue.value = autoFit ? 'On' : 'Off';
    syncPhysicsGating();
  }

  resetControls?.addEventListener('click', () => {
    dotMinSize = defaults.dotMinSize;
    dotMaxSize = defaults.dotMaxSize;
    dotDensity = defaults.dotDensity;
    dotSizeCount = defaults.dotSizeCount;
    dotDistribution = defaults.dotDistribution;
    autoFit = defaults.autoFit;
    reactToUi = defaults.reactToUi;
    motionEnabled = defaults.motionEnabled;
    physicsEnabled = defaults.physicsEnabled;
    contactMode = defaults.contactMode;
    gravityEnabled = defaults.gravityEnabled;
    breathingEnabled = defaults.breathingEnabled;
    speed = defaults.speed;

    localStorage.removeItem('dotMinSize');
    localStorage.removeItem('dotMaxSize');
    localStorage.removeItem('dotDensity');
    localStorage.removeItem('dotSizeCount');
    localStorage.removeItem('dotDistribution');
    localStorage.removeItem('autoFit');
    localStorage.removeItem('reactToUi');
    localStorage.removeItem('motionEnabled');
    localStorage.removeItem('physicsEnabled');
    localStorage.removeItem('contactMode');
    localStorage.removeItem('gravityEnabled');
    localStorage.removeItem('breathingEnabled');
    localStorage.removeItem('speed');

    syncControlValues();
    scheduleDotUpdate();
  });

  restartControls?.addEventListener('click', () => {
    dotField.restart();
    dotField.heroIntro();
  });
  syncControlValues();

  // Clean up legacy storage keys from earlier slider iterations.
  localStorage.removeItem('dotScale');
  localStorage.removeItem('dotVariance');
  localStorage.removeItem('dotSizeSteps');
  localStorage.removeItem('motionStyle');
  localStorage.removeItem('motionAmount');
  localStorage.removeItem('contactFeel');

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
