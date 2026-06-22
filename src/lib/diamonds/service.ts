import 'server-only'

import { ServiceException, mapRpcError } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import {
  toDiamondFull,
  toDiamondSalesView,
  type DiamondFull,
  type DiamondSalesView,
  type PaginatedResult,
  type TransitionResult,
  type ExtendResult,
} from './types'
import {
  findDiamondById,
  findManyDiamonds,
  insertDiamond,
  updateDiamond,
  rpcTransitionStatus,
  rpcExtendHold,
} from './repository'
import type {
  CreateDiamondInput,
  UpdateDiamondInput,
  DiamondFilter,
  PlaceHoldInput,
  ExtendHoldInput,
  TransitionStatusInput,
} from './schemas'

// ── Role guards ───────────────────────────────────────────────────────────────

function hasRole(user: StaffUser, ...roles: string[]): boolean {
  return roles.some((r) => user.roles.includes(r as never))
}

function requirePrivileged(actor: StaffUser): void {
  if (!hasRole(actor, 'super_admin', 'diamond_buyer')) {
    throw new ServiceException({ code: 'insufficient_role', message: "You don't have permission for this action", statusHint: 403 })
  }
}

function requireAnyStaff(actor: StaffUser): void {
  if (actor.roles.length === 0) {
    throw new ServiceException({ code: 'not_staff', message: "You don't have permission to perform this action", statusHint: 403 })
  }
}

// sales_adviser without super_admin or diamond_buyer gets restricted view.
function isPrivileged(actor: StaffUser): boolean {
  return hasRole(actor, 'super_admin', 'diamond_buyer')
}

// ── Diamond read ──────────────────────────────────────────────────────────────

export async function getDiamond(
  actor: StaffUser,
  id:    string,
): Promise<DiamondFull | DiamondSalesView> {
  requireAnyStaff(actor)
  const record = await findDiamondById(id)
  if (!record) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })
  return isPrivileged(actor) ? toDiamondFull(record) : toDiamondSalesView(record, actor)
}

// Sales advisers see only available/on_hold/reserved (never sold or removed).
// Privileged roles see all statuses. Status filter in the incoming filter is
// ignored for sales advisers and replaced with the role-appropriate set.
export async function listDiamonds(
  actor:  StaffUser,
  filter: DiamondFilter,
): Promise<PaginatedResult<DiamondFull> | PaginatedResult<DiamondSalesView>> {
  requireAnyStaff(actor)

  if (!isPrivileged(actor)) {
    const restricted = await findManyDiamonds(filter, ['available', 'on_hold', 'reserved'])
    return {
      ...restricted,
      items: restricted.items.map((r) => toDiamondSalesView(r, actor)),
    }
  }

  const result = await findManyDiamonds(filter)
  return { ...result, items: result.items.map((r) => toDiamondFull(r)) }
}

// ── Diamond write ─────────────────────────────────────────────────────────────

export async function createDiamond(
  actor: StaffUser,
  input: CreateDiamondInput,
): Promise<DiamondFull> {
  requirePrivileged(actor)
  const record = await insertDiamond(input, actor.id)
  return toDiamondFull(record)
}

export async function patchDiamond(
  actor: StaffUser,
  id:    string,
  patch: UpdateDiamondInput,
): Promise<DiamondFull> {
  requirePrivileged(actor)

  const existing = await findDiamondById(id)
  if (!existing) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })
  if (existing.status === 'sold' || existing.status === 'removed') {
    throw new ServiceException({ code: 'terminal_status', message: `Cannot edit a diamond with status '${existing.status}'`, statusHint: 409 })
  }

  // Validate merged colour model — patch fields override existing fields.
  const merged = { ...existing, ...patch }
  if (merged.colour_category === 'standard' && merged.colour_grade == null) {
    throw new ServiceException({ code: 'validation_error', message: 'colour_grade is required for standard colour category', statusHint: 400 })
  }
  if (merged.colour_category === 'fancy' && merged.fancy_colour_hue == null) {
    throw new ServiceException({ code: 'validation_error', message: 'fancy_colour_hue is required for fancy colour category', statusHint: 400 })
  }
  if (merged.colour_category === 'fancy' && merged.fancy_colour_intensity == null) {
    throw new ServiceException({ code: 'validation_error', message: 'fancy_colour_intensity is required for fancy colour category', statusHint: 400 })
  }
  if (merged.is_visible && (!merged.cert_lab || !merged.cert_number)) {
    throw new ServiceException({ code: 'validation_error', message: 'cert_lab and cert_number are required when is_visible is true', statusHint: 400 })
  }

  const updated = await updateDiamond(id, patch, actor.id)
  return toDiamondFull(updated)
}

// ── Hold / status transitions ─────────────────────────────────────────────────
// These delegate to the SECURITY DEFINER RPCs which enforce all hold constraints.
// RPC errors are mapped to ServiceErrors via mapRpcError.

export async function placeHold(
  actor: StaffUser,
  input: PlaceHoldInput,
): Promise<TransitionResult> {
  requireAnyStaff(actor)
  try {
    const row = await rpcTransitionStatus(
      actor.id,
      input.diamond_id,
      'on_hold',
      input.hold_expires_at,
      input.hold_reason,
    )
    return {
      id:             input.diamond_id,
      oldStatus:      row.old_status as never,
      newStatus:      'on_hold',
      wasExpiredHold: row.was_expired_hold,
    }
  } catch (err) {
    throw new ServiceException(mapRpcError(err))
  }
}

export async function releaseHold(
  actor:     StaffUser,
  diamondId: string,
): Promise<TransitionResult> {
  requireAnyStaff(actor)
  try {
    const row = await rpcTransitionStatus(actor.id, diamondId, 'available')
    return {
      id:             diamondId,
      oldStatus:      row.old_status as never,
      newStatus:      'available',
      wasExpiredHold: row.was_expired_hold,
    }
  } catch (err) {
    throw new ServiceException(mapRpcError(err))
  }
}

export async function transitionStatus(
  actor: StaffUser,
  input: TransitionStatusInput,
): Promise<TransitionResult> {
  requirePrivileged(actor)
  try {
    const row = await rpcTransitionStatus(
      actor.id,
      input.diamond_id,
      input.new_status,
      input.hold_expires_at,
      input.hold_reason,
    )
    return {
      id:             input.diamond_id,
      oldStatus:      row.old_status as never,
      newStatus:      input.new_status as never,
      wasExpiredHold: row.was_expired_hold,
    }
  } catch (err) {
    throw new ServiceException(mapRpcError(err))
  }
}

export async function extendHold(
  actor: StaffUser,
  input: ExtendHoldInput,
): Promise<ExtendResult> {
  requireAnyStaff(actor)
  try {
    const row = await rpcExtendHold(
      actor.id,
      input.diamond_id,
      input.new_expires_at,
      input.hold_reason,
    )
    return {
      id:                input.diamond_id,
      previousExpiresAt: row.previous_expires_at,
      newExpiresAt:      input.new_expires_at,
      originalHeldAt:    row.original_held_at,
    }
  } catch (err) {
    throw new ServiceException(mapRpcError(err))
  }
}
