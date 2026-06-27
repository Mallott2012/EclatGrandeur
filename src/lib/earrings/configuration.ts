import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { parseJewelleryStoneSlot } from '@/lib/pairs/types';
import { listSlotsForProduct } from '@/lib/pairs/service';
import { isPairCompatibleWithSlot } from '@/lib/pairs/compatibility';
import {
  validateConfigurationStructure,
  validatePairAvailabilityFlags,
  calculatePriceFromFacts,
  assessConfigurationCompletability,
} from './validation';
import type {
  CompatiblePairCard,
  EarringConfigurationInput,
  ConfigurationValidationResult,
  ConfigurationError,
  EarringConfigurationPrice,
  EarringConfigurationAvailability,
  ReservationPreflightResult,
  SlotAvailability,
} from './types';
import type { PairCompatibilityInput } from '@/lib/pairs/compatibility';
import type { ColourIntensity } from '@/lib/diamonds/types';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Build PairCompatibilityInput from a joined pair + diamond rows. */
function buildCompatibilityInput(
  row: Record<string, unknown>,
  da:  Record<string, unknown>,
  db:  Record<string, unknown>,
): PairCompatibilityInput {
  return {
    diamond_a: {
      cut:            da.cut as string,
      cut_grade:      (da.cut_grade as string | null) ?? null,
      polish:         (da.polish as string | null)    ?? null,
      symmetry:       (da.symmetry as string | null)  ?? null,
      fluorescence:   (da.fluorescence as string)     ?? 'none',
      eclat_approved: da.eclat_approved as boolean,
      status:         da.status as 'available' | 'reserved' | 'sold',
      is_published:   da.is_published as boolean,
      diamond_category: da.diamond_category as 'white' | 'coloured',
      colour_family:  (da.colour_family as 'yellow' | 'pink' | null) ?? null,
    },
    diamond_b: {
      cut:            db.cut as string,
      cut_grade:      (db.cut_grade as string | null) ?? null,
      polish:         (db.polish as string | null)    ?? null,
      symmetry:       (db.symmetry as string | null)  ?? null,
      fluorescence:   (db.fluorescence as string)     ?? 'none',
      eclat_approved: db.eclat_approved as boolean,
      status:         db.status as 'available' | 'reserved' | 'sold',
      is_published:   db.is_published as boolean,
      diamond_category: db.diamond_category as 'white' | 'coloured',
      colour_family:  (db.colour_family as 'yellow' | 'pink' | null) ?? null,
    },
    shape:            row.shape as string,
    diamond_category: row.diamond_category as 'white' | 'coloured',
    colour_family:    (row.colour_family as 'yellow' | 'pink' | null) ?? null,
    total_carat:      parseFloat(row.total_carat as string),
    is_published:     row.is_published as boolean,
    status:           row.status as string,
  };
}

/** Diamond-level individual reservation check. */
function hasActiveIndividualReservation(
  status: string,
  heldUntil: string | null,
  nowIso: string,
): boolean {
  return status === 'reserved' && heldUntil !== null && heldUntil > nowIso;
}

// ── Part A: Slot Compatibility Query ──────────────────────────────────────────

/**
 * Returns all diamond pairs compatible with a specific stone slot on a product.
 *
 * Filters applied:
 *  - Slot must exist, belong to the product, and be in matched_pair mode.
 *  - Pair must be published and have status = available.
 *  - Pair shape, carat, category, colour_family must match slot constraints.
 *  - Both constituent diamonds must be published and individually available.
 *  - Neither constituent diamond may have an unexpired individual reservation.
 *  - Both constituent diamonds and the pair must pass Éclat eligibility.
 *
 * Result contains only public-safe display fields — no matching_notes,
 * held_by_cart, approval fields, hold tokens, or internal staff metadata.
 */
