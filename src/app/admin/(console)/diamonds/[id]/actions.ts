'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import {
  patchDiamond,
  placeHold,
  releaseHold,
  extendHold,
  transitionStatus,
} from '@/lib/diamonds/service'
import {
  uploadDiamondMedia,
  deleteDiamondMedia,
  setPrimaryMedia,
} from '@/lib/diamonds/media'
import { uploadCertificate, getCertificateSignedUrl } from '@/lib/diamonds/certificates'
import {
  UpdateDiamondSchema,
  PlaceHoldSchema,
  ExtendHoldSchema,
  TransitionStatusSchema,
  MediaUploadMetaSchema,
  CertUploadMetaSchema,
} from '@/lib/diamonds/schemas'
import { parseDiamondFormData, zodErrors } from '../form-utils'
import type {
  DiamondActionResult,
  DiamondSimpleResult,
  CertUrlResult,
} from '../types'

// ── Helper ────────────────────────────────────────────────────────────────────

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? ''
}

function serviceMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

// ── Diamond edit ──────────────────────────────────────────────────────────────

export async function updateDiamondAction(
  id:      string,
  _state:  DiamondActionResult,
  formData: FormData,
): Promise<DiamondActionResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const parsed = UpdateDiamondSchema.safeParse(parseDiamondFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await patchDiamond(actor, id, parsed.data)
  } catch (err) {
    return { success: false, message: serviceMsg(err), fieldErrors: {} }
  }

  redirect(`/admin/diamonds/${id}`)
}

// ── Hold operations ───────────────────────────────────────────────────────────

export async function placeHoldAction(
  id:       string,
  _state:   DiamondActionResult,
  formData: FormData,
): Promise<DiamondActionResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer', 'sales_adviser'])

  const raw = {
    diamond_id:      id,
    hold_expires_at: str(formData, 'hold_expires_at'),
    hold_reason:     str(formData, 'hold_reason'),
  }
  const parsed = PlaceHoldSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await placeHold(actor, parsed.data)
  } catch (err) {
    return { success: false, message: serviceMsg(err), fieldErrors: {} }
  }

  redirect(`/admin/diamonds/${id}`)
}

export async function releaseHoldAction(
  id:       string,
  _state:   DiamondSimpleResult,
  _formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer', 'sales_adviser'])

  try {
    await releaseHold(actor, id)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${id}`)
}

export async function extendHoldAction(
  id:       string,
  _state:   DiamondActionResult,
  formData: FormData,
): Promise<DiamondActionResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer', 'sales_adviser'])

  const raw = {
    diamond_id:     id,
    new_expires_at: str(formData, 'new_expires_at'),
    hold_reason:    str(formData, 'hold_reason') || undefined,
  }
  const parsed = ExtendHoldSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await extendHold(actor, parsed.data)
  } catch (err) {
    return { success: false, message: serviceMsg(err), fieldErrors: {} }
  }

  redirect(`/admin/diamonds/${id}`)
}

// ── Status transitions ────────────────────────────────────────────────────────

export async function transitionStatusAction(
  id:        string,
  newStatus: string,
  _state:    DiamondSimpleResult,
  formData:  FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const raw = {
    diamond_id:      id,
    new_status:      newStatus,
    hold_expires_at: str(formData, 'hold_expires_at') || undefined,
    hold_reason:     str(formData, 'hold_reason') || undefined,
  }
  const parsed = TransitionStatusSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  try {
    await transitionStatus(actor, parsed.data)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${id}`)
}

// ── Media operations ──────────────────────────────────────────────────────────

export async function uploadMediaAction(
  id:       string,
  _state:   DiamondSimpleResult,
  formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { success: false, message: 'No file provided' }
  }

  // Client hint only — authoritative size check is in uploadDiamondMedia service.
  const isVideo    = file.type.startsWith('video/')
  const maxBytes   = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024
  if (file.size > maxBytes) {
    return { success: false, message: isVideo ? 'Video files must be under 100 MB' : 'Image files must be under 20 MB' }
  }

  const displayOrderRaw = parseInt(str(formData, 'display_order') || '0')
  const metaParsed = MediaUploadMetaSchema.safeParse({
    diamond_id:    id,
    display_order: isNaN(displayOrderRaw) ? 0 : displayOrderRaw,
    alt_text:      str(formData, 'alt_text') || null,
    is_primary:    formData.get('is_primary') === 'on',
  })
  if (!metaParsed.success) {
    return { success: false, message: 'Invalid upload metadata' }
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    await uploadDiamondMedia(actor, metaParsed.data, bytes)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${id}`)
}

export async function deleteMediaAction(
  mediaId:   string,
  diamondId: string,
  _state:    DiamondSimpleResult,
  _formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  try {
    await deleteDiamondMedia(actor, mediaId)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${diamondId}`)
}

export async function setPrimaryMediaAction(
  mediaId:  string,
  id:       string,
  _state:   DiamondSimpleResult,
  _formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  try {
    await setPrimaryMedia(actor, mediaId, id)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${id}`)
}

// ── Certificate operations ────────────────────────────────────────────────────

export async function uploadCertificateAction(
  id:       string,
  _state:   DiamondSimpleResult,
  formData: FormData,
): Promise<DiamondSimpleResult & { auditWarning?: boolean }> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { success: false, message: 'No file provided' }
  }
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, message: 'Certificate files must be under 20 MB' }
  }

  const metaParsed = CertUploadMetaSchema.safeParse({
    diamond_id:  id,
    cert_lab:    str(formData, 'cert_lab'),
    cert_number: str(formData, 'cert_number'),
  })
  if (!metaParsed.success) {
    return { success: false, message: metaParsed.error.errors[0]?.message ?? 'Invalid certificate metadata' }
  }

  let auditWarning = false
  try {
    const bytes  = new Uint8Array(await file.arrayBuffer())
    const result = await uploadCertificate(actor, metaParsed.data, bytes)
    auditWarning = result.auditWarning ?? false
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }

  redirect(`/admin/diamonds/${id}${auditWarning ? '?cert_warn=1' : ''}`)
}

export async function getCertificateUrlAction(
  id:       string,
  _state:   CertUrlResult,
  _formData: FormData,
): Promise<CertUrlResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  try {
    const result = await getCertificateSignedUrl(actor, id)
    return { status: 'success', signed_url: result.signed_url, expires_at: result.expires_at }
  } catch (err) {
    return { status: 'error', message: serviceMsg(err) }
  }
}
