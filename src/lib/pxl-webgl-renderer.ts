// WebGL renderer for the 24×24 LED panel used by Plus⁵.
//
// Replaces the previous 1152-div DOM grid (two stacked slots × 576 cells).
// One <canvas>, one WebGL context, one draw call per frame:
//
//   • Two 24×24 RGB textures (slot A + slot B) — pixogram frame uploads
//   • Fragment shader rebuilds the per-cell "LED bulb" look (radial hotspot
//     per cellStyle 0..9, rounded square mask, grid gap, off-cell tint)
//   • Cross-fade between slots happens in the shader via uOpacityA / uOpacityB
//     — no more z-stack juggling or two-canvas opacity dance
//
// The host page keeps the matrix3d perspective on the .hero__led-wrap and
// the bloom via CSS `filter` on the canvas; this module does not concern
// itself with either.

export type SlotKey = 'A' | 'B';

export interface PxlLedRendererOptions {
  /** Logical CSS size of the canvas (matrix3d targets this). Default 600. */
  baseSize?: number;
  /** Internal cells-per-side. The PXL Clock is 24. */
  cells?: number;
  /** Background colour for the gap/padding area, 0..1 floats. */
  bgColor?: [number, number, number];
  /** Colour an "off" cell falls back to (matches OFF_R/G/B in the host). */
  offColor?: [number, number, number];
}

const DEFAULTS: Required<PxlLedRendererOptions> = {
  baseSize: 600,
  cells: 24,
  bgColor: [5 / 255, 6 / 255, 8 / 255],
  offColor: [12 / 255, 13 / 255, 16 / 255],
};

// ─── Shaders ──────────────────────────────────────────────────────────────

