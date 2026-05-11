// Mirrors the "clock" visual mode of pxl-software/pxl-device-view/LedMatrix.tsx
// — each lit LED is a radial gradient with a hotspot shifted slightly toward
// the matrix center, an edge-dim ring, and an outer glow for bright cells.
// That look is what makes the on-screen matrix actually read as a real LED
// panel behind glass rather than a flat colour grid.

import type { PixogramColor } from './pixograms';

export type Palette = Record<PixogramColor, [number, number, number]>;

/** Default palette mapped to the brand-gradient accents we use across the
 *  fresh layouts. Off (0) is a near-black with a slight cool tint so the
 *  background reads as dim glass rather than pure void. */
export const DEFAULT_PALETTE: Palette = {
  0: [9, 10, 13],
  1: [251, 178, 56],   // honey amber
  2: [72, 93, 189],    // indigo
  3: [192, 209, 218],  // pewter blue
  4: [231, 250, 152],  // lemon lime
};

export interface PixelStyleOptions {
  /** 0–50; how far the hotspot shifts toward the matrix center for edge cells. */
  hotspotMaxShift?: number;
  /** 0–1; how much the dim ring at 55% darkens. */
  edgeDimming?: number;
  /** 0–1; multiplier for the outer-edge color at 90%. */
  outerFactor?: number;
  /** Hex string for the very edge (100%). */
  edgeColor?: string;
  /** Toggle the outer box-shadow glow on bright cells. */
  glow?: boolean;
  /** Override the palette. */
  palette?: Palette;
}

const DEFAULTS = {
  hotspotMaxShift: 18,
  edgeDimming: 0.35,
  outerFactor: 0.45,
  edgeColor: '#020203',
  glow: true,
};

/** Returns a CSS string suitable for `element.style.cssText` for one cell. */
export function cellStyle(
  x: number,
  y: number,
  width: number,
  height: number,
  colorId: PixogramColor,
  opts: PixelStyleOptions = {},
): string {
  const palette = opts.palette ?? DEFAULT_PALETTE;
  const hotspotMaxShift = opts.hotspotMaxShift ?? DEFAULTS.hotspotMaxShift;
  const edgeDimming = opts.edgeDimming ?? DEFAULTS.edgeDimming;
  const outerFactor = opts.outerFactor ?? DEFAULTS.outerFactor;
  const edgeColor = opts.edgeColor ?? DEFAULTS.edgeColor;
  const glow = opts.glow ?? DEFAULTS.glow;

  const [r, g, b] = palette[colorId] ?? palette[0];

  // Off cells: skip the gradient pipeline — just a dark colour. Faster, and
  // matches the pxl-software clock-mode behaviour for sub-threshold pixels.
  if (colorId === 0) {
    return `background:rgb(${r},${g},${b})`;
  }

  const normX = width > 1 ? x / (width - 1) : 0.5;
  const normY = height > 1 ? y / (height - 1) : 0.5;

  // Top-left cell: hotspot pulled bottom-right toward center.
  // Bottom-right cell: hotspot pulled top-left toward center.
  const hotspotX = 50 + (0.5 - normX) * hotspotMaxShift * 2;
  const hotspotY = 50 + (0.5 - normY) * hotspotMaxShift * 2;

  const dim = 1 - edgeDimming;
  const dR = Math.round(r * dim);
  const dG = Math.round(g * dim);
  const dB = Math.round(b * dim);

  const oR = Math.round(r * outerFactor);
  const oG = Math.round(g * outerFactor);
  const oB = Math.round(b * outerFactor);

  let css =
    `background:radial-gradient(circle at ${hotspotX.toFixed(1)}% ${hotspotY.toFixed(1)}%,` +
    `rgb(${r},${g},${b}) 0%,` +
    `rgb(${dR},${dG},${dB}) 55%,` +
    `rgb(${oR},${oG},${oB}) 90%,` +
    `${edgeColor} 100%)`;

  if (glow) {
    const brightness = (r + g + b) / (3 * 255);
    if (brightness > 0.12) {
      const glowAlpha = Math.min(0.55, brightness * 0.7);
      const gs = Math.round(brightness * 5);
      css += `;box-shadow:0 0 ${gs}px rgba(${r},${g},${b},${glowAlpha.toFixed(2)})`;
    }
  }

  return css;
}

/** Paint a flat list of cell elements using the drawer + cellStyle pipeline. */
export function paintMatrix(
  cells: HTMLElement[],
  width: number,
  height: number,
  draw: (x: number, y: number) => PixogramColor,
  opts?: PixelStyleOptions,
): void {
  for (let i = 0; i < cells.length; i += 1) {
    const x = i % width;
    const y = Math.floor(i / width);
    cells[i].style.cssText = cellStyle(x, y, width, height, draw(x, y), opts);
  }
}
