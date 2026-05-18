/**
 * Plus⁵ scroll-pacing math — extracted into pure functions so the
 * choreography can be unit-tested without spinning up the page.
 *
 * Model (per act):
 *   REST       = scroll-vh where the text is in its focus position
 *                (translation = 0, opacity = 1, fully visible).
 *   ACTIVATION = scroll-vh where the act officially takes over
 *                (timeline dot switches, pixogram crossfade ends).
 *                Sits anywhere inside the text fade-in window:
 *                  ACTIVATION_FRAC = 1 → activation = rest
 *                  ACTIVATION_FRAC = 0 → activation = fade-in start
 *
 *   TEXT_FADE  window per act [a, b, c, d]:
 *     a = rest − TEXT_FADE          fade-in start  (opacity 0)
 *     b = rest                      fade-in end    (opacity 1, REST)
 *     c = restNext − TEXT_FADE      fade-out start
 *     d = restNext                  fade-out end   (opacity 0)
 *
 *   PIX_FADE   window per act [a, b, c, d]:
 *     a = activation − MARGIN − TRANSITION   crossfade-in start
 *     b = activation − MARGIN                crossfade-in end
 *     c = activationNext − MARGIN − TRANSITION
 *     d = activationNext − MARGIN
 *
 *   First-act override: PIX_FADES[0] is clamped so the very first
 *     pixogram fade-in starts AFTER the Hero is gone (no crossfade
 *     FROM a non-existent previous pixogram, no overlap with Hero).
 */

export type Win = [number, number, number, number];

export interface PacingConfig {
  /** Doc-scroll vh where the Hero phase ends (title gone, clock-photo
   *  + dim layer faded out). NOTHING from the act sequence may be
   *  visible at or before this point. */
  heroEndVh: number;
  /** Where act 0's REST point sits on the doc-scroll vh axis. Must be
   *  > heroEndVh + textFadeVh so there's a clean spacer between the
   *  Hero and the first act's fade-in. */
  startVh: number;
  /** Distance between consecutive REST points (act-to-act). */
  spacingVh: number;
  /** Length of the text crossfade in vh. */
  textFadeVh: number;
  /** Where activation sits inside the text fade-in (0..1). */
  activationFrac: number;
  /** Length of the pixogram crossfade in vh. */
  pixTransitionVh: number;
  /** vh that the pixogram crossfade is finished BEFORE the next activation. */
  pixMarginVh: number;
  /** Extra hold time AFTER the last act's REST before the next section
   *  (Variants) starts sliding into view. 0 = next section enters
   *  viewport at the last act's rest position; larger = more breathing
   *  room before the outro begins. */
  tailHoldVh: number;
}

export interface PacingTables {
  REST_VHS: number[];
  ACTIVATIONS: number[];
  TEXT_FADES: Win[];
  PIX_FADES: Win[];
  /** Doc-scroll vh where the Hero phase ends and act 0's text fade-in begins. */
  heroEnd: number;
  /** Total height the scroll spacer needs to be (in vh). After this point
   *  the hero un-pins and the next section (Variants) takes over. */
  totalVh: number;
}

/** vh that the Variants section needs to slide up from below the
 *  viewport into full view. Equal to the negative margin-top on the
 *  variants element in CSS, i.e. (margin-top: -100vh → 100). */
export const VARIANTS_SLIDE_VH = 100;

