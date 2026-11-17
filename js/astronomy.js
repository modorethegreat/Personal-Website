import { astronomyViews, createAstronomyScene } from './astronomy-scene.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function mountArtifact(figure) {
  const initial = astronomyViews[figure.dataset.artifact];
  const stage = figure.querySelector('[data-astronomy-stage]');
  const canvas = figure.querySelector('canvas');
  const poster = figure.querySelector('img');
  const toolbar = figure.querySelector('[data-astronomy-controls]');
  const hint = figure.querySelector('[data-astronomy-hint]');
  const baseline = { yaw: initial.yaw, pitch: initial.pitch };
  let view = { ...baseline };
  let hover = { yaw: 0, pitch: 0 };
  let draw;
  let frame;
  let pointer;

  function schedule() {
    if (!draw || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!draw) return;
      draw({ yaw: view.yaw + hover.yaw, pitch: view.pitch + hover.pitch });
      canvas.hidden = false;
    });
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.3, Math.sqrt(260000 / (width*height)));
    const pixelWidth = Math.round(width*ratio);
    const pixelHeight = Math.round(height*ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    schedule();
  }

  function enable(enabled) {
    toolbar.hidden = hint.hidden = !enabled;
    poster.setAttribute('aria-hidden', String(enabled));
    if (!enabled) canvas.hidden = true;
    if (enabled) {
      stage.tabIndex = 0;
      stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', 'Rotate ' + figure.querySelector('figcaption strong').textContent);
      stage.setAttribute('aria-describedby', hint.id);
      stage.dataset.interactive = '';
    } else {
      stage.removeAttribute('tabindex');
      stage.removeAttribute('role');
      stage.removeAttribute('aria-label');
      stage.removeAttribute('aria-describedby');
      delete stage.dataset.interactive;
    }
  }

  function start() {
    try {
      draw = createAstronomyScene(canvas, initial.kind);
    } catch {
      return;
    }
    enable(true);
    resize();
  }

  function rotate(yaw, pitch) {
    view.yaw = (view.yaw + yaw) % (2 * Math.PI);
    view.pitch = clamp(view.pitch + pitch, -1.42, 1.42);
    schedule();
  }

  function reset() {
    view = { ...baseline };
    hover = { yaw: 0, pitch: 0 };
    schedule();
  }

  stage.addEventListener('pointerdown', (event) => {
    if (!draw || !event.isPrimary || event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    hover = { yaw: 0, pitch: 0 };
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.dataset.dragging = '';
  });
  stage.addEventListener('pointermove', (event) => {
    if (pointer?.id === event.pointerId) {
      rotate((event.clientX-pointer.x)*.011, (event.clientY-pointer.y)*.011);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    } else if (draw && !pointer && event.pointerType === 'mouse' && !reducedMotion.matches) {
      const bounds = stage.getBoundingClientRect();
      hover.yaw = ((event.clientX-bounds.left)/bounds.width-.5)*.24;
      hover.pitch = ((event.clientY-bounds.top)/bounds.height-.5)*.24;
      schedule();
    }
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    hover = { yaw: 0, pitch: 0 };
    schedule();
  });
  function endDrag(event) {
    if (pointer?.id !== event.pointerId) return;
    pointer = undefined;
    delete stage.dataset.dragging;
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(event, endDrag);

  stage.addEventListener('keydown', (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    switch (event.key) {
      case 'ArrowLeft': rotate(-.20, 0); break;
      case 'ArrowRight': rotate(.20, 0); break;
      case 'ArrowUp': rotate(0, -.20); break;
      case 'ArrowDown': rotate(0, .20); break;
      case 'Home': reset(); break;
      default: return;
    }
    event.preventDefault();
  });
  toolbar.querySelectorAll('[data-turn]').forEach((button) => {
    button.addEventListener('click', () => rotate(Number(button.dataset.turn)*.24, 0));
  });
  toolbar.querySelector('[data-reset-artifact]').addEventListener('click', reset);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    draw = undefined;
    pointer = undefined;
    delete stage.dataset.dragging;
    enable(false);
  });
  canvas.addEventListener('webglcontextrestored', start);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  start();
}

const objects = document.querySelectorAll('[data-artifact]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      mountArtifact(entry.target);
    }
  }, { rootMargin: '200px' });
  for (const figure of objects) observer.observe(figure);
} else {
  objects.forEach(mountArtifact);
}
