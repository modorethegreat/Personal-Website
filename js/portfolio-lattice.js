// Share nodes at the curved edges so loads can cross from face to face.
export function createLattice(vertices, faces, divisions) {
  const nodes = [];
  const rods = [];
  const nodeByPosition = new Map();
  const rodByEndpoints = new Map();

  function nodeAt(position) {
    const key = position.join(',');
    if (!nodeByPosition.has(key)) {
      // Keep the six axial tips fixed and pull the edges and faces inward.
      const curved = position.map(value => Math.sign(value) * (Math.abs(value) / divisions) ** 1.48);
      nodeByPosition.set(key, nodes.length);
      nodes.push({ position: curved });
    }
    return nodeByPosition.get(key);
  }

  function rodBetween(a, b) {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (!rodByEndpoints.has(key)) {
      const first = nodes[a].position;
      const second = nodes[b].position;
      const restLength = Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
      rodByEndpoints.set(key, { a, b, restLength });
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
    const strands = [];
    for (let row = 0; row < divisions; row++) {
      const otherAxis = Array.from({length: divisions + 1 - row}, (_, i) => grid[i][row]);
      const diagonal = Array.from({length: divisions + 1 - row}, (_, i) => grid[i][divisions - row - i]);
      for (const ids of [grid[row], otherAxis, diagonal]) {
        strands.push({ ids, rods: ids.slice(1).map((id, index) => rodBetween(ids[index], id)) });
      }
    }
    const perimeter = [];
    for (let i = 0; i < divisions; i++) perimeter.push(grid[i][0]);
    for (let i = divisions; i > 0; i--) perimeter.push(grid[i][divisions - i]);
    for (let j = divisions; j > 0; j--) perimeter.push(grid[0][j]);
    // All face corner lists run along Y, X, Z. Projection flips the Y axis.
    const winding = Math.sign(a[1] * b[0] * c[2]);
    return { nodes: grid.flat(), triangles, strands, perimeter, winding };
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
    rod.depthSquared = (lattice.nodes[rod.a].z - lattice.nodes[rod.b].z) ** 2;
  }
}

// Move in the view plane, retain each node's depth, and relax toward the
// three-dimensional rest lengths before rendering the next frame.
export function stepLattice(lattice, load) {
  const { nodes, rods } = lattice;
  if (!load) {
    // Finish the recoil at the rest pose even if a large pull folded a cell.
    let moving = false;
    for (const node of nodes) {
      const dx = node.x - node.restX;
      const dy = node.y - node.restY;
      const fraction = Math.abs(dx) + Math.abs(dy) > .001 ? .82 : 0;
      node.previousX = node.x = node.restX + dx * fraction;
      node.previousY = node.y = node.restY + dy * fraction;
      moving ||= fraction > 0;
    }
    return moving;
  }
  for (const node of nodes) {
    const {x, y} = node;
    node.x += (x - node.previousX) * .79 + (node.restX - x) * .048;
    node.y += (y - node.previousY) * .79 + (node.restY - y) * .048;
    node.previousX = x;
    node.previousY = y;
  }
  const pinned = load.index;
  const node = nodes[pinned];
  node.previousX = node.x = node.restX + load.dx;
  node.previousY = node.y = node.restY + load.dy;
  for (let iteration = 0; iteration < 4; iteration++) {
    for (const {a, b, restLength, depthSquared} of rods) {
      const first = nodes[a];
      const second = nodes[b];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const length = Math.sqrt(dx * dx + dy * dy + depthSquared);
      const correction = .3 * (1 - restLength / Math.max(length, 1e-6));
      if (a !== pinned) { first.x += dx * correction; first.y += dy * correction; }
      if (b !== pinned) { second.x -= dx * correction; second.y -= dy * correction; }
    }
  }

  return true;
}

export function rodStrain({nodes}, {a, b, restLength, depthSquared}) {
  const first = nodes[a];
  const second = nodes[b];
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return Math.sqrt(dx * dx + dy * dy + depthSquared) / restLength - 1;
}
