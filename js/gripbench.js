import { drawChart, drawScene, readMesh } from './gripbench-renderer.js';

const trialFiles = {
  'off-center': new URL('../assets/gripbench/off-center.json', import.meta.url),
  'centered-cylinder': new URL('../assets/gripbench/centered-cylinder.json', import.meta.url),
  'low-friction': new URL('../assets/gripbench/low-friction.json', import.meta.url),
  'centered-cube': new URL('../assets/gripbench/centered-cube.json', import.meta.url),
};
const meshFiles = {
  flat: new URL('../assets/gripbench/flat_jaw.stl', import.meta.url),
  'v-groove': new URL('../assets/gripbench/v_groove_jaw.stl', import.meta.url),
};
const cadFiles = {
  'flat-step': new URL('../assets/gripbench/flat_jaw.step', import.meta.url),
  'groove-step': new URL('../assets/gripbench/v_groove_jaw.step', import.meta.url),
};
const metrics = {
  clearance: {
    measure: (frame) => frame.object_clearance_m * 1000,
    unit: 'mm',
    caption: 'Clearance is the distance from the table to the workpiece’s lowest point. The dashed line marks 80 mm. Shading marks the hold phase.',
    name: 'Clearance',
  },
  force: {
    measure: (frame) => frame.left_normal_n + frame.right_normal_n,
    unit: 'N',
    caption: 'Normal force is summed across both jaws. Shading marks the hold phase.',
    name: 'Normal force',
  },
};

const byId = (id) => document.getElementById(id);
const picker = byId('trial');
const replay = byId('replay');
const message = byId('trial-message');
const status = byId('trial-status');
const retry = byId('retry-trial');
const transport = byId('transport');
const timeline = byId('timeline');
const play = byId('play-trial');
const elapsed = byId('elapsed');
const camera = byId('camera');
const metric = byId('metric');
const chart = byId('telemetry');
const download = byId('download-trial');
const condition = byId('condition');
const chartCaption = byId('chart-caption');
const panels = Object.fromEntries(
  [...replay.querySelectorAll('[data-jaw]')].map((panel) => [panel.dataset.jaw, {
    canvas: panel.querySelector('canvas'),
    result: panel.querySelector('[data-result]'),
    minimum: panel.querySelector('[data-minimum]'),
    reading: panel.querySelector('[data-reading]'),
  }]),
);

for (const link of document.querySelectorAll('[data-cad]')) {
  link.href = cadFiles[link.dataset.cad].href;
}

let meshRequest;
let data;
let meshes;
let loading;
let time = 0;
let animation = 0;
let startedAt;

function nearestFrame(frames, timestamp) {
  let low = 0;
  let high = frames.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid].time_s <= timestamp) low = mid;
    else high = mid;
  }
  return timestamp - frames[low].time_s < frames[high].time_s - timestamp ? frames[low] : frames[high];
}

function render() {
  if (!data) return;
  const selected = metrics[metric.value];
  for (const run of data.runs) {
    const jaw = run.result.jaw;
    const view = panels[jaw];
    const frame = nearestFrame(run.frames, time);
    drawScene(view.canvas, meshes[jaw], run, frame, camera.value === 'overhead');
    view.reading.textContent = `${selected.measure(frame).toFixed(1)} ${selected.unit}`;
  }
  timeline.value = String(time);
  const phase = nearestFrame(data.runs[0].frames, time).phase;
  elapsed.textContent = `${time.toFixed(2)} / ${data.duration_s.toFixed(2)} s · ${phase}`;
  timeline.setAttribute('aria-valuetext', `${time.toFixed(2)} seconds, ${phase} phase`);
  drawChart(chart, data, time, metric.value, selected.measure);
}

function stop() {
  cancelAnimationFrame(animation);
  animation = 0;
  startedAt = undefined;
  play.textContent = data && time >= data.duration_s ? 'Play from start' : 'Play';
}

function tick(timestamp) {
  if (!data) return;
  if (startedAt === undefined) startedAt = timestamp - time * 1000;
  time = Math.min(data.duration_s, (timestamp - startedAt) / 1000);
  render();
  if (time >= data.duration_s) stop();
  else animation = requestAnimationFrame(tick);
}

