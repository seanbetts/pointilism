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

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function getInitialDotScale() {
    const stored = Number(localStorage.getItem('dotScale'));
    if (Number.isFinite(stored) && stored > 0) return stored;
    return 1;
  }

  let dotScale = getInitialDotScale();

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

  const dotSize = document.querySelector('#dotSize');
  if (dotSize instanceof HTMLInputElement) {
    dotSize.value = String(dotScale);
    dotSize.addEventListener('input', () => {
      const next = Number(dotSize.value);
      if (!Number.isFinite(next)) return;
      dotScale = next;
      localStorage.setItem('dotScale', String(dotScale));
      dotField.setDotScale(dotScale);
    });
  }

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
