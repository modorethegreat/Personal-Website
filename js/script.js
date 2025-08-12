document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing scripts...");

    const bodyId = document.body.id;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // --- General Initializations (Run on every page) ---
    // initThemeToggle(); // Removed call
    updateActiveNav();
    updateFooterYear();
    initAudioToggle();
    initHeroScroll();

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

    function initAudioToggle() {
        const audio = document.getElementById('ambient-audio');
        const btn = document.getElementById('audio-toggle');
        if (!audio || !btn) return;

        let enabled = localStorage.getItem('audioEnabled') === 'true';
        function updateBtn() {
            btn.textContent = enabled ? '🔊' : '🔈';
        }
        updateBtn();
        if (enabled) {
            audio.play().catch(() => { enabled = false; updateBtn(); });
        }
        btn.addEventListener('click', () => {
            enabled = !enabled;
            localStorage.setItem('audioEnabled', enabled);
            updateBtn();
            if (enabled) {
                audio.play();
            } else {
                audio.pause();
            }
        });
    }

    function initHeroScroll() {
        const hero = document.getElementById('home-content');
        if (!hero) return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.body.classList.remove('show-3d');
                } else {
                    document.body.classList.add('show-3d');
                }
            });
        }, { threshold: 0.1 });
        observer.observe(hero);
    }

    // Overlay handling
    let lastFocusedElement = null;
    function openOverlay(link) {
        const overlay = document.getElementById('content-overlay');
        const body = document.getElementById('overlay-body');
        if (!overlay || !body) return;
        overlay.classList.remove('hidden');
        document.body.classList.add('overlay-open');
        lastFocusedElement = document.activeElement;
        fetch(link).then(r => r.text()).then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const main = doc.querySelector('main') || doc.body;
            body.innerHTML = '';
            body.appendChild(main.cloneNode(true));
            trapFocus(overlay);
        });
    }

    function closeOverlay() {
        const overlay = document.getElementById('content-overlay');
        if (!overlay) return;
        overlay.classList.add('hidden');
        document.body.classList.remove('overlay-open');
        overlay.removeEventListener('keydown', handleTrap);
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    function trapFocus(modal) {
        const focusable = modal.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length -1];
        function handle(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            } else if (e.key === 'Escape') {
                closeOverlay();
            }
        }
        modal.addEventListener('keydown', handle);
        modal.focus();
        handleTrap = handle;
    }
    let handleTrap = null;
    const closeBtn = document.getElementById('overlay-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOverlay);
    }

    function webglAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function showFallback() {
        const fb = document.getElementById('fallback');
        if (fb) fb.classList.remove('hidden');
    }

    // --- Homepage Specific Scripts ---
    function initHomepageScripts() {
        console.log("Initializing homepage scripts...");
        initHomepageAnimations();
        initTyped();
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


    // ========================================================
    //             THREE.JS BACKGROUND SETUP
    // ========================================================
    function initThreeBackground() {
        const bodyId = document.body.id; // Get bodyId here for use within init
        if (typeof THREE === 'undefined') {
            console.error("Three.js library not loaded. Cannot initialize 3D background.");
            return;
        }
        console.log("Attempting to initialize Three.js background...");

        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            console.error("Canvas element #bg-canvas not found. Aborting Three.js setup.");
            return;
        }
        console.log("Canvas element found.");
        if (!webglAvailable()) {
            console.warn('WebGL not supported. Showing fallback.');
            canvas.style.display = 'none';
            showFallback();
            return;
        }

        // --- Core Components ---
        let scene, camera, renderer;
        let clock = new THREE.Clock();

        // --- Scene Objects ---
        let starFields = [];
        // let planets = {}; // Removed planets object
        let nebulaClouds = [];
        let dustParticles;
        // let planetLights = []; // Removed planet lights array
        let planetGroup;
        let markers = [];
        let domMarkers = [];

        // --- Interaction Variables ---
        let mouseX = 0, mouseY = 0;
        let targetRotX = 0, targetRotY = 0; // For smoother mouse tilt lerp
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        let scrollYPos = window.scrollY;
        const textureLoader = new THREE.TextureLoader();

        // --- Initialization ---
        function init() {
            try {
                console.log("Three.js: Initializing core components...");
                // Scene
                scene = new THREE.Scene();
                // Even less dense fog for the much deeper scene
                scene.fog = new THREE.FogExp2(0x000005, 0.0035); // Reduced fog density significantly
                console.log("Three.js: Scene created.");

                // Camera
                camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
                // Start camera much further back to view the distant system
                camera.position.z = 30; // Start significantly further back
                console.log("Three.js: Camera created.");

                // Renderer
                renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                // Optional: Tone mapping for HDR effect
                // renderer.toneMapping = THREE.ACESFilmicToneMapping;
                // renderer.toneMappingExposure = 1.0;
                console.log("Three.js: Renderer created.");

                // Lighting
                console.log("Three.js: Creating lighting...");
                createLighting();
                console.log("Three.js: Lighting created.");

                // Create Scene Elements
                console.log("Three.js: Creating starfields...");
                createStarfields(3);
                console.log(`Three.js: Starfields created (${starFields.length} layers).`);

                createPlanetWithMarkers();
                console.log("Three.js: Planet with markers created.");

                console.log("Three.js: Creating nebula...");
                createNebula(10); // Increased nebula layers
                console.log(`Three.js: Nebula created (${nebulaClouds.length} clouds).`);

                console.log("Three.js: Creating dust particles...");
                createDustParticles(800); // Increased dust count
                console.log("Three.js: Dust particles created.");

                // Add Listeners
                console.log("Three.js: Adding event listeners...");
                addEventListeners();
                console.log("Three.js: Event listeners added.");

                // Start Animation Loop
                console.log("Three.js: Starting animation loop...");
                animate();
                console.log("Three.js: Initialization complete.");

            } catch (error) {
                console.error("Error during Three.js initialization:", error);
                // Optionally hide canvas or show error message
                canvas.style.display = 'none';
            }
        }

        // --- Scene Element Creation Functions ---

        function createLighting() {
            const ambientLight = new THREE.AmbientLight(0x606080, 0.7); // Increased intensity and slightly brighter ambient
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Slightly stronger directional
            directionalLight.position.set(5, 15, 10); // Adjust position
            scene.add(directionalLight);

            // Removed planet-specific point lights
        }

        function createStarfields(numLayers) {
            const starCounts = [6000, 4000, 3000]; // Increased counts
            const starSizes = [0.12, 0.09, 0.06]; // Slightly adjusted sizes
            const starDistances = [150, 300, 500]; // Adjusted distances

            for (let j = 0; j < numLayers; j++) {
                const vertices = [];
                for (let i = 0; i < starCounts[j]; i++) {
                    const x = (Math.random() - 0.5) * starDistances[j] * 2;
                    const y = (Math.random() - 0.5) * starDistances[j] * 1.5; // Stretch vertically slightly
                    const z = (Math.random() - 0.5) * starDistances[j] * 2;
                    // Ensure stars are mostly further away, avoid sphere shape
                    if (Math.sqrt(x*x + y*y + z*z) < starDistances[j] * 0.2) continue;
                    vertices.push(x, y, z);
                }
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                const material = new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: starSizes[j],
                    sizeAttenuation: true,
                    transparent: true,
                    opacity: 0.6 + Math.random() * 0.3, // Vary opacity more
                    depthWrite: false
                });
                const stars = new THREE.Points(geometry, material);
                stars.rotation.x = Math.random() * Math.PI;
                stars.rotation.y = Math.random() * Math.PI;
                stars.userData.layer = j; // Store layer index for animation speed
                scene.add(stars);
                starFields.push(stars);
            }
            console.log(`Three.js: Added ${starFields.length} starfield layers.`);
        }

        function createPlanetWithMarkers() {
            const marsTexture = textureLoader.load('textures/mars.png');
            planetGroup = new THREE.Group();
            const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
            const planetMaterial = new THREE.MeshStandardMaterial({ map: marsTexture });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            planetGroup.add(planet);

            const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

            const sections = [
                { lat: 20, lon: 0, link: 'about.html', label: 'About' },
                { lat: -10, lon: 90, link: 'projects.html', label: 'Projects' },
                { lat: 10, lon: -90, link: 'philosophy.html', label: 'Philosophy' },
                { lat: -20, lon: 180, link: 'future.html', label: 'Future' }
            ];

            sections.forEach(s => {
                const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
                marker.position.copy(latLonToVector(5.2, s.lat, s.lon));
                marker.userData.link = s.link;
                planetGroup.add(marker);
                markers.push(marker);

                const btn = document.createElement('button');
                btn.className = 'marker-btn';
                btn.textContent = s.label;
                btn.setAttribute('data-link', s.link);
                btn.addEventListener('click', () => openOverlay(s.link));
                btn.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openOverlay(s.link);
                    }
                });
                document.body.appendChild(btn);
                domMarkers.push({ element: btn, mesh: marker });
            });

            scene.add(planetGroup);
        }

        function latLonToVector(radius, lat, lon) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            const x = -radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            return new THREE.Vector3(x, y, z);
        }

        function createNebula(numClouds) {
             // ** Using local texture(s) from 'textures/' folder **
            const nebulaTextures = [
                'textures/nebula.png' // Using the single file name provided by user
                // Add 'textures/nebula2.png' etc. if you have more
            ];
            for (let i = 0; i < numClouds; i++) {
                // Use the first texture if only one, otherwise random
                const textureUrl = nebulaTextures.length > 1 ? nebulaTextures[Math.floor(Math.random() * nebulaTextures.length)] : nebulaTextures[0];
                 if (!textureUrl) continue; // Skip if no textures defined

                const nebulaTexture = textureLoader.load(
                    textureUrl,
                    () => { console.log(`Texture loaded successfully: ${textureUrl}`); },
                    undefined,
                    (error) => { console.error(`Error loading texture: ${textureUrl}`, error); }
                );

                const nebulaMaterial = new THREE.MeshBasicMaterial({
                    map: nebulaTexture,
                    transparent: true,
                    opacity: 0.06 + Math.random() * 0.1, // Further reduced max opacity slightly
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.55, 0.8, 0.6) // HSL for blues/purples/pinks
                });
                const planeSize = 100 + Math.random() * 120; // Larger clouds
                const nebulaGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
                const nebulaCloud = new THREE.Mesh(nebulaGeometry, nebulaMaterial);

                nebulaCloud.position.set(
                    (Math.random() - 0.5) * 200, // Wider spread
                    (Math.random() - 0.5) * 100,
                    -50 - Math.random() * 100 // Further back range
                );
                nebulaCloud.rotation.z = Math.random() * Math.PI * 2;
                nebulaCloud.userData.rotationSpeed = (Math.random() - 0.5) * 0.0003; // Slower rotation
                scene.add(nebulaCloud);
                nebulaClouds.push(nebulaCloud);
            }
            console.log(`Three.js: Added ${nebulaClouds.length} nebula clouds.`);
        }

        function createDustParticles(count) {
            const vertices = [];
            for (let i = 0; i < count; i++) {
                const x = (Math.random() - 0.5) * 80; // Wider dust range
                const y = (Math.random() - 0.5) * 80;
                const z = (Math.random() - 0.5) * 80;
                vertices.push(x, y, z);
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const material = new THREE.PointsMaterial({
                color: 0xbbbbbb, // Slightly brighter dust
                size: 0.04,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.4,
                depthWrite: false
            });
            dustParticles = new THREE.Points(geometry, material);
            dustParticles.userData.rotationSpeed = 0.05; // Store rotation speed
            scene.add(dustParticles);
            console.log(`Three.js: Added dust particle system.`);
        }

        // --- Event Handlers ---
        function addEventListeners() {
            document.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('scroll', onScroll, false);
            window.addEventListener('resize', onWindowResize, false);
        }

        function onMouseMove(event) {
            // Normalize mouse position (-0.5 to 0.5)
            mouseX = (event.clientX - windowHalfX) / window.innerWidth;
            mouseY = (event.clientY - windowHalfY) / window.innerHeight;

            // Set target rotation based on mouse, scaled down
            targetRotX = -mouseY * 0.15; // Slightly increased tilt effect
            targetRotY = -mouseX * 0.15;
        }

        function onScroll() {
            scrollYPos = window.scrollY;
        }

        // Removed canvas click navigation in favor of DOM buttons

        function onWindowResize() {
            if (!camera || !renderer) return; // Check if components are initialized

            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            console.log("Three.js: Resized.");
        }

        // --- Animation Loop ---
        function animate() {
            // Ensure loop continues even if errors occur elsewhere
            requestAnimationFrame(animate);

            try {
                const delta = clock.getDelta();
                const elapsedTime = clock.getElapsedTime();

                // Starfield Parallax Rotation
                starFields.forEach((field) => {
                    const layerSpeedMultiplier = (field.userData.layer + 1) * 0.015; // Base speed adjusted by layer
                    field.rotation.y += delta * layerSpeedMultiplier;
                    field.rotation.x += delta * layerSpeedMultiplier * 0.5; // Less X rotation
                });

                // Removed planet animation logic


            // Nebula Cloud Drift
            nebulaClouds.forEach(cloud => {
                    if (cloud.userData.rotationSpeed) {
                        cloud.rotation.z += delta * cloud.userData.rotationSpeed;
                    }
                });

                // Dust Particle Movement
                if (dustParticles && dustParticles.userData.rotationSpeed) {
                    dustParticles.rotation.y += delta * dustParticles.userData.rotationSpeed;
                    dustParticles.rotation.x += delta * dustParticles.userData.rotationSpeed * 0.5;
                }

                if (planetGroup) {
                    planetGroup.rotation.y += delta * 0.2;
                }

                // Camera Z position based on scroll (Parallax effect)
                // Adjust multiplier and max Z based on new scene depth and starting Z
                const startZ = 30; // Match new initial camera Z
                const scrollMultiplier = 0.025; // Allow more movement with scroll
                const maxZ = 150; // Allow camera to move much further back to view distant orbits
                const targetZ = startZ + scrollYPos * scrollMultiplier;
                // Smoothly interpolate camera Z position (Lerp)
                camera.position.z += (Math.min(targetZ, maxZ) - camera.position.z) * 0.04; // Slower lerp

                // Subtle Camera Tilt based on Mouse (Lerp)
                camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05; // Smooth lerp towards target
                camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;

                // Update DOM marker positions
                domMarkers.forEach(obj => {
                    const vector = obj.mesh.position.clone();
                    vector.project(camera);
                    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
                    obj.element.style.left = `${x}px`;
                    obj.element.style.top = `${y}px`;
                });

                // Render the scene
                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }

            } catch (error) {
                console.error("Error in animation loop:", error);
                // Optionally stop the loop if errors are critical
                // cancelAnimationFrame(animate);
            }
        }

        // Execute Initialization
        init();
    }

}); // End DOMContentLoaded
