// Pure validation functions for earring configuration.
// No database calls — all DB-sourced state is passed in as parameters.
// All functions here are directly importable from non-server contexts and testable
// without mocking or database connections.

import type { SlotSelectionMode } from '@/lib/pairs/types';
import type {
  ConfigurationError,
  EarringConfigurationPrice,
  EarringPairPriceItem,
} from './types';

// ── Slot descriptor (subset needed for structural validation) ─────────────────

export interface SlotDescriptor {
  slot_key:       string;
  selection_mode: SlotSelectionMode;
  required:       boolean;
}

export interface SelectedPairEntry {
  slotKey: string;
  pairId:  string;
}

// ── Structural configuration validation ──────────────────────────────────────

/**
 * Validates the structure of an earring configuration against the product's
 * configured stone slots.
 *
 * Checks applied (in order):
 *  1. No selected pair targets a slot key not on this product.
 *  2. No selected pair targets a fixed slot.
 *  3. No pair ID appears in more than one slot selection.
 *  4. Every required matched_pair slot has exactly one pair selected.
 *
 * Pure — no DB calls. All slot metadata injected.
 */
export function validateConfigurationStructure(
  selectedPairs: SelectedPairEntry[],
  slots: SlotDescriptor[],
): ConfigurationError[] {
  const errors: ConfigurationError[] = [];
  const slotMap = new Map(slots.map(s => [s.slot_key, s]));
  const knownKeys = new Set(slots.map(s => s.slot_key));

  // 1. Unexpected slot keys
  for (const sp of selectedPairs) {
    if (!knownKeys.has(sp.slotKey)) {
      errors.push({
        code:    'invalid_slot',
        slotKey: sp.slotKey,
        pairId:  sp.pairId,
        message: `Slot "${sp.slotKey}" does not exist on this product`,
      });
    }
  }

  // 2. Pair selected for fixed slot
  for (const sp of selectedPairs) {
    const slot = slotMap.get(sp.slotKey);
    if (slot?.selection_mode === 'fixed') {
      errors.push({
        code:    'configuration_invalid',
        slotKey: sp.slotKey,
        pairId:  sp.pairId,
        message: `Slot "${sp.slotKey}" is a fixed slot and does not accept inventory selection`,
      });
    }
  }

  // 3. Duplicate pair ID across multiple slots
  const pairCounts = new Map<string, number>();
  for (const sp of selectedPairs) {
    pairCounts.set(sp.pairId, (pairCounts.get(sp.pairId) ?? 0) + 1);
  }
  for (const [pairId, count] of pairCounts) {
    if (count > 1) {
      errors.push({
        code:   'duplicate_pair_selection',
        pairId,
        message: `Pair ${pairId} is selected for multiple slots — each pair may only be used once`,
      });
    }
  }

  // 4. Required matched_pair slots with no selection
  const selectedSlotKeys = new Set(selectedPairs.map(sp => sp.slotKey));
  for (const slot of slots) {
    if (slot.required && slot.selection_mode === 'matched_pair' && !selectedSlotKeys.has(slot.slot_key)) {
      errors.push({
        code:    'missing_required_selection',
        slotKey: slot.slot_key,
        message: `Required slot "${slot.slot_key}" has no selected pair`,
      });
    }
  }

  return errors;
}

// ── Per-pair availability validation ─────────────────────────────────────────

export interface PairAvailabilityInput {
  pairId:            string;
  slotKey:           string;
  pairStatus:        string;
  isPublished:       boolean;
  heldUntil:         string | null;
  diamondAStatus:    string;
  diamondBStatus:    string;
  diamondAHeldUntil: string | null;
  diamondBHeldUntil: string | null;
}

/**
 * Validates pair-level and constituent-diamond availability from injected flags.
 *
 * A pair is unavailable if:
 *  - Its own status is not 'available', or it is not published.
 *  - Its pair-level held_until is in the future (another session holds it).
 *  - Either constituent diamond has an unexpired individual reservation.
 *
 * Pure — no DB calls.
 */