const VERTEX_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // aPos is in clip space (-1..1). Flip Y so vUv (0..1) goes top→bottom,
  // matching the row-major frame layout uploaded into the texture.
  vUv = vec2((aPos.x + 1.0) * 0.5, (1.0 - aPos.y) * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// 10 new cell-styles — designed against real PXL Clock product photos
// (DSCF2381/DSCF2391 etc. in Produkt/Produktbilder/Wabaki/PRODUCT).
// The real cells are mostly-filled squares with subtle edge vignette
// and visible halo bleed between neighbours — not soft "round LED bulb"
// gradients like the old DOM-era CSS gradients pretended.
//
//   0 Plate     — full-fill square, subtle 8% edge vignette (= reality)
//   1 Halo      — Plate + additive bleed from 4 neighbour cells
//   2 Glass     — Plate + top-left diffusor sheen (studio-light hint)
//   3 Hard Pixel — uniform fill, sharp edges, no vignette, no rounding
//   4 CRT       — vertical R/G/B subpixel stripes + horizontal scanline
//   5 Tile      — Plate with a thick inner black frame (mosaic vibe)
//   6 Bulb      — bright hot core, darker body — round, like a lit bulb
//   7 Nebula    — strong neighbour bleed, dimmed cell — diffuse cloud
//   8 Phosphor  — tiny white core + colour ring on black — neon/CRT dot
//   9 Wireframe — only the cell outline is coloured (debug / spec view)
const FRAGMENT_SRC = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uOpacityA;
uniform float uOpacityB;
uniform int uTopIsB;          // 0 = A on top, 1 = B on top (z-stack control)
uniform int uCellStyle;       // 0..9 — see header table
uniform int uEnabled;         // 0 = display off (uniform off-tint), 1 = on
uniform float uPaddingFrac;
uniform float uGapFrac;
uniform vec3 uBgColor;
uniform vec3 uOffColor;

const float CELLS = 24.0;
const float INV_SQRT_HALF = 1.41421356;   // 1 / sqrt(0.5)

// ── Slot composition: same logic, used both for the centre cell and
//    for neighbour-sample lookups by the Halo / Nebula styles.
vec3 composeSlots(vec3 colA, vec3 colB) {
  vec3 base = uOffColor;
  if (uTopIsB == 1) {
    return mix(mix(base, colA, uOpacityA), colB, uOpacityB);
  }
  return mix(mix(base, colB, uOpacityB), colA, uOpacityA);
}

// Sample one cell's composed colour at texture-coordinate tc.
vec3 sampleCell(vec2 tc) {
  vec3 a = texture2D(uTexA, tc).rgb;
  vec3 b = texture2D(uTexB, tc).rgb;
  return composeSlots(a, b);
}

// ── Per-style colour mapping. Each function takes the cell's composed
//    colour + the local 0..1 uv inside the cell + the cell's global
//    index (so gradient origins can drift perspectively with position)
//    and returns the final fragment colour.
//
// Design principle for this generation: use MULTIPLICATIVE gradients,
// not additive overlays. base * factor with factor swinging both
// above 1.0 (brighten) and below 1.0 (darken) gives proper 3D-pixel
// feel — bright cores read as raised, dark edges read as recessed,
// the cell colour shapes itself instead of being whitewashed.
//
// Variety comes from the GRADIENT GEOMETRY (linear / radial / rim /
// two-tone / inset), not from stacking transparent overlays.

// ── Helpers ────────────────────────────────────────────────────────

// Linear multiplier along an axis. dir is the gradient direction in
// cell-uv space; the brighter end (hi) sits opposite the dir vector
// (so dir = (0,1) means "top is bright, bottom is dim"). hi ≥ 1 ≥ lo.
float linearMul(vec2 cuv, vec2 dir, float hi, float lo) {
  float t = dot(cuv - vec2(0.5), normalize(dir)) + 0.5;
  return mix(hi, lo, clamp(t, 0.0, 1.0));
}

// Radial multiplier around the centre. peak is the factor at the
// centre, edge is at the maximum-radius point. Smoothstep falloff so
// the gradient reads as a soft bowl, not a hard spotlight.
float radialMul(vec2 cuv, vec2 center, float peak, float edge, float radius) {
  vec2 d = cuv - center;
  float r = length(d);
  float t = smoothstep(0.0, radius, r);
  return mix(peak, edge, t);
}

// Inverse-edge multiplier: bright at the cell border, dim toward the
// centre. Reads as a "rim light" effect.
float rimMul(vec2 cuv, float rim, float body, float band) {
  float edge = min(min(cuv.x, 1.0 - cuv.x), min(cuv.y, 1.0 - cuv.y));
  return mix(rim, body, smoothstep(0.0, band, edge));
}

// Inset-shadow multiplier: a dark band hugging the cell border,
// transitioning quickly to full brightness inside. Reads like a
// pocket shadow around a recessed LED.
float insetMul(vec2 cuv, float dim, float band) {
  float edge = min(min(cuv.x, 1.0 - cuv.x), min(cuv.y, 1.0 - cuv.y));
  return mix(dim, 1.0, smoothstep(0.0, band, edge));
}

// Perspective-shifted radial centre. Cells left of the panel midline
// see the gradient origin nudged right inside their cell, etc.
vec2 perspectiveCenter(vec2 cellIdx, float strength) {
  vec2 cellPos = (cellIdx - vec2(11.5)) / 11.5;
  return vec2(0.5) + cellPos * vec2(-strength, -strength * 0.7);
}

// ── Effects ─────────────────────────────────────────────────────────

// 0 — Lift. Vertical linear: top is brighter, bottom is dimmer.
vec3 liftColor(vec3 base, vec2 cuv) {
  float m = linearMul(cuv, vec2(0.0, -1.0), 1.30, 0.80);
  return base * m;
}

// 1 — Diag. Diagonal linear: top-left brightest, bottom-right dimmest.
vec3 diagColor(vec3 base, vec2 cuv) {
  float m = linearMul(cuv, vec2(-1.0, -1.0), 1.35, 0.72);
  return base * m;
}

// 2 — Bowl. Radial: centre lifted, edges sunk.
vec3 bowlColor(vec3 base, vec2 cuv) {
  float m = radialMul(cuv, vec2(0.5), 1.32, 0.72, 0.65);
  return base * m;
}

// 3 — Tilt. Bowl with a perspective shift on the bowl centre —
//      gradient origin walks across the panel.
vec3 tiltColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.18);
  float m = radialMul(cuv, c, 1.32, 0.72, 0.65);
  return base * m;
}

