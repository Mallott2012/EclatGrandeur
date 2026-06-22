// Storage path generation and file-signature validation for diamond inventory.
// Imported only by server-only modules (diamonds/media.ts, diamonds/certificates.ts).
// Contains no Supabase imports and no server-only guard — enforcement is through
// the importing modules.

export const CERT_BUCKET  = 'diamond-certificates' as const
export const MEDIA_BUCKET = 'diamond-media'        as const

export const CERT_MIMES  = ['application/pdf']                                           as const
export const MEDIA_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4'] as const

export type CertMime      = (typeof CERT_MIMES)[number]
export type MediaMime     = (typeof MEDIA_MIMES)[number]
export type SupportedMime = CertMime | MediaMime

// Canonical extension for each supported MIME type.
// Client-supplied filenames and extensions are discarded entirely.
const MIME_EXT: Record<SupportedMime, string> = {
  'application/pdf': 'pdf',
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
  'image/avif':      'avif',
  'video/mp4':       'mp4',
}

// Maps a validated media MIME type to the diamond_media_type enum value.
export function mimeToMediaType(mime: MediaMime): 'image' | 'video_360' {
  return mime === 'video/mp4' ? 'video_360' : 'image'
}

// Immutable versioned certificate path.
// Format: {diamondId}/certificate-{fileUuid}.pdf
// Each upload uses a new UUID so existing objects are never overwritten.
export function makeCertPath(diamondId: string, fileUuid: string): string {
  return `${diamondId}/certificate-${fileUuid}.pdf`
}

// Immutable media path using a server-generated UUID and server-derived extension.
// The client filename is never used.
// Format: {diamondId}/{fileUuid}.{ext}
export function makeMediaPath(diamondId: string, fileUuid: string, mime: MediaMime): string {
  return `${diamondId}/${fileUuid}.${MIME_EXT[mime]}`
}

// File-signature validation using magic bytes (first 12 bytes of the file buffer).
// Identifies the MIME type from known byte sequences for the six supported types.
// This confirms the file begins with a recognised signature — it is not malware
// scanning and does not guarantee file integrity beyond the header bytes.
// Returns null if the signature does not match any supported MIME type.
export function detectMime(buffer: Uint8Array): SupportedMime | null {
  if (buffer.length < 12) return null

  // PDF: %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 && buffer[1] === 0x50 &&
    buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2d
  ) return 'application/pdf'

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return 'image/png'

  // WebP: RIFF at bytes 0–3, WEBP at bytes 8–11
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp'

  // AVIF and MP4 both start with 'ftyp' at bytes 4–7.
  const isFtyp =
    buffer[4] === 0x66 && buffer[5] === 0x74 &&
    buffer[6] === 0x79 && buffer[7] === 0x70

  if (isFtyp) {
    // AVIF brand: 'avif' (61 76 69 66) or 'avis' (61 76 69 73)
    const isAvif =
      buffer[8] === 0x61 && buffer[9] === 0x76 && buffer[10] === 0x69 &&
      (buffer[11] === 0x66 || buffer[11] === 0x73)
    return isAvif ? 'image/avif' : 'video/mp4'
  }

  return null
}

// Returns true if the detected MIME is permitted for the given bucket.
export function isMimeAllowedForBucket(
  mime: SupportedMime,
  bucket: typeof CERT_BUCKET | typeof MEDIA_BUCKET,
): boolean {
  if (bucket === CERT_BUCKET)  return (CERT_MIMES  as readonly string[]).includes(mime)
  return (MEDIA_MIMES as readonly string[]).includes(mime)
}
