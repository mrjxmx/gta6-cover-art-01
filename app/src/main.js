// Neon Panels studio wiring: the photo pool, the panel editor (click a panel to
// select it, drag to pan its photo, wheel or slider to zoom), the layout, grade
// and caption controls, and PNG export at the three post sizes. The preview
// canvas is kept at the chosen export size, so what you see is the PNG you get.
// A ?shot= query (./shots.js) loads a fixed scene for screenshots instead.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES } from './grades.js';
import { EXPORT_SIZES, TITLE_STYLES, blankCrop, panelRects, photoPlacement, renderCover } from './render.js';
import { parseShotScene } from './shots.js';

const SAMPLES = [
  { name: 'Pier at dusk', file: 'pier' },
  { name: 'Boulevard', file: 'boulevard' },
  { name: 'Boardwalk sunset', file: 'boardwalk' },
];

// Button swatches that hint at each grade before you pick it.
const GRADE_SWATCHES = {
  vice: 'linear-gradient(160deg, #2b005c, #ff2e88 55%, #ff5e3a)',
  neon: 'linear-gradient(135deg, #00e5ff, #7a00ff 55%, #ff00c8)',
  noir: 'linear-gradient(160deg, #f2f2f2, #555 55%, #0a0a0a)',
  golden: 'linear-gradient(160deg, #ffe9a8, #ff9a3c 60%, #ff7b24)',
};

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('statusLine');
const photoPool = document.getElementById('photoPool');
const zoomRange = document.getElementById('zoomRange');
const panelLabel = document.getElementById('panelLabel');

const photos = []; // HTMLImageElement[], in pool order
const photoNames = [];
const state = {
  layoutId: 'poster-grid',
  gradeId: 'vice',
  mode: 'panels',
  spread: blankCrop(),
  panels: [],
  caption: 'VICE\nHEAT',
  tagline: 'Welcome to Neon Shores',
  titleStyle: 'sunset',
  captionPos: 'bottom',
};
let selectedPanel = 0;
let activePhoto = -1;

function setStatus(text) {
  statusLine.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  renderCover(ctx, canvas.width, canvas.height, state, photos);
}

/** Keeps state.panels the same length as the layout, preserving crops by index. */
function fitPanelsToLayout() {
  const count = layoutById(state.layoutId).panels.length;
  while (state.panels.length < count) state.panels.push(blankCrop());
  state.panels.length = count;
  if (selectedPanel >= count) selectedPanel = 0;
}

/** The crop the zoom slider and drag gestures edit: the spread crop, or the selected panel's. */
function activeCrop() {
  return state.mode === 'spread' ? state.spread : state.panels[selectedPanel];
}

function refreshPanelLabel() {
  panelLabel.textContent = state.mode === 'spread'
    ? 'One photo spread across every panel'
    : `Panel ${selectedPanel + 1} of ${state.panels.length}${layoutById(state.layoutId).panels[selectedPanel]?.hero ? ' (hero)' : ''}`;
  zoomRange.value = String(activeCrop()?.zoom ?? 1);
}

/** Adds a loaded image to the pool with its thumbnail button. */
function addPhoto(img, name) {
  photos.push(img);
  photoNames.push(name);
  const index = photos.length - 1;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb';
  button.title = `${name} — click, then click a panel to place it`;
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  button.appendChild(thumb);
  button.addEventListener('click', () => placePhoto(index));
  photoPool.appendChild(button);
  return index;
}

/** Places a pool photo: into the spread, or into the selected panel. */
function placePhoto(index) {
  activePhoto = index;
  if (state.mode === 'spread') {
    state.spread.photo = index;
  } else {
    state.panels[selectedPanel].photo = index;
  }
  setStatus(`${photoNames[index]} placed. Drag on the cover to pan, scroll to zoom.`);
  redraw();
}

/** Loads the bundled sample photos into the pool, in order. */
async function loadSamples() {
  for (const sample of SAMPLES) {
    const img = await loadImage(`samples/${sample.file}.jpg`);
    addPhoto(img, sample.name);
  }
}

/** The opening scene: the samples arranged over the poster grid. */
function applyDefaultScene() {
  fitPanelsToLayout();
  const crops = [
    { photo: 0, zoom: 1.05, panX: 0.5, panY: 0.45 },
    { photo: 1, zoom: 1.1, panX: 0.5, panY: 0.14 },
    { photo: 2, zoom: 1.25, panX: 0.4, panY: 0.5 },
    { photo: 1, zoom: 1.7, panX: 0.25, panY: 0.6 },
    { photo: 2, zoom: 1.15, panX: 0.5, panY: 0.35 },
  ];
  crops.forEach((crop, i) => { if (state.panels[i]) Object.assign(state.panels[i], crop); });
  selectedPanel = 0;
  refreshPanelLabel();
  redraw();
}

