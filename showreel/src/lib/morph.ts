/**
 * Shape-morph engine. Every shape is sampled RADIALLY at the same N angles
 * (starting at 12 o'clock, clockwise), so any two shapes morph point-for-point
 * without twisting. N = 120 lands exactly on the corners of 3/4/5/6-sided shapes.
 */
export const N = 120;
export type Pts = [number, number][];

const angles = Array.from(
  { length: N },
  (_, i) => -Math.PI / 2 + (i / N) * Math.PI * 2,
);

/** Intersect a ray from the origin with a closed polygon; return the nearest distance. */
const rayPolygon = (theta: number, verts: Pts): number => {
  const dx = Math.cos(theta);
  const dy = Math.sin(theta);
  let best = Infinity;
  for (let i = 0; i < verts.length; i++) {
    const [x1, y1] = verts[i];
    const [x2, y2] = verts[(i + 1) % verts.length];
    const ex = x2 - x1;
    const ey = y2 - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ey - y1 * ex) / den; // distance along ray
    const u = (x1 * dy - y1 * dx) / den; // position along edge
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.min(best, t);
  }
  return best;
};

const fromVerts = (verts: Pts): Pts =>
  angles.map((a) => {
    const r = rayPolygon(a, verts);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

const regular = (sides: number, r: number, rot = -Math.PI / 2): Pts =>
  Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });

export const SHAPES = {
  circle: (r = 1): Pts => angles.map((a) => [Math.cos(a) * r, Math.sin(a) * r]),
  square: (r = 1): Pts =>
    fromVerts(regular(4, r * Math.SQRT2 * 0.86, -Math.PI / 4)),
  diamond: (r = 1): Pts => fromVerts(regular(4, r * 1.15)),
  triangle: (r = 1): Pts => fromVerts(regular(3, r * 1.3)),
  hexagon: (r = 1): Pts => fromVerts(regular(6, r * 1.05)),
  star: (r = 1, points = 5, inner = 0.45): Pts =>
    fromVerts(
      Array.from({ length: points * 2 }, (_, i) => {
        const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
        const rr = i % 2 === 0 ? r * 1.25 : r * 1.25 * inner;
        return [Math.cos(a) * rr, Math.sin(a) * rr] as [number, number];
      }),
    ),
  plus: (r = 1, w = 0.36): Pts =>
    fromVerts(
      (
        [
          [-w, -1],
          [w, -1],
          [w, -w],
          [1, -w],
          [1, w],
          [w, w],
          [w, 1],
          [-w, 1],
          [-w, w],
          [-1, w],
          [-1, -w],
          [-w, -w],
        ] as Pts
      ).map(([x, y]) => [x * r, y * r]),
    ),
} as const;

export type ShapeName = keyof typeof SHAPES;

export const morph = (a: Pts, b: Pts, t: number): Pts =>
  a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);

export const toPath = (p: Pts, scale = 1): string =>
  `M${p.map(([x, y]) => `${(x * scale).toFixed(2)} ${(y * scale).toFixed(2)}`).join("L")}Z`;
