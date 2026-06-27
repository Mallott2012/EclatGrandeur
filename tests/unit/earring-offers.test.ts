/**
 * Earring Diamond Offers — the ACTIVE customer model.
 *
 * Proves the customer flow is offer-driven (Metal → Choose Your Diamonds → Your
 * Earrings), uses only the editable offers (never the diamonds table / /api/diamonds
 * / engagement DiamondSelector), and presents offers as dual-diamond matched pairs.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clarityLabel } from '@/lib/earrings/offer-types';
import {
  toPence, cutLabel, buildOfferDescription,
  buildEarringCartLineId, getOfferIdFromEarringConfig, wouldDuplicateOfferInCart,
} from '@/lib/earrings/cart-helpers';
import type { ConfiguredEarring } from '@/types';
import type { CartItem } from '@/lib/store/cart';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

function cfg(over: Partial<ConfiguredEarring> = {}): ConfiguredEarring {
  return {
    productId: 'p1', productSlug: 'aura', productName: 'Aura', productMedia: '',
    offerId: 'o1', metalVariantId: 'platinum', metalLabel: 'Platinum', earringType: 'classic_studs',
    cut: 'round', totalCarat: 1, caratPerStone: 0.5, colour: 'E', clarity: 'FL',
    availability: 'made_to_order', totalPrice: 700000, currency: 'GBP', addedAt: new Date().toISOString(),
    ...over,
  };
}
function item(c: ConfiguredEarring): CartItem {
  return { id: buildEarringCartLineId(c.productId, c.offerId), name: c.productName, href: '/earrings/aura',
    price: { amount: c.totalPrice, currency: 'GBP' }, qty: 1, art: { kind: 'stud-earrings', shape: 'round', metal: 'platinum' }, earringConfig: c };
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

describe('offer cart helpers', () => {
  it('toPence converts GBP to minor units', () => { expect(toPence(7000)).toBe(700000); });
  it('clarity FL renders as "Flawless"; round cut as "Round Brilliant"', () => {
    expect(clarityLabel('FL')).toBe('Flawless');
    expect(cutLabel('round')).toBe('Round Brilliant');
    expect(cutLabel('oval')).toBe('Oval');
  });
  it('buildOfferDescription is customer-safe', () => {
    const d = buildOfferDescription(cfg());
    expect(d).toBe('1.00ct total · Round Brilliant · E · Flawless');
    expect(d).not.toMatch(/EGO-|sku|offerId/i);
  });
  it('cart line id is deterministic from product + offer; dedup detects duplicate offer', () => {
    expect(buildEarringCartLineId('p1', 'o1')).toBe('earring-p1-o1');
    expect(getOfferIdFromEarringConfig(cfg())).toBe('o1');
    expect(wouldDuplicateOfferInCart([item(cfg())], 'o1')).toBe(true);
    expect(wouldDuplicateOfferInCart([item(cfg())], 'o2')).toBe(false);
  });
});

// ── Source: offer-driven, never engagement-ring diamonds ───────────────────────

describe('customer earring flow is offer-driven and isolated from ring diamonds', () => {
  it('offers service reads earring_offers, never the diamonds table', () => {
    const src = read('src/lib/earrings/offers.ts');
    expect(src).toMatch(/\.from\(['"]earring_offers['"]\)/);
    expect(src).not.toMatch(/\.from\(['"]diamonds['"]\)/);
  });

  it('offers API is customer-safe and never queries /api/diamonds', () => {
    const src = read('src/app/api/earrings/[productId]/offers/route.ts');
    expect(src).toMatch(/listPublishedOffers/);
    expect(src).not.toMatch(/\/api\/diamonds/);
  });

  it('PublicEarringOffer excludes sku / admin_note (customer-safe shape)', () => {
    const src = read('src/lib/earrings/offer-types.ts');
    // The PublicEarringOffer interface must not carry sku or admin_note.
    const pub = src.slice(src.indexOf('interface PublicEarringOffer'), src.indexOf('interface EarringOfferAdmin'));
    expect(pub).not.toMatch(/\bsku\b/);
    expect(pub).not.toMatch(/admin_note/);
  });

  it('EarringDetailPage: Metal → Choose Your Diamonds → Your Earrings; no DiamondSelector / /api/diamonds', () => {
    const src = read('src/components/earrings/EarringDetailPage.tsx');
    expect(src).toMatch(/Choose Your Diamonds/i);
    expect(src).toMatch(/Your Earrings/i);
    expect(src).toMatch(/EarringOfferSelector/);
    expect(src).not.toMatch(/DiamondSelector/);
    expect(src).not.toMatch(/\/api\/diamonds/);
  });

  it('the offer selector filters by carat/colour/clarity and uses the offers API', () => {
    const src = read('src/components/earrings/EarringOfferSelector.tsx');
    expect(src).toMatch(/\/offers/);
    expect(src).toMatch(/Carat/);
    expect(src).toMatch(/Colour/);
    expect(src).toMatch(/Clarity/);
    expect(src).not.toMatch(/\/api\/diamonds/);
  });
});

// ── Offer card is a dual-diamond matched pair ──────────────────────────────────

describe('EarringOfferCard is a compact dual-diamond card (matches DiamondCard format)', () => {
  const src = read('src/components/earrings/EarringOfferCard.tsx');
  it('shows two diamond glyphs and a subtle "Matched pair" label', () => {
    expect((src.match(/<DiamondGlyph\s*\/>/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(src).toMatch(/Matched pair/i);
    expect(src).toMatch(/Pair/); // "{cut} Pair" headline
  });
  it('uses the DiamondCard compact format (selection radio, no giant per-card button)', () => {
    expect(src).toMatch(/padding: '14px 13px'/);          // same card padding as DiamondCard
    expect(src).not.toMatch(/Select this pair/i);          // selection is by card click + footer confirm
  });
  it('exposes no internal fields', () => {
    expect(src).not.toMatch(/sku|admin_note|supplier|held_by_cart|gia_report/i);
  });
});

describe('EarringOfferSelector matches the engagement DiamondSelector shell', () => {
  const src = read('src/components/earrings/EarringOfferSelector.tsx');
  it('uses the same shell primitives: flex-col h-full, 2-col grid, footer confirm', () => {
    expect(src).toMatch(/flex flex-col h-full bg-white/);
    expect(src).toMatch(/grid grid-cols-2 gap-3/);
    expect(src).toMatch(/Select Pair/);
    expect(src).toMatch(/Need an Expert\?/);
  });
  it('has a carat range slider + colour + clarity filters and a reset', () => {
    expect(src).toMatch(/RangeSlider/);
    expect(src).toMatch(/Carat Weight/);
    expect(src).toMatch(/Colour/);
    expect(src).toMatch(/Clarity/);
    expect(src).toMatch(/Reset/);
  });
});
