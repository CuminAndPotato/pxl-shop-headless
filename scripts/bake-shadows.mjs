#!/usr/bin/env node
// Pre-bakes a soft drop-shadow asset for product PNGs that have an alpha
// channel. The output is the SHADOW HALO ALONE (transparent where the clock
// is) so it can be placed as a sibling element BEHIND the original photo
// without doubling the clock body. Photo dimensions stay unchanged, so no
// component coordinates need recalibration.
//
// Why: at runtime, CSS `filter: drop-shadow()` needs the browser to read the
// image's alpha channel, blur it, and composite — which only happens AFTER
// the image is fully decoded. The result is a visible "hard edges → smooth
// blend" flicker on first paint. Baking the shadow at build time means the
// halo pixels exist from the very first paint.
//
// Run once via `npm run bake-shadows` (or whenever the source PNGs change).
// Outputs `<name>-shadow.png` alongside each source. Idempotent.

import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_IMG = resolve(__dirname, '..', 'public', 'img', 'products');

// Files to process. Each gets a shadow-baked sibling at `<name>-shadow.png`
// in the same directory.
const TARGETS = [
  'whatis-clock-tight.png',
  'clock-black-900.png',
  'clock-white-900.png',
];

// Shadow shape — chosen to roughly match the existing CSS drop-shadow values
// (offset y ~30-40px, blur ~50-80px, alpha ~0.22). Slightly stronger than the
// CSS so it's clearly visible even on light gradient backgrounds.
const SHADOW_OFFSET_Y = 40;
const SHADOW_BLUR_SIGMA = 22;        // sharp's blur sigma (roughly: CSS blur / 2)
const SHADOW_OPACITY = 0.28;
const PAD = 120;                     // canvas padding so the blurred shadow has room

async function bakeShadow(name) {
  const src = resolve(PUBLIC_IMG, name);
  const dst = resolve(PUBLIC_IMG, name.replace(/\.png$/i, '-shadow.png'));

  const img = sharp(src);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error(`Bad metadata for ${name}`);
  if (meta.channels !== 4) {
    console.warn(`[bake-shadows] ${name} has no alpha channel — skipping`);
    return;
  }

  const outW = meta.width + PAD * 2;
  const outH = meta.height + PAD * 2;

  // 1. Build the shadow: take just the alpha channel of the source, blur it,
  //    tint it dark. We do this by overlaying a black rectangle with the
  //    blurred alpha as a mask.
  const blurredAlpha = await sharp(src)
    .extractChannel('alpha')
    .blur(SHADOW_BLUR_SIGMA)
    .toBuffer();

  const shadowLayer = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 12, g: 12, b: 14, alpha: SHADOW_OPACITY },
    },
  })
    .composite([{ input: blurredAlpha, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 2. Place ONLY the shadow on a padded transparent canvas (no clock body
  //    composited on top). The original photo stays as-is and gets stacked
  //    on top of this halo by the consumer (CSS background or sibling img).
  await sharp({
    create: {
      width: outW,
      height: outH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadowLayer, top: PAD + SHADOW_OFFSET_Y, left: PAD },
    ])
    .png({ compressionLevel: 9 })
    .toFile(dst);

  const after = await stat(dst);
  const kb = (after.size / 1024).toFixed(1);
  console.log(`[bake-shadows] ${name} → ${name.replace(/\.png$/i, '-shadow.png')} (${kb} KB, ${outW}×${outH})`);
}

const start = Date.now();
for (const t of TARGETS) {
  await bakeShadow(t);
}
console.log(`[bake-shadows] done in ${Date.now() - start} ms`);