export function computePacing(cfg: PacingConfig, chapterCount: number): PacingTables {
  const n = chapterCount;
  const REST_VHS: number[] = new Array(n);
  const ACTIVATIONS: number[] = new Array(n);
  const TEXT_FADES: Win[] = new Array(n);
  const PIX_FADES: Win[] = new Array(n);
  // All vh values are used 1:1 — they ARE the animation pacing. The
  // separate "scroll scale" knob in the host modifies mouse-scroll
  // sensitivity by scaling progressVh + container height, NOT by
  // touching the timing values here.
  const heroEndVh    = cfg.heroEndVh;
  const startVh      = cfg.startVh;
  const spacingVh    = cfg.spacingVh;
  const textFadeVh   = cfg.textFadeVh;
  const pixTransVh   = cfg.pixTransitionVh;
  const pixMarginVh  = cfg.pixMarginVh;
  const preFade = (1 - cfg.activationFrac) * textFadeVh;
  // Shift logic: REST_VHS is purely a function of (startVh, spacingVh,
  // heroEndVh). textFade MUST NOT affect position — it only shapes the
  // opacity ramp. If the user drags heroEnd past startVh, push every
  // act forward by the overlap.
  const shift = Math.max(0, heroEndVh - startVh);
  const effectiveStartVh = startVh + shift;
  for (let i = 0; i < n; i++) {
    REST_VHS[i] = effectiveStartVh + i * spacingVh;
    ACTIVATIONS[i] = REST_VHS[i] - preFade;
  }
  for (let i = 0; i < n; i++) {
    const rest = REST_VHS[i];
    const restNext = i + 1 < n ? REST_VHS[i + 1] : rest + spacingVh;
    TEXT_FADES[i] = [
      rest     - textFadeVh,
      rest,
      restNext - textFadeVh,
      restNext,
    ];
    const act = ACTIVATIONS[i];
    const actNext = i + 1 < n ? ACTIVATIONS[i + 1] : act + spacingVh;
    PIX_FADES[i] = [
      act     - pixMarginVh - pixTransVh,
      act     - pixMarginVh,
      actNext - pixMarginVh - pixTransVh,
      actNext - pixMarginVh,
    ];
  }
  // heroEnd is the line where the Hero phase ends. The shift logic
  // above already guarantees no act element overlaps the Hero, so no
  // per-act clamping is needed here. The first act's pixogram still
  // needs its own fade-in start to be after heroEnd (it has no previous
  // pixogram to crossfade from), so clamp just that one window.
  const heroEnd = Math.max(1, heroEndVh);
  if (n > 0) {
    PIX_FADES[0][0] = Math.max(PIX_FADES[0][0], heroEnd);
    PIX_FADES[0][1] = Math.max(PIX_FADES[0][1], PIX_FADES[0][0] + 1);
  }
  // totalVh = the height of the scroll spacer. Sized so that the
  // Variants section (which has margin-top: -VARIANTS_SLIDE_VH) only
  // STARTS sliding into view AFTER the last act has been held for
  // TAIL_HOLD_VH vh. Math:
  //   variants natural top = totalVh
  //   variants real top    = totalVh - VARIANTS_SLIDE_VH
  //   variants enters viewport bottom at scroll = real_top - 100vh
  // We require: enters_viewport_bottom >= lastRest + TAIL_HOLD_VH
  //   → totalVh - VARIANTS_SLIDE_VH - 100 >= lastRest + TAIL_HOLD_VH
  //   → totalVh >= lastRest + TAIL_HOLD_VH + VARIANTS_SLIDE_VH + 100
  const lastRest = n > 0 ? REST_VHS[n - 1] : 0;
  const tailHoldVh = Math.max(0, cfg.tailHoldVh);
  const totalVh = lastRest + tailHoldVh + VARIANTS_SLIDE_VH + 100;
  return { REST_VHS, ACTIVATIONS, TEXT_FADES, PIX_FADES, heroEnd, totalVh };
}

/** Trapezoidal 0..1 opacity from a fade window [a, b, c, d]. */
export function opacityAt(progressVh: number, win: Win): number {
  const [a, b, c, d] = win;
  if (progressVh <= a || progressVh >= d) return 0;
  if (progressVh >= b && progressVh <= c) return 1;
  if (progressVh < b) return (progressVh - a) / (b - a);
  return (d - progressVh) / (d - c);
}

/** Text translation in CSS px. 0 at REST, scrolls 1:1 with progressVh. */
export function textTranslatePx(progressVh: number, restVh: number, viewportPx: number): number {
  return -(progressVh - restVh) * viewportPx / 100;
}

/**
 * Sticky activation: returns the highest index i whose ACTIVATIONS[i]
 * has been passed. Returns -1 before any act activates (Hero phase).
 */
export function activeIdxAt(progressVh: number, activations: number[]): number {
  let idx = -1;
  for (let i = 0; i < activations.length; i++) {
    if (progressVh >= activations[i]) idx = i;
    else break;
  }
  return idx;
}
