import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/diamonds/repository', () => ({
  findDiamondById:       vi.fn(),
  findMediaByDiamond:    vi.fn(),
  findMediaById:         vi.fn(),
  insertMediaRecord:     vi.fn(),
  deleteMediaRecord:     vi.fn(),
  setPrimaryMediaRecord: vi.fn(),
}))

import { uploadDiamondMedia, listDiamondMedia, deleteDiamondMedia, setPrimaryMedia } from '@/lib/diamonds/media'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  findDiamondById,
  findMediaByDiamond,
  findMediaById,
  insertMediaRecord,
  deleteMediaRecord,
  setPrimaryMediaRecord,
} from '@/lib/diamonds/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { DiamondRecord, DiamondMediaRecord } from '@/lib/diamonds/types'
import type { MediaUploadMeta } from '@/lib/diamonds/schemas'

// ── Fixtures ──────────────────────────────────────────────────────────────────

// JPEG magic bytes
const JPEG_BYTES = new Uint8Array([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0])
// 21 MB filler (exceeds 20 MB image limit) with JPEG header
const OVERSIZED_IMAGE = new Uint8Array(21 * 1024 * 1024).fill(0xFF)
OVERSIZED_IMAGE[0] = 0xFF; OVERSIZED_IMAGE[1] = 0xD8; OVERSIZED_IMAGE[2] = 0xFF

const SUPER_ADMIN:   StaffUser = { id: 'u-001', email: 'admin@eg.test', fullName: null, roles: ['super_admin']   }
const SALES_ADVISER: StaffUser = { id: 'u-003', email: 'adv@eg.test',   fullName: null, roles: ['sales_adviser'] }

const MOCK_DIAMOND: DiamondRecord = {
  id: 'dia-001', sku: 'EGD-2026-000001', supplier_id: null, supplier_sku: null,
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

const MEDIA_RECORD: DiamondMediaRecord = {
  id: 'med-001', diamond_id: 'dia-001', storage_path: 'diamonds/dia-001/img-001.jpg',
  media_type: 'image', alt_text: null, display_order: 0, is_primary: true,
  created_at: '2026-01-01T00:00:00Z',
}

const VALID_META: MediaUploadMeta = {
  diamond_id: 'dia-001', display_order: 0, alt_text: null, is_primary: false,
}

const SIGNED_URL = 'https://storage.example.com/signed'

function makeStorageClient() {
  const uploadFn  = vi.fn().mockResolvedValue({ data: { path: 'stored' }, error: null })
  const signedFn  = vi.fn().mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null })
  const signedsFn = vi.fn().mockImplementation((paths: string[]) =>
    Promise.resolve({ data: paths.map((p) => ({ path: p, signedUrl: SIGNED_URL })), error: null }),
  )
  const removeFn  = vi.fn().mockResolvedValue({ error: null })
  const fromFn    = vi.fn().mockReturnValue({ upload: uploadFn, createSignedUrl: signedFn, createSignedUrls: signedsFn, remove: removeFn })
  const auditFn   = vi.fn().mockResolvedValue({ error: null })
  const dbFromFn  = vi.fn().mockReturnValue({ insert: auditFn })

  return {
    storage:   { from: fromFn },
    from:      dbFromFn,
    _uploadFn: uploadFn,
    _signedFn: signedsFn,
    _removeFn: removeFn,
    _auditFn:  auditFn,
  }
}

// ── uploadDiamondMedia — size enforcement ─────────────────────────────────────

describe('uploadDiamondMedia — file size', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findDiamondById).mockResolvedValue(MOCK_DIAMOND)
    vi.mocked(insertMediaRecord).mockResolvedValue(MEDIA_RECORD)
  })

  it('rejects image exceeding 20 MB', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(uploadDiamondMedia(SUPER_ADMIN, VALID_META, OVERSIZED_IMAGE)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'file_too_large',
    )
  })

  it('accepts image within 20 MB', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(uploadDiamondMedia(SUPER_ADMIN, VALID_META, JPEG_BYTES)).resolves.toBeDefined()
  })

  it('rejects upload by sales_adviser (role guard)', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(uploadDiamondMedia(SALES_ADVISER, VALID_META, JPEG_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })

  it('writes non-blocking audit after successful upload', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await uploadDiamondMedia(SUPER_ADMIN, VALID_META, JPEG_BYTES)
    expect(client._auditFn).toHaveBeenCalled()
  })

  it('does NOT throw when audit write fails after upload', async () => {
    const client = makeStorageClient()
    client._auditFn.mockResolvedValue({ error: new Error('db down') })
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(uploadDiamondMedia(SUPER_ADMIN, VALID_META, JPEG_BYTES)).resolves.toBeDefined()
  })
})

// ── listDiamondMedia — batch signed URLs ──────────────────────────────────────

describe('listDiamondMedia — batch signed URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findDiamondById).mockResolvedValue(MOCK_DIAMOND)
    vi.mocked(findMediaByDiamond).mockResolvedValue([MEDIA_RECORD])
  })

  it('calls createSignedUrls once (not N times)', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await listDiamondMedia(SUPER_ADMIN, 'dia-001')
    expect(client._signedFn).toHaveBeenCalledTimes(1)
  })

  it('maps signed_url onto response and omits storage_path', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    const [item] = await listDiamondMedia(SUPER_ADMIN, 'dia-001')
    expect(item.signed_url).toBe(SIGNED_URL)
    expect('storage_path' in item).toBe(false)
  })

  it('returns empty array when no media (no storage call)', async () => {
    vi.mocked(findMediaByDiamond).mockResolvedValue([])
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    const result = await listDiamondMedia(SUPER_ADMIN, 'dia-001')
    expect(result).toHaveLength(0)
    expect(client._signedFn).not.toHaveBeenCalled()
  })
})

// ── deleteDiamondMedia ────────────────────────────────────────────────────────

describe('deleteDiamondMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findMediaById).mockResolvedValue(MEDIA_RECORD)
    vi.mocked(deleteMediaRecord).mockResolvedValue(undefined)
  })

  it('privileged actor can delete', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(deleteDiamondMedia(SUPER_ADMIN, 'med-001')).resolves.toBeUndefined()
    expect(deleteMediaRecord).toHaveBeenCalledWith('med-001')
  })

  it('throws not_found when media does not exist', async () => {
    vi.mocked(findMediaById).mockResolvedValue(null)
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(deleteDiamondMedia(SUPER_ADMIN, 'missing')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_found',
    )
  })

  it('sales_adviser cannot delete', async () => {
    const client = makeStorageClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await expect(deleteDiamondMedia(SALES_ADVISER, 'med-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })
})

// ── setPrimaryMedia ───────────────────────────────────────────────────────────

describe('setPrimaryMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(setPrimaryMediaRecord).mockResolvedValue(undefined)
  })

  it('privileged actor can set primary', async () => {
    await expect(setPrimaryMedia(SUPER_ADMIN, 'med-001', 'dia-001')).resolves.toBeUndefined()
    expect(setPrimaryMediaRecord).toHaveBeenCalledWith('med-001', 'dia-001')
  })

  it('sales_adviser cannot set primary', async () => {
    await expect(setPrimaryMedia(SALES_ADVISER, 'med-001', 'dia-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })
})
