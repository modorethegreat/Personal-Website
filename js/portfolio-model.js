import { createLattice, poseLattice, rodStrain, stepLattice } from './portfolio-lattice.js';

const vertices = [
  { position: [0, 1, 0], color: '#91cff2' },
  { position: [0,-1, 0], color: '#bcaaf4' },
  { position: [-1,0, 0], color: '#80d8d5' },
  { position: [1, 0, 0], color: '#ffae82' },
  { position: [0, 0, 1], color: '#9bb9ff' },
  { position: [0, 0,-1], color: '#e8a7d5' },
];

const homeFaces = [
  {
    corners: [0, 2, 4], color: '#95cdff', title: 'From solver to test',
    description: 'I’m interested in workflows that put solver assumptions and test data close enough together to investigate where predictions diverge from measurements.',
  },
  {
    corners: [0, 2, 5], color: '#78c8db', title: 'Learning from physical data',
    description: 'Numerical simulations and thermal-vacuum telemetry offer different ways to observe a system. I’m interested in what learned models can recover when observations are sparse.',
  },
  {
    corners: [0, 3, 4], color: '#f3ab90', title: 'From CAD to CFD',
    description: 'Automating repeatable case setup made it easier to change geometry and compare simulation runs in my propulsion work.',
  },
  {
    corners: [0, 3, 5], color: '#d6a2df', title: 'Checking the assumptions',
    description: 'Conservation checks, static-fire measurements, and held-out experiments each give me a way to ask where a prediction holds up.',
  },
  {
    corners: [1, 2, 4], color: '#9f9af5', title: 'Finding the important signal',
    description: 'Synchronized gripper replays and thermal-vacuum dashboards both help trace an outcome back to the moment a measurement started to change.',
  },
  {
    corners: [1, 2, 5], color: '#bcbaf5', title: 'Working with uncertainty',
    description: 'Grip friction, sensor readings, and wildfire inputs all raise a similar question for me. Which uncertainties change the decision, and which can I measure?',
  },
  {
    corners: [1, 3, 4], color: '#dea790', title: 'Designing for the next test',
    description: 'A good design tool should make it easy to change a jaw or a propulsion component, rerun the analysis, and explain what to test next.',
  },
  {
    corners: [1, 3, 5], color: '#b290ec', title: 'When results generalize',
    description: 'A grasp, a propulsion prediction, and a wildfire model can each look good under one set of conditions. I want to know which results carry over when those conditions change.',
  },
].map(face => ({
  ...face,
  // Each corner supplies the sign of one axis of the outward face normal.
  outward: [0, 1, 2].map(axis => face.corners.reduce((sum, vertex) => sum + vertices[vertex].position[axis], 0)),
}));

// Same geometry, with the role order from the Experience page's controls.
const experienceFaces = [
  ['Testing and measurement', 'Static-fire measurements, thermal-vacuum telemetry, and formulation assays all connect an engineering question to something you can measure.'],
  ['Tracking change over time', 'Static-fire data, thermal cycling, and wildfire spread each show how a system evolves. The timing of a change can help explain what happened.'],
  ['Checking predictions', 'I compared propulsion predictions with static-fire measurements, checked solid-mechanics Jacobians against finite differences, and tested formulation predictions against lab data.'],
  ['Putting physics into models', 'Propulsion CFD, nonlinear material models, and physics-informed wildfire prediction each depend on deciding which physical relationships the model should represent.'],
  ['Tools for reviewing results', 'I built interfaces for inspecting solver results and monitoring thermal-vacuum tests, and automated assay processing to make lab results easier to review.'],
  ['Making results inspectable', 'Recorded solver inputs, telemetry dashboards, and a held-out wildfire comparison each give someone a concrete place to start when investigating a result.'],
  ['Repeatable workflows', 'I recorded inputs and outputs for solver jobs, contributed reproducible solid-mechanics examples, and automated recurring assay data processing.'],
  ['Scientific software', 'Browser-based solver workflows, generated C++ material kernels, and a wildfire model in JAX put computational methods to work at three different scales.'],
].map(([title, description], index) => ({ ...homeFaces[index], title, description }));

const home = { yaw: -.54, pitch: .34 };

