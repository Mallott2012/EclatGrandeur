/**
 * Earring route-mode resolution — single source of truth for how an earring
 * product page renders. Pure and unit-tested (no database).
 *
 * The page decides between:
 *   - 'configurable'  → the variant configurator (metal/carat/colour/clarity).
 *   - 'consultation'  → a premium "available following a private consultation"
 *                       state for a product that is meant to be configurable but
 *                       currently has no live, purchasable variants.
 *   - 'standard'      → a fixed-composition earring rendered through the normal
 *                       jewellery page with no diamond selection.
 *
 * Earrings NEVER use the engagement-ring individual-diamond DiamondSelector.
 * 'standard' here is always diamondMode 'none'.
 */

export type EarringRenderMode =
  | { kind: 'configurable' }
  | { kind: 'consultation' }
  | { kind: 'standard' };

export interface EarringRouteFacts {
  /** Product classification (earring_type), e.g. 'halo_studs' | 'fixed_composition' | null. */
  earringType:              string | null;
  /** Count of currently live, purchasable variants for the product. */
  purchasableVariantCount:  number;
  /** Legacy flags retained on the product (used only as a safety net). */
  legacyShowDiamond:        boolean;
  legacyIsPair:             boolean;
}

export function resolveEarringRenderMode(f: EarringRouteFacts): EarringRenderMode {
  // 1. Has live sellable variants → full configurator.
  if (f.purchasableVariantCount > 0) return { kind: 'configurable' };

  // 2. Genuinely fixed-composition earring → normal jewellery page (no selectors).
  if (f.earringType === 'fixed_composition') return { kind: 'standard' };

  // 3. Meant to be configurable (any configurable classification) but no live
  //    variants yet → premium consultation-only state.
  const isConfigurableType =
    f.earringType !== null && f.earringType !== 'fixed_composition' && f.earringType !== 'other';
  if (isConfigurableType) return { kind: 'consultation' };

  // 4. Legacy selectable earring with no variant/classification → consultation
  //    (never the old individual-diamond path, never a silently stripped page).
  if (f.legacyShowDiamond || f.legacyIsPair) return { kind: 'consultation' };

  // 5. Otherwise a plain fixed earring.
  return { kind: 'standard' };
}
