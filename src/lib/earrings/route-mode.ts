/**
 * Earring route-mode resolution — single source of truth for how an earring
 * setting page renders. Pure and unit-tested (no database).
 *
 *   'configurable' → the product has published Earring Diamond Offers:
 *                    METAL → CHOOSE YOUR DIAMONDS → YOUR EARRINGS (EarringDetailPage).
 *
 *   'consultation' → a setting meant to be configurable but with no published offers:
 *                    premium "available following a private consultation" state.
 *
 *   'standard'     → genuinely fixed-composition earring (normal jewellery page, no
 *                    diamond selection).
 *
 * Earrings NEVER use the engagement-ring individual DiamondSelector or /api/diamonds.
 */

export type EarringRenderMode =
  | { kind: 'configurable' }
  | { kind: 'consultation' }
  | { kind: 'standard' };

export interface EarringRouteFacts {
  hasPublishedOffers: boolean;
  earringType:        string | null;
  legacyShowDiamond:  boolean;
  legacyIsPair:       boolean;
}

export function resolveEarringRenderMode(f: EarringRouteFacts): EarringRenderMode {
  // Live, editable offers exist → full configurator.
  if (f.hasPublishedOffers) return { kind: 'configurable' };

  // Genuinely fixed-composition → normal jewellery page (no diamond selection).
  if (f.earringType === 'fixed_composition') return { kind: 'standard' };

  // Classified as a configurable earring type but no published offers → consultation.
  const isConfigurableType =
    f.earringType !== null && f.earringType !== 'fixed_composition' && f.earringType !== 'other';
  if (isConfigurableType) return { kind: 'consultation' };

  // Legacy selectable flags but nothing configured → consultation (never a stripped
  // page, never the individual-diamond path).
  if (f.legacyShowDiamond || f.legacyIsPair) return { kind: 'consultation' };

  return { kind: 'standard' };
}
