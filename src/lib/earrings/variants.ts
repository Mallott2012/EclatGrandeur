import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PublicEarringVariant,
  EarringVariantAdmin,
  CreateEarringVariantInput,
  UpdateEarringVariantInput,
  VariantReservationResult,
  EarringColour,
  EarringClarity,
  EarringAvailability,
} from './types';

const HOLD_MINUTES = 60;

function parsePublic(row: Record<string, unknown>): PublicEarringVariant {
  return {
    id:           row.id as string,
    metal:        row.metal as string,
    total_carat:  parseFloat(row.total_carat as string),
    colour:       row.colour as EarringColour,
    clarity:      row.clarity as EarringClarity,
    price_gbp:    parseFloat(row.price_gbp as string),
    currency:     (row.currency as string) ?? 'GBP',
    availability: row.availability as 'available' | 'made_to_order',
  };
}

function parseAdmin(row: Record<string, unknown>): EarringVariantAdmin {
  return {
    id:                   row.id as string,
    jewellery_product_id: row.jewellery_product_id as string,
    sku:                  row.sku as string,
    metal:                row.metal as string,
    total_carat:          parseFloat(row.total_carat as string),
    colour:               row.colour as EarringColour,
    clarity:              row.clarity as EarringClarity,
    price_gbp:            parseFloat(row.price_gbp as string),
    currency:             (row.currency as string) ?? 'GBP',
    availability:         row.availability as EarringAvailability,
    display_order:        (row.display_order as number) ?? 0,
    is_published:         row.is_published as boolean,
    admin_note:           (row.admin_note as string | null) ?? null,
    held_until:           (row.held_until as string | null) ?? null,
    held_by_cart:         (row.held_by_cart as string | null) ?? null,
    created_at:           row.created_at as string,
    updated_at:           row.updated_at as string,
  };
}

/** True when a published variant can currently be offered to a NEW customer. */
function isOfferable(row: Record<string, unknown>, nowIso: string): boolean {
  const avail = row.availability as string;
  if (avail === 'made_to_order') return true;
  if (avail !== 'available') return false;
  const held = row.held_by_cart as string | null;
  const until = row.held_until as string | null;
  // 'available' one-of-one is offerable unless actively held by someone else.
  return !held || (until !== null && until < nowIso);
}

// ── Customer-facing reads ─────────────────────────────────────────────────────

/**
 * Published, currently-offerable variants for a product, customer-safe.
 * Excludes sold/unavailable/reserved and any 'available' variant currently held
 * by another cart. Never returns sku, admin_note, or hold internals.
 */
export async function listPurchasableVariants(productId: string): Promise<PublicEarringVariant[]> {
  const supabase = createAdminClient();
  const nowIso   = new Date().toISOString();
  const { data, error } = await supabase
    .from('earring_variants')
    .select('id, metal, total_carat, colour, clarity, price_gbp, currency, availability, held_until, held_by_cart, display_order')
    .eq('jewellery_product_id', productId)
    .eq('is_published', true)
    .in('availability', ['available', 'made_to_order'])
    .order('display_order', { ascending: true })
    .order('total_carat',   { ascending: true });

  if (error || !data) return [];
  return data
    .filter(row => isOfferable(row as Record<string, unknown>, nowIso))
    .map(row => parsePublic(row as Record<string, unknown>));
}

/** Server-side fetch of one variant's authoritative sale facts (price/availability). */
export async function getVariantForSale(productId: string, variantId: string): Promise<{
  id: string; metal: string; total_carat: number; colour: EarringColour; clarity: EarringClarity;
  price_gbp: number; currency: string; availability: EarringAvailability; is_published: boolean;
} | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_variants')
    .select('id, metal, total_carat, colour, clarity, price_gbp, currency, availability, is_published')
    .eq('id', variantId)
    .eq('jewellery_product_id', productId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: r.id as string, metal: r.metal as string, total_carat: parseFloat(r.total_carat as string),
    colour: r.colour as EarringColour, clarity: r.clarity as EarringClarity,
    price_gbp: parseFloat(r.price_gbp as string), currency: (r.currency as string) ?? 'GBP',
    availability: r.availability as EarringAvailability, is_published: r.is_published as boolean,
  };
}

// ── Reservation ───────────────────────────────────────────────────────────────

