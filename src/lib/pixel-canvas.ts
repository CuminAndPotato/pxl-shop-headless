// Canvas renderer for the 24x24 PXL Clock matrix. Five visual modes — pick
// the one that best mimics the look you want for a given surface. All modes
// share the same drawer signature and palette as the DOM-based pixel-style
// helper, so a mode swap is just one prop change.

import type { PixogramColor } from './pixograms';
import { DEFAULT_PALETTE, type Palette } from './pixel-style';

export type RenderMode = 'clock' | 'photoreal' | 'flat' | 'bloom' | 'crt';

export interface RenderOptions {
  width: number;
  height: number;
  mode: RenderMode;
  palette?: Palette;
  /** Background colour outside the matrix (the frame). */
  frameColor?: string;
  /** Background between cells (the trench / off matte). */
  voidColor?: string;
  /** Frame padding as a fraction of min(width, height). Default 0 — the
   *  enclosing HTML element is usually already responsible for the bezel. */
  framePadding?: number;
}

interface Ctx {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  cellSize: number;
  matSize: number;
  offsetX: number;
  offsetY: number;
}

/** Prepare the canvas backing store and compute layout. */
function prepare(canvas: HTMLCanvasElement, opts: RenderOptions): Ctx | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Frame (only painted if a colour is supplied; default = transparent so
  // the enclosing HTML bezel shows through)
  if (opts.frameColor) {
    ctx.fillStyle = opts.frameColor;
    ctx.fillRect(0, 0, cssW, cssH);
  } else {
    ctx.clearRect(0, 0, cssW, cssH);
  }
  // Bezel padding
  const pad = Math.min(cssW, cssH) * (opts.framePadding ?? 0);
  const matSize = Math.min(cssW - pad * 2, cssH - pad * 2);
  const offsetX = (cssW - matSize) / 2;
  const offsetY = (cssH - matSize) / 2;
  // Void (between cells)
  ctx.fillStyle = opts.voidColor ?? '#050608';
  ctx.fillRect(offsetX, offsetY, matSize, matSize);
  const cellSize = matSize / opts.width;
  return { ctx, cssW, cssH, cellSize, matSize, offsetX, offsetY };
}

function rgb(palette: Palette, c: PixogramColor): [number, number, number] {
  return palette[c] ?? palette[0];
}