// 4 — Rim. Bright border, slightly dimmed body. Edge-light effect.
vec3 rimColor(vec3 base, vec2 cuv) {
  float m = rimMul(cuv, 1.22, 0.90, 0.18);
  return base * m;
}

// 5 — Halo. Soft radial multiply + axial neighbour-colour bleed.
vec3 haloColor(vec3 base, vec2 cuv, vec3 neighbourGlow) {
  float m = radialMul(cuv, vec2(0.5, 0.42), 1.18, 0.85, 0.70);
  return base * m + neighbourGlow * 0.22;
}

// 6 — Inset. Body at full brightness, sharp dark band along the cell
//      border (recessed-LED-in-pocket look).
vec3 insetColor(vec3 base, vec2 cuv) {
  float m = insetMul(cuv, 0.55, 0.10);
  return base * m;
}

// 7 — Split. Two-tone vertical: top half boosted, bottom half dimmed
//      with a steep transition through the middle.
vec3 splitColor(vec3 base, vec2 cuv) {
  float t = smoothstep(0.42, 0.58, cuv.y);
  float m = mix(1.20, 0.82, t);
  return base * m;
}

// 8 — Soft. Gentle radial, perspective-shifted, low contrast.
vec3 softColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.06);
  float m = radialMul(cuv, c, 1.12, 0.88, 0.85);
  return base * m;
}

// 9 — Glass. Bowl with perspective + a diagonal additive sheen strip
//      (the one thing Ronald liked from the previous generation).
vec3 glassColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.08);
  float m = radialMul(cuv, c, 1.25, 0.78, 0.72);
  vec3 col = base * m;
  float sheen = clamp(dot(vec2(1.0) - cuv, vec2(0.7, 0.55)) - 0.35, 0.0, 1.0);
  sheen = pow(sheen, 1.8) * 0.16;
  return col + vec3(sheen);
}

// ── Tilt variations ─────────────────────────────────────────────────
// Same perspective-Bowl shape as Tilt (style 3); knobs differ on three
// independent axes: contrast (peak / edge), falloff width (radius),
// and how far the gradient origin walks with cell position.

// 10 — Smooth. Lower contrast, wider falloff. Bowl reads as a hint.
vec3 tiltSmoothColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.18);
  float m = radialMul(cuv, c, 1.20, 0.82, 0.90);
  return base * m;
}

// 13 — Mid. Halfway between Tilt (3) and Smooth (10) on all three
//       axes: contrast (peak/edge), falloff radius, perspective stays.
vec3 tiltMidColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.18);
  float m = radialMul(cuv, c, 1.26, 0.77, 0.78);
  return base * m;
}

// 11 — Deep. Higher contrast, tighter focus. Dramatic 3D feel.
vec3 tiltDeepColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.18);
  float m = radialMul(cuv, c, 1.45, 0.62, 0.55);
  return base * m;
}

// 12 — Wide. Same gradient as Tilt, but the perspective shift is
//      pushed harder so cells further from centre show the hotspot
//      visibly shoved aside.
vec3 tiltWideColor(vec3 base, vec2 cuv, vec2 cellIdx) {
  vec2 c = perspectiveCenter(cellIdx, 0.30);
  float m = radialMul(cuv, c, 1.30, 0.74, 0.68);
  return base * m;
}

vec3 applyStyle(vec3 base, vec2 cuv, vec2 cellIdx, vec3 neighbourGlow, int style) {
  if (style == 1) return diagColor(base, cuv);
  if (style == 2) return bowlColor(base, cuv);
  if (style == 3) return tiltColor(base, cuv, cellIdx);
  if (style == 4) return rimColor(base, cuv);
  if (style == 5) return haloColor(base, cuv, neighbourGlow);
  if (style == 6) return insetColor(base, cuv);
  if (style == 7) return splitColor(base, cuv);
  if (style == 8) return softColor(base, cuv, cellIdx);
  if (style == 9) return glassColor(base, cuv, cellIdx);
  if (style == 10) return tiltSmoothColor(base, cuv, cellIdx);
  if (style == 11) return tiltDeepColor(base, cuv, cellIdx);
  if (style == 12) return tiltWideColor(base, cuv, cellIdx);
  if (style == 13) return tiltMidColor(base, cuv, cellIdx);
  return liftColor(base, cuv); // 0 — Lift (default)
}

