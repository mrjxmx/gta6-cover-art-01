// Colour grades. A grade is a CSS filter string applied to the photo as it is drawn,
// plus a set of washes: unit-space linear gradients painted over each panel so the
// whole cover shares one light. Wash stops are [position, colour] pairs and the
// from/to points are fractions of the panel, so a grade looks the same at any size.

export const GRADES = [
  {
    id: 'vice',
    name: 'Vice Sunset',
    filter: 'saturate(1.38) contrast(1.09) brightness(1.04)',
    washes: [
      {
        from: [0, 0],
        to: [0, 1],
        stops: [
          [0, 'rgba(43, 0, 92, 0.28)'],
          [0.38, 'rgba(43, 0, 92, 0)'],
          [0.74, 'rgba(255, 64, 120, 0.10)'],
          [1, 'rgba(255, 94, 58, 0.34)'],
        ],
      },
      {
        from: [0, 0],
        to: [1, 0],
        stops: [
          [0, 'rgba(255, 170, 60, 0.10)'],
          [0.55, 'rgba(255, 170, 60, 0)'],
          [1, 'rgba(0, 180, 255, 0.10)'],
        ],
      },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.16) brightness(0.95) hue-rotate(-10deg)',
    washes: [
      {
        from: [0, 0],
        to: [1, 1],
        stops: [
          [0, 'rgba(0, 229, 255, 0.16)'],
          [0.5, 'rgba(30, 0, 80, 0.05)'],
          [1, 'rgba(255, 0, 128, 0.24)'],
        ],
      },
      {
        from: [0, 1],
        to: [0, 0],
        stops: [
          [0, 'rgba(10, 0, 40, 0.30)'],
          [0.45, 'rgba(10, 0, 40, 0)'],
        ],
      },
    ],
  },
  {
    id: 'noir',
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(1.03)',
    washes: [
      {
        from: [0, 0],
        to: [0, 1],
        stops: [
          [0, 'rgba(0, 0, 0, 0.14)'],
          [0.4, 'rgba(0, 0, 0, 0)'],
          [1, 'rgba(0, 0, 0, 0.34)'],
        ],
      },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.22) sepia(0.28) contrast(1.06) brightness(1.05)',
    washes: [
      {
        from: [0, 0],
        to: [0, 1],
        stops: [
          [0, 'rgba(120, 60, 0, 0.10)'],
          [0.55, 'rgba(255, 160, 40, 0.04)'],
          [1, 'rgba(255, 110, 30, 0.26)'],
        ],
      },
    ],
  },
];

/** The grade with this id, or the first grade when the id is unknown. */
export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}
