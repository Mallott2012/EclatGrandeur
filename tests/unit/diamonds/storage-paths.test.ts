import { describe, it, expect } from 'vitest'
import {
  detectMime,
  makeCertPath,
  makeMediaPath,
  mimeToMediaType,
  isMimeAllowedForBucket,
  CERT_BUCKET,
  MEDIA_BUCKET,
} from '@/lib/storage/paths'

// Minimal magic-byte buffers for each supported type.
// Padded to 12 bytes so the length check passes.

function buf(...bytes: number[]): Uint8Array {
  const arr = new Uint8Array(12)
  bytes.forEach((b, i) => { arr[i] = b })
  return arr
}

const PDF_MAGIC  = buf(0x25, 0x50, 0x44, 0x46, 0x2d)                      // %PDF-
const JPEG_MAGIC = buf(0xff, 0xd8, 0xff)                                   // FF D8 FF
const PNG_MAGIC  = buf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)   // PNG sig
const WEBP_MAGIC = (() => {
  const b = buf(0x52, 0x49, 0x46, 0x46)                                    // RIFF
  b[8] = 0x57; b[9] = 0x45; b[10] = 0x42; b[11] = 0x50                    // WEBP
  return b
})()
const AVIF_MAGIC = (() => {
  const b = new Uint8Array(12)
  b[4] = 0x66; b[5] = 0x74; b[6] = 0x79; b[7] = 0x70                     // ftyp
  b[8] = 0x61; b[9] = 0x76; b[10] = 0x69; b[11] = 0x66                   // avif
  return b
})()
const MP4_MAGIC = (() => {
  const b = new Uint8Array(12)
  b[4] = 0x66; b[5] = 0x74; b[6] = 0x79; b[7] = 0x70                     // ftyp
  b[8] = 0x69; b[9] = 0x73; b[10] = 0x6f; b[11] = 0x6d                   // isom
  return b
})()
const UNKNOWN_MAGIC = buf(0x00, 0x11, 0x22, 0x33)

describe('detectMime', () => {
  it('detects PDF', () => expect(detectMime(PDF_MAGIC)).toBe('application/pdf'))
  it('detects JPEG', () => expect(detectMime(JPEG_MAGIC)).toBe('image/jpeg'))
  it('detects PNG', () => expect(detectMime(PNG_MAGIC)).toBe('image/png'))
  it('detects WebP', () => expect(detectMime(WEBP_MAGIC)).toBe('image/webp'))
  it('detects AVIF', () => expect(detectMime(AVIF_MAGIC)).toBe('image/avif'))
  it('detects MP4', () => expect(detectMime(MP4_MAGIC)).toBe('video/mp4'))

  it('returns null for unrecognised bytes', () => {
    expect(detectMime(UNKNOWN_MAGIC)).toBeNull()
  })

  it('returns null when buffer is too short (< 12 bytes)', () => {
    expect(detectMime(new Uint8Array(8))).toBeNull()
  })

  it('detects AVIF with "avis" brand', () => {
    const b = new Uint8Array(12)
    b[4] = 0x66; b[5] = 0x74; b[6] = 0x79; b[7] = 0x70   // ftyp
    b[8] = 0x61; b[9] = 0x76; b[10] = 0x69; b[11] = 0x73  // avis
    expect(detectMime(b)).toBe('image/avif')
  })
})

describe('makeCertPath', () => {
  it('produces the expected format', () => {
    const p = makeCertPath('dia-001', 'uuid-abc')
    expect(p).toBe('dia-001/certificate-uuid-abc.pdf')
  })

  it('uses diamond ID as the folder prefix', () => {
    expect(makeCertPath('dia-xyz', 'f').startsWith('dia-xyz/')).toBe(true)
  })
})

describe('makeMediaPath', () => {
  it('uses jpg extension for image/jpeg', () => {
    expect(makeMediaPath('dia-001', 'uuid', 'image/jpeg')).toBe('dia-001/uuid.jpg')
  })

  it('uses mp4 extension for video/mp4', () => {
    expect(makeMediaPath('dia-001', 'uuid', 'video/mp4')).toBe('dia-001/uuid.mp4')
  })

  it('uses webp extension for image/webp', () => {
    expect(makeMediaPath('dia-001', 'uuid', 'image/webp')).toBe('dia-001/uuid.webp')
  })

  it('uses avif extension for image/avif', () => {
    expect(makeMediaPath('dia-001', 'uuid', 'image/avif')).toBe('dia-001/uuid.avif')
  })
})

describe('mimeToMediaType', () => {
  it('maps video/mp4 to video_360', () => {
    expect(mimeToMediaType('video/mp4')).toBe('video_360')
  })

  it('maps all image types to image', () => {
    expect(mimeToMediaType('image/jpeg')).toBe('image')
    expect(mimeToMediaType('image/png')).toBe('image')
    expect(mimeToMediaType('image/webp')).toBe('image')
    expect(mimeToMediaType('image/avif')).toBe('image')
  })
})

describe('isMimeAllowedForBucket', () => {
  it('allows application/pdf only for cert bucket', () => {
    expect(isMimeAllowedForBucket('application/pdf', CERT_BUCKET)).toBe(true)
    expect(isMimeAllowedForBucket('image/jpeg',      CERT_BUCKET)).toBe(false)
  })

  it('allows image types for media bucket', () => {
    expect(isMimeAllowedForBucket('image/jpeg', MEDIA_BUCKET)).toBe(true)
    expect(isMimeAllowedForBucket('image/png',  MEDIA_BUCKET)).toBe(true)
    expect(isMimeAllowedForBucket('image/webp', MEDIA_BUCKET)).toBe(true)
    expect(isMimeAllowedForBucket('image/avif', MEDIA_BUCKET)).toBe(true)
  })

  it('allows video/mp4 for media bucket', () => {
    expect(isMimeAllowedForBucket('video/mp4', MEDIA_BUCKET)).toBe(true)
  })

  it('does not allow application/pdf for media bucket', () => {
    expect(isMimeAllowedForBucket('application/pdf', MEDIA_BUCKET)).toBe(false)
  })
})
