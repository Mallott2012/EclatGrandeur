/**
 * Earring-variant model unit tests (pure — no database).
 *
 * Covers the customer-facing variant model that replaced the matched-pair system:
 * route-mode resolution, cart helpers, and clarity labelling. The customer chooses
 * only metal / total carat / colour / clarity — never individual diamonds or pairs.
 */

import { describe, it, expect } from 'vitest';
import { resolveEarringRenderMode } from '@/lib/earrings/route-mode';
import {
  toPence, clarityLabel, buildVariantDescription,
  buildEarringCartLineId, getVariantIdFromEarringConfig,
  wouldDuplicateVariantInCart, isEarringCartLineExpired,
} from '@/lib/earrings/cart-helpers';
import { CLARITY_LABEL } from '@/lib/earrings/types';
import type { ConfiguredEarring } from '@/types';
import type { CartItem } from '@/lib/store/cart';

function cfg(over: Partial<ConfiguredEarring> = {}): ConfiguredEarring {
  return {
    productId: 'p1', productSlug: 'aura', productName: 'Aura', productMedia: '',
    variantId: 'v1', metalVariantId: 'yellow-gold-18k', metalLabel: '18k Yellow Gold',
    earringType: 'classic_studs', totalCarat: 1, colour: 'D', clarity: 'VS1',
    availability: 'available', totalPrice: 500000, currency: 'GBP',
    reservationExpiresAt: new Date(Date.now() + 3600000).toISOString(), addedAt: new Date().toISOString(),
    ...over,
  };
}
function item(c: ConfiguredEarring): CartItem {
  return { id: buildEarringCartLineId(c.productId, c.variantId), name: c.productName, href: '/earrings/aura',
    price: { amount: c.totalPrice, currency: 'GBP' }, qty: 1, art: { kind: 'stud-earrings', shape: 'round', metal: 'platinum' }, earringConfig: c };
}

// ── Route mode ──────────────────────────────────────────────────────────────────

describe('resolveEarringRenderMode', () => {
  const base = { earringType: null, purchasableVariantCount: 0, legacyShowDiamond: false, legacyIsPair: false };

  it('configurable when there are purchasable variants', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'classic_studs', purchasableVariantCount: 3 }))
      .toEqual({ kind: 'configurable' });
  });

  it('consultation for a configurable type with no live variants (Aura case)', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'halo_studs', purchasableVariantCount: 0 }))
      .toEqual({ kind: 'consultation' });
  });

  it('consultation for a legacy selectable earring with no variants (never a stripped page)', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: null, legacyShowDiamond: true, legacyIsPair: true }))
      .toEqual({ kind: 'consultation' });
  });

  it('standard (fixed) for fixed_composition', () => {
    expect(resolveEarringRenderMode({ ...base, earringType: 'fixed_composition' }))
      .toEqual({ kind: 'standard' });
  });

  it('standard for a plain product with no selectable indicators', () => {
    expect(resolveEarringRenderMode(base)).toEqual({ kind: 'standard' });
  });

  it('a configurable earring never resolves to an individual-diamond selector', () => {
    const mode = resolveEarringRenderMode({ ...base, earringType: 'drop_earrings', purchasableVariantCount: 5 });
    expect(mode.kind).toBe('configurable'); // EarringDetailPage → variants only, never DiamondSelector
  });
});

// ── Clarity labelling ────────────────────────────────────────────────────────────

describe('clarity labelling', () => {
  it('shows FL as "Flawless" publicly, others unchanged', () => {
    expect(clarityLabel('FL')).toBe('Flawless');
    expect(clarityLabel('VS1')).toBe('VS1');
    expect(CLARITY_LABEL.FL).toBe('Flawless');
  });
  it('passes unknown values through safely', () => {
    expect(clarityLabel('XX')).toBe('XX');
  });
});

// ── Cart helpers ─────────────────────────────────────────────────────────────────

describe('variant cart helpers', () => {
  it('toPence converts GBP to minor units', () => {
    expect(toPence(5000)).toBe(500000);
    expect(toPence(0.01)).toBe(1);
  });

  it('buildVariantDescription is customer-safe (no SKU / internal data)', () => {
    const d = buildVariantDescription({ totalCarat: 1, colour: 'D', clarity: 'FL' });
    expect(d).toBe('1.00ct total · D · Flawless');
    expect(d).not.toMatch(/EGE-|SKU|sku/);
  });

  it('deterministic cart line id from productId + variantId', () => {
    expect(buildEarringCartLineId('p1', 'v1')).toBe('earring-p1-v1');
    expect(buildEarringCartLineId('p1', 'v1')).toBe(buildEarringCartLineId('p1', 'v1'));
  });

  it('extracts variant id from a config', () => {
    expect(getVariantIdFromEarringConfig(cfg({ variantId: 'vX' }))).toBe('vX');
  });

  it('detects a duplicate variant already in the cart', () => {
    const cart = [item(cfg({ variantId: 'v1' }))];
    expect(wouldDuplicateVariantInCart(cart, 'v1')).toBe(true);
    expect(wouldDuplicateVariantInCart(cart, 'v2')).toBe(false);
  });

  it('expiry: available hold expires; made-to-order never expires', () => {
    expect(isEarringCartLineExpired(cfg({ reservationExpiresAt: new Date(Date.now() - 1000).toISOString() }))).toBe(true);
    expect(isEarringCartLineExpired(cfg({ reservationExpiresAt: new Date(Date.now() + 3600000).toISOString() }))).toBe(false);
    expect(isEarringCartLineExpired(cfg({ availability: 'made_to_order', reservationExpiresAt: null }))).toBe(false);
  });
});

// ── Model guarantees ─────────────────────────────────────────────────────────────

describe('variant model contains no individual-diamond / pair concepts', () => {
  it('ConfiguredEarring exposes only finished-set spec fields', () => {
    const c = cfg();
    expect(c).toHaveProperty('variantId');
    expect(c).toHaveProperty('totalCarat');
    expect(c).toHaveProperty('colour');
    expect(c).toHaveProperty('clarity');
    expect(c).not.toHaveProperty('selectedSlots');
    expect(c).not.toHaveProperty('pairId');
    expect(c).not.toHaveProperty('diamondId');
  });
});
