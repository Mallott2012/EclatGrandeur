/**
 * Earring route-mode resolution (pure). The setting page renders one of:
 * configurable (setting-led pair configurator), consultation, or standard (fixed).
 * Earrings never use the engagement-ring individual DiamondSelector.
 */
import { describe, it, expect } from 'vitest';
import { resolveEarringRenderMode } from '@/lib/earrings/route-mode';

const base = {
  hasMatchedPairSlots: false, isCompletable: false,
  earringType: null as string | null, legacyShowDiamond: false, legacyIsPair: false,
};

describe('resolveEarringRenderMode', () => {
  it('configurable when matched-pair slots have live inventory', () => {
    expect(resolveEarringRenderMode({ ...base, hasMatchedPairSlots: true, isCompletable: true }))
      .toEqual({ kind: 'configurable' });
  });

  it('consultation when slots exist but no inventory (sold out / not yet stocked)', () => {
    expect(resolveEarringRenderMode({ ...base, hasMatchedPairSlots: true, isCompletable: false }))
      .toEqual({ kind: 'consultation' });
  });

  it('consultation for a configurable type (e.g. halo_studs) with no slots — Aura case', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'halo_studs' }))
      .toEqual({ kind: 'consultation' });
  });

  it('consultation for a legacy selectable earring with no pair config (never stripped)', () => {
    expect(resolveEarringRenderMode({ ...base, legacyShowDiamond: true, legacyIsPair: true }))
      .toEqual({ kind: 'consultation' });
  });

  it('standard (fixed) for fixed_composition', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'fixed_composition' }))
      .toEqual({ kind: 'standard' });
  });

  it('standard for a plain earring with no selectable indicators', () => {
    expect(resolveEarringRenderMode(base)).toEqual({ kind: 'standard' });
  });

  it('never resolves to an individual-diamond selector (only the three earring modes)', () => {
    const kinds = new Set(['configurable', 'consultation', 'standard']);
    for (const f of [
      { ...base, hasMatchedPairSlots: true, isCompletable: true },
      { ...base, earringType: 'classic_studs' },
      { ...base, earringType: 'fixed_composition' },
    ]) {
      expect(kinds.has(resolveEarringRenderMode(f).kind)).toBe(true);
    }
  });
});
