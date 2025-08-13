document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing enhanced space portfolio...");

    const bodyId = document.body.id;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // --- General Initializations (Run on every page) ---
    updateActiveNav();
    updateFooterYear();

    // Initialize 3D Background and Animations only if motion is preferred
    if (!motionQuery.matches) {
        console.log("Motion preference: OK. Initializing dynamic elements.");
        console.log(">>> Calling initThreeBackground...");
        initThreeBackground();
        initScrollTriggers();
    } else {
        console.log("Reduced motion preferred. Skipping 3D background and scroll animations.");
        const canvas = document.getElementById('bg-canvas');
        if (canvas) {
            canvas.style.display = 'none';
            console.log("Canvas explicitly hidden due to reduced motion preference.");
        }
    }

    // --- Page-Specific Initializations ---
    if (bodyId === 'home-page' && !motionQuery.matches) {
        initHomepageScripts();
    }

    // ========================================================
    //             INITIALIZATION FUNCTIONS
    // ========================================================

    function updateActiveNav() {
        const navLinks = document.querySelectorAll('#main-nav .nav-link');
        if (navLinks.length === 0) return;

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

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
        initInteractiveElements();
    }

    function initHomepageAnimations() {
        if (typeof gsap === 'undefined') {
            console.error("GSAP not loaded. Cannot initialize homepage animations.");
            return;
        }
        console.log("Initializing homepage GSAP animations.");

        const headline = document.getElementById('main-headline');
        const taglines = document.querySelectorAll('.tagline');
        const typedEl = document.getElementById('typed-intro');

        // Enhanced entrance animations
        if (headline) {
            gsap.fromTo(headline, 
                { opacity: 0, y: 50, scale: 0.8 },
                { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1, 
                    duration: 1.2, 
                    delay: 0.2,
                    ease: "power3.out"
                }
            );
        }

        if (taglines.length > 0) {
            gsap.fromTo(taglines, 
                { opacity: 0, y: 30, x: -20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    x: 0,
                    stagger: 0.3, 
                    duration: 0.8, 
                    delay: 0.6,
                    ease: "power2.out"
                }
            );
        }

        if (typedEl) {
            gsap.fromTo(typedEl, 
                { opacity: 0, scale: 0.9 },
                { 
                    opacity: 1, 
                    scale: 1,
                    duration: 0.5, 
                    delay: 1.0,
                    ease: "back.out(1.7)"
                }
            );
        }
    }

    function initTyped() {
        const typedElement = document.getElementById('typed-intro');
        if (typedElement && typeof Typed !== 'undefined') {
            console.log("Initializing enhanced Typed.js");
            typedElement.innerHTML = '';
            try {
                new Typed(typedElement, {
                    strings: [
                        'Exploring the cosmos through computational models 🚀',
                        'Building the future of aerospace propulsion systems ⚡',
                        'Bridging quantum physics, AI, and space engineering 🌌',
                        'Simulating orbital mechanics and gravitational dynamics 🪐',
                        'Developing algorithms for deep space navigation 🛸',
                        'Welcome to my journey through space and time ✨'
                    ],
                    typeSpeed: 40,
                    backSpeed: 25,
                    backDelay: 2000,
                    startDelay: 1200,
                    loop: true,
                    showCursor: true,
                    cursorChar: '|',
                    smartBackspace: true,
                    fadeOut: true,
                    fadeOutClass: 'typed-fade-out',
                    fadeOutDelay: 300
                });
            } catch (e) {
                console.error("Error initializing Typed.js:", e);
            }
        }
    }

    function initOrbitScroll() {
        const orbit = document.querySelector('#orbit-container .orbit');
        const mars = document.getElementById('mars');
        const rocket = document.getElementById('rocket');
        
        if (!orbit) return;

        let lastScrollY = 0;
        let ticking = false;

        function updateOrbit() {
            const scrollY = window.scrollY;
            const scrollDelta = scrollY - lastScrollY;
            
            // Enhanced orbital rotation with momentum
            const rotation = scrollY * 0.2;
            const marsRotation = scrollY * 0.05;
            
            if (orbit) {
                orbit.style.transform = `rotate(${rotation}deg)`;
            }
            
            // Mars self-rotation
            if (mars) {
                mars.style.transform = `rotate(${marsRotation}deg)`;
            }
            
            // Enhanced rocket animation
            if (rocket) {
                const rocketScale = 1 + Math.sin(scrollY * 0.01) * 0.1;
                const rocketTilt = Math.sin(scrollY * 0.02) * 5;
                rocket.style.transform = `translateX(-50%) scale(${rocketScale}) rotate(${rocketTilt}deg)`;
            }
            
            lastScrollY = scrollY;
            ticking = false;

            // Auto-scroll to top when reaching bottom
            if (scrollY + window.innerHeight >= document.body.scrollHeight - 10) {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 500);
            }
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateOrbit);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick);
    }

    function initInteractiveElements() {
        // Enhanced Mars hover effects
        const mars = document.getElementById('mars');
        const rocket = document.getElementById('rocket');
        const orbitContainer = document.getElementById('orbit-container');

        if (mars) {
            mars.addEventListener('mouseenter', () => {
                gsap.to(mars, {
                    scale: 1.1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            mars.addEventListener('mouseleave', () => {
                gsap.to(mars, {
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }

        if (rocket) {
            rocket.addEventListener('click', () => {
                // Rocket boost animation
                gsap.timeline()
                    .to(rocket, {
                        scale: 1.3,
                        duration: 0.2,
                        ease: "power2.out"
                    })
                    .to(rocket, {
                        scale: 1,
                        duration: 0.3,
                        ease: "bounce.out"
                    });
            });
        }

        // Parallax effect for orbit container
        if (orbitContainer) {
            window.addEventListener('mousemove', (e) => {
                const rect = orbitContainer.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                const moveX = x * 0.02;
                const moveY = y * 0.02;
                
                gsap.to(orbitContainer, {
                    x: moveX,
                    y: moveY,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });

            window.addEventListener('mouseleave', () => {
                gsap.to(orbitContainer, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        }
    }

    // --- ScrollTrigger Animations ---
    function initScrollTriggers() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error("GSAP or ScrollTrigger not loaded. Cannot initialize scroll animations.");
            return;
        }
        gsap.registerPlugin(ScrollTrigger);
        console.log("Initializing enhanced ScrollTrigger animations.");

        // Orbit section animation
        const orbitSection = document.getElementById('orbit-section');
        if (orbitSection) {
            gsap.fromTo(orbitSection,
                { opacity: 0, scale: 0.8, rotationY: 45 },
                {
                    opacity: 1,
                    scale: 1,
                    rotationY: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: orbitSection,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // General sections animation
        const sections = gsap.utils.toArray('section:not(#home-content)');
        sections.forEach((section, index) => {
            if (section && section.children.length > 0 && section.id !== 'orbit-section') {
                gsap.fromTo(section,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: section,
                            start: "top 85%",
                            end: "bottom 20%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }
        });
    }

    // ========================================================
    //             ENHANCED THREE.JS BACKGROUND SETUP
    // ========================================================
    function initThreeBackground() {
        if (typeof THREE === 'undefined') {
            console.error("Three.js library not loaded. Cannot initialize 3D background.");
            return;
        }
        console.log("Initializing enhanced Three.js background with 3D Mars...");

        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            console.error("Canvas element #bg-canvas not found.");
            return;
        }

        // --- Core Components ---
        let scene, camera, renderer;
        let clock = new THREE.Clock();

        // --- Scene Objects ---
        let starFields = [];
        let mars3D, marsSystem;
        let moons = [];
        let nebulaClouds = [];
        let dustParticles;
        let asteroidBelt = [];
        let spaceDebris = [];

        // --- Interaction Variables ---
        let mouseX = 0, mouseY = 0;
        let targetRotX = 0, targetRotY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;
        let scrollYPos = window.scrollY;
        const textureLoader = new THREE.TextureLoader();

        // --- Enhanced Initialization ---
        function init() {
            try {
                console.log("Three.js: Initializing enhanced components...");
                
                // Scene with enhanced atmosphere
                scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2(0x000008, 0.003);

                // Camera with dynamic FOV
                camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 3000);
                camera.position.set(0, 0, 50);

                // Enhanced Renderer
                renderer = new THREE.WebGLRenderer({ 
                    canvas: canvas, 
                    antialias: true, 
                    alpha: true,
                    powerPreference: "high-performance"
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;

                // Enhanced Lighting System
                createEnhancedLighting();

                // Create Enhanced Scene Elements
                createAdvancedStarfields(4);
                create3DMars();
                createMarsSystem();
                createEnhancedNebula(15);
                createAdvancedDustParticles(1200);
                createAsteroidBelt(200);
                createSpaceDebris(150);

                // Add Enhanced Interactions
                addEnhancedEventListeners();

                // Start Enhanced Animation
                animate();
                
                console.log("Three.js: Enhanced initialization complete.");

            } catch (error) {
                console.error("Error during enhanced Three.js initialization:", error);
                canvas.style.display = 'none';
            }
        }

        // --- Enhanced Lighting System ---
        function createEnhancedLighting() {
            // Ambient light with color variation
            const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
            scene.add(ambientLight);

            // Main sun light
            const sunLight = new THREE.DirectionalLight(0xffa500, 1.2);
            sunLight.position.set(100, 50, 50);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            scene.add(sunLight);

            // Mars atmospheric light
            const marsLight = new THREE.PointLight(0xff4500, 0.8, 100);
            marsLight.position.set(0, 0, 0);
            scene.add(marsLight);

            // Distant star light
            const starLight = new THREE.DirectionalLight(0x6495ed, 0.3);
            starLight.position.set(-50, -30, -80);
            scene.add(starLight);
        }

        // --- Advanced Starfield Creation ---
        function createAdvancedStarfields(numLayers) {
            const starConfigs = [
                { count: 8000, size: 0.15, distance: 200, opacity: 0.8, color: 0xffffff },
                { count: 6000, size: 0.12, distance: 400, opacity: 0.6, color: 0x87ceeb },
                { count: 4000, size: 0.08, distance: 600, opacity: 0.4, color: 0xdda0dd },
                { count: 2000, size: 0.05, distance: 800, opacity: 0.3, color: 0xffd700 }
            ];

            for (let j = 0; j < numLayers; j++) {
                const config = starConfigs[j];
                const vertices = [];
                const colors = [];
                const sizes = [];

                for (let i = 0; i < config.count; i++) {
                    // Spherical distribution
                    const radius = config.distance + Math.random() * config.distance * 0.5;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);

                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.sin(phi) * Math.sin(theta);
                    const z = radius * Math.cos(phi);

                    vertices.push(x, y, z);

                    // Varied colors
                    const color = new THREE.Color(config.color);
                    color.offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2 - 0.1);
                    colors.push(color.r, color.g, color.b);

                    // Varied sizes
                    sizes.push(config.size * (0.5 + Math.random() * 1.5));
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 }
                    },
                    vertexShader: `
                        attribute float size;
                        attribute vec3 color;
                        varying vec3 vColor;
                        uniform float time;
                        
                        void main() {
                            vColor = color;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            
                            float twinkle = sin(time * 2.0 + position.x * 0.01) * 0.5 + 0.5;
                            gl_PointSize = size * (1.0 + twinkle * 0.3) * (300.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `,
                    fragmentShader: `
                        varying vec3 vColor;
                        
                        void main() {
                            float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                            if (r > 0.5) discard;
                            
                            float alpha = 1.0 - smoothstep(0.0, 0.5, r);
                            gl_FragColor = vec4(vColor, alpha);
                        }
                    `,
                    transparent: true,
                    vertexColors: true,
                    depthWrite: false
                });

                const stars = new THREE.Points(geometry, material);
                stars.userData.layer = j;
                stars.userData.material = material;
                scene.add(stars);
                starFields.push(stars);
            }
        }

        // --- 3D Mars Creation ---
        function create3DMars() {
            // Mars geometry
            const marsGeometry = new THREE.SphereGeometry(8, 64, 32);

            // Enhanced Mars material with multiple textures
            const marsMaterial = new THREE.MeshPhongMaterial({
                color: 0xff4500,
                shininess: 10,
                transparent: true,
                opacity: 0.95
            });

            // Load Mars texture if available
            textureLoader.load(
                'textures/mars.png',
                (texture) => {
                    marsMaterial.map = texture;
                    marsMaterial.needsUpdate = true;
                    console.log("Mars texture loaded successfully");
                },
                undefined,
                (error) => {
                    console.log("Mars texture not found, using procedural material");
                }
            );

            mars3D = new THREE.Mesh(marsGeometry, marsMaterial);
            mars3D.position.set(-30, 10, -50);
            mars3D.castShadow = true;
            mars3D.receiveShadow = true;

            // Mars atmosphere
            const atmosphereGeometry = new THREE.SphereGeometry(8.5, 32, 16);
            const atmosphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6347,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            mars3D.add(atmosphere);

            scene.add(mars3D);
        }

        // --- Mars System (Moons, Rings, etc.) ---
        function createMarsSystem() {
            marsSystem = new THREE.Group();

            // Create Phobos and Deimos
            const moonData = [
                { name: 'Phobos', distance: 12, size: 0.3, speed: 0.02, color: 0x8b7355 },
                { name: 'Deimos', distance: 18, size: 0.2, speed: 0.01, color: 0x696969 }
            ];

            moonData.forEach(data => {
                const moonGeometry = new THREE.SphereGeometry(data.size, 16, 8);
                const moonMaterial = new THREE.MeshPhongMaterial({
                    color: data.color,
                    shininess: 5
                });
                const moon = new THREE.Mesh(moonGeometry, moonMaterial);
                
                moon.position.x = data.distance;
                moon.userData = {
                    distance: data.distance,
                    speed: data.speed,
                    angle: Math.random() * Math.PI * 2
                };
                
                marsSystem.add(moon);
                moons.push(moon);
            });

            marsSystem.position.copy(mars3D.position);
            scene.add(marsSystem);
        }

        // --- Enhanced Nebula ---
        function createEnhancedNebula(numClouds) {
            for (let i = 0; i < numClouds; i++) {
                const nebulaGeometry = new THREE.PlaneGeometry(
                    80 + Math.random() * 120,
                    60 + Math.random() * 80
                );

                const nebulaMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        opacity: { value: 0.03 + Math.random() * 0.05 },
                        color: { value: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.8, 0.6) }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform float time;
                        uniform float opacity;
                        uniform vec3 color;
                        varying vec2 vUv;
                        
                        float noise(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                        }
                        
                        void main() {
                            vec2 pos = vUv * 3.0 + time * 0.1;
                            float n = noise(pos) * noise(pos * 2.0) * noise(pos * 4.0);
                            
                            float alpha = n * opacity * (1.0 - length(vUv - 0.5) * 2.0);
                            gl_FragColor = vec4(color, alpha);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const nebulaCloud = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
                nebulaCloud.position.set(
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 200,
                    -100 - Math.random() * 200
                );
                nebulaCloud.rotation.z = Math.random() * Math.PI * 2;
                nebulaCloud.userData.material = nebulaMaterial;
                nebulaCloud.userData.rotationSpeed = (Math.random() - 0.5) * 0.0002;

                scene.add(nebulaCloud);
                nebulaClouds.push(nebulaCloud);
            }
        }

        // --- Advanced Dust Particles ---
        function createAdvancedDustParticles(count) {
            const vertices = [];
            const colors = [];
            const sizes = [];

            for (let i = 0; i < count; i++) {
                vertices.push(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150
                );

                const color = new THREE.Color();
                color.setHSL(Math.random() * 0.1 + 0.55, 0.5, 0.8);
                colors.push(color.r, color.g, color.b);

                sizes.push(Math.random() * 0.1 + 0.02);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                size: 0.05,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.6,
                vertexColors: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            dustParticles = new THREE.Points(geometry, material);
            scene.add(dustParticles);
        }

        // --- Asteroid Belt ---
        function createAsteroidBelt(count) {
            for (let i = 0; i < count; i++) {
                const size = Math.random() * 0.5 + 0.2;
                const geometry = new THREE.DodecahedronGeometry(size, 0);
                const material = new THREE.MeshPhongMaterial({
                    color: 0x8b7355,
                    shininess: 5
                });

                const asteroid = new THREE.Mesh(geometry, material);
                
                // Position in belt around Mars
                const angle = Math.random() * Math.PI * 2;
                const distance = 25 + Math.random() * 15;
                const height = (Math.random() - 0.5) * 5;
                
                asteroid.position.set(
                    mars3D.position.x + Math.cos(angle) * distance,
                    mars3D.position.y + height,
                    mars3D.position.z + Math.sin(angle) * distance
                );

                asteroid.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );

                asteroid.userData = {
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02,
                        z: (Math.random() - 0.5) * 0.02
                    },
                    orbitSpeed: Math.random() * 0.005 + 0.001,
                    orbitRadius: distance,
                    orbitAngle: angle
                };

                scene.add(asteroid);
                asteroidBelt.push(asteroid);
            }
        }

        // --- Space Debris ---
        function createSpaceDebris(count) {
            for (let i = 0; i < count; i++) {
                const geometries = [
                    new THREE.BoxGeometry(0.1, 0.1, 0.4),
                    new THREE.CylinderGeometry(0.05, 0.05, 0.3),
                    new THREE.TetrahedronGeometry(0.1)
                ];

                const geometry = geometries[Math.floor(Math.random() * geometries.length)];
                const material = new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0x666666 : 0x444444,
                    transparent: true,
                    opacity: 0.7
                });

                const debris = new THREE.Mesh(geometry, material);
                debris.position.set(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 200
                );

                debris.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );

                debris.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                );

                debris.userData.rotationSpeed = {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.05,
                    z: (Math.random() - 0.5) * 0.05
                };

                scene.add(debris);
                spaceDebris.push(debris);
            }
        }

        // --- Enhanced Event Handlers ---
        function addEnhancedEventListeners() {
            document.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('scroll', onScroll, false);
            window.addEventListener('resize', onWindowResize, false);
            
            // Keyboard controls
            document.addEventListener('keydown', onKeyDown, false);
        }

        function onMouseMove(event) {
            mouseX = (event.clientX - windowHalfX) / window.innerWidth;
            mouseY = (event.clientY - windowHalfY) / window.innerHeight;

            targetRotX = -mouseY * 0.2;
            targetRotY = -mouseX * 0.2;
        }

        function onScroll() {
            scrollYPos = window.scrollY;
        }

        function onKeyDown(event) {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    // Boost effect for rocket or camera
                    gsap.to(camera.position, {
                        z: camera.position.z - 10,
                        duration: 0.5,
                        ease: "power2.out",
                        yoyo: true,
                        repeat: 1
                    });
                    break;
                case 'KeyR':
                    // Reset camera position
                    gsap.to(camera.position, {
                        x: 0,
                        y: 0,
                        z: 50,
                        duration: 1,
                        ease: "power2.inOut"
                    });
                    gsap.to(camera.rotation, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 1,
                        ease: "power2.inOut"
                    });
                    break;
            }
        }

        function onWindowResize() {
            if (!camera || !renderer) return;

            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        // --- Enhanced Animation Loop ---
        function animate() {
            requestAnimationFrame(animate);

            try {
                const delta = clock.getDelta();
                const elapsedTime = clock.getElapsedTime();

                // Update shader uniforms for twinkling stars
                starFields.forEach(field => {
                    if (field.userData.material && field.userData.material.uniforms) {
                        field.userData.material.uniforms.time.value = elapsedTime;
                    }
                    
                    // Slow rotation based on layer
                    const layerSpeed = (field.userData.layer + 1) * 0.01;
                    field.rotation.y += delta * layerSpeed;
                    field.rotation.x += delta * layerSpeed * 0.3;
                });

                // Animate 3D Mars
                if (mars3D) {
                    // Mars self-rotation
                    mars3D.rotation.y += delta * 0.1;
                    
                    // Subtle floating motion
                    mars3D.position.y += Math.sin(elapsedTime * 0.5) * 0.02;
                    
                    // Scale pulsing based on scroll
                    const scaleVariation = 1 + Math.sin(elapsedTime * 0.3) * 0.05;
                    mars3D.scale.setScalar(scaleVariation);
                }

                // Animate Mars moons
                moons.forEach(moon => {
                    moon.userData.angle += delta * moon.userData.speed;
                    moon.position.x = Math.cos(moon.userData.angle) * moon.userData.distance;
                    moon.position.z = Math.sin(moon.userData.angle) * moon.userData.distance;
                    moon.rotation.y += delta * 0.5;
                });

                // Animate nebula clouds
                nebulaClouds.forEach(cloud => {
                    if (cloud.userData.material && cloud.userData.material.uniforms) {
                        cloud.userData.material.uniforms.time.value = elapsedTime;
                    }
                    if (cloud.userData.rotationSpeed) {
                        cloud.rotation.z += delta * cloud.userData.rotationSpeed;
                    }
                });

                // Animate dust particles
                if (dustParticles) {
                    dustParticles.rotation.y += delta * 0.02;
                    dustParticles.rotation.x += delta * 0.01;
                    
                    // Gentle floating motion
                    const positions = dustParticles.geometry.attributes.position.array;
                    for (let i = 1; i < positions.length; i += 3) {
                        positions[i] += Math.sin(elapsedTime + i) * 0.001;
                    }
                    dustParticles.geometry.attributes.position.needsUpdate = true;
                }

                // Animate asteroid belt
                asteroidBelt.forEach(asteroid => {
                    // Self rotation
                    asteroid.rotation.x += delta * asteroid.userData.rotationSpeed.x;
                    asteroid.rotation.y += delta * asteroid.userData.rotationSpeed.y;
                    asteroid.rotation.z += delta * asteroid.userData.rotationSpeed.z;
                    
                    // Orbital motion around Mars
                    asteroid.userData.orbitAngle += delta * asteroid.userData.orbitSpeed;
                    const x = mars3D.position.x + Math.cos(asteroid.userData.orbitAngle) * asteroid.userData.orbitRadius;
                    const z = mars3D.position.z + Math.sin(asteroid.userData.orbitAngle) * asteroid.userData.orbitRadius;
                    asteroid.position.x = x;
                    asteroid.position.z = z;
                });

                // Animate space debris
                spaceDebris.forEach(debris => {
                    // Movement
                    debris.position.add(debris.userData.velocity);
                    
                    // Rotation
                    debris.rotation.x += delta * debris.userData.rotationSpeed.x;
                    debris.rotation.y += delta * debris.userData.rotationSpeed.y;
                    debris.rotation.z += delta * debris.userData.rotationSpeed.z;
                    
                    // Boundary wrapping
                    if (Math.abs(debris.position.x) > 100) debris.userData.velocity.x *= -1;
                    if (Math.abs(debris.position.y) > 50) debris.userData.velocity.y *= -1;
                    if (Math.abs(debris.position.z) > 100) debris.userData.velocity.z *= -1;
                });

                // Enhanced camera movement based on scroll and mouse
                const scrollInfluence = scrollYPos * 0.03;
                const maxCameraZ = 150;
                const minCameraZ = 20;
                
                const targetCameraZ = Math.min(Math.max(50 + scrollInfluence, minCameraZ), maxCameraZ);
                camera.position.z += (targetCameraZ - camera.position.z) * 0.03;

                // Mouse influence on camera
                camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;
                camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;

                // Dynamic FOV based on speed
                const speed = Math.abs(camera.position.z - targetCameraZ);
                const targetFOV = 65 + speed * 2;
                camera.fov += (targetFOV - camera.fov) * 0.1;
                camera.updateProjectionMatrix();

                // Camera shake effect during rapid scrolling
                if (speed > 1) {
                    camera.position.x += (Math.random() - 0.5) * 0.1;
                    camera.position.y += (Math.random() - 0.5) * 0.1;
                } else {
                    camera.position.x *= 0.9;
                    camera.position.y *= 0.9;
                }

                // Auto-rotation around Mars when stationary
                if (Math.abs(mouseX) < 0.01 && Math.abs(mouseY) < 0.01) {
                    camera.position.x += Math.sin(elapsedTime * 0.1) * 0.1;
                    camera.lookAt(mars3D.position);
                }

                // Render with enhanced effects
                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }

            } catch (error) {
                console.error("Error in enhanced animation loop:", error);
            }
        }

        // Initialize enhanced scene
        init();
    }

    // ========================================================
    //             PERFORMANCE MONITORING & OPTIMIZATION
    // ========================================================
    
    // Performance monitoring
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    function monitorPerformance() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
            
            // Adjust quality based on performance
            if (fps < 30) {
                console.log("Low FPS detected, reducing quality...");
                // Reduce particle counts or disable some effects
                optimizeForLowPerformance();
            }
        }
        
        requestAnimationFrame(monitorPerformance);
    }

    function optimizeForLowPerformance() {
        const canvas = document.getElementById('bg-canvas');
        if (canvas && canvas.getContext) {
            const renderer = canvas.renderer;
            if (renderer) {
                renderer.setPixelRatio(1); // Reduce pixel ratio
                console.log("Performance optimized: Reduced pixel ratio");
            }
        }
    }

    // Start performance monitoring
    if (!motionQuery.matches) {
        monitorPerformance();
    }

    // ========================================================
    //             ADDITIONAL INTERACTIVE FEATURES
    // ========================================================
    
    // Konami code easter egg
    let konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑ ↑ ↓ ↓ ← → ← → B A
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.keyCode === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function triggerEasterEgg() {
        console.log("🚀 EASTER EGG ACTIVATED! 🚀");
        
        // Create spectacular visual effect
        if (typeof gsap !== 'undefined') {
            const body = document.body;
            
            // Rainbow background animation
            gsap.timeline()
                .to(body, {
                    background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
                    duration: 0.5
                })
                .to(body, {
                    background: 'var(--bg-primary)',
                    duration: 2,
                    delay: 1
                });

            // Confetti-like particle explosion
            createConfettiExplosion();
        }

        // Play space sound if available
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhJEew+6mbSRsIRZnZ0YpAH'); // Simple beep sound
            audio.play().catch(() => {}); // Ignore errors if audio fails
        } catch (e) {
            console.log("Audio easter egg failed");
        }
    }

    function createConfettiExplosion() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        const particles = [];

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.zIndex = '9999';
            particle.style.pointerEvents = 'none';
            particle.style.left = '50%';
            particle.style.top = '50%';
            
            document.body.appendChild(particle);
            particles.push(particle);

            if (typeof gsap !== 'undefined') {
                gsap.to(particle, {
                    x: (Math.random() - 0.5) * window.innerWidth,
                    y: (Math.random() - 0.5) * window.innerHeight,
                    rotation: Math.random() * 360,
                    opacity: 0,
                    duration: 2 + Math.random() * 2,
                    ease: "power2.out",
                    onComplete: () => {
                        particle.remove();
                    }
                });
            }
        }
    }

    // ========================================================
    //             ACCESSIBILITY ENHANCEMENTS
    // ========================================================
    
    // High contrast mode toggle
    function toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const isHighContrast = document.body.classList.contains('high-contrast');
        localStorage.setItem('highContrast', isHighContrast);
        console.log('High contrast mode:', isHighContrast ? 'enabled' : 'disabled');
    }

    // Load accessibility preferences
    function loadAccessibilityPreferences() {
        const highContrast = localStorage.getItem('highContrast') === 'true';
        if (highContrast) {
            document.body.classList.add('high-contrast');
        }

        const reducedMotion = localStorage.getItem('reducedMotion') === 'true';
        if (reducedMotion) {
            document.body.classList.add('reduced-motion');
        }
    }

    // Initialize accessibility features
    loadAccessibilityPreferences();

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
        
        // Accessibility shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    toggleHighContrast();
                    break;
                case 'm':
                    e.preventDefault();
                    document.body.classList.toggle('reduced-motion');
                    localStorage.setItem('reducedMotion', document.body.classList.contains('reduced-motion'));
                    break;
            }
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
    });

    console.log("Enhanced Space Portfolio initialization complete! 🚀");
    console.log("Controls:");
    console.log("- Space: Camera boost");
    console.log("- R: Reset camera");
    console.log("- Ctrl+H: Toggle high contrast");
    console.log("- Ctrl+M: Toggle reduced motion");
    console.log("- Try the Konami code for a surprise! ↑↑↓↓←→←→BA");

}); // End DOMContentLoaded
