// Panel templates for the cover. Each panel is a rectangle in unit space (x, y, w, h as
// fractions of the canvas), so the same layout works at every export size. The panel
// flagged `hero` is the big one the eye lands on first; the editor pre-fills it first.

export const LAYOUTS = [
  {
    id: 'poster-grid',
    name: 'Poster Grid',
    panels: [
      { x: 0, y: 0, w: 0.54, h: 1, hero: true },
      { x: 0.54, y: 0, w: 0.46, h: 0.42 },
      { x: 0.54, y: 0.42, w: 0.23, h: 0.3 },
      { x: 0.77, y: 0.42, w: 0.23, h: 0.3 },
      { x: 0.54, y: 0.72, w: 0.46, h: 0.28 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    panels: [
      { x: 0, y: 0, w: 0.32, h: 1 },
      { x: 0.32, y: 0, w: 0.36, h: 1, hero: true },
      { x: 0.68, y: 0, w: 0.32, h: 1 },
    ],
  },
  {
    id: 'split-duo',
    name: 'Split Duo',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1, hero: true },
      { x: 0.58, y: 0, w: 0.42, h: 1 },
    ],
  },
  {
    id: 'full-hero',
    name: 'Full Hero',
    panels: [{ x: 0, y: 0, w: 1, h: 1, hero: true }],
  },
];

/** The layout with this id, or the first layout when the id is unknown. */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}
