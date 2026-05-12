document.addEventListener('DOMContentLoaded', () => {
  updateFooterYear();
  setActiveNavOnScroll();
  initSectionReveal();
  initThreeBackground();
});

function updateFooterYear() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = new Date().getFullYear();
}

function setActiveNavOnScroll() {
  const sections = [...document.querySelectorAll('main section')];
  const links = [...document.querySelectorAll('.nav-link')];
  const byId = new Map(links.map(a => [a.getAttribute('href').replace('#', ''), a]));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.remove('active'));
      const link = byId.get(entry.target.id);
      if (link) link.classList.add('active');
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
}

function initSectionReveal() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('main section').forEach((section, i) => {
    if (i === 0) return;
    gsap.from(section, {
      y: 36,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 85%' }
    });
  });
}

function initThreeBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 26;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);

  const stars = new THREE.BufferGeometry();
  const count = 1800;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 140;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 140;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 140;
  }
  stars.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const starMat = new THREE.PointsMaterial({ size: 0.22, color: 0x9ecbff, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(stars, starMat);
  scene.add(points);

  const torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry(4.8, 1.2, 180, 22),
    new THREE.MeshStandardMaterial({ color: 0x6e82ff, emissive: 0x1f1d44, metalness: 0.6, roughness: 0.25 })
  );
  scene.add(torus);

  scene.add(new THREE.AmbientLight(0xa3bfff, 0.5));
  const key = new THREE.PointLight(0x63d4ff, 1.4, 120);
  key.position.set(12, 8, 20);
  scene.add(key);

  let mx = 0; let my = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 1.8;
    my = (e.clientY / innerHeight - 0.5) * 1.2;
  });

  function animate(t) {
    requestAnimationFrame(animate);
    const time = t * 0.001;
    points.rotation.y = time * 0.03;
    torus.rotation.x = time * 0.35;
    torus.rotation.y = time * 0.22;
    camera.position.x += (mx - camera.position.x) * 0.02;
    camera.position.y += (-my - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate(0);

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}
