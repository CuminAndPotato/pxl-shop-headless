import { describe, it, expect } from 'vitest';
import {
  computePacing,
  opacityAt,
  textTranslatePx,
  activeIdxAt,
  type PacingConfig,
} from '../src/lib/op5-pacing';

const DEFAULT_CFG: PacingConfig = {
  heroEndVh: 50,
  startVh: 120,
  spacingVh: 100,
  textFadeVh: 30,
  activationFrac: 0.5,
  pixTransitionVh: 20,
  pixMarginVh: 10,
  scrollScale: 1.0,
};
const N = 7;

describe('computePacing — layout invariants', () => {
  it('REST_VHS is evenly spaced from START_VH with SPACING_VH steps', () => {
    const p = computePacing(DEFAULT_CFG, N);
    expect(p.REST_VHS).toEqual([120, 220, 320, 420, 520, 620, 720]);
  });

  it('ACTIVATIONS sit BEFORE REST by (1-FRAC)·FADE', () => {
    const p = computePacing(DEFAULT_CFG, N);
    // FRAC = 0.5, FADE = 30 → preFade = 15
    expect(p.ACTIVATIONS).toEqual([105, 205, 305, 405, 505, 605, 705]);
  });

  it('ACTIVATION = REST when FRAC = 1 (activation at full visibility)', () => {
    const p = computePacing({ ...DEFAULT_CFG, activationFrac: 1.0 }, N);
    expect(p.ACTIVATIONS[0]).toBe(p.REST_VHS[0]);
    expect(p.ACTIVATIONS[3]).toBe(p.REST_VHS[3]);
  });

  it('ACTIVATION = REST − FADE when FRAC = 0 (activation at fade-in start)', () => {
    const p = computePacing({ ...DEFAULT_CFG, activationFrac: 0.0 }, N);
    expect(p.ACTIVATIONS[0]).toBe(p.REST_VHS[0] - DEFAULT_CFG.textFadeVh);
  });

  it('heroEnd is the explicit heroEndVh knob', () => {
    const p = computePacing(DEFAULT_CFG, N);
    expect(p.heroEnd).toBe(50);
  });

  it('SPACER exists between heroEnd and act-0 text fade-in start', () => {
    const p = computePacing(DEFAULT_CFG, N);
    // With heroEnd=50, REST[0]=120, FADE=30:
    // act-0 text fade-in normally starts at 120-30=90 → spacer = 90-50 = 40vh.
    const textFadeInStart = p.TEXT_FADES[0][0];
    expect(textFadeInStart).toBeGreaterThanOrEqual(p.heroEnd);
    expect(textFadeInStart - p.heroEnd).toBeGreaterThan(0);
  });
});

describe('TEXT_FADES — symmetric crossfade between adjacent acts', () => {
  const p = computePacing(DEFAULT_CFG, N);

  it('act i text at REST has opacity 1', () => {
    expect(opacityAt(p.REST_VHS[2], p.TEXT_FADES[2])).toBeCloseTo(1, 5);
  });

  it('act i text at fade-in start (REST − FADE) has opacity 0', () => {
    expect(opacityAt(p.REST_VHS[2] - DEFAULT_CFG.textFadeVh, p.TEXT_FADES[2])).toBe(0);
  });

  it('act i text at fade-out end (next REST) has opacity 0', () => {
    expect(opacityAt(p.REST_VHS[3], p.TEXT_FADES[2])).toBe(0);
  });

  it('adjacent acts crossfade 1:1 — sum at midpoint = 1', () => {
    // Midpoint of fade-out of act 2 = fade-in of act 3
    const mid = (p.REST_VHS[3] - DEFAULT_CFG.textFadeVh / 2);
    const oOut = opacityAt(mid, p.TEXT_FADES[2]);
    const oIn = opacityAt(mid, p.TEXT_FADES[3]);
    expect(oOut + oIn).toBeCloseTo(1, 5);
    expect(oOut).toBeCloseTo(0.5, 5);
    expect(oIn).toBeCloseTo(0.5, 5);
  });
});

