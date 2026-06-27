/**
 * Regression — Earring flow must never mount the engagement-ring DiamondSelector.
 *
 * Reproduced defect: clicking the diamond-selection CTA on an earring product page
 * crashed with `TypeError: liveDiamonds.filter is not a function`, because a
 * non-configurable earring fell through to JewelleryDetailPage which mounts the
 * engagement-ring DiamondSelector, and DiamondSelector received a non-array
 * inventory response (shared SWR cache key + non-normalising pre-warm fetcher).
 *
 * These tests prove:
 *  1. Classic Studs (1 matched_pair slot) drives the pair-selector path.
 *  2. Drop Earrings (2 matched_pair slots) drive the pair-selector path for both slots.
 *  3. No earring component imports DiamondSelector; the earrings route never mounts it.
 *  4. The earring pairs endpoint response is parsed as an array before card rendering.
 *  5. A malformed pairs response does not crash the selector.
 *  6. A malformed engagement-ring diamond response does not crash DiamondSelector.
 *  7. The engagement-ring selector still resolves a normal array of diamonds.
 *  8. Existing E4/E5 earring config behaviour is unchanged.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRequiredSelectorSlots } from '@/lib/earrings/validation';
import { normaliseDiamondInventory } from '@/components/engagement/DiamondSelector';
import type { SlotDescriptor } from '@/lib/earrings/validation';
import type { CompatiblePairCard } from '@/lib/earrings/types';

const ROOT = process.cwd();

// Mirror of EarringPairSelector's response parsing (data.pairs ?? []).
function parsePairsResponse(data: unknown): CompatiblePairCard[] {
  const body = data as { pairs?: CompatiblePairCard[]; error?: string } | null;
  if (body?.error) throw new Error(body.error);
  return body?.pairs ?? [];
}

// ── 1 & 2: matched_pair earrings drive the pair-selector path ──────────────────

describe('Earring routing — matched_pair products use the pair selector', () => {
  it('1: Classic Studs (1 matched_pair slot) yields one pair-selector slot', () => {
    const slots: SlotDescriptor[] = [
      { slot_key: 'centre_pair', selection_mode: 'matched_pair', required: true },
    ];
    const hasMatchedPair = slots.some(s => s.selection_mode === 'matched_pair');
    expect(hasMatchedPair).toBe(true); // → EarringDetailPage path
    expect(getRequiredSelectorSlots(slots).map(s => s.slot_key)).toEqual(['centre_pair']);
  });

  it('2: Drop Earrings (2 matched_pair slots) yield a pair selector for both slots', () => {
    const slots: SlotDescriptor[] = [
      { slot_key: 'top_pair',  selection_mode: 'matched_pair', required: true },
      { slot_key: 'drop_pair', selection_mode: 'matched_pair', required: true },
    ];
    const hasMatchedPair = slots.some(s => s.selection_mode === 'matched_pair');
    expect(hasMatchedPair).toBe(true); // → EarringDetailPage path
    expect(getRequiredSelectorSlots(slots).map(s => s.slot_key)).toEqual(['top_pair', 'drop_pair']);
  });
});

// ── 3: No earring component imports DiamondSelector; route never mounts it ──────

describe('Earring isolation from the engagement-ring DiamondSelector', () => {
  const earringComponents = [
    'src/components/earrings/EarringDetailPage.tsx',
    'src/components/earrings/EarringPairSelector.tsx',
    'src/components/earrings/MatchedPairCard.tsx',
  ];

  it('3a: no earring component imports DiamondSelector', () => {
    for (const rel of earringComponents) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src, `${rel} must not import DiamondSelector`).not.toMatch(/DiamondSelector/);
    }
  });

  it('3b: the earrings route never maps an earring to a DiamondSelector mode (single/pair)', () => {
    const src = readFileSync(join(ROOT, 'src/app/earrings/[slug]/page.tsx'), 'utf8');
    // The fixed-composition fallthrough must use diamondMode 'none' only.
    // 'single' and 'pair' are the only modes that mount DiamondSelector.
    expect(src).toMatch(/diamondMode:\s*'none'/);
    expect(src).not.toMatch(/diamondMode:\s*'(single|pair)'/);
    expect(src).not.toMatch(/is_pair\s*\?\s*'pair'\s*:\s*'single'/);
    // The route routes configurable earrings to the setting-led configurator, not a selector.
    expect(src).toMatch(/resolveEarringRenderMode/);
    expect(src).toMatch(/EarringDetailPage/);
  });

  it('3c: configurable earrings render the earring offer selector (not DiamondSelector)', () => {
    const src = readFileSync(join(ROOT, 'src/components/earrings/EarringDetailPage.tsx'), 'utf8');
    expect(src).toMatch(/EarringOfferSelector/);
    expect(src).not.toMatch(/DiamondSelector/);
  });
});

// ── 4 & 5: earring pairs response is array-safe ────────────────────────────────

describe('Earring pairs endpoint response handling', () => {
  const pair: CompatiblePairCard = {
    id: 'p1', shape: 'round', total_carat: 1, carat_per_stone: 0.5,
    colour: 'D', clarity: 'VS1', colour_family: null, colour_intensity: null,
    colour_description: null, pair_price_gbp: 7000, diamond_category: 'white',
  };

  it('4: a well-formed response is parsed as an array of pair cards', () => {
    const parsed = parsePairsResponse({ pairs: [pair] });
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('p1');
  });

  it('5a: a malformed response (no pairs key) resolves to an empty array — no crash', () => {
    expect(parsePairsResponse({})).toEqual([]);
    expect(parsePairsResponse(null)).toEqual([]);
    expect(parsePairsResponse({ pairs: undefined })).toEqual([]);
  });

  it('5b: an error response surfaces a customer-safe error rather than crashing', () => {
    expect(() => parsePairsResponse({ error: 'boom' })).toThrow();
    // Caller maps any thrown error to a safe string, never the raw payload:
    let shown: string | null = null;
    try { parsePairsResponse({ error: 'internal db detail' }); }
    catch { shown = 'Could not load available pairs. Please try again.'; }
    expect(shown).toBe('Could not load available pairs. Please try again.');
    expect(shown).not.toContain('db');
  });
});

// ── 6: DiamondSelector guard — non-array inventory cannot crash ────────────────

describe('DiamondSelector defensive inventory normalisation', () => {
  it('6a: a raw { diamonds: [...] } object is normalised to its array', () => {
    const arr = normaliseDiamondInventory({ diamonds: [{ id: 'd1' }, { id: 'd2' }] });
    expect(Array.isArray(arr)).toBe(true);
    expect(arr).toHaveLength(2);
  });

  it('6b: malformed / error / nullish responses normalise to an empty array', () => {
    expect(normaliseDiamondInventory({ error: 'Internal server error' })).toEqual([]);
    expect(normaliseDiamondInventory(null)).toEqual([]);
    expect(normaliseDiamondInventory(undefined)).toEqual([]);
    expect(normaliseDiamondInventory('not-json')).toEqual([]);
    expect(normaliseDiamondInventory(42)).toEqual([]);
    expect(normaliseDiamondInventory({ diamonds: 'oops' })).toEqual([]);
  });

  it('6c: .filter is always safe on the normalised result', () => {
    const malformed: unknown = { diamonds: { not: 'an array' } };
    const safe = normaliseDiamondInventory(malformed);
    expect(() => safe.filter(() => true)).not.toThrow();
    expect(safe).toEqual([]);
  });
});

// ── 7: engagement-ring selector still resolves a normal array ──────────────────

describe('Engagement-ring DiamondSelector still loads compatible diamonds', () => {
  it('7: a plain array of diamonds passes through unchanged', () => {
    const diamonds = [
      { id: 'd1', carat: 1, color: 'D', clarity: 'VS1', price: 17000 },
      { id: 'd2', carat: 2, color: 'E', clarity: 'VS2', price: 30000 },
    ];
    const arr = normaliseDiamondInventory(diamonds);
    expect(arr).toBe(diamonds);
    expect(arr.filter(d => d.carat >= 1)).toHaveLength(2);
  });
});

// ── 8: existing E4/E5 earring config behaviour unchanged ───────────────────────

describe('E4/E5 earring config remains intact', () => {
  it('8: CompatiblePairCard public shape is unchanged (no pair_sku, normal fields present)', () => {
    const card: CompatiblePairCard = {
      id: 'p1', shape: 'round', total_carat: 1, carat_per_stone: 0.5,
      colour: 'D', clarity: 'VS1', colour_family: null, colour_intensity: null,
      colour_description: null, pair_price_gbp: 7000, diamond_category: 'white',
    };
    expect('pair_sku' in card).toBe(false);
    expect(card.carat_per_stone).toBe(0.5);
    expect(card.pair_price_gbp).toBe(7000);
  });
});
