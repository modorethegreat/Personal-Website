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
  const stars = Array.from({ length: 480 }, () => {
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

function renderTrail(context, trail, width, height, time, parallax, compact) {
  const path = compact ? trail.narrow : trail.wide;
  const deltaX = parallax.x * 20;
  const deltaY = parallax.y * 15;
  const density = compact ? 310 : trail.stars.length;

  context.fillStyle = `rgb(${trail.color})`;
  for (let index = 0; index < density; index += 1) {
    const star = trail.stars[index];
    const t = (star.origin + time * star.speed) % 1;
    const [x, y] = point(path, t);
    const next = point(path, t + .005);
    const dx = (next[0] - x) * width;
    const dy = (next[1] - y) * height;
    const distance = Math.hypot(dx, dy) || 1;
    const spread = star.spread * (.014 + t * .055) * height;
    const starX = x * width - spread * dy / distance + deltaX * (1 + t * .5);
    const starY = y * height + spread * dx / distance + deltaY * (1 + t * .5);
    const fade = Math.min(1, t * 36, (1 - t) * 12);
    context.globalAlpha = fade * star.shine * .87;
    if (star.glow) {
      const size = star.size * (compact ? .8 : 1);
      context.drawImage(trail.sprite, starX - size / 2, starY - size / 2, size, size);
    } else {
      context.fillRect(starX, starY, star.size, star.size);
    }
  }
  context.globalAlpha = 1;
}

export function createParticleTrails(canvas) {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const random = randomSequence(8129);
  const warm = makeTrail(random,
    [[1.035,.12],[.67,-.035],[.24,-.02],[-.09,.36]],
    [[1.08,.33],[.85,.4],[.4,.42],[-.17,.52]], '255, 177, 116');
  const cool = makeTrail(random,
    [[-.06,.86],[.29,1.045],[.72,.96],[1.07,.67]],
    [[-.12,.68],[.26,.81],[.73,.76],[1.11,.57]], '134, 188, 255');
  let width = 0;
  let height = 0;

  return (time, parallax) => {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    if (nextWidth !== width || nextHeight !== height) {
      width = nextWidth;
      height = nextHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    context.clearRect(0, 0, width, height);
    const compact = width <= 760;
    renderTrail(context, warm, width, height, time, parallax, compact);
    renderTrail(context, cool, width, height, time, parallax, compact);
  };
}