describe('Text translation — 1:1 with scroll, 0 at REST', () => {
  const p = computePacing(DEFAULT_CFG, N);
  const vh = 800; // assume 800px viewport for tests

  it('translation = 0 at REST', () => {
    expect(textTranslatePx(p.REST_VHS[1], p.REST_VHS[1], vh)).toBeCloseTo(0, 5);
  });

  it('translation is POSITIVE (text below center) BEFORE REST', () => {
    // 10vh before REST → text should be 80px BELOW center (positive Y)
    const ty = textTranslatePx(p.REST_VHS[1] - 10, p.REST_VHS[1], vh);
    expect(ty).toBeCloseTo(80, 1);
  });

  it('translation is NEGATIVE (text above center) AFTER REST', () => {
    const ty = textTranslatePx(p.REST_VHS[1] + 10, p.REST_VHS[1], vh);
    expect(ty).toBeCloseTo(-80, 1);
  });
});

describe('CRITICAL — text/timeline alignment at activation', () => {
  // This is the bug the user reported: timeline says act 2 is active,
  // but the text is still way off-screen at the bottom.
  const p = computePacing(DEFAULT_CFG, N);
  const vh = 800;

  it('AT ACTIVATIONS[i] — activeIdx jumps to i', () => {
    expect(activeIdxAt(p.ACTIVATIONS[2], p.ACTIVATIONS)).toBe(2);
  });

  it('JUST BEFORE ACTIVATIONS[i] — activeIdx still on i-1', () => {
    expect(activeIdxAt(p.ACTIVATIONS[2] - 0.5, p.ACTIVATIONS)).toBe(1);
  });

  it('AT ACTIVATIONS[i] — text translation should NOT be more than HALF a viewport off-center', () => {
    // If translation > 0.5 * vh in absolute terms, the text is essentially
    // off-screen — yet the timeline already marks the act as active.
    // That's the bug. With FRAC=0.5 and FADE=30, this should be ≤ 120px (= 15vh).
    const ty = textTranslatePx(p.ACTIVATIONS[2], p.REST_VHS[2], vh);
    expect(Math.abs(ty)).toBeLessThanOrEqual(vh * 0.5);
  });

  it('AT ACTIVATIONS[i] — text opacity equals ACTIVATION_FRAC (50% at default)', () => {
    // With FRAC=0.5, at the activation line the text should be mid-fade.
    const o = opacityAt(p.ACTIVATIONS[2], p.TEXT_FADES[2]);
    expect(o).toBeCloseTo(DEFAULT_CFG.activationFrac, 5);
  });

  it('AT REST_VHS[i] — text opacity = 1 AND activeIdx = i (full focus)', () => {
    expect(opacityAt(p.REST_VHS[3], p.TEXT_FADES[3])).toBeCloseTo(1, 5);
    expect(activeIdxAt(p.REST_VHS[3], p.ACTIVATIONS)).toBe(3);
  });
});

describe('scrollScale — global tempo multiplier', () => {
  it('scale = 2 doubles every vh value (REST distances, fade lengths, etc.)', () => {
    const baseline = computePacing(DEFAULT_CFG, N);
    const scaled = computePacing({ ...DEFAULT_CFG, scrollScale: 2 }, N);
    expect(scaled.REST_VHS[0]).toBeCloseTo(baseline.REST_VHS[0] * 2, 5);
    expect(scaled.heroEnd).toBeCloseTo(baseline.heroEnd * 2, 5);
    const baseSpacing = baseline.REST_VHS[1] - baseline.REST_VHS[0];
    const scaledSpacing = scaled.REST_VHS[1] - scaled.REST_VHS[0];
    expect(scaledSpacing).toBeCloseTo(baseSpacing * 2, 5);
    const baseFade = baseline.TEXT_FADES[1][1] - baseline.TEXT_FADES[1][0];
    const scaledFade = scaled.TEXT_FADES[1][1] - scaled.TEXT_FADES[1][0];
    expect(scaledFade).toBeCloseTo(baseFade * 2, 5);
  });

  it('scale = 0.5 halves every vh value', () => {
    const baseline = computePacing(DEFAULT_CFG, N);
    const scaled = computePacing({ ...DEFAULT_CFG, scrollScale: 0.5 }, N);
    expect(scaled.REST_VHS[0]).toBeCloseTo(baseline.REST_VHS[0] * 0.5, 5);
  });

  it('activationFrac is NOT scaled (it is a ratio, not a vh value)', () => {
    const scaled = computePacing({ ...DEFAULT_CFG, scrollScale: 2 }, N);
    // FRAC = 0.5, scaled FADE = 60 → preFade = 30 → ACTIVATIONS = REST - 30
    const offset = scaled.REST_VHS[0] - scaled.ACTIVATIONS[0];
    const expectedOffset = (1 - DEFAULT_CFG.activationFrac) * DEFAULT_CFG.textFadeVh * 2;
    expect(offset).toBeCloseTo(expectedOffset, 5);
  });
});

