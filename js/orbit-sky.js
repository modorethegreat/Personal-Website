const TAU = Math.PI * 2;

function randomSequence(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function glowSprite(color) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const context = sprite.getContext('2d');
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'rgba(255, 252, 242, 1)');
  glow.addColorStop(0.18, `rgba(${color}, .96)`);
  glow.addColorStop(0.37, `rgba(${color}, .32)`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return sprite;
}

function makeTrail(random, wide, narrow, color) {
  const stars = Array.from({ length: 570 }, () => {
    const size = random();
    return {
      origin: random(),
      spread: (random() + random() + random() - 1.5) / 1.5,
      glow: size > .82,
      size: size > .96 ? 10 + (size - .96) * 180 : size > .82 ? 4 + (size - .82) * 38 : .65 + size * 1.55,
      shine: .25 + random() * .75,
      speed: .008 + random() * .014,
    };
  });
  return { wide, narrow, color, stars, sprite: glowSprite(color) };
}

const point = (points, t) => {
  const u = 1 - t;
  return [
    u ** 3 * points[0][0] + 3 * u * u * t * points[1][0] + 3 * u * t * t * points[2][0] + t ** 3 * points[3][0],
    u ** 3 * points[0][1] + 3 * u * u * t * points[1][1] + 3 * u * t * t * points[2][1] + t ** 3 * points[3][1],
  ];
};

function drawFlare(context, x, y, radius, color) {
  const glowRadius = radius * 4.7;
  const halo = context.createRadialGradient(x, y, 0, x, y, glowRadius);
  halo.addColorStop(0, 'rgba(255, 247, 221, 1)');
  halo.addColorStop(.22, `rgba(${color}, .78)`);
  halo.addColorStop(.43, `rgba(${color}, .18)`);
  halo.addColorStop(1, `rgba(${color}, 0)`);
  context.fillStyle = halo;
  context.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
  context.fillStyle = '#fff9eb';
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
}

function renderTrail(context, trail, width, height, time, parallax, compact) {
  const path = compact ? trail.narrow : trail.wide;
  const deltaX = parallax.x * 20;
  const deltaY = parallax.y * 15;
  const density = compact ? 340 : trail.stars.length;

  context.fillStyle = `rgb(${trail.color})`;
  for (let index = 0; index < density; index += 1) {
    const star = trail.stars[index];
    const t = (star.origin + time * star.speed) % 1;
    const [x, y] = point(path, t);
    const next = point(path, t + .005);
    const dx = (next[0] - x) * width;
    const dy = (next[1] - y) * height;
    const distance = Math.hypot(dx, dy) || 1;
    const spread = star.spread * (.009 + t * .14) * height;
    const starX = x * width - spread * dy / distance + deltaX * (1 + t * .5);
    const starY = y * height + spread * dx / distance + deltaY * (1 + t * .5);
    const fade = Math.min(1, t * 36, (1 - t) * 12);
    context.globalAlpha = fade * star.shine;
    if (star.glow) {
      const size = star.size * (compact ? .8 : 1);
      context.drawImage(trail.sprite, starX - size / 2, starY - size / 2, size, size);
    } else {
      context.fillRect(starX, starY, star.size, star.size);
    }
  }
  context.globalAlpha = 1;
  const [anchorX, anchorY] = path[0];
  const warm = trail.color === '249, 186, 127';
  const radius = warm ? Math.max(9, height * .025) : Math.max(3, height * .009);
  drawFlare(context, anchorX * width + deltaX, anchorY * height + deltaY, radius, trail.color);
}

function mountSky(hero) {
  const canvas = hero.querySelector('[data-orbit-canvas]');
  const button = hero.querySelector('[data-orbit-toggle]');
  const context = canvas.getContext('2d');
  if (!context) return;

  const random = randomSequence(8129);
  const warm = makeTrail(random,
    [[.728,.177],[.61,-.035],[.14,-.02],[-.095,.66]],
    [[.77,.20],[.63,.045],[.19,-.03],[-.20,.34]],
    '249, 186, 127');
  const cool = makeTrail(random,
    [[.262,.727],[.43,1.0],[.83,1.05],[1.13,.55]],
    [[.17,.83],[.43,1.0],[.9,.96],[1.14,.66]],
    '168, 212, 255');
  const stars = Array.from({ length: 156 }, () => [random(), random(), random()]);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const near = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const dialog = hero.querySelector('dialog');
  let width = 0;
  let height = 0;
  let frame = 0;
  let elapsed = 0;
  let last = 0;
  let visible = true;
  let playing = !reducedMotion.matches;

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgb(207, 225, 247)';
    for (const [x, y, brightness] of stars) {
      const size = .56 + brightness * .95;
      context.globalAlpha = .16 + brightness * .37;
      context.fillRect(x * width + near.x * brightness * 13, y * height + near.y * brightness * 9, size, size);
    }
    context.globalAlpha = 1;
    const compact = width < 660;
    renderTrail(context, warm, width, height, elapsed, near, compact);
    renderTrail(context, cool, width, height, elapsed, near, compact);
  }

  function tick(timestamp) {
    frame = 0;
    if (last) elapsed += Math.min(timestamp - last, 60) / 1000;
    last = timestamp;
    near.x += (target.x - near.x) * .07;
    near.y += (target.y - near.y) * .07;
    draw();
    reconcile();
  }

  function reconcile() {
    if (playing && visible && !document.hidden && !dialog?.open) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  }

  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const resolution = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * resolution);
    canvas.height = Math.round(height * resolution);
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    draw();
  }

  function setPlaying(value) {
    playing = value;
    button.textContent = playing ? 'Pause sky' : 'Animate sky';
    reconcile();
  }

  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    target.x = (event.clientX - bounds.left) / bounds.width - .5;
    target.y = (event.clientY - bounds.top) / bounds.height - .5;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { target.x = target.y = 0; });
  hero.addEventListener('pointercancel', () => { target.x = target.y = 0; });
  button.addEventListener('click', () => setPlaying(!playing));
  reducedMotion.addEventListener('change', (event) => setPlaying(!event.matches));
  document.addEventListener('visibilitychange', reconcile);
  dialog?.addEventListener('close', reconcile);
  // Updating the open attribute also catches browsers without the dialog toggle event.
  if (dialog) new MutationObserver(reconcile).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      reconcile();
    }).observe(hero);
  }
  resize();
  button.hidden = false;
  setPlaying(playing);
}

const hero = document.querySelector('[data-orbit-hero]');
if (hero) mountSky(hero);
