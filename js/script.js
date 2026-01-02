document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Loaded. Initializing scripts...");

  const bodyId = document.body.id;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- General Initializations (Run on every page) ---
  // initThemeToggle(); // Removed call
  updateActiveNav();
  updateFooterYear();

  // Initialize 3D Background and Animations only if motion is preferred
  if (!motionQuery.matches) {
      console.log("Motion preference: OK. Initializing dynamic elements.");
      console.log(">>> Calling initThreeBackground..."); // Add this line
      initThreeBackground(); // Initialize 3D background
      initScrollTriggers();  // Restore scroll triggers
  } else {
      console.log("Reduced motion preferred. Skipping 3D background and scroll animations.");
      // Ensure canvas is hidden if JS runs but motion is reduced
      const canvas = document.getElementById('bg-canvas');
      if (canvas) {
          canvas.style.display = 'none';
          console.log("Canvas explicitly hidden due to reduced motion preference.");
      }
  }

  // --- Page-Specific Initializations ---
  if (bodyId === 'home-page' && !motionQuery.matches) {
      initHomepageScripts(); // Restore homepage scripts
  }
  // Add more page-specific initializers here if needed
  // if (bodyId === 'some-other-page') { initOtherPageScripts(); }


  // ========================================================
  //             INITIALIZATION FUNCTIONS
  // ========================================================

  /* Removed initThemeToggle function */

  function updateActiveNav() {
      const navLinks = document.querySelectorAll('#main-nav .nav-link');
      if (navLinks.length === 0) return;

      const currentPath = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html if path is '/'

      navLinks.forEach(link => {
          const linkPath = link.getAttribute('href').split('/').pop();
          const isActive = (currentPath === linkPath);

          if (isActive) {
              link.classList.add('active');
          } else {
              link.classList.remove('active');
          }
      });
      console.log("Active nav link updated for:", currentPath);
  }

  function updateFooterYear() {
      const yearSpan = document.getElementById('current-year');
      if (yearSpan) {
          yearSpan.textContent = new Date().getFullYear();
      }
  }

  // --- Homepage Specific Scripts ---
  function initHomepageScripts() {
      console.log("Initializing homepage scripts...");
      initHomepageAnimations();
      initTyped();
      initOrbitScroll();
  }

  function initHomepageAnimations() {
      if (typeof gsap === 'undefined') {
          console.error("GSAP not loaded. Cannot initialize homepage animations."); return;
      }
      console.log("Initializing homepage GSAP animations.");

      const headline = document.getElementById('main-headline');
      const taglines = document.querySelectorAll('.tagline');
      const typedEl = document.getElementById('typed-intro');

      // Ensure elements exist before animating
      if (headline) gsap.from(headline, { opacity: 0, y: 30, duration: 1, delay: 0.2 });
      if (taglines.length > 0) gsap.from(taglines, { opacity: 0, y: 20, stagger: 0.2, duration: 0.8, delay: 0.5 });
      if (typedEl) gsap.from(typedEl, { opacity: 0, duration: 0.5, delay: 1.0 });
  }

  function initTyped() {
      const typedElement = document.getElementById('typed-intro');
      if (typedElement && typeof Typed !== 'undefined') {
          console.log("Initializing Typed.js");
          typedElement.innerHTML = ''; // Clear previous content if any
          try {
              new Typed(typedElement, {
                  strings: [
                      'Exploring the cosmos through code.',
                      'Building the future of propulsion.',
                      'Bridging physics, AI, and engineering.',
                      'Welcome to my journey.'
                  ],
                  typeSpeed: 50,
                  backSpeed: 30,
                  backDelay: 1500,
                  startDelay: 1200, // Start after initial fade-in
                  loop: true,
                  showCursor: true,
                  cursorChar: '_',
                  smartBackspace: true
              });
          } catch (e) {
              console.error("Error initializing Typed.js:", e);
          }
      } else if (!typedElement) {
          console.log('Typed target element #typed-intro not found.');
      } else {
          console.error('Typed.js library not loaded.');
      }
  }

  function initOrbitScroll() {
      const orbit = document.querySelector('#orbit-container .orbit');
      if (!orbit) return;
      window.addEventListener('scroll', () => {
          const rotation = window.scrollY * 0.1;
          orbit.style.transform = `rotate(${rotation}deg)`;
          if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
              window.scrollTo({ top: 0, behavior: 'auto' });
          }
      });
  }

  // --- ScrollTrigger Animations (Run on relevant pages) ---
  function initScrollTriggers() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
          console.error("GSAP or ScrollTrigger not loaded. Cannot initialize scroll animations."); return;
      }
      gsap.registerPlugin(ScrollTrigger);
      console.log("Initializing ScrollTrigger animations.");

      // Target all sections EXCEPT the homepage hero content
      const sections = gsap.utils.toArray('section:not(#home-content)');

      sections.forEach((section, index) => {
          // Ensure section exists and has content before animating
          if (section && section.children.length > 0) {
              gsap.to(section, {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: {
                      trigger: section,
                      start: "top 85%", // Trigger when 85% of the viewport reaches the top of the section
                      end: "bottom 20%", // Optional: define an end point
                      // markers: true, // Uncomment for debugging scroll trigger positions
                      toggleActions: "play none none none", // Play the animation once when entering the trigger zone
                  }
              });
          } else {
               console.warn(`ScrollTrigger skipped for empty or non-existent section index ${index}`);
          }
      });
      console.log(`ScrollTriggers potentially attached to ${sections.length} sections.`);
  }

  // --- Three.js Background Initialization ---
  function initThreeBackground() {
      console.log("initThreeBackground called");
      const canvas = document.getElementById('bg-canvas');
      if (!canvas) {
          console.warn("Canvas element #bg-canvas not found. Skipping 3D background.");
          return;
      }

      // Check if THREE is loaded
      if (typeof THREE === 'undefined') {
          console.error("THREE.js library not loaded. Cannot initialize 3D background.");
          return;
      }

      console.log("Initializing Three.js background...");

      // Scene setup
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020617, 0.12);

      // Camera
      const camera = new THREE.PerspectiveCamera(
          45,
          window.innerWidth / window.innerHeight,
          0.1,
          100
      );
      camera.position.set(0, 6, 12);
      camera.lookAt(0, 0, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true
      });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(window.innerWidth, window.innerHeight, false);

      // Lights
      const ambient = new THREE.AmbientLight(0x6b8cff, 0.7);
      scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      // Grid
      const grid = new THREE.GridHelper(20, 24, 0x1f2937, 0x0f172a);
      grid.position.y = -0.01;
      scene.add(grid);

      // Mouse tracking
      const mouse = { x: 0, y: 0, ndcX: 0, ndcY: 0, active: false };
      
      window.addEventListener('mousemove', e => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
          mouse.ndcX = (e.clientX / window.innerWidth) * 2 - 1;
          mouse.ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
          mouse.active = true;
      });

      window.addEventListener('mouseleave', () => {
          mouse.active = false;
      });

      // Resize handler
      function onResize() {
          const w = window.innerWidth;
          const h = window.innerHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
      }
      window.addEventListener('resize', onResize);

      // Animation loop
      function animate(time) {
          requestAnimationFrame(animate);
          const t = time * 0.001;

          // Camera movement
          const wobble = 0.6;
          camera.position.x = Math.sin(t * 0.25) * 4 + mouse.ndcX * wobble * 3;
          camera.position.y = 4.5 + Math.cos(t * 0.2) * 0.8 + mouse.ndcY * wobble * 2;
          camera.position.z = 11 + Math.sin(t * 0.15) * 0.5;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
      }

      requestAnimationFrame(animate);
      console.log("Three.js background initialized successfully.");
  }

}); // Close DOMContentLoaded event listener
