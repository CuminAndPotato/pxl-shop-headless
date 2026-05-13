// Quad-to-quad projection math used by PixogramLibrary to map the rendered
// canvas onto an arbitrary quadrilateral defined by four photo-space corner
// points. Implementation is the standard Heckbert / Steven Wittens projective
// transform — see https://acko.net/blog/making-webgl-dance/ for derivation.
//
// Pure functions, no DOM dependencies, suitable for unit testing.

export type Corner = { x: number; y: number };
export type Corners = { tl: Corner; tr: Corner; bl: Corner; br: Corner };

function adj(m: number[]): number[] {
  return [
    m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
    m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
    m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3],
  ];
}

function multmm(a: number[], b: number[]): number[] {
  const c = new Array(9);
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      let cij = 0;
      for (let k = 0; k < 3; k += 1) cij += a[3*i+k] * b[3*k+j];
      c[3*i+j] = cij;
    }
  }
  return c;
}

function multmv(m: number[], v: number[]): number[] {
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2],
  ];
}

function basisToPoints(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number,
): number[] {
  const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1];
  const v = multmv(adj(m), [x4, y4, 1]);
  return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

/** Compute the 3×3 projective matrix that maps one quadrilateral to another. */
export function quadProjection(
  x1s: number, y1s: number, x1d: number, y1d: number,
  x2s: number, y2s: number, x2d: number, y2d: number,
  x3s: number, y3s: number, x3d: number, y3d: number,
  x4s: number, y4s: number, x4d: number, y4d: number,
): number[] {
  const s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
  const d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
  return multmm(d, adj(s));
}

/**
 * Build a CSS `matrix3d(...)` string that maps the rect (0,0)-(w,h) onto the
 * quadrilateral defined by `corners` (each corner expressed as % of w/h).
 * Returns the bare matrix3d() value ready to assign to `style.transform`.
 */
export function cornersToMatrix3d(corners: Corners, w: number, h: number): string {
  const px = (c: Corner) => ({ x: (c.x / 100) * w, y: (c.y / 100) * h });
  const tl = px(corners.tl), tr = px(corners.tr), bl = px(corners.bl), br = px(corners.br);
  const t = quadProjection(
    0, 0, tl.x, tl.y,
    w, 0, tr.x, tr.y,
    0, h, bl.x, bl.y,
    w, h, br.x, br.y,
  );
  for (let i = 0; i < 9; i += 1) t[i] = t[i] / t[8];
  return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
}
