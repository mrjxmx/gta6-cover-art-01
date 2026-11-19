// Renders a cover onto a 2D context at any size. The editor's preview and the PNG
// export are the same drawing: renderCover(ctx, w, h, state, photos) paints the
// panels of the chosen layout, the photo in each (or one photo spread across all
// of them), the colour grade's washes, a vignette per panel, and the caption in
// heavy poster lettering with an outline, a gradient fill and a drop shadow.

import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';

export const EXPORT_SIZES = [
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
];

// The caption typeface: heavy system faces only, nothing shipped and nothing taken
// from a game. Arial Black / Impact carry the poster weight on every desktop.
const TITLE_FONT_STACK = '"Arial Black", Impact, "Franklin Gothic Heavy", "Segoe UI", Arial, sans-serif';

// Caption fills. `stops` paints a vertical gradient across the caption block;
// `plain` is a solid fill. Every style gets a near-black outline.
export const TITLE_STYLES = [
  { id: 'sunset', name: 'Sunset', stops: [[0, '#ffe259'], [0.55, '#ff7518'], [1, '#ff2e88']], outline: '#2b0a2e' },
  { id: 'ice', name: 'Ice', stops: [[0, '#ffffff'], [1, '#a8e6ff']], outline: '#0b1e3a' },
  { id: 'neon', name: 'Neon', stops: [[0, '#67f6ff'], [1, '#ff71ce']], outline: '#160030' },
  { id: 'gold', name: 'Gold', stops: [[0, '#fff3b0'], [1, '#f5b921']], outline: '#241a02' },
  { id: 'plain', name: 'White', plain: '#ffffff', outline: '#111111' },
];

/** The title style with this id, or the first style when the id is unknown. */
export function titleStyleById(id) {
  return TITLE_STYLES.find((style) => style.id === id) ?? TITLE_STYLES[0];
}

/** A fresh crop state for one panel: no photo, no zoom, centred. */
export function blankCrop() {
  return { photo: -1, zoom: 1, panX: 0.5, panY: 0.5 };
}

/** The white gutter between panels, in pixels, for a canvas of this width. */
export function gutterFor(w) {
  return Math.max(6, Math.round(w * 0.009));
}

/**
 * The panel rectangles of a layout on a w x h canvas, in pixels, each inset by
 * half the gutter so panels sit in a white frame like a printed poster. The
 * editor hit-tests with these same rectangles, so what you click is what you see.
 */
export function panelRects(w, h, layoutId) {
  const half = gutterFor(w) / 2;
  return layoutById(layoutId).panels.map((panel) => ({
    x: panel.x * w + half,
    y: panel.y * h + half,
    w: panel.w * w - half * 2,
    h: panel.h * h - half * 2,
    hero: Boolean(panel.hero),
  }));
}

/**
 * Where a photo lands inside a target rectangle: scaled to cover it, multiplied
 * by the crop's zoom, and slid by the crop's pan (0..1 across the overflow).
 * Returns the drawImage rectangle plus the overflow, which dragging divides by.
 */
export function photoPlacement(img, rx, ry, rw, rh, crop) {
  const fit = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
  const scale = fit * crop.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  return {
    x: rx + (rw - dw) * crop.panX,
    y: ry + (rh - dh) * crop.panY,
    w: dw,
    h: dh,
    overflowX: Math.max(1, dw - rw),
    overflowY: Math.max(1, dh - rh),
  };
}

