import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import { detectMime, makeMediaPath, mimeToMediaType, isMimeAllowedForBucket, MEDIA_BUCKET, type MediaMime } from '@/lib/storage/paths'
import { findDiamondById, findMediaByDiamond, findMediaById, insertMediaRecord, deleteMediaRecord } from './repository'
import type { DiamondMediaResponse } from './types'
import type { MediaUploadMeta } from './schemas'
import type { StaffUser } from '@/lib/staff-shared'

const SIGNED_URL_SECONDS = 3600 // 1 hour

function requirePrivileged(actor: StaffUser): void {
  const hasRole = actor.roles.includes('super_admin') || actor.roles.includes('diamond_buyer')
  if (!hasRole) {
    throw new ServiceException({ code: 'insufficient_role', message: "You don't have permission to manage media", statusHint: 403 })
  }
}

async function makeSignedUrl(storagePath: string): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to generate media signed URL', statusHint: 500 })
  }
  return data.signedUrl
}

function toResponse(record: { id: string; diamond_id: string; media_type: string; storage_path: string; display_order: number; alt_text: string | null; is_primary: boolean; created_at: string }, signedUrl: string): DiamondMediaResponse {
  return {
    id:            record.id,
    diamond_id:    record.diamond_id,
    media_type:    record.media_type as DiamondMediaResponse['media_type'],
    signed_url:    signedUrl,
    display_order: record.display_order,
    alt_text:      record.alt_text,
    is_primary:    record.is_primary,
    created_at:    record.created_at,
  }
}

// Upload a media file for a diamond. File bytes must be provided as a Buffer or
// Uint8Array by the server action (reading the multipart form data server-side).
// The client filename is ignored. MIME is detected from magic bytes.
export async function uploadDiamondMedia(
  actor:    StaffUser,
  meta:     MediaUploadMeta,
  fileData: Uint8Array,
): Promise<DiamondMediaResponse> {
  requirePrivileged(actor)

  const diamond = await findDiamondById(meta.diamond_id)
  if (!diamond) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })

  // File-signature validation
  const detectedMime = detectMime(fileData)
  if (!detectedMime || !isMimeAllowedForBucket(detectedMime, MEDIA_BUCKET)) {
    throw new ServiceException({
      code:       'invalid_file_type',
      message:    'File type not permitted. Allowed types: JPEG, PNG, WebP, AVIF, MP4.',
      statusHint: 400,
    })
  }
  const mime      = detectedMime as MediaMime
  const mediaType = mimeToMediaType(mime)
  const fileUuid  = crypto.randomUUID()
  const path      = makeMediaPath(meta.diamond_id, fileUuid, mime)

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(path, fileData, { contentType: mime, upsert: false })

  if (uploadError) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to upload media file', statusHint: 500 })
  }

  let record
  try {
    record = await insertMediaRecord({
      diamond_id:    meta.diamond_id,
      media_type:    mediaType,
      storage_path:  path,
      display_order: meta.display_order,
      alt_text:      meta.alt_text ?? null,
      is_primary:    meta.is_primary,
    })
  } catch (err) {
    // DB insert failed — remove the already-uploaded object to avoid orphans.
    await admin.storage.from(MEDIA_BUCKET).remove([path])
    throw err
  }

  const signedUrl = await makeSignedUrl(path)
  return toResponse(record, signedUrl)
}

// Returns all media for a diamond with fresh signed URLs.
export async function listDiamondMedia(
  actor:     StaffUser,
  diamondId: string,
): Promise<DiamondMediaResponse[]> {
  if (actor.roles.length === 0) {
    throw new ServiceException({ code: 'not_staff', message: "You don't have permission to view media", statusHint: 403 })
  }

  const records = await findMediaByDiamond(diamondId)
  return Promise.all(
    records.map(async (r) => toResponse(r, await makeSignedUrl(r.storage_path))),
  )
}

// Deletes the storage object and the database row.
// Supabase's direct-DELETE trigger does not apply to the Storage API —
// service_role can delete via the Storage client with BYPASSRLS.
export async function deleteDiamondMedia(
  actor:   StaffUser,
  mediaId: string,
): Promise<void> {
  requirePrivileged(actor)

  const record = await findMediaById(mediaId)
  if (!record) throw new ServiceException({ code: 'not_found', message: 'Media record not found', statusHint: 404 })

  const admin = createAdminClient()
  const { error: storageError } = await admin.storage
    .from(MEDIA_BUCKET)
    .remove([record.storage_path])

  if (storageError) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to delete media file from storage', statusHint: 500 })
  }

  await deleteMediaRecord(mediaId)
}
