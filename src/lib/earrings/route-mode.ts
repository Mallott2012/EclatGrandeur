/**
 * Earring route-mode resolution — single source of truth for how an earring
 * setting page renders. Pure and unit-tested (no database).
 *
 *   'configurable' → setting/style-led configurator: the customer selects
 *                    metal / cut / colour / clarity / total carat, then chooses a
 *                    real curated matched pair (EarringDetailPage + EarringPairSelector).
 *                    Requires matched-pair slots AND live compatible pair inventory.
 *
 *   'consultation' → a premium "available following a private consultation" state for
 *                    a setting meant to be configurable that has no live pair inventory.
 *                    Never an empty/broken selector or a false Choose-Your-Diamonds button.
 *
 *   'standard'     → genuinely fixed-composition earring rendered through the normal
 *                    jewellery page with NO diamond selection.
 *
 * Earrings NEVER use the engagement-ring individual DiamondSelector.
 */

export type EarringRenderMode =
  | { kind: 'configurable' }
  | { kind: 'consultation' }
  | { kind: 'standard' };

export interface EarringRouteFacts {
  hasMatchedPairSlots: boolean;
  /** getEarringConfigurationAvailability().isCompletable — required slots all have inventory. */
  isCompletable:       boolean;
  earringType:         string | null;
  legacyShowDiamond:   boolean;
  legacyIsPair:        boolean;
}

export function resolveEarringRenderMode(f: EarringRouteFacts): EarringRenderMode {
  // Configured with live matched-pair inventory → full configurator.
  if (f.hasMatchedPairSlots && f.isCompletable) return { kind: 'configurable' };

  // Configured slots but no live inventory → consultation (never a broken selector).
  if (f.hasMatchedPairSlots) return { kind: 'consultation' };

  // No slots yet, but classified as a configurable earring type → consultation.
  const isConfigurableType =
    f.earringType !== null && f.earringType !== 'fixed_composition' && f.earringType !== 'other';
  if (isConfigurableType) return { kind: 'consultation' };

  // Legacy selectable flags but no pair configuration → consultation
  // (never the old individual-diamond path, never a silently stripped page).
  if (f.legacyShowDiamond || f.legacyIsPair) return { kind: 'consultation' };

  // Genuinely fixed-composition / plain earring.
  return { kind: 'standard' };
}
