/**
 * Earring route-mode resolution (pure, offers model). The setting page renders:
 * configurable (Metal → Choose Your Diamonds), consultation, or standard (fixed).
 * Earrings never use the engagement-ring individual DiamondSelector.
 */
import { describe, it, expect } from 'vitest';
import { resolveEarringRenderMode } from '@/lib/earrings/route-mode';

const base = {
  hasPublishedOffers: false,
  earringType: null as string | null, legacyShowDiamond: false, legacyIsPair: false,
};

describe('resolveEarringRenderMode (offers)', () => {
  it('configurable when the product has published offers', () => {
    expect(resolveEarringRenderMode({ ...base, hasPublishedOffers: true })).toEqual({ kind: 'configurable' });
  });

  it('consultation for a configurable type with no published offers (Aura case)', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'halo_studs' })).toEqual({ kind: 'consultation' });
  });

  it('consultation for a legacy selectable earring with no offers (never stripped)', () => {
    expect(resolveEarringRenderMode({ ...base, legacyShowDiamond: true, legacyIsPair: true })).toEqual({ kind: 'consultation' });
  });

  it('standard (fixed) for fixed_composition', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'fixed_composition' })).toEqual({ kind: 'standard' });
  });

  it('standard for a plain earring with no selectable indicators', () => {
    expect(resolveEarringRenderMode(base)).toEqual({ kind: 'standard' });
  });

  it('only ever resolves to the three earring modes (never an individual-diamond selector)', () => {
    const kinds = new Set(['configurable', 'consultation', 'standard']);
    for (const f of [
      { ...base, hasPublishedOffers: true },
      { ...base, earringType: 'classic_studs' },
      { ...base, earringType: 'fixed_composition' },
    ]) {
      expect(kinds.has(resolveEarringRenderMode(f).kind)).toBe(true);
    }
  });
});
