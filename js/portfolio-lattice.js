// Build a shared triangular lattice so loads can travel across face boundaries.
export function createLattice(vertices, faces, divisions = 12) {
  const nodes = [];
  const rods = [];
  const nodeByPosition = new Map();
  const rodByEndpoints = new Map();

  function nodeAt(position) {
    const key = position.join(',');
    if (!nodeByPosition.has(key)) {
      nodeByPosition.set(key, nodes.length);
      nodes.push({ position: position.map(value => value / divisions) });
    }
    return nodeByPosition.get(key);
  }

  function rodBetween(a, b) {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (!rodByEndpoints.has(key)) {
      rodByEndpoints.set(key, { a, b });
      rods.push(rodByEndpoints.get(key));
    }
    return rodByEndpoints.get(key);
  }

  const surfaces = faces.map(({corners}) => {
    const [a, b, c] = corners.map(vertex => vertices[vertex].position);
    const grid = Array.from({length: divisions + 1}, (_, i) =>
      Array.from({length: divisions + 1 - i}, (_, j) =>
        nodeAt(a.map((value, axis) => (divisions - i - j) * value + i * b[axis] + j * c[axis]))));
    const triangles = [];
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions - i; j++) {
        triangles.push([grid[i][j], grid[i + 1][j], grid[i][j + 1]]);
        if (i + j < divisions - 1) triangles.push([grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]);
      }
    }
    const surfaceRods = new Set();
    for (const [first, second, third] of triangles) {
      surfaceRods.add(rodBetween(first, second));
      surfaceRods.add(rodBetween(second, third));
      surfaceRods.add(rodBetween(third, first));
    }
    const perimeter = [];
    for (let i = 0; i < divisions; i++) perimeter.push(grid[i][0]);
    for (let i = divisions; i > 0; i--) perimeter.push(grid[i][divisions - i]);
    for (let j = divisions; j > 0; j--) perimeter.push(grid[0][j]);
    return { nodes: grid.flat(), triangles, rods: [...surfaceRods], perimeter };
  });
  const tips = vertices.map(({position}) => nodeAt(position.map(value => value * divisions)));
  return { nodes, rods, surfaces, tips };
}

export function poseLattice(lattice, rotate) {
  for (const node of lattice.nodes) {
    const [x, y, z] = rotate(node.position);
    Object.assign(node, { x, y, z, restX: x, restY: y, previousX: x, previousY: y });
  }
  for (const rod of lattice.rods) {
    const a = lattice.nodes[rod.a];
    const b = lattice.nodes[rod.b];
    rod.restLength = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}

// Move in the view plane, retain each node's depth, and relax toward the
// three-dimensional rest lengths before rendering the next frame.
export function stepLattice(lattice, load) {
  const { nodes, rods } = lattice;
  const inertia = load ? .79 : .88;
  const returnToRest = load ? .048 : .022;
  for (const node of nodes) {
    const {x, y} = node;
    node.x += (x - node.previousX) * inertia + (node.restX - x) * returnToRest;
    node.y += (y - node.previousY) * inertia + (node.restY - y) * returnToRest;
    node.previousX = x;
    node.previousY = y;
  }
  if (load) {
    const node = nodes[load.index];
    node.x = node.restX + load.dx;
    node.y = node.restY + load.dy;
    node.previousX = node.x;
    node.previousY = node.y;
  }
  for (let iteration = 0; iteration < 4; iteration++) {
    for (const {a, b, restLength} of rods) {
      const first = nodes[a];
      const second = nodes[b];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const length = Math.hypot(dx, dy, second.z - first.z);
      const correction = .3 * (1 - restLength / Math.max(length, 1e-6));
      if (a !== load?.index) { first.x += dx * correction; first.y += dy * correction; }
      if (b !== load?.index) { second.x -= dx * correction; second.y -= dy * correction; }
    }
  }

  return Boolean(load) || nodes.some(node =>
    Math.abs(node.x - node.restX) + Math.abs(node.y - node.restY) +
    Math.abs(node.x - node.previousX) + Math.abs(node.y - node.previousY) > .001);
}

export function rodStrain({nodes}, {a, b, restLength}) {
  const first = nodes[a];
  const second = nodes[b];
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z) / restLength - 1;
}