// --- Controls ---------------------------------------------------------------

function buildLayoutButtons() {
  const host = document.getElementById('layoutButtons');
  for (const layout of LAYOUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'layout-button';
    button.dataset.layout = layout.id;
    const mini = document.createElement('span');
    mini.className = 'mini';
    for (const panel of layout.panels) {
      const cell = document.createElement('span');
      cell.className = panel.hero ? 'mini-cell hero' : 'mini-cell';
      cell.style.left = `${panel.x * 100}%`;
      cell.style.top = `${panel.y * 100}%`;
      cell.style.width = `${panel.w * 100}%`;
      cell.style.height = `${panel.h * 100}%`;
      mini.appendChild(cell);
    }
    const label = document.createElement('span');
    label.textContent = layout.name;
    button.append(mini, label);
    button.addEventListener('click', () => {
      state.layoutId = layout.id;
      fitPanelsToLayout();
      markActive(host, button);
      refreshPanelLabel();
      redraw();
    });
    host.appendChild(button);
  }
  host.querySelector('[data-layout="poster-grid"]')?.classList.add('active');
}

function buildGradeButtons() {
  const host = document.getElementById('gradeButtons');
  for (const grade of GRADES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'grade-button';
    button.dataset.grade = grade.id;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = GRADE_SWATCHES[grade.id] ?? '#888';
    const label = document.createElement('span');
    label.textContent = grade.name;
    button.append(swatch, label);
    button.addEventListener('click', () => {
      state.gradeId = grade.id;
      markActive(host, button);
      redraw();
    });
    host.appendChild(button);
  }
  host.querySelector('[data-grade="vice"]')?.classList.add('active');
}

function buildSizeButtons() {
  const host = document.getElementById('sizeButtons');
  for (const size of EXPORT_SIZES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'size-button';
    button.dataset.size = size.id;
    button.textContent = size.name;
    button.addEventListener('click', () => {
      canvas.width = size.w;
      canvas.height = size.h;
      markActive(host, button);
      redraw();
    });
    host.appendChild(button);
  }
  host.querySelector('[data-size="wide"]')?.classList.add('active');
}

function markActive(host, button) {
  host.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
  button.classList.add('active');
}

function buildTitleStyleOptions() {
  const select = document.getElementById('titleStyleSelect');
  for (const style of TITLE_STYLES) {
    const option = document.createElement('option');
    option.value = style.id;
    option.textContent = style.name;
    select.appendChild(option);
  }
  select.value = state.titleStyle;
}

// --- Pointer editing on the canvas ------------------------------------------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height,
  };
}

function panelAt(x, y) {
  const rects = panelRects(canvas.width, canvas.height, state.layoutId);
  return rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = panelAt(point.x, point.y);
  if (hit >= 0 && state.mode === 'panels') {
    selectedPanel = hit;
    refreshPanelLabel();
    redraw();
  }
  const crop = activeCrop();
  const img = crop && photos[crop.photo];
  if (!img) return;
  const rect = state.mode === 'spread'
    ? { x: 0, y: 0, w: canvas.width, h: canvas.height }
    : panelRects(canvas.width, canvas.height, state.layoutId)[selectedPanel];
  const place = photoPlacement(img, rect.x, rect.y, rect.w, rect.h, crop);
  drag = { crop, startX: event.clientX, startY: event.clientY, panX: crop.panX, panY: crop.panY, place, scaleX: point.scaleX, scaleY: point.scaleY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const dx = (event.clientX - drag.startX) * drag.scaleX;
  const dy = (event.clientY - drag.startY) * drag.scaleY;
  drag.crop.panX = Math.min(1, Math.max(0, drag.panX - dx / drag.place.overflowX));
  drag.crop.panY = Math.min(1, Math.max(0, drag.panY - dy / drag.place.overflowY));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (event) => {
  const point = canvasPoint(event);
  const hit = panelAt(point.x, point.y);
  if (hit >= 0 && state.mode === 'panels') selectedPanel = hit;
  const crop = activeCrop();
  if (!crop || !photos[crop.photo]) return;
  event.preventDefault();
  crop.zoom = Math.min(4, Math.max(1, crop.zoom * Math.exp(-event.deltaY * 0.0012)));
  zoomRange.value = String(crop.zoom);
  refreshPanelLabel();
  redraw();
}, { passive: false });

// --- Wiring -----------------------------------------------------------------

document.getElementById('photoInput').addEventListener('change', async (event) => {
  for (const file of event.target.files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    const index = addPhoto(img, file.name);
    if (state.mode === 'panels') {
      const empty = state.panels.findIndex((panel) => panel.photo < 0);
      if (empty >= 0) { selectedPanel = empty; placePhoto(index); }
    } else if (state.spread.photo < 0) {
      placePhoto(index);
    }
  }
  refreshPanelLabel();
  redraw();
});

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  for (const file of event.dataTransfer.files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    addPhoto(img, file.name);
  }
  redraw();
});

