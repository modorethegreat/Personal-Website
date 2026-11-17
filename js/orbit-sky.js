import { createOrbitScene } from './orbit-scene.js';
import { createParticleTrails } from './particle-trails.js';

const orbitView = { yaw: .18, pitch: .45, zoom: 1 };
const ringView = { yaw: .18, pitch: 1.35, zoom: .91 };
const nearLimit = .72;
const farLimit = 1.74;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function mountOrbit(hero) {
  const stage = hero.querySelector('[data-orbit-stage]');
  const canvas = hero.querySelector('[data-orbit-canvas]');
  const controls = hero.querySelector('[data-orbit-controls]');
  const hint = hero.querySelector('#orbit-hint');
  const toggle = controls.querySelector('[data-orbit-toggle]');
  const zoomOut = controls.querySelector('[data-orbit-zoom="-1"]');
  const zoomIn = controls.querySelector('[data-orbit-zoom="1"]');
  const presets = [...controls.querySelectorAll('[data-orbit-view]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = hero.querySelector('dialog');
  const view = { ...orbitView };
  const particles = createParticleTrails(hero.querySelector('[data-particle-trails]'));
  const parallax = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0 };
  let draw;
  let preset = 'orbit';
  let drift = !motion.matches;
  let inViewport = true;
  let dirty = true;
  let frame = 0;
  let last = 0;
  let time = 0;
  let orbitStarted = 0;
  let gesture;

  function canRender() {
    return draw && inViewport && !dialog.open && !document.hidden;
  }

  function updateFrame(now) {
    frame = 0;
    if (!canRender()) return;
    if (dirty || (!gesture && drift && now - last >= 41)) {
      if (drift && !gesture && last) time += Math.min(80, now - last) / 1000;
      last = now;
      dirty = false;
      const camera = { ...view, yaw: view.yaw + .105 * Math.sin((time - orbitStarted) * .28) };
      if (drift && !motion.matches) {
        parallax.x += (pointer.x - parallax.x) * .12;
        parallax.y += (pointer.y - parallax.y) * .12;
      }
      draw(camera, time);
      particles(time, parallax);
      canvas.hidden = false;
    }
    schedule();
  }

  function schedule() {
    if (!canRender() || (!drift && !dirty) || (gesture && !dirty)) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      return;
    }
    if (!frame) frame = requestAnimationFrame(updateFrame);
  }

  function redraw() {
    dirty = true;
    schedule();
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.3, Math.sqrt(660000 / (width * height)));
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    if (!draw) particles(time, parallax);
    redraw();
  }

  function refreshControls() {
    for (const button of presets) button.setAttribute('aria-pressed', String(button.dataset.orbitView === preset));
    zoomOut.disabled = view.zoom <= nearLimit;
    zoomIn.disabled = view.zoom >= farLimit;
    toggle.textContent = drift ? 'Pause drift' : 'Play drift';
    redraw();
  }

  function setPreset(key) {
    Object.assign(view, key === 'orbit' ? orbitView : ringView);
    orbitStarted = time;
    preset = key;
    refreshControls();
  }

  function turn(dx, dy) {
    view.yaw = (view.yaw + dx) % (2 * Math.PI);
    view.pitch = clamp(view.pitch + dy, -1.48, 1.48);
    preset = '';
    refreshControls();
  }

  function zoom(direction) {
    view.zoom = Number(clamp(view.zoom * (direction > 0 ? 1.16 : 1 / 1.16), nearLimit, farLimit).toFixed(3));
    refreshControls();
  }

  function setDrift(value) {
    drift = value;
    last = 0;
    refreshControls();
  }

  function setInteractive(enabled) {
    controls.hidden = hint.hidden = !enabled;
    if (enabled) {
      stage.setAttribute('tabindex', '0');
      stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', 'Orbit the ringed planet');
      stage.setAttribute('aria-describedby', hint.id);
      stage.dataset.interactive = '';
    } else {
      stage.removeAttribute('tabindex');
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', 'A ringed planet lit from the upper left');
      stage.removeAttribute('aria-describedby');
      delete stage.dataset.interactive;
    }
  }

  function start() {
    try {
      draw = createOrbitScene(canvas);
    } catch {
      particles(time, parallax);
      return;
    }
    setInteractive(true);
    resize();
    refreshControls();
  }

  function endGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    gesture = undefined;
    delete stage.dataset.dragging;
    schedule();
  }

  hero.addEventListener('pointermove', (event) => {
    if (!drift || motion.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    pointer.x = (event.clientX - bounds.left) / bounds.width - .5;
    pointer.y = (event.clientY - bounds.top) / bounds.height - .5;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
  stage.addEventListener('pointerdown', (event) => {
    if (!draw || !event.isPrimary || event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.dataset.dragging = '';
    schedule();
  });
  stage.addEventListener('pointermove', (event) => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (dx || dy) turn(-dx * .006, dy * .006);
    gesture.x = event.clientX;
    gesture.y = event.clientY;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stage.addEventListener(name, endGesture);
  }
  stage.addEventListener('keydown', (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    switch (event.key) {
      case 'ArrowLeft': turn(-.14, 0); break;
      case 'ArrowRight': turn(.14, 0); break;
      case 'ArrowUp': turn(0, .14); break;
      case 'ArrowDown': turn(0, -.14); break;
      case '+':
      case '=': zoom(1); break;
      case '-': zoom(-1); break;
      default: return;
    }
    event.preventDefault();
  });
  for (const button of presets) button.addEventListener('click', () => setPreset(button.dataset.orbitView));
  zoomOut.addEventListener('click', () => zoom(-1));
  zoomIn.addEventListener('click', () => zoom(1));
  toggle.addEventListener('click', () => setDrift(!drift));
  motion.addEventListener('change', (event) => setDrift(!event.matches));
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resizeObserver.observe(hero);
  } else {
    window.addEventListener('resize', resize);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      schedule();
    }).observe(hero);
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    draw = undefined;
    gesture = undefined;
    delete stage.dataset.dragging;
    canvas.hidden = true;
    setInteractive(false);
    schedule();
  });
  canvas.addEventListener('webglcontextrestored', start);
  start();
}

const hero = document.querySelector('[data-orbit-hero]');
if (hero) mountOrbit(hero);