export function validatePairAvailabilityFlags(
  input: PairAvailabilityInput,
  now: Date = new Date(),
): ConfigurationError[] {
  const errors: ConfigurationError[] = [];
  const nowIso = now.toISOString();

  // Pair-level: must be published and available
  if (input.pairStatus !== 'available' || !input.isPublished) {
    errors.push({
      code:    'pair_unavailable',
      slotKey: input.slotKey,
      pairId:  input.pairId,
      message: 'Pair is not available for selection',
    });
    return errors; // further checks are moot if pair itself is gone
  }

  // Pair-level: unexpired pair hold (defensive — available pairs should not have holds)
  if (input.heldUntil && input.heldUntil > nowIso) {
    errors.push({
      code:    'pair_unavailable',
      slotKey: input.slotKey,
      pairId:  input.pairId,
      message: 'Pair is currently held by another session',
    });
  }

  // Constituent diamond A: individual reservation
  if (
    input.diamondAStatus === 'reserved' &&
    input.diamondAHeldUntil &&
    input.diamondAHeldUntil > nowIso
  ) {
    errors.push({
      code:    'pair_unavailable',
      slotKey: input.slotKey,
      pairId:  input.pairId,
      message: 'Constituent diamond A has an active individual reservation',
    });
  }

  // Constituent diamond B: individual reservation
  if (
    input.diamondBStatus === 'reserved' &&
    input.diamondBHeldUntil &&
    input.diamondBHeldUntil > nowIso
  ) {
    errors.push({
      code:    'pair_unavailable',
      slotKey: input.slotKey,
      pairId:  input.pairId,
      message: 'Constituent diamond B has an active individual reservation',
    });
  }

  return errors;
}

// ── Price calculation (pure) ──────────────────────────────────────────────────

/**
 * Calculates the total earring configuration price from DB-sourced values.
 *
 * The base price and pair prices MUST be derived from the database before
 * calling this function. Client-provided prices must NEVER be passed here.
 *
 * Fixed stone slots are included in the base price (setting price) and
 * do NOT appear in selectedPairs.
 */
export function calculatePriceFromFacts(
  jewelleryProductId: string,
  metalVariantId: string | null,
  basePrice: number,
  selectedPairs: EarringPairPriceItem[],
): EarringConfigurationPrice {
  const totalPrice = basePrice + selectedPairs.reduce((sum, sp) => sum + sp.pairPrice, 0);
  return {
    jewelleryProductId,
    metalVariantId,
    basePrice,
    selectedPairs,
    totalPrice,
  };
}

// ── Multi-slot configuration completability (Part D) ─────────────────────────

/**
 * Given the set of compatible pair IDs per required slot, determines whether
 * a complete configuration using ALL-DISTINCT pair assignments is possible.
 *
 * Uses backtracking — safe and exact for ≤10 required slots.
 * Caps combination counting at 1000 for performance.
 *
 * Examples:
 *  Top slot:  {pairA}          → not completable (same pair needed for both)
 *  Drop slot: {pairA}
 *
 *  Top slot:  {pairA, pairB}   → completable (2 valid combinations)
 *  Drop slot: {pairA, pairB}
 *
 * Pure — no DB calls.
 */
export function assessConfigurationCompletability(
  slotPairIds: Map<string, Set<string>>,
  requiredSlotKeys: string[],
): { isCompletable: boolean; validCombinationCount: number | null } {
  if (requiredSlotKeys.length === 0) {
    return { isCompletable: true, validCombinationCount: 1 };
  }

  const totalCandidates = [...slotPairIds.values()].reduce((s, set) => s + set.size, 0);

  function backtrack(slotIndex: number, usedPairIds: Set<string>): number {
    if (slotIndex === requiredSlotKeys.length) return 1;
    const key        = requiredSlotKeys[slotIndex];
    const candidates = slotPairIds.get(key) ?? new Set<string>();
    let count = 0;
    for (const pairId of candidates) {
      if (!usedPairIds.has(pairId)) {
        usedPairIds.add(pairId);
        count += backtrack(slotIndex + 1, usedPairIds);
        usedPairIds.delete(pairId);
        if (count >= 1000) return count; // cap for performance
      }
    }
    return count;
  }

  const count = backtrack(0, new Set<string>());
  const shouldReport = totalCandidates <= 200;

  return {
    isCompletable:         count > 0,
    validCombinationCount: shouldReport ? count : null,
  };
}
