import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { detectMime, MEDIA_MIMES, type MediaMime } from '@/lib/storage/paths'

export const JEWELLERY_MEDIA_BUCKET = 'jewellery-media' as const

const MIME_EXT: Record<MediaMime, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4':  'mp4',
}

export async function uploadJewelleryMedia(
  file: File,
  folder: string,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime  = detectMime(bytes)

  if (!mime || !(MEDIA_MIMES as readonly string[]).includes(mime)) {
    throw new Error('Unsupported file type. Accepted: JPEG, PNG, WebP, AVIF, MP4.')
  }

  const ext         = MIME_EXT[mime as MediaMime]
  const uuid        = crypto.randomUUID()
  const storagePath = `${folder}/${uuid}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(JEWELLERY_MEDIA_BUCKET)
    .upload(storagePath, bytes, { contentType: mime, upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = admin.storage
    .from(JEWELLERY_MEDIA_BUCKET)
    .getPublicUrl(storagePath)

  return publicUrl
}

export async function deleteJewelleryMedia(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${JEWELLERY_MEDIA_BUCKET}/`
  const storagePath = publicUrl.includes(marker)
    ? publicUrl.split(marker)[1]
    : publicUrl

  const admin = createAdminClient()
  await admin.storage.from(JEWELLERY_MEDIA_BUCKET).remove([storagePath])
}
