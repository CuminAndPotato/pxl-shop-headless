// Browser-side pixogram drawers used by LivePixogramPicker and AISandbox.
// Each drawer returns a color (0..4) for cell (x, y) at tick t. 4 ticks per second.

export type PixogramColor = 0 | 1 | 2 | 3 | 4;
export type PixogramDrawer = (x: number, y: number, t: number) => PixogramColor;
export type PixogramId = 'pulse' | 'heart' | 'orbit' | 'rain' | 'clock' | 'wave' | 'sunset' | 'glyph' | 'journey';

export const PIXOGRAM_SIZE = 24;
const center = (PIXOGRAM_SIZE - 1) / 2;

const digitGlyphs: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[1,0,0],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0],[1,0,0],[1,0,0]],
  '8': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
};

export const drawers: Record<PixogramId, PixogramDrawer> = {
  pulse: (x, y, t) => {
    const d = Math.hypot(x - center, y - center);
    const phase = (t % 16) / 16;
    const r = 2 + phase * 9;
    if (Math.abs(d - r) < 1.4) return 1;
    if (Math.abs(d - r) < 2.4) return 2;
    if (d < 1.7) return 1;
    return 0;
  },
  heart: (x, y, t) => {
    const nx = (x - center) / 9;
    const ny = (y - 12.5) / 9;
    const v = Math.pow(nx * nx + ny * ny - 0.45, 3) - nx * nx * ny * ny * ny;
    const beat: PixogramColor = (t % 8) < 2 ? 4 : 2;
    if (v < -0.045) return beat;
    if (v < 0.01) return 2;
    return 0;
  },
  orbit: (x, y, t) => {
    const dx = x - center;
    const dy = y - center;
    const d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const tau = (t * Math.PI) / 8;
    if (d < 1.7) return 1;
    if (Math.abs(d - 4.5) < 0.7 && Math.cos(ang * 2 - tau) > 0.65) return 2;
    if (Math.abs(d - 8) < 0.7 && Math.cos(ang * 3 + tau * 0.6) > 0.55) return 3;
    if (Math.abs(d - 11) < 0.7 && Math.sin(ang * 2 - tau * 0.4) > 0.7) return 4;
    return 0;
  },
  rain: (x, _y, t) => {
    const seed = (x * 17 + 11) % 24;
    const pos = (seed + t * 1.3) % 28;
    const dy = _y - pos;
    if (dy >= 0 && dy < 1) return 2;
    if (dy >= 1 && dy < 2) return 1;
    if ((x * 7 + _y * 5) % 31 === t % 31) return 1;
    return 0;
  },
  clock: (x, y, t) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const slots: [number, string][] = [
      [2, hh[0]],
      [6, hh[1]],
      [14, mm[0]],
      [18, mm[1]],
    ];
    const yTop = 8;
    for (const [xs, ch] of slots) {
      const dx = x - xs;
      const dy = y - yTop;
      if (dx >= 0 && dx < 3 && dy >= 0 && dy < 7) {
        if (digitGlyphs[ch] && digitGlyphs[ch][dy][dx]) return 1;
      }
    }
    if (x === 11 && (y === 10 || y === 14)) {
      return ((t % 4 < 2 ? 2 : 0) as PixogramColor);
    }
    return 0;
  },
  wave: (x, y, t) => {
    const phase = t / 6;
    const yWave = 12 + Math.sin(x * 0.4 - phase) * 4 + Math.sin(x * 0.2 + phase * 0.6) * 2;
    const d = Math.abs(y - yWave);
    if (d < 0.7) return 2;
    if (d < 1.7) return 1;
    return 0;
  },
  sunset: (x, y, t) => {
    // Bottom-half warm gradient with a slow rising "sun" disc.
    const sunY = 18 - Math.sin((t % 64) / 64 * Math.PI) * 6;
    const d = Math.hypot(x - center, y - sunY);
    if (d < 3) return 3;
    if (d < 5) return 1;
    if (y > 18) return ((x + y + Math.floor(t / 4)) % 5 === 0 ? 3 : 0) as PixogramColor;
    if (y > 14 && (x * y + t) % 11 === 0) return 4;
    return 0;
  },
  // Scroll-driven journey: a bouncing ball with a fading trail and a soft
  // floor pulse on each impact. Designed to live across t = 0..360 (one full
  // scroll of the LivingSidebar) — every tick is a discrete frame.
  journey: (x, y, t) => {
    const cycle = 36;            // ticks per bounce (one up-down cycle)
    const phase = (t % cycle) / cycle;
    const ballY = 3 + Math.abs(Math.sin(phase * Math.PI)) * 18;
    const ballX = 12 + Math.sin(t * 0.018) * 8;

    // Trail (older positions, fade with distance in time)
    for (let i = 1; i <= 6; i += 1) {
      const pt = t - i;
      if (pt < 0) break;
      const pp = (pt % cycle) / cycle;
      const py = 3 + Math.abs(Math.sin(pp * Math.PI)) * 18;
      const px = 12 + Math.sin(pt * 0.018) * 8;
      const td = Math.hypot(x - px, y - py);
      if (td < 0.75) {
        if (i <= 1) return 2;
        if (i <= 3) return 3;
        return 4;
      }
    }

    // Ball core + glow
    const dx = x - ballX;
    const dy = y - ballY;
    const d = Math.hypot(dx, dy);
    if (d < 1.2) return 1;
    if (d < 2.2) return 2;

    // Floor impact: when ball is near floor, brief horizontal shockwave
    const nearImpact = ballY > 19.4;
    if (nearImpact && y === 21) {
      const distFromBall = Math.abs(x - ballX);
      const wave = Math.floor((22 - ballY) * 4);
      if (distFromBall > wave - 1 && distFromBall <= wave + 1) return 3;
    }

    // Subtle rising stars (ambient, very sparse)
    if (((x * 7 + y * 13 + Math.floor(t / 6)) % 97) === 0) return 4;

    return 0;
  },
  glyph: (x, y, t) => {
    // Letter "PXL" cycling — used for AI demo.
    const letters = ['P', 'X', 'L'];
    const which = letters[Math.floor(t / 6) % 3];
    const fonts: Record<string, number[][]> = {
      P: [
        [0,0,1,1,1,1,1,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,0,1,0,0],
        [0,0,1,0,0,0,1,1,0,0],
        [0,0,1,1,1,1,1,0,0,0],
        [0,0,1,0,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0],
        [0,0,1,0,0,0,0,0,0,0],
      ],
      X: [
        [1,1,0,0,0,0,0,0,1,1],
        [0,1,1,0,0,0,0,1,1,0],
        [0,0,1,1,0,0,1,1,0,0],
        [0,0,0,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,0,0,0],
        [0,0,1,1,0,0,1,1,0,0],
        [0,1,1,0,0,0,0,1,1,0],
      ],
      L: [
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1],
      ],
    };
    const grid = fonts[which];
    const offsetX = 7;
    const offsetY = 8;
    const gx = x - offsetX;
    const gy = y - offsetY;
    if (gx >= 0 && gx < 10 && gy >= 0 && gy < 8 && grid[gy][gx]) {
      return ((t % 8 < 4 ? 1 : 2) as PixogramColor);
    }
    return 0;
  },
};
