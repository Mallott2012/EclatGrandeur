import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PublicEarringOffer, EarringOfferAdmin,
  CreateEarringOfferInput, UpdateEarringOfferInput, OfferAvailability,
} from './offer-types';

function num(v: unknown): number { return parseFloat(v as string); }
function numOrNull(v: unknown): number | null { return v == null ? null : parseFloat(v as string); }

function toPublic(r: Record<string, unknown>): PublicEarringOffer {
  return {
    id:               r.id as string,
    cut:              r.cut as string,
    total_carat:      num(r.total_carat),
    carat_per_stone:  numOrNull(r.carat_per_stone),
    colour:           r.colour as string,
    clarity:          r.clarity as string,
    cut_grade:        (r.cut_grade as string | null) ?? null,
    polish:           (r.polish as string | null) ?? null,
    symmetry:         (r.symmetry as string | null) ?? null,
    fluorescence:     (r.fluorescence as string | null) ?? null,
    price_gbp:        num(r.price_gbp),
    currency:         (r.currency as string) ?? 'GBP',
    availability:     r.availability as 'available' | 'made_to_order',
    supported_metals: (r.supported_metals as string[]) ?? [],
  };
}

function toAdmin(r: Record<string, unknown>): EarringOfferAdmin {
  return {
    id:                   r.id as string,
    jewellery_product_id: r.jewellery_product_id as string,
    sku:                  r.sku as string,
    supported_metals:     (r.supported_metals as string[]) ?? [],
    cut:                  r.cut as string,
    total_carat:          num(r.total_carat),
    carat_per_stone:      numOrNull(r.carat_per_stone),
    colour:               r.colour as string,
    clarity:              r.clarity as string,
    cut_grade:            (r.cut_grade as string | null) ?? null,
    polish:               (r.polish as string | null) ?? null,
    symmetry:             (r.symmetry as string | null) ?? null,
    fluorescence:         (r.fluorescence as string | null) ?? null,
    price_gbp:            num(r.price_gbp),
    currency:             (r.currency as string) ?? 'GBP',
    availability:         r.availability as OfferAvailability,
    is_published:         r.is_published as boolean,
    display_order:        (r.display_order as number) ?? 0,
    admin_note:           (r.admin_note as string | null) ?? null,
    created_at:           r.created_at as string,
    updated_at:           r.updated_at as string,
  };
}

const PUBLIC_COLS =
  'id, cut, total_carat, carat_per_stone, colour, clarity, cut_grade, polish, symmetry, fluorescence, price_gbp, currency, availability, supported_metals, is_published, display_order';

// ── Customer reads ─────────────────────────────────────────────────────────────

/**
 * Published, purchasable offers for a product, customer-safe. Optionally restricted
 * to a chosen metal (offers with a non-empty supported_metals must include it).
 * Never returns sku, admin_note, or internal metadata.
 */
export async function listPublishedOffers(productId: string, metal?: string | null): Promise<PublicEarringOffer[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_offers')
    .select(PUBLIC_COLS)
    .eq('jewellery_product_id', productId)
    .eq('is_published', true)
    .in('availability', ['available', 'made_to_order'])
    .order('display_order', { ascending: true })
    .order('total_carat',   { ascending: true });
  if (error || !data) return [];
  return data
    .map(r => r as Record<string, unknown>)
    .filter(r => {
      const sm = (r.supported_metals as string[]) ?? [];
      return !metal || sm.length === 0 || sm.includes(metal);
    })
    .map(toPublic);
}

export async function countPublishedOffers(productId: string): Promise<number> {
  return (await listPublishedOffers(productId)).length;
}

/** Authoritative offer facts for server-side price validation. */
export async function getOfferForSale(productId: string, offerId: string): Promise<(PublicEarringOffer & { is_published: boolean }) | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_offers')
    .select(PUBLIC_COLS)
    .eq('id', offerId)
    .eq('jewellery_product_id', productId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return { ...toPublic(r), is_published: r.is_published as boolean };
}

// ── Admin reads/writes ─────────────────────────────────────────────────────────

export async function listOffersAdmin(productId: string): Promise<EarringOfferAdmin[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_offers')
    .select('*')
    .eq('jewellery_product_id', productId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(r => toAdmin(r as Record<string, unknown>));
}

export async function createOffer(input: CreateEarringOfferInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('earring_offers').insert({
    jewellery_product_id: input.jewellery_product_id,
    supported_metals:     input.supported_metals ?? [],
    cut:                  input.cut,
    total_carat:          input.total_carat,
    carat_per_stone:      input.carat_per_stone ?? null,
    colour:               input.colour,
    clarity:              input.clarity,
    cut_grade:            input.cut_grade ?? null,
    polish:               input.polish ?? null,
    symmetry:             input.symmetry ?? null,
    fluorescence:         input.fluorescence ?? null,
    price_gbp:            input.price_gbp,
    currency:             input.currency ?? 'GBP',
    availability:         input.availability ?? 'made_to_order',
    is_published:         input.is_published ?? false,
    display_order:        input.display_order ?? 0,
    admin_note:           input.admin_note ?? null,
  }).select('id').maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not create offer.' };
  return { ok: true, id: data.id as string };
}

export async function updateOffer(id: string, input: UpdateEarringOfferInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('earring_offers').update(input).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteOffer(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('earring_offers').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function duplicateOffer(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('earring_offers').select('*').eq('id', id).maybeSingle();
  if (error || !data) return { ok: false, error: 'Offer not found.' };
  const r = data as Record<string, unknown>;
  const res = await createOffer({
    jewellery_product_id: r.jewellery_product_id as string,
    supported_metals: (r.supported_metals as string[]) ?? [],
    cut: r.cut as string, total_carat: num(r.total_carat), carat_per_stone: numOrNull(r.carat_per_stone),
    colour: r.colour as string, clarity: r.clarity as string,
    cut_grade: r.cut_grade as string | null, polish: r.polish as string | null,
    symmetry: r.symmetry as string | null, fluorescence: r.fluorescence as string | null,
    price_gbp: num(r.price_gbp), currency: (r.currency as string) ?? 'GBP',
    availability: 'unavailable', is_published: false,
    display_order: ((r.display_order as number) ?? 0) + 1, admin_note: r.admin_note as string | null,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