export async function listCompatiblePairsForSlot(opts: {
  jewelleryProductId: string;
  slotKey: string;
}): Promise<CompatiblePairCard[]> {
  const supabase = createAdminClient();
  const nowIso   = new Date().toISOString();

  // Fetch slot
  const { data: slotRow, error: slotErr } = await supabase
    .from('jewellery_stone_slots')
    .select('*')
    .eq('jewellery_product_id', opts.jewelleryProductId)
    .eq('slot_key', opts.slotKey)
    .maybeSingle();

  if (slotErr || !slotRow) return [];
  const slot = parseJewelleryStoneSlot(slotRow);
  if (slot.selection_mode !== 'matched_pair') return [];

  const slotConstraints = {
    compatible_shapes:          slot.compatible_shapes,
    min_carat:                  slot.min_carat,
    max_carat:                  slot.max_carat,
    allowed_diamond_categories: slot.allowed_diamond_categories,
    allowed_colour_families:    slot.allowed_colour_families,
    selection_mode:             slot.selection_mode,
  };

  // Build DB query — apply coarse slot filters at DB level for efficiency
  let q = supabase
    .from('diamond_pairs')
    .select(`
      id, shape, diamond_category, colour_family, colour, clarity,
      colour_intensity, colour_description, total_carat, carat_per_stone,
      pair_price_gbp, status, is_published, held_until,
      diamond_a:diamonds!diamond_id_a(
        id, status, is_published, cut, cut_grade, polish, symmetry,
        fluorescence, eclat_approved, held_until, diamond_category, colour_family
      ),
      diamond_b:diamonds!diamond_id_b(
        id, status, is_published, cut, cut_grade, polish, symmetry,
        fluorescence, eclat_approved, held_until, diamond_category, colour_family
      )
    `)
    .eq('is_published', true)
    .eq('status', 'available');

  if (slot.compatible_shapes.length > 0)
    q = q.in('shape', slot.compatible_shapes);
  if (slot.min_carat !== null)
    q = q.gte('total_carat', slot.min_carat);
  if (slot.max_carat !== null)
    q = q.lte('total_carat', slot.max_carat);
  if (slot.allowed_diamond_categories.length > 0)
    q = q.in('diamond_category', slot.allowed_diamond_categories);
  if (slot.allowed_colour_families && slot.allowed_colour_families.length > 0)
    q = q.in('colour_family', slot.allowed_colour_families);

  const { data: rows, error: pairsErr } = await q;
  if (pairsErr) throw new Error(`listCompatiblePairsForSlot: ${pairsErr.message}`);

  const results: CompatiblePairCard[] = [];

  for (const rawRow of rows ?? []) {
    const row = rawRow as unknown as Record<string, unknown>;
    const da  = row.diamond_a as Record<string, unknown> | null;
    const db  = row.diamond_b as Record<string, unknown> | null;
    if (!da || !db) continue;

    // Both constituent diamonds must be published and individually available
    if (!da.is_published || !db.is_published) continue;
    if ((da.status as string) !== 'available') continue;
    if ((db.status as string) !== 'available') continue;

    // Neither diamond may have an unexpired individual reservation
    if (hasActiveIndividualReservation(da.status as string, da.held_until as string | null, nowIso)) continue;
    if (hasActiveIndividualReservation(db.status as string, db.held_until as string | null, nowIso)) continue;

    // Full eligibility + slot compatibility check (pure)
    const pairInput = buildCompatibilityInput(row as Record<string, unknown>, da, db);
    if (!isPairCompatibleWithSlot(pairInput, slotConstraints)) continue;

    results.push({
      id:                 row.id as string,
      shape:              row.shape as string,
      total_carat:        parseFloat(row.total_carat as string),
      carat_per_stone:    row.carat_per_stone != null ? parseFloat(row.carat_per_stone as string) : null,
      colour:             (row.colour as string | null)             ?? null,
      clarity:            (row.clarity as string | null)            ?? null,
      colour_family:      (row.colour_family as 'yellow' | 'pink' | null) ?? null,
      colour_intensity:   (row.colour_intensity as ColourIntensity | null) ?? null,
      colour_description: (row.colour_description as string | null) ?? null,
      pair_price_gbp:     parseFloat(row.pair_price_gbp as string),
      diamond_category:   row.diamond_category as 'white' | 'coloured',
    });
  }

  return results;
}

// ── Part B: Complete Earring Configuration Validator ─────────────────────────

/**
 * Validates a complete earring configuration against the live database.
 *
 * Checks applied:
 *  1. Product exists and is an earring product.
 *  2. Structural integrity (no unknown slots, no pair for fixed slot,
 *     no duplicate pairs, all required slots covered).
 *  3. For each selected pair: published, available, no constituent reservation,
 *     compatible with its assigned slot.
 *  4. Metal variant valid when supplied.
 *
 * Returns customer-safe error codes — never raw DB errors.
 */