// === MODE 1: clock ==========================================================
// Per-cell radial gradient with hotspot shifted toward matrix center; soft
// per-cell outer glow stacked via blend. Mirrors the DOM pixel-style helper.
function drawClock(canvas: HTMLCanvasElement, draw: (x: number, y: number) => PixogramColor, opts: RenderOptions): void {
  const ready = prepare(canvas, opts); if (!ready) return;
  const { ctx, cellSize, offsetX, offsetY } = ready;
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const W = opts.width, H = opts.height;
  const inset = cellSize * 0.06;

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      const [r, g, b] = rgb(palette, c);
      const cx = offsetX + (x + 0.5) * cellSize;
      const cy = offsetY + (y + 0.5) * cellSize;
      const sx = cx - cellSize / 2 + inset;
      const sy = cy - cellSize / 2 + inset;
      const sz = cellSize - inset * 2;

      if (c === 0) {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(sx, sy, sz, sz);
        continue;
      }

      const nx = W > 1 ? x / (W - 1) : 0.5;
      const ny = H > 1 ? y / (H - 1) : 0.5;
      const hx = cx + (0.5 - nx) * cellSize * 0.4;
      const hy = cy + (0.5 - ny) * cellSize * 0.4;
      const grad = ctx.createRadialGradient(hx, hy, 0, cx, cy, cellSize * 0.7);
      grad.addColorStop(0, `rgb(${r},${g},${b})`);
      grad.addColorStop(0.55, `rgb(${Math.round(r * 0.65)},${Math.round(g * 0.65)},${Math.round(b * 0.65)})`);
      grad.addColorStop(0.9, `rgb(${Math.round(r * 0.4)},${Math.round(g * 0.4)},${Math.round(b * 0.4)})`);
      grad.addColorStop(1, '#020203');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  // Additive glow pass for bright cells — gives the bloom feel.
  ctx.globalCompositeOperation = 'lighter';
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      if (c === 0) continue;
      const [r, g, b] = rgb(palette, c);
      const brightness = (r + g + b) / 765;
      if (brightness < 0.25) continue;
      const cx = offsetX + (x + 0.5) * cellSize;
      const cy = offsetY + (y + 0.5) * cellSize;
      const radius = cellSize * (0.8 + brightness * 0.8);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${r},${g},${b},${(brightness * 0.35).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// === MODE 2: photoreal ======================================================
// Built to match the real product photos: square pixels with slight rounding,
// dark trench between them, internal radial gradient (center hotter, corners
// darker), and a wider soft bloom that leaks onto neighbours.
function drawPhotoreal(canvas: HTMLCanvasElement, draw: (x: number, y: number) => PixogramColor, opts: RenderOptions): void {
  const ready = prepare(canvas, opts); if (!ready) return;
  const { ctx, cellSize, offsetX, offsetY } = ready;
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const W = opts.width, H = opts.height;
  // Tight trench — LEDs sit close together, matching the dense pixel-to-pixel
  // look of the real product.
  const gap = cellSize * 0.03;
  const radius = cellSize * 0.05;

  // Base cells
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      const [r, g, b] = rgb(palette, c);
      const sx = offsetX + x * cellSize + gap / 2;
      const sy = offsetY + y * cellSize + gap / 2;
      const sz = cellSize - gap;
      ctx.beginPath();
      // @ts-expect-error roundRect available in modern browsers
      ctx.roundRect(sx, sy, sz, sz, radius);
      if (c === 0) {
        ctx.fillStyle = '#0c0d10';
        ctx.fill();
        continue;
      }
      const cx = sx + sz / 2;
      const cy = sy + sz / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.7);
      grad.addColorStop(0, `rgb(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)})`);
      grad.addColorStop(0.5, `rgb(${r},${g},${b})`);
      grad.addColorStop(1, `rgb(${Math.round(r * 0.35)},${Math.round(g * 0.35)},${Math.round(b * 0.35)})`);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Bloom pass — kept tight (~half a cell of leak) so the matrix still reads
  // as discrete LEDs rather than a wash. Only bright cells contribute.
  ctx.globalCompositeOperation = 'lighter';
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      if (c === 0) continue;
      const [r, g, b] = rgb(palette, c);
      const brightness = (r + g + b) / 765;
      if (brightness < 0.28) continue;
      const cx = offsetX + (x + 0.5) * cellSize;
      const cy = offsetY + (y + 0.5) * cellSize;
      const radius = cellSize * (0.75 + brightness * 0.5);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${r},${g},${b},${(brightness * 0.16).toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${(brightness * 0.05).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// === MODE 3: flat ===========================================================
// Designer-clean: rounded squares, fine gaps, single colour, no glow at all.
function drawFlat(canvas: HTMLCanvasElement, draw: (x: number, y: number) => PixogramColor, opts: RenderOptions): void {
  const ready = prepare(canvas, opts); if (!ready) return;
  const { ctx, cellSize, offsetX, offsetY } = ready;
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const W = opts.width, H = opts.height;
  const gap = cellSize * 0.08;
  const radius = cellSize * 0.18;

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      const [r, g, b] = rgb(palette, c);
      const sx = offsetX + x * cellSize + gap / 2;
      const sy = offsetY + y * cellSize + gap / 2;
      const sz = cellSize - gap;
      ctx.beginPath();
      // @ts-expect-error roundRect available in modern browsers
      ctx.roundRect(sx, sy, sz, sz, radius);
      ctx.fillStyle = c === 0
        ? '#15171b'
        : `rgb(${r},${g},${b})`;
      ctx.fill();
    }
  }
}

// === MODE 4: bloom ==========================================================
// Strong, multi-layer bloom — three glow passes at different radii plus a
// sharp inner core. Reads as "neon under frosted glass".
function drawBloom(canvas: HTMLCanvasElement, draw: (x: number, y: number) => PixogramColor, opts: RenderOptions): void {
  const ready = prepare(canvas, opts); if (!ready) return;
  const { ctx, cellSize, offsetX, offsetY } = ready;
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const W = opts.width, H = opts.height;

  // Three additive bloom layers, large → small
  const passes: Array<{ radiusMul: number; alpha: number }> = [
    { radiusMul: 2.6, alpha: 0.10 },
    { radiusMul: 1.5, alpha: 0.18 },
    { radiusMul: 0.85, alpha: 0.45 },
  ];

  ctx.globalCompositeOperation = 'lighter';
  for (const pass of passes) {
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const c = draw(x, y);
        if (c === 0) continue;
        const [r, g, b] = rgb(palette, c);
        const cx = offsetX + (x + 0.5) * cellSize;
        const cy = offsetY + (y + 0.5) * cellSize;
        const radius = cellSize * pass.radiusMul;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${pass.alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
    }
  }

  // Sharp white-hot core dot
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const c = draw(x, y);
      if (c === 0) continue;
      const [r, g, b] = rgb(palette, c);
      const cx = offsetX + (x + 0.5) * cellSize;
      const cy = offsetY + (y + 0.5) * cellSize;
      const dot = cellSize * 0.18;
      ctx.fillStyle = `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},0.9)`;
      ctx.beginPath();
      ctx.arc(cx, cy, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// === MODE 5: crt ============================================================
// CRT/VHS feel: tiny chromatic aberration (per-channel offset) plus subtle
// horizontal scanlines. Pixel base is flat-coloured rounded square.
function drawCrt(canvas: HTMLCanvasElement, draw: (x: number, y: number) => PixogramColor, opts: RenderOptions): void {
  const ready = prepare(canvas, opts); if (!ready) return;
  const { ctx, cellSize, offsetX, offsetY, matSize } = ready;
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const W = opts.width, H = opts.height;
  const gap = cellSize * 0.08;
  const radius = cellSize * 0.14;
  const aberration = Math.max(0.6, cellSize * 0.05);

  // Three colour-separated passes — R, G, B with horizontal offset
  const channels: Array<{ idx: 0 | 1 | 2; dx: number }> = [
    { idx: 0, dx: -aberration },
    { idx: 1, dx: 0 },
    { idx: 2, dx: aberration },
  ];

  ctx.globalCompositeOperation = 'lighter';
  for (const ch of channels) {
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const c = draw(x, y);
        if (c === 0) continue;
        const rgbVals = rgb(palette, c);
        const v = rgbVals[ch.idx];
        if (v === 0) continue;
        const sx = offsetX + x * cellSize + gap / 2 + ch.dx;
        const sy = offsetY + y * cellSize + gap / 2;
        const sz = cellSize - gap;
        ctx.beginPath();
        // @ts-expect-error roundRect available in modern browsers
        ctx.roundRect(sx, sy, sz, sz, radius);
        ctx.fillStyle = ch.idx === 0
          ? `rgb(${v},0,0)`
          : ch.idx === 1
            ? `rgb(0,${v},0)`
            : `rgb(0,0,${v})`;
        ctx.fill();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // Fill off-cells with deep colour so the matrix doesn't show the void.
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (draw(x, y) !== 0) continue;
      const sx = offsetX + x * cellSize + gap / 2;
      const sy = offsetY + y * cellSize + gap / 2;
      const sz = cellSize - gap;
      ctx.beginPath();
      // @ts-expect-error
      ctx.roundRect(sx, sy, sz, sz, radius);
      ctx.fillStyle = '#0a0d12';
      ctx.fill();
    }
  }

  // Scanlines — every other row, semi-transparent dark line
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  for (let py = offsetY; py < offsetY + matSize; py += 3) {
    ctx.fillRect(offsetX, py, matSize, 1);
  }
  ctx.globalCompositeOperation = 'source-over';
}

const RENDERERS: Record<RenderMode, typeof drawClock> = {
  clock: drawClock,
  photoreal: drawPhotoreal,
  flat: drawFlat,
  bloom: drawBloom,
  crt: drawCrt,
};

export function renderPixogram(
  canvas: HTMLCanvasElement,
  draw: (x: number, y: number) => PixogramColor,
  opts: RenderOptions,
): void {
  RENDERERS[opts.mode](canvas, draw, opts);
}

export const RENDER_MODES: { id: RenderMode; label: string; description: string }[] = [
  { id: 'clock',     label: 'Clock',     description: 'Hotspot pro Pixel + sanfter Glow. Studio-Look der ersten Iteration.' },
  { id: 'photoreal', label: 'Photoreal', description: 'Echte Produktfotos als Referenz: Trenn-Steg-Gitter, Bloom durch Glas.' },
  { id: 'flat',      label: 'Flat',      description: 'Designer-clean — quadratisch, ruhig, kein Glow. Für UI / Editorial.' },
  { id: 'bloom',     label: 'Bloom',     description: 'Drei-Layer additive Glow. Neon unter Frosted-Glas.' },
  { id: 'crt',       label: 'CRT',       description: 'Chromatische Aberration + Scanlines. Filmisch / VHS.' },
];
