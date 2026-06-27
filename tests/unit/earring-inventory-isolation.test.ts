/**
 * Earring inventory isolation — engagement-ring diamond inventory and earring
 * matched-pair inventory must be SEPARATE in customer-facing behaviour.
 *
 * Proves:
 *  - The earring selector reads ONLY explicit diamond_pairs (never the diamonds table).
 *  - Unpublished / reserved / sold pairs are excluded (so no accidental/test pair leaks).
 *  - A general engagement diamond can only surface via a published, available pair.
 *  - The customer pair card renders as TWO diamonds together (not a single-diamond card).
 *  - The earring ADMIN editor hides the individual "Manage Diamonds" panel.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validatePairAvailabilityFlags } from '@/lib/earrings/validation';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const FUTURE = new Date(Date.now() + 3600_000).toISOString();
const base = {
  pairId: 'p1', slotKey: 'centre_pair',
  diamondAStatus: 'available', diamondBStatus: 'available',
  diamondAHeldUntil: null as string | null, diamondBHeldUntil: null as string | null,
};

// ── Source: earring selection reads diamond_pairs only ─────────────────────────

describe('earring selector queries explicit pairs, never the diamonds table', () => {
  it('listCompatiblePairsForSlot reads from diamond_pairs', () => {
    const src = read('src/lib/earrings/configuration.ts');
    expect(src).toMatch(/\.from\(['"]diamond_pairs['"]\)/);
  });

  it('the earring pairs API does not select earring inventory from the diamonds table', () => {
    const src = read('src/app/api/earrings/[productId]/slots/[slotKey]/pairs/route.ts');
    expect(src).toMatch(/listCompatiblePairsForSlot/);
    expect(src).not.toMatch(/from\(['"]diamonds['"]\)/);
    expect(src).not.toMatch(/\/api\/diamonds/);
  });

  it('no earring component imports the engagement-ring DiamondSelector', () => {
    for (const rel of [
      'src/components/earrings/EarringDetailPage.tsx',
      'src/components/earrings/EarringPairSelector.tsx',
      'src/components/earrings/MatchedPairCard.tsx',
    ]) {
      expect(read(rel)).not.toMatch(/DiamondSelector/);
    }
  });
});

// ── Behaviour: only published+available pairs are selectable ───────────────────

describe('pair availability gating', () => {
  it('an unpublished pair is never selectable', () => {
    const errs = validatePairAvailabilityFlags({ ...base, pairStatus: 'available', isPublished: false, heldUntil: null });
    expect(errs.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('a reserved pair is never selectable', () => {
    const errs = validatePairAvailabilityFlags({ ...base, pairStatus: 'reserved', isPublished: true, heldUntil: FUTURE });
    expect(errs.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('a sold pair is never selectable', () => {
    const errs = validatePairAvailabilityFlags({ ...base, pairStatus: 'sold', isPublished: true, heldUntil: null });
    expect(errs.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('a published, available pair with available diamonds is selectable', () => {
    const errs = validatePairAvailabilityFlags({ ...base, pairStatus: 'available', isPublished: true, heldUntil: null });
    expect(errs).toHaveLength(0);
  });

  it('a pair whose constituent diamond is individually reserved is not selectable', () => {
    const errs = validatePairAvailabilityFlags({
      ...base, pairStatus: 'available', isPublished: true, heldUntil: null,
      diamondAStatus: 'reserved', diamondAHeldUntil: FUTURE,
    });
    expect(errs.some(e => e.code === 'pair_unavailable')).toBe(true);
  });
});

// ── Customer card renders as a dual-diamond matched pair ───────────────────────

describe('MatchedPairCard presents two diamonds together (not a single-diamond card)', () => {
  const src = read('src/components/earrings/MatchedPairCard.tsx');

  it('shows the "matched pair" framing and two diamond silhouettes', () => {
    expect(src).toMatch(/Matched Diamond Pair/i);
    expect(src).toMatch(/Two \{cutName\(pair\.shape\)\} Diamonds/); // "Two {cut} Diamonds"
    expect((src.match(/<DiamondSilhouette\s*\/>/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('exposes no internal fields (id/SKU/supplier/status/hold/notes)', () => {
    expect(src).not.toMatch(/pair_sku|matching_notes|held_by_cart|held_until|supplier|diamond_id/);
  });
});

// ── Earring admin hides individual-diamond assignment ──────────────────────────

describe('earring admin is pair-based, not individual-diamond based', () => {
  it('AdminProductEditor supports hiding the diamond panel', () => {
    const src = read('src/components/admin/AdminProductEditor.tsx');
    expect(src).toMatch(/showDiamondPanel/);
    expect(src).toMatch(/showDiamondPanel !== false/);
  });

  it('the earring admin editor disables the individual "Manage Diamonds" panel', () => {
    const src = read('src/app/admin/(console)/earrings/[id]/page.tsx');
    expect(src).toMatch(/showDiamondPanel=\{false\}/);
  });
});