// Per-style corner radius. Inset already paints its own dark border so
// it gets sharp corners; the others use a subtle 5 % rounding.
float cornerRadiusForStyle(int style) {
  if (style == 6) return 0.0;   // Inset (its own border)
  return 0.05;
}

// Rounded-rectangle mask in cell-local uv (cuv ∈ [0,1]²).
// cr is the corner radius in the same units (e.g. 0.08 = 8 %).
float roundedRectMask(vec2 cuv, float cr) {
  vec2 q = abs(cuv - 0.5) - vec2(0.5 - cr);
  float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cr;
  return 1.0 - smoothstep(0.0, 0.02, sdf);
}

// Compute (cellIndex, cellUv) for a coordinate inside the inner grid
// region. coord is 0..1 across the inner area, cells is the cell count,
// gapFrac is the gap width in the SAME 0..1 inner space. Returns
// cellIdx (rounded) and cellUv (0..1 within the cell, NaN-safe). The
// gap status is conveyed by cellUv: if .x or .y leaves [0,1] the
// fragment is inside the gap. Caller checks.
//
// Layout: cells * cellSize + (cells-1) * gap = 1.0   →   cellSize = (1 - (cells-1)*gap) / cells
void cellLookup(vec2 inner, float gap, out vec2 cellIdx, out vec2 cellUv, out vec2 gapMask) {
  float cellSize = (1.0 - (CELLS - 1.0) * gap) / CELLS;
  // NOTE: don't name this 'step' — it shadows the built-in step() function.
  float cellStep = cellSize + gap;
  vec2 idx = floor(inner / cellStep);
  // The last cell has no gap after it; clamp the index so a fragment
  // sitting AT the trailing edge still maps to cell 23.
  idx = clamp(idx, vec2(0.0), vec2(CELLS - 1.0));
  vec2 within = inner - idx * cellStep;
  // within ∈ [0, cellSize+gap]; values > cellSize fall into the gap.
  cellIdx = idx;
  cellUv = within / cellSize;
  gapMask = step(within, vec2(cellSize));
}