function loadMeshes() {
  meshRequest ??= Promise.all(Object.entries(meshFiles).map(async ([jaw, url]) => [jaw, await readMesh(url)]))
    .then(Object.fromEntries)
    .catch((error) => {
      meshRequest = undefined;
      throw error;
    });
  return meshRequest;
}

function validRecording(recording) {
  return Number.isFinite(recording?.duration_s) && recording.duration_s > 0
    && recording.runs?.length === 2
    && recording.runs[0].result?.jaw === 'flat'
    && recording.runs[1].result?.jaw === 'v-groove'
    && recording.runs.every((run) => run.frames?.length > 1);
}

function showRecording(recording, key) {
  for (const run of recording.runs) {
    const view = panels[run.result.jaw];
    view.minimum.textContent = `${(1000 * run.result.min_hold_clearance_m).toFixed(1)} mm`;
    view.result.textContent = run.result.passed ? 'Pass' : 'Below threshold';
    view.result.dataset.passed = String(run.result.passed);
  }
  const { object_shape, friction, offset_mm } = recording.runs[0].result;
  condition.textContent = `${object_shape === 'cube' ? 'Cube' : 'Cylinder'} · Friction ${friction.toFixed(2)} · ${offset_mm} mm offset`;
  timeline.max = String(recording.duration_s);
  time = recording.duration_s;
  download.href = trialFiles[key].href;
  download.download = `gripbench-${key}.json`;
  download.hidden = false;
  message.hidden = true;
  replay.hidden = false;
  transport.disabled = false;
  metric.disabled = false;
  render();
  stop();
}

async function loadTrial(key) {
  loading?.abort();
  const request = new AbortController();
  loading = request;
  stop();
  data = undefined;
  condition.textContent = 'Loading the selected scenario.';
  replay.hidden = true;
  download.hidden = true;
  transport.disabled = true;
  metric.disabled = true;
  message.hidden = false;
  retry.hidden = true;
  status.textContent = 'Loading GripBench replay…';
  picker.value = key;

  try {
    const [recording, trialMeshes] = await Promise.all([
      fetch(trialFiles[key], { signal: request.signal }).then((response) => {
        if (!response.ok) throw new Error('Replay unavailable.');
        return response.json();
      }),
      loadMeshes(),
    ]);
    if (request.signal.aborted) return;
    if (!validRecording(recording)) throw new Error('Invalid replay.');
    data = recording;
    meshes = trialMeshes;
    showRecording(recording, key);
  } catch {
    if (request.signal.aborted) return;
    data = undefined;
    replay.hidden = true;
    transport.disabled = true;
    metric.disabled = true;
    download.hidden = true;
    message.hidden = false;
    condition.textContent = 'Recorded simulations';
    status.textContent = 'The replay could not load. Try again or choose a different scenario.';
    retry.hidden = false;
  }
}

play.addEventListener('click', () => {
  if (!data) return;
  if (animation) {
    stop();
    return;
  }
  if (time >= data.duration_s) time = 0;
  play.textContent = 'Pause';
  animation = requestAnimationFrame(tick);
});

timeline.addEventListener('input', () => {
  if (!data) return;
  time = Number(timeline.value);
  stop();
  render();
});

camera.addEventListener('change', render);
metric.addEventListener('change', () => {
  const selected = metrics[metric.value];
  chartCaption.textContent = selected.caption;
  chart.setAttribute('aria-label', `${selected.name} traces for both jaws. At-cursor readings are listed above.`);
  render();
});

picker.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('trial', picker.value);
  history.replaceState(null, '', url);
  loadTrial(picker.value);
});
retry.addEventListener('click', () => loadTrial(picker.value));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
});

if ([...Object.values(panels).map((view) => view.canvas), chart].every((canvas) => canvas.getContext('2d'))) {
  picker.disabled = false;
  const chosen = new URL(location.href).searchParams.get('trial');
  const observer = new ResizeObserver(render);
  for (const view of Object.values(panels)) observer.observe(view.canvas);
  observer.observe(chart);
  loadTrial(Object.hasOwn(trialFiles, chosen) ? chosen : 'off-center');
} else {
  replay.hidden = true;
  message.hidden = false;
  status.textContent = 'This browser cannot display the replay. The method and CAD files are available below.';
}
