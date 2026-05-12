document.addEventListener('DOMContentLoaded', () => {
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  updateActiveNav();
  updateFooterYear();

  if (!motionReduced) {
    initThreeBackground();
    initScrollTriggers();
    initFlowViz();
  }
  if (document.body.id === 'home-page') initTyped();

  function updateActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href').split('/').pop() === current);
    });
  }

  function updateFooterYear() {
    const y = document.getElementById('current-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function initTyped() {
    const el = document.getElementById('typed-intro');
    if (!el || typeof Typed === 'undefined') return;
    new Typed(el, {
      strings: [
        'Modeling turbulence with physics-informed learning.',
        'Designing propulsion systems for interplanetary futures.',
        'Bridging AI research and aerospace engineering.'
      ], typeSpeed: 45, backSpeed: 24, backDelay: 1600, loop: true
    });
  }

  function initScrollTriggers() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('section:not(#home-content)').forEach(section => {
      gsap.to(section, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 85%', toggleActions: 'play none none none' }
      });
    });
  }

  function initFlowViz() {
    const canvas = document.getElementById('flow-viz');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    function size() {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); window.addEventListener('resize', size);
    let t = 0;
    function draw() {
      t += 0.015;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.fillStyle = 'rgba(2,6,23,0.18)'; ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) {
        for (let y = 0; y < h; y += 16) {
          const a = Math.sin(x * 0.02 + t) + Math.cos(y * 0.03 - t * 1.1);
          const len = 8 + 4 * Math.sin(a + t);
          ctx.strokeStyle = `hsla(${190 + 40*Math.sin(a)}, 90%, 70%, 0.45)`;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.09);
    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 4, 10);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.setPixelRatio(devicePixelRatio || 1);

    scene.add(new THREE.AmbientLight(0x8ec5ff, 0.65));
    const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(5, 6, 5); scene.add(d);
    const stars = new THREE.BufferGeometry();
    const pts = new Float32Array(1200 * 3);
    for (let i = 0; i < pts.length; i += 3) {
      pts[i] = (Math.random() - 0.5) * 40;
      pts[i + 1] = (Math.random() - 0.5) * 25;
      pts[i + 2] = (Math.random() - 0.5) * 40;
    }
    stars.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const particles = new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.05 }));
    scene.add(particles);

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false);
    });

    const mouse = { x: 0, y: 0 };
    addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / innerWidth) * 2 - 1;
      mouse.y = (e.clientY / innerHeight) * 2 - 1;
    });

    (function animate(t) {
      const s = t * 0.00015;
      particles.rotation.y += 0.0007;
      camera.position.x = Math.sin(s) * 1.8 + mouse.x * 0.6;
      camera.position.y = Math.cos(s * 1.4) * 0.8 - mouse.y * 0.4;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    })(0);
  }
});
