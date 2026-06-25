import { describe, it, expect } from 'vitest';
import { CreateDiamondSchema } from '@/lib/diamonds/schemas';

// Acceptance tests T7-T12 — Phase 2 schema colour validation
describe('Phase 2 schema — colour family validation', () => {
  const base = {
    cut: 'oval' as const, carat: 1.00, colour: 'G' as const,
    clarity: 'VS1' as const, fluorescence: 'none' as const, price_gbp: 5000,
  };

  it('T7: rejects colour_family=green (not in enum)', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, diamond_category: 'coloured', colour_family: 'green' });
    expect(r.success).toBe(false);
  });

  it('T8: accepts colour_family=yellow', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, diamond_category: 'coloured', colour_family: 'yellow' });
    expect(r.success).toBe(true);
  });

  it('T9: accepts colour_family=pink', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, diamond_category: 'coloured', colour_family: 'pink' });
    expect(r.success).toBe(true);
  });

  it('T10: rejects coloured diamond without colour_family', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, diamond_category: 'coloured' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const cfErr = r.error.issues.find(i => i.path.includes('colour_family'));
      expect(cfErr?.message).toMatch(/required/i);
    }
  });

  it('T11: accepts white diamond without colour_family', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, cut: 'round', diamond_category: 'white' });
    expect(r.success).toBe(true);
  });

  it('T12: accepts pink with valid intensity', () => {
    const r = CreateDiamondSchema.safeParse({
      ...base, diamond_category: 'coloured', colour_family: 'pink', colour_intensity: 'fancy_vivid',
    });
    expect(r.success).toBe(true);
  });

  it('T13: rejects unsupported intensity value', () => {
    const r = CreateDiamondSchema.safeParse({
      ...base, diamond_category: 'coloured', colour_family: 'pink', colour_intensity: 'light',
    });
    expect(r.success).toBe(false);
  });

  it('T14: defaults diamond_category to white when omitted', () => {
    const r = CreateDiamondSchema.safeParse({ ...base, cut: 'round' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.diamond_category).toBe('white');
  });
});