/** Paints one grade wash (a unit-space gradient) inside a clipped panel. */
function paintWash(ctx, wash, rect) {
  const gradient = ctx.createLinearGradient(
    rect.x + wash.from[0] * rect.w,
    rect.y + wash.from[1] * rect.h,
    rect.x + wash.to[0] * rect.w,
    rect.y + wash.to[1] * rect.h,
  );
  for (const [at, colour] of wash.stops) gradient.addColorStop(at, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** A soft dark edge inside a panel, so each panel reads as its own photograph. */
function paintVignette(ctx, rect) {
  const radius = Math.max(rect.w, rect.h) * 0.72;
  const gradient = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, radius * 0.45,
    rect.x + rect.w / 2, rect.y + rect.h / 2, radius,
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** The empty-panel placeholder: a dusk gradient and a quiet instruction. */
function paintEmptyPanel(ctx, rect, index) {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  gradient.addColorStop(0, '#3a2b52');
  gradient.addColorStop(1, '#1d1430');
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = `700 ${Math.max(13, rect.w * 0.055)}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.font = `900 ${rect.h * 0.5}px ${TITLE_FONT_STACK}`;
  ctx.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/**
 * Paints one panel: the photo (graded), the grade's washes and the vignette,
 * all clipped to the panel rectangle. In spread mode the placement is computed
 * against the whole canvas, so one photograph runs unbroken behind the gutters.
 */
function paintPanel(ctx, rect, index, state, photos, canvas) {
  const grade = gradeById(state.gradeId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  let img = null;
  let place = null;
  if (state.mode === 'spread') {
    img = photos[state.spread.photo] ?? null;
    if (img) place = photoPlacement(img, 0, 0, canvas.w, canvas.h, state.spread);
  } else {
    const crop = state.panels[index] ?? blankCrop();
    img = photos[crop.photo] ?? null;
    if (img) place = photoPlacement(img, rect.x, rect.y, rect.w, rect.h, crop);
  }
  if (img && place) {
    ctx.filter = grade.filter;
    ctx.drawImage(img, place.x, place.y, place.w, place.h);
    ctx.filter = 'none';
  } else {
    paintEmptyPanel(ctx, rect, index);
  }
  for (const wash of grade.washes) paintWash(ctx, wash, rect);
  paintVignette(ctx, rect);
  ctx.restore();
}

/**
 * The caption: stacked lines of heavy capitals, sheared a few degrees like a
 * poster masthead, each line stroked thick and filled with the style's gradient,
 * over a soft shadow. The block hugs the bottom (or top) edge and shrinks until
 * its widest line fits. A tagline rides above it in spaced small capitals.
 */
function paintCaption(ctx, w, h, state) {
  const lines = state.caption.split('\n').map((line) => line.trim().toUpperCase()).filter(Boolean);
  const tagline = state.tagline.trim().toUpperCase();
  if (!lines.length && !tagline) return;
  const style = titleStyleById(state.titleStyle);
  let size = h * (w >= h ? 0.145 : 0.105);
  const setFont = () => { ctx.font = `900 ${size}px ${TITLE_FONT_STACK}`; };
  setFont();
  const widest = () => Math.max(...lines.map((line) => ctx.measureText(line).width), 1);
  while (lines.length && widest() > w * 0.92 && size > 14) {
    size -= 2;
    setFont();
  }
  const lineHeight = size * 0.96;
  const tagSize = Math.max(15, size * 0.21);
  const tagGap = tagline ? tagSize * 1.5 : 0;
  const blockH = lines.length * lineHeight + tagGap;
  const margin = h * 0.05;
  const bottom = state.captionPos === 'top' ? margin + blockH : h - margin;
  const left = w * 0.045;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.045;

  if (tagline) {
    ctx.font = `700 ${tagSize}px "Segoe UI", Arial, sans-serif`;
    try { ctx.letterSpacing = `${tagSize * 0.34}px`; } catch { /* older canvas: no spacing */ }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const tagY = state.captionPos === 'top' ? margin + tagSize : bottom - blockH + tagSize;
    ctx.fillText(tagline, left, tagY);
    try { ctx.letterSpacing = '0px'; } catch { /* no-op */ }
  }

  setFont();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const fill = style.plain ?? (() => {
    const gradient = ctx.createLinearGradient(0, bottom - blockH, 0, bottom);
    for (const [at, colour] of style.stops) gradient.addColorStop(at, colour);
    return gradient;
  })();
  lines.forEach((line, i) => {
    const baseline = bottom - (lines.length - 1 - i) * lineHeight;
    ctx.save();
    ctx.translate(left, baseline);
    ctx.transform(1, 0, -0.055, 1, 0, 0);
    ctx.strokeStyle = style.outline;
    ctx.lineWidth = size * 0.17;
    ctx.strokeText(line, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

/** Paints the whole cover: white gutters, the panels, then the caption. */
export function renderCover(ctx, w, h, state, photos) {
  ctx.fillStyle = '#f7f2e7';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(w, h, state.layoutId);
  rects.forEach((rect, index) => paintPanel(ctx, rect, index, state, photos, { w, h }));
  paintCaption(ctx, w, h, state);
}
