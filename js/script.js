document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu';
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.textContent = open ? 'Menu' : 'Close';
    navigation?.classList.toggle('is-open', !open);
    document.body.classList.toggle('menu-open', !open);
  });

  navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const filterButtons = document.querySelectorAll('[data-filter]');
  const noteRows = document.querySelectorAll('.note-row[data-category]');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyNoteFilter(button.dataset.filter));
  });

  function applyNoteFilter(filter) {
    filterButtons.forEach((candidate) => {
      const active = candidate.dataset.filter === filter;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    noteRows.forEach((row) => {
      row.hidden = filter !== 'all' && row.dataset.category !== filter;
    });
  }

  function openLinkedNote() {
    const row = document.getElementById(window.location.hash.slice(1));
    if (!row?.matches('.note-row[data-category]')) return;
    if (row.hidden) applyNoteFilter('all');
    const details = row.querySelector('details');
    if (details) details.open = true;
  }

  if (noteRows.length) {
    openLinkedNote();
    window.addEventListener('hashchange', openLinkedNote);
  }

  const solverDetails = document.querySelector('#solver-notes');
  if (solverDetails) {
    function openSolverFromHash() {
      if (window.location.hash === '#solver-notes') solverDetails.open = true;
    }
    openSolverFromHash();
    window.addEventListener('hashchange', openSolverFromHash);
    document.querySelectorAll('[data-open-solver]').forEach((link) => {
      link.addEventListener('click', () => { solverDetails.open = true; });
    });
    const recording = solverDetails.querySelector('video');
    solverDetails.addEventListener('toggle', () => {
      if (!solverDetails.open && !recording.paused) recording.pause();
    });
  }

  const spacecraft = document.querySelector('[data-spacecraft]');
  if (spacecraft) activateSpacecraftControls(spacecraft);

  const printButton = document.querySelector('[data-print-resume]');
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener('click', () => window.print());
  }
});


function activateSpacecraftControls(container) {
  const artwork = container.querySelector('.hero-art');
  const canvas = container.querySelector('canvas');
  const toggle = container.querySelector('[data-spacecraft-toggle]');
  const controls = container.querySelector('[data-spacecraft-controls]');
  const spin = container.querySelector('[data-spacecraft-spin]');
  const status = container.querySelector('[data-spacecraft-status]');
  let viewer;

  toggle.hidden = false;
  toggle.addEventListener('click', async () => {
    status.textContent = '';
    if (viewer) {
      viewer.destroy();
      viewer = undefined;
      canvas.hidden = true;
      artwork.hidden = false;
      controls.hidden = true;
      toggle.textContent = 'Explore 3D';
      toggle.setAttribute('aria-expanded', 'false');
      return;
    }

    toggle.disabled = true;
    toggle.textContent = 'Loading 3D…';
    try {
      const { mountSpacecraft } = await import('./spacecraft.js');
      canvas.hidden = false;
      viewer = mountSpacecraft(canvas, (spinning) => {
        spin.textContent = spinning ? 'Pause rotation' : 'Start rotation';
      });
      artwork.hidden = true;
      controls.hidden = false;
      toggle.textContent = 'Show illustration';
      toggle.setAttribute('aria-expanded', 'true');
      status.textContent = '';
    } catch {
      canvas.hidden = true;
      toggle.textContent = 'Explore 3D';
      status.textContent = 'The 3D view is unavailable.';
    } finally {
      toggle.disabled = false;
    }
  });
  spin.addEventListener('click', () => viewer?.toggleSpin());
  container.querySelectorAll('[data-spacecraft-turn]').forEach((button) => {
    button.addEventListener('click', () => viewer?.turn(Number(button.dataset.spacecraftTurn)));
  });
}
