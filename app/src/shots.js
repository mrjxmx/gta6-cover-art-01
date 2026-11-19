// Fixed scenes for screenshots, driven by the page's query string. ?shot=cover
// shows one exported cover full-screen; ?shot=editor shows the studio with a
// scene loaded. The scene names sample photos (samples/<name>.jpg) per panel,
// or one sample to spread, plus the layout, grade, caption and canvas size.
// The capture script waits for window.__shotReady, set by main.js once the
// scene is painted. Without a ?shot= parameter this returns null and the
// studio opens on its default scene instead.

export function parseShotScene(params) {
  const kind = params.get('shot');
  if (!kind) return null;
  const [w, h] = (params.get('size') ?? '1920x1080').split('x').map((n) => Number(n) || 0);
  return {
    kind,
    w: w || 1920,
    h: h || 1080,
    layoutId: params.get('layout') ?? 'poster-grid',
    gradeId: params.get('grade') ?? 'vice',
    mode: params.get('mode') ?? 'panels',
    panelSamples: (params.get('panels') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    spreadSample: params.get('spread') ?? '',
    caption: params.get('caption') ?? 'Vice Heat',
    tagline: params.get('tagline') ?? '',
    titleStyle: params.get('style') ?? 'sunset',
    captionPos: params.get('pos') ?? 'bottom',
  };
}
