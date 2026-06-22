import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/diamonds/repository', () => ({
  findDiamondById:    vi.fn(),
  findMediaByDiamond: vi.fn(),
  findMediaById:      vi.fn(),
  insertMediaRecord:  vi.fn(),
  deleteMediaRecord:  vi.fn(),
}))

import { uploadDiamondMedia, listDiamondMedia, deleteDiamondMedia } from '@/lib/diamonds/media'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  findDiamondById,
  findMediaByDiamond,
  findMediaById,
  insertMediaRecord,
  deleteMediaRecord,
} from '@/lib/diamonds/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { DiamondRecord, DiamondMediaRecord } from '@/lib/diamonds/types'
import type { MediaUploadMeta } from '@/lib/diamonds/schemas'

// ── Fixtures ──────────────────────────────────────────────────────────────────

// JPEG magic bytes: FF D8 FF + padding
const JPEG_BYTES = new Uint8Array([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0])
// PDF bytes — valid signature but wrong bucket for media
const PDF_BYTES  = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0, 0, 0, 0, 0, 0, 0])
// Unknown bytes — no matching signature
const JUNK_BYTES = new Uint8Array(12).fill(0x00)

const SUPER_ADMIN:   StaffUser = { id: 'u-001', email: 'admin@eg.test',   fullName: null, roles: ['super_admin'] }
const DIAMOND_BUYER: StaffUser = { id: 'u-002', email: 'buyer@eg.test',   fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER: StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }
const CONTENT_ED:    StaffUser = { id: 'u-005', email: 'content@eg.test', fullName: null, roles: ['content_editor'] }

const MOCK_DIAMOND: DiamondRecord = {
  id: 'dia-001', sku: 'SKU-001', supplier_id: null, supplier_sku: null,
  origin: 'natural', colour_category: 'standard', colour_grade: 'G',
  fancy_colour_hue: null, fancy_colour_intensity: null, fancy_colour_overtone: null,
  shape: 'round', carat: '1.500', clarity: 'VS1', cut: 'Excellent',
  polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'None',
  meas_length_mm: null, meas_width_mm: null, meas_depth_mm: null,
  table_pct: null, depth_pct: null, girdle: null, culet: null,
  cert_lab: null, cert_number: null, cert_pdf_path: null,
  retail_price_amount: null, retail_price_currency: 'AED',
  supplier_cost_amount: null, supplier_cost_currency: 'USD',
  status: 'available', is_visible: false,
  held_by_user_id: null, held_at: null, hold_expires_at: null, hold_reason: null,
  selection_note: null, internal_notes: null, last_availability_check: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  created_by: null, updated_by: null,
}

const MOCK_MEDIA_RECORD: DiamondMediaRecord = {
  id: 'med-001', diamond_id: 'dia-001', media_type: 'image',
  storage_path: 'dia-001/uuid-abc.jpg', display_order: 0,
  alt_text: null, is_primary: false, created_at: '2026-01-01T00:00:00Z',
}

const UPLOAD_META: MediaUploadMeta = {
  diamond_id: 'dia-001', display_order: 0, alt_text: null, is_primary: false,
}

const SIGNED_URL = 'https://storage.supabase.co/media.jpg?token=xyz'

// ── Admin mock factory ────────────────────────────────────────────────────────

function makeAdminMock() {
  const mockUpload          = vi.fn().mockResolvedValue({ data: {}, error: null })
  const mockRemove          = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockCreateSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null })
  const storageBucket = { upload: mockUpload, remove: mockRemove, createSignedUrl: mockCreateSignedUrl }
  const mockStorageFrom = vi.fn().mockReturnValue(storageBucket)

  const admin = { storage: { from: mockStorageFrom } }
  return {
    admin: admin as unknown as ReturnType<typeof createAdminClient>,
    mockUpload, mockRemove, mockCreateSignedUrl, mockStorageFrom,
  }
}

let am: ReturnType<typeof makeAdminMock>

beforeEach(() => {
  vi.clearAllMocks()
  am = makeAdminMock()
  vi.mocked(createAdminClient).mockReturnValue(am.admin)
  vi.mocked(findDiamondById).mockResolvedValue(MOCK_DIAMOND)
  vi.mocked(insertMediaRecord).mockResolvedValue(MOCK_MEDIA_RECORD)
  vi.mocked(findMediaByDiamond).mockResolvedValue([MOCK_MEDIA_RECORD])
  vi.mocked(findMediaById).mockResolvedValue(MOCK_MEDIA_RECORD)
})