function svgNode(tag, attributes = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [attribute, value] of Object.entries(attributes)) node.setAttribute(attribute, value);
  return node;
}

function rotate([x, y, z], {yaw, pitch}) {
  const a = x * Math.cos(yaw) + z * Math.sin(yaw);
  const b = z * Math.cos(yaw) - x * Math.sin(yaw);
  return [a, y * Math.cos(pitch) - b * Math.sin(pitch), y * Math.sin(pitch) + b * Math.cos(pitch)];
}

function project({x, y, z}) {
  const scale = 790 / (4.5 - z);
  return [260 + x * scale, 216 - y * scale];
}

function pointString(point) {
  return point.map(value => value.toFixed(2)).join(',');
}

function visibleTriangles(surface, projected) {
  return surface.triangles.filter(([a, b, c]) => {
    const [x, y] = projected[a];
    const [bx, by] = projected[b];
    const [cx, cy] = projected[c];
    return ((bx - x) * (cy - y) - (by - y) * (cx - x)) * surface.winding > .001;
  });
}

function strandPaths(surface, paths, lattice, showStrain) {
  const lines = { normal: '', tension: '', compression: '' };
  for (const { ids, rods } of surface.strands) {
    if (!showStrain) {
      lines.normal += 'M' + ids.map(id => paths[id]).join('L');
      continue;
    }
    let previousKind;
    for (let i = 0; i < rods.length; i++) {
      const strain = rodStrain(lattice, rods[i]);
      const kind = strain > .045 ? 'tension' : strain < -.045 ? 'compression' : 'normal';
      if (kind !== previousKind) lines[kind] += 'M' + paths[ids[i]];
      lines[kind] += 'L' + paths[ids[i + 1]];
      previousKind = kind;
    }
  }
  return lines;
}

function refinedMesh(triangles, projected, focus) {
  const midpoint = (first, second) => first.map((value, axis) => (value + second[axis]) / 2);
  let lines = '';
  for (const [first, second, third] of triangles) {
    const a = projected[first];
    const b = projected[second];
    const c = projected[third];
    const x = (a[0] + b[0] + c[0]) / 3;
    const y = (a[1] + b[1] + c[1]) / 3;
    if ((x - focus[0]) ** 2 + (y - focus[1]) ** 2 > 46 ** 2) continue;
    lines += 'M' + pointString(midpoint(a, b)) + 'L' + pointString(midpoint(b, c)) +
      'L' + pointString(midpoint(c, a)) + 'Z';
  }
  return lines;
}