void main() {
  // Step 1: clip to inner grid area (padding strip around the edge).
  vec2 inner = (vUv - vec2(uPaddingFrac)) / (1.0 - 2.0 * uPaddingFrac);
  if (any(lessThan(inner, vec2(0.0))) || any(greaterThan(inner, vec2(1.0)))) {
    gl_FragColor = vec4(uBgColor, 1.0);
    return;
  }

  vec2 cellIdx;
  vec2 cellUv;
  vec2 gapMask;
  cellLookup(inner, uGapFrac, cellIdx, cellUv, gapMask);

  // Gap fragment? bg colour.
  if (gapMask.x * gapMask.y < 0.5) {
    gl_FragColor = vec4(uBgColor, 1.0);
    return;
  }

  // Off-state short-circuit: uniform off-tint across the whole panel,
  // no neighbour fetches, no style work. Single early return.
  if (uEnabled == 0) {
    gl_FragColor = vec4(uOffColor, 1.0);
    return;
  }

  // Step 2: sample the centre cell (composed across both slots).
  vec2 tc = (cellIdx + 0.5) / CELLS;
  vec3 cell = sampleCell(tc);

  // Step 3: neighbour-glow lookup, only for Halo (style 5). For all
  // other styles this code path is skipped, so the texture fetches
  // don't happen at all.
  vec3 neighbourGlow = vec3(0.0);
  if (uCellStyle == 5) {
    float texel = 1.0 / CELLS;
    vec3 nL = sampleCell(tc + vec2(-texel, 0.0));
    vec3 nR = sampleCell(tc + vec2( texel, 0.0));
    vec3 nU = sampleCell(tc + vec2(0.0, -texel));
    vec3 nD = sampleCell(tc + vec2(0.0,  texel));
    neighbourGlow = (nL + nR + nU + nD) * 0.25;
  }

  // Step 4: per-style colour transform. cellIdx feeds the perspective
  // shift of the top-highlight (different cells get different highlight
  // centres based on their position in the grid).
  cell = applyStyle(cell, cellUv, cellIdx, neighbourGlow, uCellStyle);

  // Step 5: rounded-corner mask — subtle 5% for every style except
  // Sharp (style 9 = 0 % corners). The mask blends the cell colour
  // against the panel bg in the rounded outside region.
  float cornerRad = cornerRadiusForStyle(uCellStyle);
  float mask = roundedRectMask(cellUv, cornerRad);
  cell = mix(uBgColor, cell, mask);

  gl_FragColor = vec4(cell, 1.0);
}
`;

// ─── Implementation ────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('createShader failed');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? '?';
    gl.deleteShader(sh);
    throw new Error('shader compile: ' + log);
  }
  return sh;
}

function linkProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error('createProgram failed');
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) ?? '?';
    gl.deleteProgram(p);
    throw new Error('program link: ' + log);
  }
  return p;
}

interface Uniforms {
  uTexA: WebGLUniformLocation;
  uTexB: WebGLUniformLocation;
  uOpacityA: WebGLUniformLocation;
  uOpacityB: WebGLUniformLocation;
  uTopIsB: WebGLUniformLocation;
  uCellStyle: WebGLUniformLocation;
  uEnabled: WebGLUniformLocation;
  uPaddingFrac: WebGLUniformLocation;
  uGapFrac: WebGLUniformLocation;
  uBgColor: WebGLUniformLocation;
  uOffColor: WebGLUniformLocation;
}

function getUniform(gl: WebGLRenderingContext, prog: WebGLProgram, name: string): WebGLUniformLocation {
  const loc = gl.getUniformLocation(prog, name);
  if (!loc) throw new Error('uniform missing: ' + name);
  return loc;
}

export class PxlLedRenderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private uni: Uniforms;
  private texA: WebGLTexture;
  private texB: WebGLTexture;
  private vbo: WebGLBuffer;
  private opts: Required<PxlLedRendererOptions>;

  // Cached uniform values — skip uniform writes when nothing changed.
  private vOpacityA = 0;
  private vOpacityB = 0;
  private vTopIsB = -1;
  private vCellStyle = -1;
  private vEnabled = -1;
  private vGapFrac = -1;

  private dirty = true;
  private rafScheduled = false;

  /** Persistent CPU mirror of each slot — written into on every uploadFrame
   *  call so we can re-upload after a context loss without losing pixels.
   *  Also used to short-circuit redundant uploads. */
  private mirrorA: Uint8Array;
  private mirrorB: Uint8Array;
  private mirrorADirty = true;
  private mirrorBDirty = true;

  constructor(canvas: HTMLCanvasElement, options: PxlLedRendererOptions = {}) {
    this.opts = { ...DEFAULTS, ...options };
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    this.prog = linkProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    this.uni = {
      uTexA: getUniform(gl, this.prog, 'uTexA'),
      uTexB: getUniform(gl, this.prog, 'uTexB'),
      uOpacityA: getUniform(gl, this.prog, 'uOpacityA'),
      uOpacityB: getUniform(gl, this.prog, 'uOpacityB'),
      uTopIsB: getUniform(gl, this.prog, 'uTopIsB'),
      uCellStyle: getUniform(gl, this.prog, 'uCellStyle'),
      uEnabled: getUniform(gl, this.prog, 'uEnabled'),
      uPaddingFrac: getUniform(gl, this.prog, 'uPaddingFrac'),
      uGapFrac: getUniform(gl, this.prog, 'uGapFrac'),
      uBgColor: getUniform(gl, this.prog, 'uBgColor'),
      uOffColor: getUniform(gl, this.prog, 'uOffColor'),
    };

    // Full-screen quad: two triangles covering -1..1.
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vbo = gl.createBuffer();
    if (!vbo) throw new Error('createBuffer failed');
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    this.vbo = vbo;

    // Two 24×24 RGB textures — one per slot. NEAREST so the pixel grid
    // stays crisp; the texture is read by cell-centre coords anyway.
    this.texA = this.makeCellTexture();
    this.texB = this.makeCellTexture();

    const cells = this.opts.cells;
    this.mirrorA = new Uint8Array(cells * cells * 3);
    this.mirrorB = new Uint8Array(cells * cells * 3);
    // Seed mirrors with the "off" colour so the initial blit isn't pure
    // black — matches the JS side's OFF_R/OFF_G/OFF_B defaults.
    const [or, og, ob] = this.opts.offColor;
    const sr = Math.round(or * 255);
    const sg = Math.round(og * 255);
    const sb = Math.round(ob * 255);
    for (let i = 0; i < cells * cells; i += 1) {
      this.mirrorA[i * 3] = sr;
      this.mirrorA[i * 3 + 1] = sg;
      this.mirrorA[i * 3 + 2] = sb;
      this.mirrorB[i * 3] = sr;
      this.mirrorB[i * 3 + 1] = sg;
      this.mirrorB[i * 3 + 2] = sb;
    }

    // One-time setup that doesn't change per frame.
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this.uni.uTexA, 0);
    gl.uniform1i(this.uni.uTexB, 1);
    gl.uniform1f(this.uni.uPaddingFrac, 4.0 / this.opts.baseSize);
    gl.uniform3fv(this.uni.uBgColor, this.opts.bgColor);
    gl.uniform3fv(this.uni.uOffColor, this.opts.offColor);

    // Defaults — sync mirrored uniforms with the GPU side.
    this.setCellStyle(0);
    this.setEnabled(true);
    this.setGridGap(2);
    this.setTopSlot('B');

    // Recover from compositor context loss (tab backgrounded for long
    // periods, GPU reset, etc). The renderer re-creates GL resources and
    // restores any uploaded pixel data from the CPU mirrors.
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); });
    canvas.addEventListener('webglcontextrestored', () => this.handleContextRestore());
  }

  private makeCellTexture(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture();
    if (!tex) throw new Error('createTexture failed');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const n = this.opts?.cells ?? DEFAULTS.cells;
    // Allocate with a transparent black baseline; uploadFrame() will fill.
    const blank = new Uint8Array(n * n * 3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, n, n, 0, gl.RGB, gl.UNSIGNED_BYTE, blank);
    return tex;
  }

  private handleContextRestore(): void {
    const gl = this.gl;
    // Note: in practice browsers replace the WebGLRenderingContext object
    // on restore; this code path is a best-effort. A full implementation
    // would re-grab gl from the canvas. We mark everything dirty so any
    // subsequent uploadFrame / render rebuilds state from the mirrors.
    this.texA = this.makeCellTexture();
    this.texB = this.makeCellTexture();
    this.mirrorADirty = true;
    this.mirrorBDirty = true;
    this.vCellStyle = -1;
    this.vEnabled = -1;
    this.vGapFrac = -1;
    this.vTopIsB = -1;
    gl.useProgram(this.prog);
    this.dirty = true;
  }

  /** Upload a 24×24 RGB frame (576 × 3 = 1728 bytes) to the named slot.
   *  Cheap to call every rAF: the upload itself is ~1.7 KB and the diff
   *  against the CPU mirror skips redundant texSubImage2D calls. */
  uploadFrame(slot: SlotKey, frame: Uint8Array): void {
    const mirror = slot === 'A' ? this.mirrorA : this.mirrorB;
    if (frame.length !== mirror.length) return;
    // Diff vs. mirror — if every byte matches, skip the GPU upload.
    let equal = true;
    for (let i = 0; i < mirror.length; i += 1) {
      if (mirror[i] !== frame[i]) { equal = false; break; }
    }
    if (equal) return;
    mirror.set(frame);
    if (slot === 'A') this.mirrorADirty = true; else this.mirrorBDirty = true;
    this.dirty = true;
  }

  /** Fill a slot with the off colour. Used when a slot is being released
   *  back to the pool or the page is initialising. */
  clearSlot(slot: SlotKey): void {
    const mirror = slot === 'A' ? this.mirrorA : this.mirrorB;
    const [or, og, ob] = this.opts.offColor;
    const sr = Math.round(or * 255);
    const sg = Math.round(og * 255);
    const sb = Math.round(ob * 255);
    for (let i = 0; i < mirror.length; i += 3) {
      mirror[i] = sr;
      mirror[i + 1] = sg;
      mirror[i + 2] = sb;
    }
    if (slot === 'A') this.mirrorADirty = true; else this.mirrorBDirty = true;
    this.dirty = true;
  }

  /** Set composite weights for both slots. The renderer doesn't track
   *  which slot is dominant; the caller passes the post-z-stack opacities. */
  setOpacities(opacityA: number, opacityB: number): void {
    if (opacityA !== this.vOpacityA) { this.vOpacityA = opacityA; this.dirty = true; }
    if (opacityB !== this.vOpacityB) { this.vOpacityB = opacityB; this.dirty = true; }
  }

  /** Which physical slot sits on top of the composite. The bottom slot is
   *  rendered first against the off-tint base; the top slot is then
   *  overlaid using its own opacity. Matches the old DOM z-stack semantics
   *  where the secondary chapter's grid had the higher z-index. */
  setTopSlot(slot: SlotKey): void {
    const v = slot === 'B' ? 1 : 0;
    if (v === this.vTopIsB) return;
    this.vTopIsB = v;
    this.gl.uniform1i(this.uni.uTopIsB, v);
    this.dirty = true;
  }

  setCellStyle(style: number): void {
    const s = Math.max(0, Math.min(13, Math.floor(style)));
    if (s === this.vCellStyle) return;
    this.vCellStyle = s;
    this.gl.uniform1i(this.uni.uCellStyle, s);
    this.dirty = true;
  }

  /** Master display switch. When false the panel paints a uniform off
   *  tint regardless of pixogram content or cell style — a single
   *  early-return in the shader handles it. */
  setEnabled(enabled: boolean): void {
    const v = enabled ? 1 : 0;
    if (v === this.vEnabled) return;
    this.vEnabled = v;
    this.gl.uniform1i(this.uni.uEnabled, v);
    this.dirty = true;
  }

  /** Grid gap in CSS pixels of the canvas's local coordinate system
   *  (matches the host's settings.gridGap, expressed in baseSize pixels). */
  setGridGap(gapCssPx: number): void {
    const g = Math.max(0, gapCssPx) / this.opts.baseSize;
    if (g === this.vGapFrac) return;
    this.vGapFrac = g;
    this.gl.uniform1f(this.uni.uGapFrac, g);
    this.dirty = true;
  }

  /** Resize the WebGL backbuffer to the canvas's display size.
   *  Called on init and from a ResizeObserver in the host.
   *
   *  DPR is intentionally NOT applied — the canvas's CSS size is the
   *  pre-matrix3d logical size (baseSize × baseSize, defaults to 600px),
   *  but matrix3d then warps it onto the LED quad in the photo which is
   *  typically 300–500 screen px. So the backbuffer is already 1.2–2×
   *  the displayed pixel count even at DPR=1; bumping further by DPR
   *  just wastes fragment shader work and pushes us off 60 fps. */
  resize(): void {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const cssW = canvas.clientWidth || this.opts.baseSize;
    const cssH = canvas.clientHeight || this.opts.baseSize;
    const w = Math.max(1, Math.round(cssW));
    const h = Math.max(1, Math.round(cssH));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      this.dirty = true;
    }
  }

  /** Render now, on the current tick. The caller is responsible for
   *  driving the rAF loop — this method just submits the draw. */
  render(): void {
    if (!this.dirty) return;
    const gl = this.gl;

    if (this.mirrorADirty) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texA);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.opts.cells, this.opts.cells, gl.RGB, gl.UNSIGNED_BYTE, this.mirrorA);
      this.mirrorADirty = false;
    } else {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texA);
    }
    if (this.mirrorBDirty) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texB);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.opts.cells, this.opts.cells, gl.RGB, gl.UNSIGNED_BYTE, this.mirrorB);
      this.mirrorBDirty = false;
    } else {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texB);
    }

    gl.uniform1f(this.uni.uOpacityA, this.vOpacityA);
    gl.uniform1f(this.uni.uOpacityB, this.vOpacityB);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.dirty = false;
  }

  /** Convenience: request a render on the next rAF tick (coalesces multiple
   *  setX calls into a single draw). The host's own rAF loop calls render()
   *  directly each frame, so this method is mainly for one-off setX changes
   *  that arrive outside the loop (dev panel writes). */
  scheduleRender(): void {
    if (this.rafScheduled || !this.dirty) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.rafScheduled = false;
      this.render();
    });
  }
}