describe('TEXT_FADE isolation — changing textFade only changes opacity, never position', () => {
  // User-reported requirement: TEXT_FADE controls ONLY the opacity ramp,
  // not REST positions or activation positions.
  const baseline = computePacing(DEFAULT_CFG, N);
  const wider = computePacing({ ...DEFAULT_CFG, textFadeVh: 80 }, N);

  it('REST_VHS is identical regardless of textFade', () => {
    for (let i = 0; i < N; i++) {
      expect(wider.REST_VHS[i]).toBeCloseTo(baseline.REST_VHS[i], 5);
    }
  });

  it('ACTIVATIONS shift only by the (FRAC × textFade) ratio, REST stays put', () => {
    // ACTIVATIONS = REST − (1−FRAC)·textFade. With larger textFade,
    // the activation point moves earlier in scroll, but REST doesn't.
    for (let i = 0; i < N; i++) {
      // Compute the expected shift in activation from the fade change.
      const dActivation = wider.ACTIVATIONS[i] - baseline.ACTIVATIONS[i];
      const expectedDelta = -(1 - DEFAULT_CFG.activationFrac) * (80 - DEFAULT_CFG.textFadeVh);
      expect(dActivation).toBeCloseTo(expectedDelta, 5);
      // But the REST point — where translation = 0 — is unchanged.
      expect(wider.REST_VHS[i]).toBeCloseTo(baseline.REST_VHS[i], 5);
    }
  });
});

describe('HERO_END isolation — changing heroEnd shifts but never reshapes acts', () => {
  // User-reported requirement: dragging the HERO_END slider must not
  // change the act sequence's internal feel. Each act's fade-in length,
  // spacing, activation offset, and pixogram crossfade must stay identical
  // regardless of heroEnd. heroEnd may DELAY when acts start, but not
  // distort them.
  const baseline = computePacing({ ...DEFAULT_CFG, heroEndVh: 50 }, N);
  const heroPushed = computePacing({ ...DEFAULT_CFG, heroEndVh: 150 }, N);

  it('spacing between acts stays constant when heroEnd changes', () => {
    for (let i = 1; i < N; i++) {
      const dBase = baseline.REST_VHS[i] - baseline.REST_VHS[i - 1];
      const dPushed = heroPushed.REST_VHS[i] - heroPushed.REST_VHS[i - 1];
      expect(dPushed).toBeCloseTo(dBase, 5);
    }
  });

  it('text fade-in length stays = TEXT_FADE_VH for every act', () => {
    for (let i = 0; i < N; i++) {
      const fadeLenBase = baseline.TEXT_FADES[i][1] - baseline.TEXT_FADES[i][0];
      const fadeLenPushed = heroPushed.TEXT_FADES[i][1] - heroPushed.TEXT_FADES[i][0];
      expect(fadeLenBase).toBeCloseTo(DEFAULT_CFG.textFadeVh, 5);
      expect(fadeLenPushed).toBeCloseTo(DEFAULT_CFG.textFadeVh, 5);
    }
  });

  it('activation offset from REST stays = (1-FRAC)·FADE for every act', () => {
    const expectedOffset = (1 - DEFAULT_CFG.activationFrac) * DEFAULT_CFG.textFadeVh;
    for (let i = 0; i < N; i++) {
      expect(baseline.REST_VHS[i] - baseline.ACTIVATIONS[i]).toBeCloseTo(expectedOffset, 5);
      expect(heroPushed.REST_VHS[i] - heroPushed.ACTIVATIONS[i]).toBeCloseTo(expectedOffset, 5);
    }
  });

  it('raising heroEnd only DELAYS the act sequence (shifts all REST by same amount)', () => {
    const delta = heroPushed.REST_VHS[0] - baseline.REST_VHS[0];
    expect(delta).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < N; i++) {
      const localDelta = heroPushed.REST_VHS[i] - baseline.REST_VHS[i];
      expect(localDelta).toBeCloseTo(delta, 5);
    }
  });
});

