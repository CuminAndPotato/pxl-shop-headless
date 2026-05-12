// Parser for the `.pxl` text format produced by Pxl.Render.
//
// Format: per-pixel hex colours ("#rrggbb"), pixels in a row separated by
// spaces, rows separated by single newlines, frames separated by blank lines.
// See pxl-software/src/Pxl.Render/FramesEncoder.fs#L301 for the writer.

export interface Pixogram {
  width: number;
  height: number;
  /** Each frame is a Uint8Array of RGB bytes (length = width * height * 3). */
  frames: Uint8Array[];
}

export function parsePxl(text: string): Pixogram {
  // Frames are separated by blank lines. Trailing blank lines are ignored.
  const blocks = text.split(/\r?\n\r?\n/).map((b) => b.replace(/^\s+|\s+$/g, '')).filter(Boolean);
  if (blocks.length === 0) return { width: 0, height: 0, frames: [] };

  const frames: Uint8Array[] = [];
  let width = 0, height = 0;

  for (const block of blocks) {
    const rows = block.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    if (rows.length === 0) continue;
    const cells = rows.map((row) => row.split(/\s+/));
    const h = rows.length;
    const w = cells[0].length;
    if (width === 0) { width = w; height = h; }
    const buf = new Uint8Array(w * h * 3);
    let p = 0;
    for (let y = 0; y < h; y += 1) {
      const row = cells[y];
      for (let x = 0; x < w; x += 1) {
        const hex = row[x] ?? '#000000';
        // hex is "#rrggbb" — fast manual parse, avoids parseInt overhead per channel.
        buf[p++] = (hexNibble(hex.charCodeAt(1)) << 4) | hexNibble(hex.charCodeAt(2));
        buf[p++] = (hexNibble(hex.charCodeAt(3)) << 4) | hexNibble(hex.charCodeAt(4));
        buf[p++] = (hexNibble(hex.charCodeAt(5)) << 4) | hexNibble(hex.charCodeAt(6));
      }
    }
    frames.push(buf);
  }
  return { width, height, frames };
}

function hexNibble(code: number): number {
  // '0'..'9' → 0..9, 'a'..'f' / 'A'..'F' → 10..15
  if (code >= 48 && code <= 57) return code - 48;
  if (code >= 97 && code <= 102) return code - 87;
  if (code >= 65 && code <= 70) return code - 55;
  return 0;
}

/** Build a drawer function (x, y, t) → PixogramColor-equivalent (0..255 R/G/B)
 *  for a parsed pixogram. Use this with the canvas renderer in pixel-canvas.ts
 *  via a small adapter that maps the returned color back to a palette entry,
 *  OR render directly with the RGB triple. */
export function pxlFrameAt(pixogram: Pixogram, frameIndex: number): Uint8Array {
  const i = ((frameIndex % pixogram.frames.length) + pixogram.frames.length) % pixogram.frames.length;
  return pixogram.frames[i];
}

/** Read a single RGB triple from a frame buffer at (x, y). */
export function pxlRgbAt(frame: Uint8Array, width: number, x: number, y: number): [number, number, number] {
  const off = (y * width + x) * 3;
  return [frame[off], frame[off + 1], frame[off + 2]];
}
