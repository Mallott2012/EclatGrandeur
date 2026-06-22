import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import {
  detectMime,
  makeMediaPath,
  mimeToMediaType,
  isMimeAllowedForBucket,
  MEDIA_BUCKET,
  type MediaMime,
} from '@/lib/storage/paths'
import {
  findDiamondById,
  findMediaByDiamond,
  findMediaById,
  insertMediaRecord,
  deleteMediaRecord,
  setPrimaryMediaRecord,
} from './repository'
import type { DiamondMediaResponse } from './types'
import type { MediaUploadMeta } from './schemas'
import type { StaffUser } from '@/lib/staff-shared'

const SIGNED_URL_SECONDS = 3600 // 1 hour

const MAX_IMAGE_BYTES = 20 * 1024 * 1024   // 20 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024  // 100 MB

function requirePrivileged(actor: StaffUser): void {
  const ok = actor.roles.includes('super_admin') || actor.roles.includes('diamond_buyer')
  if (!ok) {
    throw new ServiceException({ code: 'insufficient_role', message: "You don't have permission to manage media", statusHint: 403 })
  }
}

function toResponse(
  record: { id: string; diamond_id: string; media_type: string; storage_path: string; display_order: number; alt_text: string | null; is_primary: boolean; created_at: string },
  signedUrl: string,
): DiamondMediaResponse {
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

// Upload a media file for a diamond. Bytes must be provided by the server action
// from the multipart FormData — the client filename is never used.
// Server enforces: magic-byte MIME validation, file size limits, storage upload,
// DB insert (with orphan cleanup on failure), and non-blocking audit write.
export async function uploadDiamondMedia(
  actor:    StaffUser,
  meta:     MediaUploadMeta,
  fileData: Uint8Array,
): Promise<DiamondMediaResponse> {
  requirePrivileged(actor)

  const diamond = await findDiamondById(meta.diamond_id)
  if (!diamond) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })

  // File-signature validation (magic bytes — client MIME type is not trusted).
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

  // Server-side authoritative size enforcement.
  const maxBytes = mediaType === 'video_360' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (fileData.length > maxBytes) {
    throw new ServiceException({
      code:       'file_too_large',
      message:    mediaType === 'video_360' ? 'Video files must be under 100 MB' : 'Image files must be under 20 MB',
      statusHint: 400,
    })
  }

  const fileUuid = crypto.randomUUID()
  const path     = makeMediaPath(meta.diamond_id, fileUuid, mime)
  const admin    = createAdminClient()

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

  // Non-blocking audit write.
  const { error: auditErr } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        'diamond.media_uploaded',
    entity_type:   'diamond',
    entity_id:     meta.diamond_id,
    metadata:      { media_id: record.id, media_type: mediaType },
  })
  if (auditErr) console.error('[media] Audit write failed for diamond.media_uploaded:', meta.diamond_id, auditErr)

  // Generate signed URL for the uploaded object.
  const { data: urlData, error: urlErr } = await admin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS)
  if (urlErr || !urlData?.signedUrl) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to generate media signed URL', statusHint: 500 })
  }

  return toResponse(record, urlData.signedUrl)
}

// Returns all media for a diamond with fresh signed URLs.
// Uses a single batch createSignedUrls call — not N individual calls.
export async function listDiamondMedia(
  actor:     StaffUser,
  diamondId: string,
): Promise<DiamondMediaResponse[]> {
  if (actor.roles.length === 0) {
    throw new ServiceException({ code: 'not_staff', message: "You don't have permission to view media", statusHint: 403 })
  }

  const records = await findMediaByDiamond(diamondId)
  if (records.length === 0) return []

  const admin = createAdminClient()
  const paths = records.map((r) => r.storage_path)

  const { data: signedData, error } = await admin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)

  if (error || !signedData) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to generate media signed URLs', statusHint: 500 })
  }

  // Build path → signedUrl map for safe lookup (positional ordering not guaranteed).
  // Supabase returns path/signedUrl as string|null; skip entries where either is missing.
  const urlMap = new Map(
    signedData
      .filter((s: { path: string | null; signedUrl: string | null }) => s.path != null && s.signedUrl != null)
      .map((s: { path: string | null; signedUrl: string | null }) => [s.path!, s.signedUrl!]),
  )

  return records.map((r) => toResponse(r, urlMap.get(r.storage_path) ?? ''))
}

// Deletes the storage object and the database row. Non-blocking audit write after.
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

  // Non-blocking audit write.
  const { error: auditErr } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        'diamond.media_deleted',
    entity_type:   'diamond',
    entity_id:     record.diamond_id,
    metadata:      { media_id: mediaId, media_type: record.media_type },
  })
  if (auditErr) console.error('[media] Audit write failed for diamond.media_deleted:', record.diamond_id, auditErr)
}

// Sets the primary flag on one media item and clears it on all others for the diamond.
export async function setPrimaryMedia(
  actor:     StaffUser,
  mediaId:   string,
  diamondId: string,
): Promise<void> {
  requirePrivileged(actor)
  await setPrimaryMediaRecord(mediaId, diamondId)
}
