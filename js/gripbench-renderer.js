// Adapted from GripBench’s local replay renderer. The geometry comes from the same STL files used by the experiment.
const add = (a, b) => a.map((value, axis) => value + b[axis]);
const subtract = (a, b) => a.map((value, axis) => value - b[axis]);
const dot = (a, b) => a.reduce((sum, value, axis) => sum + value * b[axis], 0);
const cross = ([ax, ay, az], [bx, by, bz]) => [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
const unit = (vector) => {
  const size = Math.hypot(...vector);
  return vector.map((coordinate) => coordinate / size);
};
const rotate = (point, [w, x, y, z]) => {
  const vector = [x, y, z];
  const product = cross(vector, point).map((value) => value * 2);
  return add(point, add(product.map((value) => value * w), cross(vector, product)));
};

export async function readMesh(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("A jaw mesh could not be loaded.");
  const view = new DataView(await response.arrayBuffer());
  if (view.byteLength < 84) throw new Error("The jaw STL is incomplete.");
  const count = view.getUint32(80, true);
  if (84 + count * 50 !== view.byteLength) throw new Error("Expected a binary STL jaw mesh.");
  return Array.from({length: count}, (_, triangle) => {
    const start = 84 + triangle * 50 + 12;
    return [0, 1, 2].map((i) => [0, 1, 2].map((axis) => view.getFloat32(start + i * 12 + axis * 4, true) / 1000));
  });
}

function trianglesFromQuads(points, faces) {
  return faces.flatMap(([a, b, c, d]) => [[points[a], points[b], points[c]], [points[a], points[c], points[d]]]);
}

function box(x, y, z) {
  return trianglesFromQuads(
    [[-x,-y,-z], [x,-y,-z], [x,y,-z], [-x,y,-z], [-x,-y,z], [x,-y,z], [x,y,z], [-x,y,z]],
    [[3,2,1,0], [4,5,6,7], [0,1,5,4], [1,2,6,5], [2,3,7,6], [3,0,4,7]],
  );
}

function cylinder(radius, height) {
  const sides = 36;
  const ring = Array.from({length: sides}, (_, i) => {
    const angle = i * 2 * Math.PI / sides;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
  return ring.flatMap(([x, y], i) => {
    const [nx, ny] = ring[(i + 1) % sides];
    const a = [x,y,-height], b = [nx,ny,-height], c = [nx,ny,height], d = [x,y,height];
    return [[a,b,c], [a,c,d], [[0,0,height],d,c], [[0,0,-height],b,a]];
  });
}

const OBJECTS = {cube: box(.015, .015, .015), cylinder: cylinder(.015, .015)};
const CARRIAGE = box(.068, .0075, .004);
const PALETTE = {flat: [124, 189, 230], "v-groove": [195, 165, 247], part: [248, 161, 81], frame: [101, 124, 129]};
const LIGHT = unit([-.7, -.35, 1.15]);

export function canvasContext(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  return {context, width, height};
}

export function drawScene(canvas, mesh, run, frame, overhead) {
  const {context: ctx, width, height} = canvasContext(canvas);
  const eye = overhead ? [0, 0, 1] : unit([.56, -.9, .67]);
  const across = overhead ? [1, 0, 0] : unit([.9, .56, 0]);
  const up = cross(eye, across);
  const scale = Math.min(width / (overhead ? .168 : .205), height / (overhead ? .14 : .181));
  const origin = overhead ? [0, 0, 0] : [0, 0, .078];
  function project(point) {
    const p = subtract(point, origin);
    return [width / 2 + scale * dot(p, across), height / 2 - scale * dot(p, up), dot(p, eye)];
  }
  function line(a, b) {
    const [x, y] = project(a);
    const [u, v] = project(b);
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#334258";
  ctx.beginPath();
  for (let i = -5; i <= 5; i += 1) {
    const p = i * .024;
    line([p, -.12, 0], [p, .12, 0]);
    line([-.12, p, 0], [.12, p, 0]);
  }
  ctx.stroke();
  if (!frame || !mesh) return;

  const surfaces = [];
  function addMesh(triangles, xyz, quaternion, color) {
    for (const triangle of triangles) {
      const [a, b, c] = triangle.map((point) => add(rotate(point, quaternion), xyz));
      const normal = unit(cross(subtract(b, a), subtract(c, a)));
      if (dot(normal, eye) <= 1e-8) continue;
      const vertices = [a, b, c].map(project);
      const depth = vertices.reduce((sum, point) => sum + point[2], 0) / 3;
      const brightness = .61 + .39 * Math.max(0, dot(normal, LIGHT));
      const rgb = color.map((channel) => Math.round(channel * brightness));
      surfaces.push({vertices, depth, color: "rgb(" + rgb.join(",") + ")"});
    }
  }
  const jaw = PALETTE[run.result.jaw];
  addMesh(CARRIAGE, frame.frame_xyz_m, [1,0,0,0], PALETTE.frame);
  addMesh(mesh, frame.left_xyz_m, [1,0,0,0], jaw);
  addMesh(mesh, frame.right_xyz_m, [0,0,0,1], jaw);
  addMesh(OBJECTS[run.result.object_shape], frame.object_xyz_m, frame.object_wxyz, PALETTE.part);
  surfaces.sort((a, b) => a.depth - b.depth);
  for (const surface of surfaces) {
    const [[x, y], [u, v], [p, q]] = surface.vertices;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(u, v);
    ctx.lineTo(p, q);
    ctx.closePath();
    ctx.fillStyle = surface.color;
    ctx.fill();
    ctx.lineWidth = .45;
    ctx.strokeStyle = surface.color;
    ctx.stroke();
  }
}

const CHART_COLORS = ["#81d3ee", "#d9b2f5"];
export function drawChart(canvas, data, time, metric, measure) {
  const {context: ctx, width, height} = canvasContext(canvas);
  if (!data || width < 60) return;
  const {runs, duration_s: duration} = data;
  const margin = {left: 34, right: 13, top: 9, bottom: 20};
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const x = (t) => margin.left + w * t / duration;
  const min = metric === "clearance" ? -10 : 0;
  const max = metric === "clearance" ? 120 :
    Math.max(20, 10 * Math.ceil(Math.max(...runs.flatMap((run) => run.frames.map(measure))) / 10));
  const y = (value) => margin.top + h * (1 - (value - min) / (max - min));
  const ticks = metric === "clearance" ? [0, 40, 80, 120] : [0, max / 2, max];
  const holdStart = duration - data.phases.at(-1)[1];

  ctx.fillStyle = "#203345";
  ctx.fillRect(x(holdStart), margin.top, x(duration) - x(holdStart), h);
  ctx.font = "10px ui-monospace, monospace";
  for (const value of ticks) {
    ctx.fillStyle = "#b8c7d9";
    ctx.textAlign = "right";
    ctx.fillText(String(value), margin.left - 6, y(value) + 3);
    ctx.beginPath();
    ctx.strokeStyle = "#26394c";
    if (metric === "clearance" && value === data.pass_clearance_m * 1000) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "#8998ab";
    }
    ctx.moveTo(x(0), y(value));
    ctx.lineTo(x(duration), y(value));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#b8c7d9";
  for (const tick of [0, 1, 2, 3, duration]) {
    ctx.textAlign = tick === duration ? "right" : "center";
    ctx.fillText(tick + " s", x(tick), height - 5);
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x(0) - 1, margin.top, w + 2, h);
  ctx.clip();
  runs.forEach((run, index) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = CHART_COLORS[index];
    run.frames.forEach((frame, i) => {
      if (i === 0) ctx.moveTo(x(frame.time_s), y(measure(frame)));
      else ctx.lineTo(x(frame.time_s), y(measure(frame)));
    });
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#d4dbed";
  ctx.moveTo(x(time), margin.top);
  ctx.lineTo(x(time), height - margin.bottom);
  ctx.stroke();
  ctx.restore();
}