export async function validateEarringConfiguration(
  input: EarringConfigurationInput,
): Promise<ConfigurationValidationResult> {
  const supabase = createAdminClient();
  const errors: ConfigurationError[] = [];
  const nowIso   = new Date().toISOString();

  // 1. Product
  const { data: productRow, error: productErr } = await supabase
    .from('jewellery_products')
    .select('id, category, base_price_gbp, is_published, metal_variants')
    .eq('id', input.jewelleryProductId)
    .maybeSingle();

  if (productErr || !productRow) {
    return { valid: false, errors: [{ code: 'invalid_product', message: 'Product not found' }] };
  }
  if ((productRow.category as string) !== 'earrings') {
    return { valid: false, errors: [{ code: 'invalid_product', message: 'Product is not an earring product' }] };
  }

  // 2. Fetch configured slots
  const slots = await listSlotsForProduct(input.jewelleryProductId).catch(() => []);

  const slotDescriptors = slots.map(s => ({
    slot_key:       s.slot_key,
    selection_mode: s.selection_mode,
    required:       s.required,
  }));

  const structureErrors = validateConfigurationStructure(input.selectedPairs, slotDescriptors);
  errors.push(...structureErrors);

  // If structural errors exist, stop — further checks depend on valid structure
  if (errors.length > 0) return { valid: false, errors };

  // 3. Per-pair validation
  const slotMap = new Map(slots.map(s => [s.slot_key, s]));

  for (const sp of input.selectedPairs) {
    const slot = slotMap.get(sp.slotKey);
    if (!slot) continue; // already caught by structural check

    // Fetch pair with constituent diamonds
    const { data: pairRow, error: pairErr } = await supabase
      .from('diamond_pairs')
      .select(`
        id, shape, diamond_category, colour_family, total_carat, status, is_published, held_until,
        diamond_a:diamonds!diamond_id_a(
          id, status, is_published, cut, cut_grade, polish, symmetry,
          fluorescence, eclat_approved, held_until, diamond_category, colour_family
        ),
        diamond_b:diamonds!diamond_id_b(
          id, status, is_published, cut, cut_grade, polish, symmetry,
          fluorescence, eclat_approved, held_until, diamond_category, colour_family
        )
      `)
      .eq('id', sp.pairId)
      .maybeSingle();

    if (pairErr || !pairRow) {
      errors.push({ code: 'pair_unavailable', slotKey: sp.slotKey, pairId: sp.pairId, message: `Pair ${sp.pairId} not found` });
      continue;
    }

    const pairAny = pairRow as unknown as Record<string, unknown>;
    const da = pairAny.diamond_a as Record<string, unknown> | null;
    const db = pairAny.diamond_b as Record<string, unknown> | null;

    if (!da || !db) {
      errors.push({ code: 'pair_unavailable', slotKey: sp.slotKey, pairId: sp.pairId, message: 'Pair has missing constituent diamonds' });
      continue;
    }

    // Availability flags
    const availErrors = validatePairAvailabilityFlags({
      pairId:            sp.pairId,
      slotKey:           sp.slotKey,
      pairStatus:        pairRow.status as string,
      isPublished:       pairRow.is_published as boolean,
      heldUntil:         (pairRow.held_until as string | null) ?? null,
      diamondAStatus:    da.status as string,
      diamondBStatus:    db.status as string,
      diamondAHeldUntil: (da.held_until as string | null) ?? null,
      diamondBHeldUntil: (db.held_until as string | null) ?? null,
    }, new Date(nowIso));

    errors.push(...availErrors);
    if (availErrors.length > 0) continue;

    // Slot compatibility
    const pairInput = buildCompatibilityInput(pairRow as Record<string, unknown>, da, db);
    const slotConstraints = {
      compatible_shapes:          slot.compatible_shapes,
      min_carat:                  slot.min_carat,
      max_carat:                  slot.max_carat,
      allowed_diamond_categories: slot.allowed_diamond_categories,
      allowed_colour_families:    slot.allowed_colour_families,
      selection_mode:             slot.selection_mode,
    };

    if (!isPairCompatibleWithSlot(pairInput, slotConstraints)) {
      errors.push({
        code:    'pair_not_compatible',
        slotKey: sp.slotKey,
        pairId:  sp.pairId,
        message: `Pair is not compatible with slot "${sp.slotKey}"`,
      });
    }
  }

  // 4. Metal variant
  if (input.metalVariantId) {
    const variants = productRow.metal_variants;
    const variantList = Array.isArray(variants) ? variants : [];
    const found = variantList.some(
      (v: unknown) => typeof v === 'object' && v !== null && (v as Record<string, unknown>).id === input.metalVariantId,
    );
    if (!found) {
      errors.push({ code: 'invalid_metal', message: `Metal variant "${input.metalVariantId}" is not valid for this product` });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Part C: Configuration Price Foundation ────────────────────────────────────

/**
 * Calculates the validated price for an earring configuration.
 *
 * All prices are derived from the database.
 * Client-provided prices are never accepted.
 * Fixed stone slots are included in the product base price.
 */
export async function calculateEarringConfigurationPrice(
  input: EarringConfigurationInput,
): Promise<EarringConfigurationPrice> {
  const supabase = createAdminClient();

  // Fetch product base price from DB (never from client)
  const { data: productRow, error: productErr } = await supabase
    .from('jewellery_products')
    .select('id, base_price_gbp, metal_variants')
    .eq('id', input.jewelleryProductId)
    .maybeSingle();

  if (productErr || !productRow) {
    throw new Error(`calculateEarringConfigurationPrice: product ${input.jewelleryProductId} not found`);
  }

  // Determine base price: if a metal variant is specified and has a price, use it
  let basePrice = parseFloat(productRow.base_price_gbp as string);
  const metalVariantId = input.metalVariantId ?? null;

  if (metalVariantId) {
    const variants = Array.isArray(productRow.metal_variants) ? productRow.metal_variants : [];
    const variant = variants.find(
      (v: unknown) => typeof v === 'object' && v !== null && (v as Record<string, unknown>).id === metalVariantId,
    ) as Record<string, unknown> | undefined;
    if (variant && typeof variant.price_gbp === 'number') {
      basePrice = variant.price_gbp;
    }
  }

  // Fetch each selected pair price from DB (never trust client-provided values)
  const pairPriceItems = await Promise.all(
    input.selectedPairs.map(async sp => {
      const { data: pair, error } = await supabase
        .from('diamond_pairs')
        .select('id, pair_price_gbp')
        .eq('id', sp.pairId)
        .maybeSingle();

      if (error || !pair) {
        throw new Error(`calculateEarringConfigurationPrice: pair ${sp.pairId} not found`);
      }
      return {
        slotKey:   sp.slotKey,
        pairId:    sp.pairId,
        pairPrice: parseFloat(pair.pair_price_gbp as string),
      };
    }),
  );

  return calculatePriceFromFacts(
    input.jewelleryProductId,
    metalVariantId,
    basePrice,
    pairPriceItems,
  );
}

// ── Part D: Multi-Slot Configuration Availability ─────────────────────────────

/**
 * Returns slot-level pair counts and a completability assessment for the
 * earring product's full configuration.
 *
 * For each matched_pair slot: fetches compatible pairs via listCompatiblePairsForSlot
 * (which applies all eligibility and availability checks).
 *
 * isCompletable is true only when there exist enough DISTINCT compatible pairs
 * to satisfy all required matched_pair slots simultaneously.
 *
 * Example: two slots each show 1 compatible pair — if it is the same pair,
 * a complete configuration is NOT possible.
 */
export async function getEarringConfigurationAvailability(
  productId: string,
): Promise<EarringConfigurationAvailability> {
  const slots = await listSlotsForProduct(productId).catch(() => []);

  const slotAvailabilities: SlotAvailability[] = [];
  const slotPairIds = new Map<string, Set<string>>();
  const requiredSlotKeys: string[] = [];

  for (const slot of slots) {
    if (slot.selection_mode === 'matched_pair') {
      const compatiblePairs = await listCompatiblePairsForSlot({
        jewelleryProductId: productId,
        slotKey:            slot.slot_key,
      }).catch(() => []);

      const pairIds = new Set(compatiblePairs.map(p => p.id));
      slotPairIds.set(slot.slot_key, pairIds);

      if (slot.required) requiredSlotKeys.push(slot.slot_key);

      slotAvailabilities.push({
        slotKey:        slot.slot_key,
        label:          slot.label,
        selection_mode: slot.selection_mode,
        required:       slot.required,
        pairCount:      compatiblePairs.length,
      });
    } else {
      // fixed / single: no inventory selection
      slotAvailabilities.push({
        slotKey:        slot.slot_key,
        label:          slot.label,
        selection_mode: slot.selection_mode,
        required:       slot.required,
        pairCount:      null,
      });
    }
  }

  const { isCompletable, validCombinationCount } = assessConfigurationCompletability(
    slotPairIds,
    requiredSlotKeys,
  );

  return {
    slots:                 slotAvailabilities,
    requiredSlotCount:     requiredSlotKeys.length,
    isCompletable,
    validCombinationCount,
  };
}

// ── Part E: Reservation Readiness Preflight ───────────────────────────────────

/**
 * Confirms that all selected pairs in a configuration can be claimed together
 * atomically via claimPairsAtomically() — without performing any mutation.
 *
 * Checks:
 *  1. All pair IDs are distinct.
 *  2. Each pair is currently published and available.
 *  3. Neither constituent diamond has an unexpired individual reservation.
 *  4. Each pair remains compatible with its assigned slot.
 *
 * Makes no database mutations. Safe to call before presenting a reservation form.
 */
export async function preflightPairReservation(
  input: EarringConfigurationInput,
): Promise<ReservationPreflightResult> {
  const issues: string[] = [];
  const nowIso = new Date().toISOString();
  const supabase = createAdminClient();

  // 1. Distinct pair IDs
  const pairIds = input.selectedPairs.map(sp => sp.pairId);
  const uniquePairIds = new Set(pairIds);
  if (uniquePairIds.size !== pairIds.length) {
    issues.push('Duplicate pair selections detected — each pair may only be claimed once');
  }

  if (issues.length > 0) return { canClaim: false, issues };

  // 2–4. Per-pair checks
  const slots = await listSlotsForProduct(input.jewelleryProductId).catch(() => []);
  const slotMap = new Map(slots.map(s => [s.slot_key, s]));

  for (const sp of input.selectedPairs) {
    const { data: pairRow, error } = await supabase
      .from('diamond_pairs')
      .select(`
        id, shape, diamond_category, colour_family, total_carat, status, is_published, held_until,
        diamond_a:diamonds!diamond_id_a(
          id, status, is_published, cut, cut_grade, polish, symmetry,
          fluorescence, eclat_approved, held_until, diamond_category, colour_family
        ),
        diamond_b:diamonds!diamond_id_b(
          id, status, is_published, cut, cut_grade, polish, symmetry,
          fluorescence, eclat_approved, held_until, diamond_category, colour_family
        )
      `)
      .eq('id', sp.pairId)
      .maybeSingle();

    if (error || !pairRow) {
      issues.push(`Pair ${sp.pairId} not found`);
      continue;
    }

    const preflightRow = pairRow as unknown as Record<string, unknown>;
    const da = preflightRow.diamond_a as Record<string, unknown> | null;
    const db = preflightRow.diamond_b as Record<string, unknown> | null;

    // 2. Availability
    const availErrors = validatePairAvailabilityFlags({
      pairId:            sp.pairId,
      slotKey:           sp.slotKey,
      pairStatus:        pairRow.status as string,
      isPublished:       pairRow.is_published as boolean,
      heldUntil:         (pairRow.held_until as string | null) ?? null,
      diamondAStatus:    (da?.status as string) ?? 'sold',
      diamondBStatus:    (db?.status as string) ?? 'sold',
      diamondAHeldUntil: (da?.held_until as string | null) ?? null,
      diamondBHeldUntil: (db?.held_until as string | null) ?? null,
    }, new Date(nowIso));

    issues.push(...availErrors.map(e => e.message));
    if (availErrors.length > 0) continue;

    // 4. Slot compatibility
    const slot = slotMap.get(sp.slotKey);
    if (slot && da && db) {
      const pairInput = buildCompatibilityInput(pairRow as Record<string, unknown>, da, db);
      const slotConstraints = {
        compatible_shapes:          slot.compatible_shapes,
        min_carat:                  slot.min_carat,
        max_carat:                  slot.max_carat,
        allowed_diamond_categories: slot.allowed_diamond_categories,
        allowed_colour_families:    slot.allowed_colour_families,
        selection_mode:             slot.selection_mode,
      };
      if (!isPairCompatibleWithSlot(pairInput, slotConstraints)) {
        issues.push(`Pair ${sp.pairId} is no longer compatible with slot "${sp.slotKey}"`);
      }
    }
  }

  return { canClaim: issues.length === 0, issues };
}