function mountPortfolio(root, faces) {
  const view = root.querySelector('[data-model-view]');
  const controls = root.querySelector('[data-model-controls]');
  const stage = root.querySelector('.portfolio-model-stage');
  const svg = root.querySelector('[data-model-svg]');
  const probe = root.querySelector('[data-model-probe]');
  const dragHint = root.querySelector('[data-model-drag-hint]');
  const faceLayer = root.querySelector('[data-model-faces]');
  const pointLayer = root.querySelector('[data-model-points]');
  const picker = root.querySelector('[data-model-face-select]');
  const faceCard = root.querySelector('[data-model-face-card]');
  const faceTitle = faceCard.querySelector('[data-model-face-title]');
  const faceDescription = faceCard.querySelector('[data-model-face-description]');
  const faceLinks = faceCard.querySelector('[data-model-face-links]');
  const status = root.querySelector('[data-model-status]');
  const topicButtons = [...controls.querySelectorAll('[data-model-vertex]')];
  const modeButtons = [...root.querySelectorAll('[data-model-mode]')];
  const ids = topicButtons.map(button => button.dataset.modelVertex);
  const labels = topicButtons.map(button => button.textContent);
  const cards = [...root.querySelectorAll('[data-model-topic]')];
  const roleCard = root.querySelector('[data-model-role-card]');
  const roleLink = roleCard?.querySelector('[data-model-role-link]');
  const roles = roleCard ? ids.map(id => document.getElementById(id)) : [];
  if (ids.length !== vertices.length || roles.some(role => !role)) return;
  const hasTouchGestures = 'ontouchstart' in window;
  let orientation = {...home};
  const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const lattice = createLattice(vertices, faces, compact || roleCard ? 18 : 24);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let posedOrientation;
  let projected;
  let load;
  let release;
  let hover;
  let settling = false;
  let lastStep = 0;
  let timeDebt = 0;
  let mode = 'pull';
  let choice = { vertex: 0 };
  let gesture;
  let faceOrder = '';
  let pointOrder = '';
  let frame;

  const faceNodes = faces.map(({title: label, color}, index) => {
    const group = svgNode('g', { 'data-face': index, style: `--facet:${color}` });
    const fill = svgNode('path', { class: 'portfolio-face-fill' });
    const outline = svgNode('path', { class: 'portfolio-face-outline' });
    const grid = svgNode('path', { class: 'portfolio-face-grid' });
    const detail = svgNode('path', { class: 'portfolio-face-grid portfolio-grid-detail' });
    const tension = svgNode('path', { class: 'portfolio-face-grid portfolio-grid-tension' });
    const compression = svgNode('path', { class: 'portfolio-face-grid portfolio-grid-compression' });
    const title = svgNode('title');
    title.textContent = label;
    group.append(title, fill, outline, grid, detail, tension, compression);
    picker.add(new Option(title.textContent, String(index)));
    return { group, fill, outline, grid, detail, tension, compression };
  });

  const pointNodes = vertices.map(({color}, index) => {
    const group = svgNode('g', { 'data-point': index, style: `--point:${color}` });
    const title = svgNode('title');
    title.textContent = labels[index];
    group.append(title, svgNode('circle', { r: 15, class: 'portfolio-point-halo' }),
      svgNode('circle', { r: 5, class: 'portfolio-point-dot' }));
    return group;
  });

  function stopLoad() {
    load = undefined;
    release = undefined;
    settling = false;
    lastStep = 0;
    timeDebt = 0;
    posedOrientation = undefined;
  }

  function drawModel(timestamp) {
    frame = undefined;
    if (posedOrientation !== orientation) {
      poseLattice(lattice, position => rotate(position, orientation));
      posedOrientation = orientation;
    }
    let appliedLoad = load;
    if (release) {
      const elapsed = Math.max(0, timestamp - release.at) / 1000;
      if (elapsed >= .9) release = undefined;
      else {
        // Let the pulled junction recoil before letting the remaining rods relax.
        const rebound = Math.exp(-4 * elapsed) * (Math.cos(6 * elapsed) + .55 * Math.sin(6 * elapsed));
        appliedLoad = { index: release.index, dx: release.dx * rebound, dy: release.dy * rebound };
      }
    }
    if (settling) {
      timeDebt += lastStep ? Math.min(timestamp - lastStep, 50) : 1000 / 60;
      lastStep = timestamp;
      while (settling && timeDebt >= 1000 / 60) {
        settling = stepLattice(lattice, appliedLoad);
        timeDebt -= 1000 / 60;
      }
      if (settling) scheduleDraw();
      else {
        stopLoad();
        poseLattice(lattice, position => rotate(position, orientation));
        posedOrientation = orientation;
      }
    }
    projected = lattice.nodes.map(project);
    const paths = projected.map(pointString);
    const refinement = projected[appliedLoad?.index ?? hover];
    probe.setAttribute('visibility', refinement ? 'visible' : 'hidden');
    if (refinement) {
      probe.setAttribute('cx', refinement[0]);
      probe.setAttribute('cy', refinement[1]);
    }
    const frontVertices = new Set();
    const layers = faces.map(({corners}, index) => {
      const points = corners.map(vertex => lattice.nodes[lattice.tips[vertex]]);
      const surface = lattice.surfaces[index];
      const facing = visibleTriangles(surface, projected);
      const isFront = facing.length > 0;
      const {group, fill, outline, grid, detail, tension, compression} = faceNodes[index];
      const boundary = 'M' + surface.perimeter.map(node => paths[node]).join('L') + 'Z';
      outline.setAttribute('d', boundary);
      // Curvature can turn only part of a face toward the viewer.
      const hitArea = facing.length === surface.triangles.length
        ? boundary
        : facing.map(([a, b, c]) => `M${paths[a]}L${paths[b]}L${paths[c]}Z`).join('');
      fill.setAttribute('d', hitArea);
      group.classList.toggle('is-front', isFront);
      group.classList.toggle('is-selected', index === choice.face);
      const lines = strandPaths(surface, paths, lattice, settling && isFront);
      grid.setAttribute('d', lines.normal);
      tension.setAttribute('d', lines.tension);
      compression.setAttribute('d', lines.compression);
      detail.setAttribute('d', isFront && refinement ? refinedMesh(facing, projected, refinement) : '');
      for (const vertex of corners) {
        if (facing.some(cell => cell.includes(lattice.tips[vertex]))) frontVertices.add(vertex);
      }
      const depth = points.reduce((sum, point) => sum + point.z, 0) / 3;
      return {index, depth, isFront};
    }).sort((a, b) => Number(a.isFront) - Number(b.isFront) || a.depth - b.depth);

    const nextFaceOrder = layers.map(({index}) => index).join(',');
    if (nextFaceOrder !== faceOrder && !settling) {
      faceLayer.append(...layers.map(({index}) => faceNodes[index].group));
      faceOrder = nextFaceOrder;
    }

    for (const [vertex, point] of pointNodes.entries()) {
      point.setAttribute('transform', `translate(${paths[lattice.tips[vertex]]})`);
      point.setAttribute('visibility', frontVertices.has(vertex) ? 'visible' : 'hidden');
      const selected = vertex === choice.vertex || (faces[choice.face]?.corners.includes(vertex) ?? false);
      point.classList.toggle('is-selected', selected);
    }
    const orderedPoints = vertices.map((_, vertex) => vertex)
      .sort((a, b) => lattice.nodes[lattice.tips[a]].z - lattice.nodes[lattice.tips[b]].z);
    const nextPointOrder = orderedPoints.join(',');
    if (nextPointOrder !== pointOrder) {
      pointLayer.append(...orderedPoints.map(vertex => pointNodes[vertex]));
      pointOrder = nextPointOrder;
    }
  }

  function scheduleDraw() {
    frame ??= requestAnimationFrame(drawModel);
  }

  function aimAt([x, y, z]) {
    stopLoad();
    hover = undefined;
    orientation = { yaw: Math.atan2(-x, z) - .29, pitch: Math.atan2(y, Math.hypot(x, z)) + .24 };
  }

  function selectTopic(vertex, orient = false) {
    choice = { vertex };
    if (orient) aimAt(vertices[vertex].position);
    picker.value = '';
    faceCard.hidden = true;
    cards.forEach(card => { card.hidden = card.dataset.modelTopic !== ids[vertex]; });
    if (roleCard) {
      const role = roles[vertex];
      roleCard.querySelector('[data-model-role-name]').textContent = labels[vertex];
      roleCard.querySelector('[data-model-role-title]').textContent = role.querySelector('h3').textContent;
      roleCard.querySelector('[data-model-role-dates]').textContent = role.querySelector('.entry-date').textContent;
      roleLink.href = `#${role.id}`;
      roleLink.setAttribute('aria-label', `Jump to the ${labels[vertex]} role`);
      roleCard.hidden = false;
    }
    topicButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === vertex)));
    status.textContent = `Showing ${labels[vertex]}.`;
    scheduleDraw();
  }

  function selectFace(index, orient = false) {
    const face = faces[index];
    choice = { face: index };
    if (orient) aimAt(face.outward);
    picker.value = String(index);
    topicButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    cards.forEach(card => { card.hidden = true; });
    if (roleCard) roleCard.hidden = true;
    faceTitle.textContent = face.title;
    faceDescription.textContent = face.description;
    faceLinks.replaceChildren(...face.corners.map(vertex => {
      const item = document.createElement('li');
      const control = document.createElement(roleCard ? 'a' : 'button');
      control.textContent = labels[vertex];
      if (roleCard) control.href = `#${ids[vertex]}`;
      else {
        control.type = 'button';
        control.dataset.modelVertex = ids[vertex];
      }
      item.append(control);
      return item;
    }));
    faceCard.hidden = false;
    status.textContent = `Showing ${faceTitle.textContent}.`;
    scheduleDraw();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('[data-model-vertex]');
    if (!button) return;
    const vertex = ids.indexOf(button.dataset.modelVertex);
    selectTopic(vertex, true);
    if (faceCard.contains(button)) topicButtons[vertex].focus();
  });

  picker.addEventListener('change', () => {
    if (picker.value === '') selectTopic(0, true);
    else selectFace(Number(picker.value), true);
  });

  root.querySelector('[data-model-reset]').addEventListener('click', () => {
    stopLoad();
    hover = undefined;
    orientation = {...home};
    selectTopic(0);
  });

  function pointerTarget(event) {
    const target = event.target.closest('[data-point], [data-face]');
    if (event.pointerType !== 'touch') return target;
    let closestTip = target;
    let nearest = 22;
    for (const point of pointLayer.children) {
      if (point.getAttribute('visibility') === 'hidden') continue;
      const dot = point.lastElementChild.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - (dot.left + dot.width / 2), event.clientY - (dot.top + dot.height / 2));
      if (distance < nearest) {
        closestTip = point;
        nearest = distance;
      }
    }
    return closestTip;
  }

  function nodeUnderPointer(target, pointer) {
    if (!target || !projected) return;
    if (target.hasAttribute('data-point')) return lattice.tips[Number(target.dataset.point)];
    let nearest;
    let best = Infinity;
    for (const node of lattice.surfaces[Number(target.dataset.face)].nodes) {
      const [x, y] = projected[node];
      const distance = (pointer.x - x) ** 2 + (pointer.y - y) ** 2;
      if (distance < best) { nearest = node; best = distance; }
    }
    return nearest;
  }

  for (const button of modeButtons) button.addEventListener('click', () => {
    mode = button.dataset.modelMode;
    modeButtons.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    dragHint.textContent = mode === 'pull' ? 'Drag the mesh to pull it.' : 'Drag the mesh to turn it.';
    hover = undefined;
    scheduleDraw();
  });

  function startGesture(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const inverse = matrix.inverse();
    const pointer = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
    const target = pointerTarget(event);
    if (event.pointerType === 'touch' && !target) return;
    const node = mode === 'pull' && !event.shiftKey ? nodeUnderPointer(target, pointer) : undefined;
    gesture = {
      id: event.pointerId, x: event.clientX, y: event.clientY, node, target, inverse,
      slop: event.pointerType === 'touch' ? 9 : 5,
      start: {...orientation}, moved: false,
    };
    if (event.pointerType === 'touch' && node !== undefined) {
      hover = node;
      scheduleDraw();
    }
  }

  svg.addEventListener('pointerdown', event => {
    if (hasTouchGestures && event.pointerType === 'touch') return;
    if (gesture) {
      if (event.pointerType === 'touch') gesture.ignoreTap = true;
      return;
    }
    if (!event.isPrimary || event.button !== 0) return;
    startGesture(event);
    if (!gesture) return;
    svg.setPointerCapture(event.pointerId);
  });

  function moveGesture(event) {
    if (!gesture) {
      if (event.pointerType === 'touch') return;
      const target = event.target.closest('[data-point], [data-face]');
      const matrix = target && svg.getScreenCTM();
      const next = mode === 'pull' && matrix
        ? nodeUnderPointer(target, new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()))
        : undefined;
      if (next !== hover) { hover = next; scheduleDraw(); }
      return;
    }
    if (gesture.id !== event.pointerId) return;
    const screenX = event.clientX - gesture.x;
    const screenY = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(screenX, screenY) < gesture.slop) return;
    gesture.moved = true;
    stage.classList.add('is-dragging');
    if (gesture.node === undefined) {
      stopLoad();
      hover = undefined;
      orientation = { yaw: gesture.start.yaw + screenX * .013, pitch: gesture.start.pitch + screenY * .013 };
    } else {
      const {a, b, c, d} = gesture.inverse;
      const dx = a * screenX + c * screenY;
      const dy = b * screenX + d * screenY;
      const node = lattice.nodes[gesture.node];
      const worldUnits = (4.5 - node.z) / 790;
      const scale = Math.min(worldUnits, .71 / Math.max(1, Math.hypot(dx, dy)));
      const [restX, restY] = project({x: node.restX, y: node.restY, z: node.z});
      const bounds = svg.viewBox.baseVal;
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const x = clamp(restX + dx * scale / worldUnits, bounds.x + 12, bounds.x + bounds.width - 12);
      const y = clamp(restY + dy * scale / worldUnits, bounds.y + 12, bounds.y + bounds.height - 12);
      release = undefined;
      load = { index: gesture.node, dx: (x - restX) * worldUnits, dy: (restY - y) * worldUnits };
      settling = true;
    }
    scheduleDraw();
  }

  svg.addEventListener('pointermove', event => {
    if (!hasTouchGestures || event.pointerType !== 'touch') moveGesture(event);
  });

  svg.addEventListener('pointerleave', () => { hover = undefined; scheduleDraw(); });

  function endGesture(event) {
    if (gesture?.id !== event.pointerId) return;
    const {target, moved, ignoreTap, slop, x, y} = gesture;
    gesture = undefined;
    stage.classList.remove('is-dragging');
    if (load) {
      if (reducedMotion.matches || event.type !== 'pointerup') stopLoad();
      else release = { ...load, at: performance.now() };
      hover = undefined;
      load = undefined;
      scheduleDraw();
    }
    if (event.pointerType === 'touch' && hover !== undefined) {
      hover = undefined;
      scheduleDraw();
    }
    if (event.type !== 'pointerup' || moved || ignoreTap || !target || Math.hypot(event.clientX - x, event.clientY - y) >= slop) return;
    if (target.hasAttribute('data-point')) {
      selectTopic(Number(target.dataset.point));
      roleLink?.click();
    } else selectFace(Number(target.dataset.face));
  }

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    svg.addEventListener(type, event => {
      if (!hasTouchGestures || event.pointerType !== 'touch') endGesture(event);
    });
  }

  if (hasTouchGestures) {
    // Let the page scroll until a single finger starts on the model itself.
    // Non-passive touch moves let Safari keep the drag even on SVG paths.
    svg.classList.add('has-touch-gestures');
    let touchId;

    function touchInput(touch, target, type) {
      return { type, target, pointerType: 'touch', pointerId: touch.identifier,
        clientX: touch.clientX, clientY: touch.clientY };
    }

    function cancelTouch() {
      if (touchId === undefined) return;
      endGesture({ pointerId: touchId, pointerType: 'touch', type: 'pointercancel' });
      touchId = undefined;
    }

    svg.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) {
        cancelTouch();
        return;
      }
      if (gesture) return;
      const touch = event.changedTouches[0];
      startGesture(touchInput(touch, event.target, 'pointerdown'));
      if (gesture) touchId = touch.identifier;
    }, { passive: true });

    svg.addEventListener('touchmove', event => {
      if (touchId === undefined) return;
      if (event.touches.length !== 1 || !event.cancelable) {
        cancelTouch();
        return;
      }
      const touch = event.touches[0];
      if (touch.identifier !== touchId) return;
      event.preventDefault();
      moveGesture(touchInput(touch, event.target, 'pointermove'));
    }, { passive: false });

    svg.addEventListener('touchend', event => {
      if (touchId === undefined) return;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === touchId);
      if (!touch) return;
      touchId = undefined;
      if (event.cancelable) event.preventDefault();
      endGesture(touchInput(touch, event.target, 'pointerup'));
    }, { passive: false });

    svg.addEventListener('touchcancel', cancelTouch, { passive: true });
  }

  stage.addEventListener('keydown', event => {
    const turns = {ArrowLeft:[-.16,0], ArrowRight:[.16,0], ArrowUp:[0,-.16], ArrowDown:[0,.16]};
    const delta = turns[event.key];
    if (!Array.isArray(delta)) return;
    event.preventDefault();
    stopLoad();
    hover = undefined;
    orientation = { yaw: orientation.yaw + delta[0], pitch: orientation.pitch + delta[1] };
    scheduleDraw();
  });

  view.hidden = false;
  controls.hidden = false;
  root.querySelector('.portfolio-model-layout').classList.add('is-interactive');
  selectTopic(0);
  root.hidden = false;
}

const portfolio = document.querySelector('#portfolio-3d');
if (portfolio) mountPortfolio(portfolio, homeFaces);

const experience = document.querySelector('#experience-3d');
if (experience) mountPortfolio(experience, experienceFaces);