// ── uploadDiamondMedia ────────────────────────────────────────────────────────

describe('uploadDiamondMedia', () => {
  it('authorised super_admin can upload media and receives a signed URL', async () => {
    const result = await uploadDiamondMedia(SUPER_ADMIN, UPLOAD_META, JPEG_BYTES)

    expect(am.mockUpload).toHaveBeenCalledOnce()
    expect(result.signed_url).toBe(SIGNED_URL)
    expect(result).not.toHaveProperty('storage_path')
  })

  it('authorised diamond_buyer can upload media', async () => {
    const result = await uploadDiamondMedia(DIAMOND_BUYER, UPLOAD_META, JPEG_BYTES)

    expect(result.signed_url).toBe(SIGNED_URL)
  })

  it('invalid file signature is rejected before Storage upload', async () => {
    await expect(uploadDiamondMedia(SUPER_ADMIN, UPLOAD_META, JUNK_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'invalid_file_type',
    )

    expect(am.mockUpload).not.toHaveBeenCalled()
  })

  it('PDF bytes are rejected for the media bucket (wrong MIME/bucket combination)', async () => {
    await expect(uploadDiamondMedia(SUPER_ADMIN, UPLOAD_META, PDF_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'invalid_file_type',
    )

    expect(am.mockUpload).not.toHaveBeenCalled()
  })

  it('generated Storage path is UUID-based, not derived from any client-supplied filename', async () => {
    await uploadDiamondMedia(SUPER_ADMIN, UPLOAD_META, JPEG_BYTES)

    const uploadPath = am.mockUpload.mock.calls[0][0] as string
    // Path must match {diamond_id}/{uuid}.{ext} — no client filename can appear
    expect(uploadPath).toMatch(/^dia-001\/[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4)$/)
  })

  it('DB insert failure attempts cleanup of the newly uploaded object', async () => {
    vi.mocked(insertMediaRecord).mockRejectedValue(new ServiceException({ code: 'db_error', message: 'Insert failed', statusHint: 500 }))

    await expect(uploadDiamondMedia(SUPER_ADMIN, UPLOAD_META, JPEG_BYTES)).rejects.toBeTruthy()

    expect(am.mockRemove).toHaveBeenCalledOnce()
    const removedPaths = am.mockRemove.mock.calls[0][0] as string[]
    expect(removedPaths[0]).toMatch(/^dia-001\/[0-9a-f-]{36}\.jpg$/)
  })

  it('sales_adviser cannot upload media', async () => {
    await expect(uploadDiamondMedia(SALES_ADVISER, UPLOAD_META, JPEG_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(am.mockUpload).not.toHaveBeenCalled()
    expect(vi.mocked(findDiamondById)).not.toHaveBeenCalled()
  })
})

// ── deleteDiamondMedia ────────────────────────────────────────────────────────

describe('deleteDiamondMedia', () => {
  it('authorised staff can delete a media record', async () => {
    await deleteDiamondMedia(SUPER_ADMIN, 'med-001')

    expect(am.mockRemove).toHaveBeenCalledWith([MOCK_MEDIA_RECORD.storage_path])
    expect(vi.mocked(deleteMediaRecord)).toHaveBeenCalledWith('med-001')
  })

  it('sales_adviser cannot delete media', async () => {
    await expect(deleteDiamondMedia(SALES_ADVISER, 'med-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(am.mockRemove).not.toHaveBeenCalled()
    expect(vi.mocked(findMediaById)).not.toHaveBeenCalled()
  })

  it('content_editor cannot delete media', async () => {
    await expect(deleteDiamondMedia(CONTENT_ED, 'med-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })
})

// ── listDiamondMedia ──────────────────────────────────────────────────────────

describe('listDiamondMedia', () => {
  it('any authenticated staff member receives signed media URLs', async () => {
    const results = await listDiamondMedia(SALES_ADVISER, 'dia-001')

    expect(results).toHaveLength(1)
    expect(results[0].signed_url).toBe(SIGNED_URL)
    expect(results[0]).not.toHaveProperty('storage_path')
  })
})