document.getElementById('sampleButton').addEventListener('click', async () => {
  await loadSamples();
  setStatus('Sample photos added to the pool.');
  redraw();
});

document.getElementById('modePanels').addEventListener('click', () => setMode('panels'));
document.getElementById('modeSpread').addEventListener('click', () => setMode('spread'));
function setMode(mode) {
  state.mode = mode;
  document.getElementById('modePanels').classList.toggle('active', mode === 'panels');
  document.getElementById('modeSpread').classList.toggle('active', mode === 'spread');
  refreshPanelLabel();
  redraw();
}

document.getElementById('captionInput').addEventListener('input', (event) => { state.caption = event.target.value; redraw(); });
document.getElementById('taglineInput').addEventListener('input', (event) => { state.tagline = event.target.value; redraw(); });
document.getElementById('titleStyleSelect').addEventListener('change', (event) => { state.titleStyle = event.target.value; redraw(); });
document.getElementById('captionPosSelect').addEventListener('change', (event) => { state.captionPos = event.target.value; redraw(); });
zoomRange.addEventListener('input', () => {
  const crop = activeCrop();
  if (crop) { crop.zoom = Number(zoomRange.value); redraw(); }
});
document.getElementById('resetCropButton').addEventListener('click', () => {
  const crop = activeCrop();
  if (crop) { crop.zoom = 1; crop.panX = 0.5; crop.panY = 0.5; zoomRange.value = '1'; redraw(); }
});
document.getElementById('clearPanelButton').addEventListener('click', () => {
  const crop = activeCrop();
  if (crop) { crop.photo = -1; redraw(); }
});
document.getElementById('exportButton').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-panels-${canvas.width}x${canvas.height}.png`;
    a.click();
    setStatus(`Saved ${a.download} — ready to post.`);
  }, 'image/png');
});

// --- Shot scenes and boot -----------------------------------------------------

async function applyShotScene(scene) {
  state.layoutId = scene.layoutId;
  state.gradeId = scene.gradeId;
  state.mode = scene.mode;
  state.caption = scene.caption;
  state.tagline = scene.tagline;
  state.titleStyle = scene.titleStyle;
  state.captionPos = scene.captionPos;
  canvas.width = scene.w;
  canvas.height = scene.h;
  fitPanelsToLayout();
  const names = scene.mode === 'spread' ? [scene.spreadSample] : scene.panelSamples;
  const indexByName = new Map();
  for (const name of names) {
    if (!name || indexByName.has(name)) continue;
    const img = await loadImage(`samples/${name}.jpg`);
    indexByName.set(name, addPhoto(img, name));
  }
  if (scene.mode === 'spread') {
    state.spread.photo = indexByName.get(scene.spreadSample) ?? 0;
    state.spread.zoom = 1.05;
  } else {
    scene.panelSamples.forEach((name, i) => {
      if (state.panels[i] && name) state.panels[i].photo = indexByName.get(name) ?? -1;
    });
    // Frame each panel on the interesting part of its photo: faces high in the
    // wide panel, a detail crop in the small one, the sea band along the foot.
    const shotCrops = {
      1: { panY: 0.12 },
      3: { zoom: 1.7, panX: 0.25, panY: 0.6 },
      4: { zoom: 1.15, panX: 0.5, panY: 0.35 },
    };
    for (const [i, crop] of Object.entries(shotCrops)) {
      if (state.panels[i]) Object.assign(state.panels[i], crop);
    }
  }
  if (scene.kind === 'cover') document.body.classList.add('shot-cover');
  refreshPanelLabel();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

buildLayoutButtons();
buildGradeButtons();
buildSizeButtons();
buildTitleStyleOptions();
fitPanelsToLayout();
refreshPanelLabel();
redraw();

const scene = parseShotScene(new URLSearchParams(location.search));
if (scene) {
  applyShotScene(scene);
} else {
  loadSamples().then(applyDefaultScene);
}