describe('Hero separation — first pixogram does not appear during Hero', () => {
  const p = computePacing(DEFAULT_CFG, N);

  it('PIX_FADES[0] fade-in starts AT OR AFTER heroEnd', () => {
    expect(p.PIX_FADES[0][0]).toBeGreaterThanOrEqual(p.heroEnd);
  });

  it('Pixogram of act 0 has opacity 0 during the entire Hero phase', () => {
    expect(opacityAt(0, p.PIX_FADES[0])).toBe(0);
    expect(opacityAt(p.heroEnd - 1, p.PIX_FADES[0])).toBe(0);
  });

  it('activeIdx is -1 (Hero phase) before ACTIVATIONS[0]', () => {
    expect(activeIdxAt(0, p.ACTIVATIONS)).toBe(-1);
    expect(activeIdxAt(p.ACTIVATIONS[0] - 1, p.ACTIVATIONS)).toBe(-1);
  });

  // ── Hard-overlap criteria from the user ─────────────────────────────
  // "Hero und Pixogramm-Section dürfen sich nicht überlappen."
  // Interpretation: while ANY Hero element is still visible (i.e.
  // progressVh < heroEnd → act1 < 1), NO act element (text or pixogram)
  // may have opacity > 0.

  it('NO HERO-PIX OVERLAP: no pixogram opacity > 0 while hero is still fading', () => {
    for (let v = 0; v < p.heroEnd; v += 0.5) {
      for (let i = 0; i < N; i++) {
        const o = opacityAt(v, p.PIX_FADES[i]);
        expect(o, `progressVh=${v}, act ${i}: opacity should be 0 during hero`).toBe(0);
      }
    }
  });

  it('NO HERO-TEXT OVERLAP: no act text opacity > 0 while hero is still fading', () => {
    for (let v = 0; v < p.heroEnd; v += 0.5) {
      for (let i = 0; i < N; i++) {
        const o = opacityAt(v, p.TEXT_FADES[i]);
        expect(o, `progressVh=${v}, act ${i}: text opacity should be 0 during hero`).toBe(0);
      }
    }
  });

  it('NO HERO-PIX OVERLAP (strict): at progressVh = heroEnd, hero is gone AND no pixogram visible', () => {
    // act1 = progressVh / heroEnd; at v = heroEnd → act1 = 1 (hero gone).
    // At that exact instant, all pixogram opacities should still be 0.
    for (let i = 0; i < N; i++) {
      expect(opacityAt(p.heroEnd, p.PIX_FADES[i])).toBe(0);
    }
  });
});

describe('Variants section — does NOT overlap the last act', () => {
  const p = computePacing(DEFAULT_CFG, N);
  const VARIANTS_SLIDE_VH = 100;

  it('totalVh accommodates all acts plus tail buffer', () => {
    // The spacer must extend well past the last act's REST.
    expect(p.totalVh).toBeGreaterThan(p.REST_VHS[N - 1]);
  });

  it('variants section does not enter viewport while last act is at REST', () => {
    // variants real top = totalVh - VARIANTS_SLIDE_VH
    // variants enters viewport bottom at scroll = real_top - 100vh
    const variantsRealTop = p.totalVh - VARIANTS_SLIDE_VH;
    const variantsEntersAt = variantsRealTop - 100; // viewport-height
    // At REST of the last act, variants must still be below the viewport.
    expect(variantsEntersAt).toBeGreaterThanOrEqual(p.REST_VHS[N - 1]);
  });

  it('variants enters viewport exactly at last REST (or later, depending on TAIL_HOLD)', () => {
    // With TAIL_HOLD_VH = 0, variants begins entering right at the last
    // REST. Hold buffer >= 0.
    const variantsEntersAt = p.totalVh - VARIANTS_SLIDE_VH - 100;
    expect(variantsEntersAt - p.REST_VHS[N - 1]).toBeGreaterThanOrEqual(0);
  });
});

describe('PIX_FADES — crossfade between adjacent pixograms keeps 100% coverage', () => {
  const p = computePacing(DEFAULT_CFG, N);

  it('between acts N and N+1 in their pix-crossfade window, sum ≈ 1', () => {
    // Pick the midpoint of the act-1 → act-2 pixogram crossfade
    const mid = (p.ACTIVATIONS[2] - DEFAULT_CFG.pixMarginVh - DEFAULT_CFG.pixTransitionVh / 2);
    const o1 = opacityAt(mid, p.PIX_FADES[1]);
    const o2 = opacityAt(mid, p.PIX_FADES[2]);
    expect(o1 + o2).toBeCloseTo(1, 3);
  });

  it('pixogram of act N+1 reaches opacity 1 at (ACTIVATIONS[N+1] − MARGIN)', () => {
    const point = p.ACTIVATIONS[2] - DEFAULT_CFG.pixMarginVh;
    expect(opacityAt(point, p.PIX_FADES[2])).toBeCloseTo(1, 5);
  });
});