export async function reserveVariant(
  productId: string,
  variantId: string,
  cartToken: string,
): Promise<VariantReservationResult> {
  const sale = await getVariantForSale(productId, variantId);
  if (!sale || !sale.is_published) {
    return { ok: false, reason: 'This earring is no longer available.', reservationExpiresAt: null };
  }
  if (sale.availability === 'made_to_order') {
    // Not exclusive — no hold needed.
    return { ok: true, availability: 'made_to_order', reservationExpiresAt: null };
  }
  if (sale.availability !== 'available') {
    return { ok: false, reason: 'This earring is no longer available.', reservationExpiresAt: null };
  }

  const supabase = createAdminClient();
  const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase.rpc('claim_earring_variant', {
    p_variant_id: variantId, p_cart_token: cartToken, p_held_until: heldUntil,
  });
  if (error || data !== true) {
    return { ok: false, reason: 'This earring has just been reserved by another client.', reservationExpiresAt: null };
  }
  return { ok: true, availability: 'available', reservationExpiresAt: heldUntil };
}

export async function releaseVariant(variantId: string, cartToken: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.rpc('release_earring_variant', { p_variant_id: variantId, p_cart_token: cartToken });
}

/** Cart-refresh check: is this variant still purchasable (for this cart)? */
export async function isVariantPurchasable(
  productId: string,
  variantId: string,
  cartToken: string,
): Promise<{ valid: boolean; reason?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_variants')
    .select('availability, is_published, held_until, held_by_cart')
    .eq('id', variantId)
    .eq('jewellery_product_id', productId)
    .maybeSingle();
  if (error || !data || !data.is_published) {
    return { valid: false, reason: 'This earring is no longer available.' };
  }
  const r = data as Record<string, unknown>;
  const avail = r.availability as string;
  if (avail === 'made_to_order') return { valid: true };
  if (avail !== 'available') return { valid: false, reason: 'This earring is no longer available.' };
  // available one-of-one: valid if this cart owns the live hold, or it is free.
  const held = r.held_by_cart as string | null;
  const until = r.held_until as string | null;
  const nowIso = new Date().toISOString();
  if (held === cartToken && until !== null && until > nowIso) return { valid: true };
  if (!held || (until !== null && until < nowIso)) return { valid: true };
  return { valid: false, reason: 'Your reservation for this earring has expired.' };
}

// ── Admin reads/writes ────────────────────────────────────────────────────────

export async function listVariantsAdmin(productId: string): Promise<EarringVariantAdmin[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_variants')
    .select('*')
    .eq('jewellery_product_id', productId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.map(r => parseAdmin(r as Record<string, unknown>));
}

/** Count of genuinely live, purchasable variants — for "is configurable?" checks. */
export async function countPurchasableVariants(productId: string): Promise<number> {
  return (await listPurchasableVariants(productId)).length;
}

export async function createVariant(input: CreateEarringVariantInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('earring_variants')
    .insert({
      jewellery_product_id: input.jewellery_product_id,
      metal:        input.metal,
      total_carat:  input.total_carat,
      colour:       input.colour,
      clarity:      input.clarity,
      price_gbp:    input.price_gbp,
      currency:     input.currency ?? 'GBP',
      availability: input.availability ?? 'available',
      display_order: input.display_order ?? 0,
      is_published: input.is_published ?? false,
      admin_note:   input.admin_note ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error || !data) {
    const dup = error?.code === '23505';
    return { ok: false, error: dup ? 'A variant with this metal, carat, colour and clarity already exists.' : (error?.message ?? 'Could not create variant.') };
  }
  return { ok: true, id: data.id as string };
}

export async function updateVariant(id: string, input: UpdateEarringVariantInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('earring_variants').update(input).eq('id', id);
  if (error) return { ok: false, error: error.code === '23505' ? 'A variant with this metal, carat, colour and clarity already exists.' : error.message };
  return { ok: true };
}

export async function deleteVariant(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('earring_variants').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function duplicateVariant(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('earring_variants').select('*').eq('id', id).maybeSingle();
  if (error || !data) return { ok: false, error: 'Variant not found.' };
  const r = data as Record<string, unknown>;
  const res = await createVariant({
    jewellery_product_id: r.jewellery_product_id as string,
    metal: r.metal as string, total_carat: parseFloat(r.total_carat as string),
    colour: r.colour as EarringColour, clarity: r.clarity as EarringClarity,
    price_gbp: parseFloat(r.price_gbp as string), currency: (r.currency as string) ?? 'GBP',
    availability: 'unavailable', display_order: ((r.display_order as number) ?? 0) + 1,
    is_published: false, admin_note: r.admin_note as string | null,
  });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}
