const TAU = Math.PI * 2;

function ring(x, radius, height = 0, depth = 0, flatten = 1) {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = index * TAU / 24;
    return [x, height + Math.cos(angle) * radius * flatten, depth + Math.sin(angle) * radius];
  });
}

function connectRings(rings, material) {
  return rings.slice(1).flatMap((next, index) => {
    const previous = rings[index];
    return previous.map((point, side) => {
      const neighbor = (side + 1) % previous.length;
      return { material, points: [point, previous[neighbor], next[neighbor], next[side]] };
    });
  });
}

function surface(corners, material, spanSegments = 8, chordSegments = 5) {
  const point = (u, v) => corners[0].map((start, i) => {
    const root = start + (corners[1][i] - start) * u;
    const tip = corners[2][i] + (corners[3][i] - corners[2][i]) * u;
    return root + (tip - root) * v;
  });
  return Array.from({ length: spanSegments }, (_, span) => {
    const v = span / spanSegments;
    const nextV = (span + 1) / spanSegments;
    return Array.from({ length: chordSegments }, (_, chord) => {
      const u = chord / chordSegments;
      const nextU = (chord + 1) / chordSegments;
      return { material, points: [point(u, v), point(nextU, v), point(nextU, nextV), point(u, nextV)] };
    });
  }).flat();
}

function buildSpaceplane() {
  // Shapes are in scene coordinates and describe a fictional vehicle.
  const body = [[-2.65, 0.015], [-2.18, 0.13], [-1.65, 0.26], [-1.07, 0.39],
    [-0.47, 0.48], [0.15, 0.49], [0.8, 0.47], [1.45, 0.42], [1.96, 0.34]]
    .map(([x, radius]) => ring(x, radius, 0, 0, 0.74));
  const wings = [-1, 1].flatMap((side) => {
    const wing = surface([[-0.92, -0.07, side * 0.32], [1.64, -0.06, side * 0.39],
      [0.70, -0.12, side * 1.64], [1.64, -0.12, side * 1.57]], 'wing');
    const stabilizer = surface([[0.7, 0.16, side * 0.27], [1.74, 0.14, side * 0.32],
      [1.32, 0.75, side * 0.59], [1.74, 0.69, side * 0.59]], 'wing', 4, 4);
    return [...wing, ...stabilizer];
  });
  const canopy = [[-1.82, 0.025, 0.23], [-1.47, 0.15, 0.24], [-1.13, 0.17, 0.29], [-0.77, 0.03, 0.31]]
    .map(([x, radius, height]) => ring(x, radius, height, 0, 0.58));
  const exhaust = [-0.17, 0.17].flatMap((depth) => connectRings([
    ring(1.89, 0.10, 0, depth), ring(2.19, 0.14, 0, depth), ring(2.17, 0.10, 0, depth),
  ], 'exhaust'));

  return [...connectRings(body, 'hull'), ...wings, ...connectRings(canopy, 'glass'), ...exhaust];
}

function starfield() {
  let seed = 257;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 85 }, () => [random(), random(), random()]);
}

const palette = {
  hull: ['#0d2137', '#6197c6'],
  wing: ['#0d1d31', '#5086ba'],
  glass: ['#142d46', '#b4dfff'],
  exhaust: ['#1a2537', '#e69058'],
};

export function mountSpacecraft(canvas, onSpinChange) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering is unavailable.');

  const faces = buildSpaceplane();
  const stars = starfield();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const options = { signal: events.signal };
  let width = 1;
  let height = 1;
  let yaw = -0.27;
  let roll = -0.65;
  let spinning = !motion.matches;
  let inView = true;
  let frame = 0;
  let lastTime = 0;
  let drag = null;

  function render() {
    ctx.fillStyle = '#080e18';
    ctx.fillRect(0, 0, width, height);
    for (const [x, y, shine] of stars) {
      ctx.fillStyle = `rgba(167,207,255,${0.18 + shine * 0.52})`;
      const size = shine > 0.94 ? 1.5 : 0.65;
      ctx.fillRect(x * width, y * height, size, size);
    }

    const horizon = width * 0.64;
    ctx.beginPath();
    ctx.ellipse(width * 0.77, height * 0.60, horizon, horizon * 0.55, -0.28, Math.PI, TAU);
    ctx.strokeStyle = '#274463';
    ctx.lineWidth = 1;
    ctx.stroke();

    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);
    const magnification = Math.min(width * 1.48, height * 2.38);

    function project([x, y, z]) {
      const rotatedY = y * cosRoll - z * sinRoll;
      const rolledZ = y * sinRoll + z * cosRoll;
      const rotatedX = x * cosYaw + rolledZ * sinYaw;
      const depth = rolledZ * cosYaw - x * sinYaw;
      const scale = magnification / (9 - depth);
      return [width * 0.51 + (rotatedX + rotatedY * 0.17) * scale,
        height * 0.45 - (rotatedY - rotatedX * 0.14) * scale, depth];
    }

    const projected = faces.map(({ material, points }) => {
      const screen = points.map(project);
      const depth = screen.reduce((sum, point) => sum + point[2], 0) / screen.length;
      return { material, screen, depth };
    }).sort((a, b) => a.depth - b.depth);

    for (const { material, screen } of projected) {
      ctx.beginPath();
      ctx.moveTo(screen[0][0], screen[0][1]);
      for (const [x, y] of screen.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
      [ctx.fillStyle, ctx.strokeStyle] = palette[material];
      ctx.fill();
      ctx.lineWidth = material === 'exhaust' ? 0.9 : 0.65;
      ctx.stroke();
    }
  }

  function tick(time) {
    frame = 0;
    if (lastTime) yaw += Math.min(time - lastTime, 48) * 0.00029;
    lastTime = time;
    render();
    syncAnimation();
  }

  function syncAnimation() {
    if (spinning && inView && !drag && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  }

  function setSpinning(value) {
    spinning = value;
    onSpinChange(spinning);
    syncAnimation();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    render();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    setSpinning(false);
  }, options);
  canvas.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    yaw += (event.clientX - drag.x) * 0.012;
    roll = Math.max(-1.5, Math.min(1.5, roll + (event.clientY - drag.y) * 0.01));
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
  }, options);
  function endDrag(event) {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    syncAnimation();
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(event, endDrag, options);
  }

  const sizeObserver = new ResizeObserver(resize);
  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncAnimation();
  });
  sizeObserver.observe(canvas);
  viewObserver.observe(canvas);
  motion.addEventListener('change', (event) => {
    if (event.matches) setSpinning(false);
  }, options);
  document.addEventListener('visibilitychange', syncAnimation, options);
  resize();
  setSpinning(spinning);

  return {
    turn(direction) {
      setSpinning(false);
      yaw += direction * 0.25;
      render();
    },
    toggleSpin() {
      setSpinning(!spinning);
    },
    destroy() {
      setSpinning(false);
      events.abort();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}
