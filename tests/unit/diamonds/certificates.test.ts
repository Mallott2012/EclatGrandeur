import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock calls are hoisted before imports by Vitest's transformer.
// server-only is aliased to an empty stub in vitest.config.ts, so these
// modules can be imported without triggering Next.js's build-time throw.
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/diamonds/repository', () => ({ findDiamondById: vi.fn() }))

import { uploadCertificate, getCertificateSignedUrl } from '@/lib/diamonds/certificates'
import { createAdminClient } from '@/lib/supabase/admin'
import { findDiamondById } from '@/lib/diamonds/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { DiamondRecord } from '@/lib/diamonds/types'
import type { CertUploadMeta } from '@/lib/diamonds/schemas'

// ── Test fixtures ─────────────────────────────────────────────────────────────

// PDF magic bytes (%PDF- followed by padding to 12 bytes)
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0, 0, 0, 0, 0, 0, 0])
// Bytes that do not match any supported MIME signature
const UNKNOWN_BYTES = new Uint8Array(12).fill(0x00)

const SUPER_ADMIN:    StaffUser = { id: 'u-001', email: 'admin@eg.test', fullName: null, roles: ['super_admin'] }
const DIAMOND_BUYER:  StaffUser = { id: 'u-002', email: 'buyer@eg.test', fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER:  StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }
const NO_ROLES:       StaffUser = { id: 'u-004', email: 'noauth@eg.test', fullName: null, roles: [] }

const DIAMOND_NO_CERT: DiamondRecord = {
  id: 'dia-001', sku: 'SKU-001', supplier_id: 'sup-001', supplier_sku: null,
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

const DIAMOND_WITH_CERT: DiamondRecord = {
  ...DIAMOND_NO_CERT,
  cert_lab: 'GIA', cert_number: '1234567890',
  cert_pdf_path: 'dia-001/certificate-old-uuid.pdf',
}

const CERT_META: CertUploadMeta = { diamond_id: 'dia-001', cert_lab: 'GIA', cert_number: '9876543210' }

const SIGNED_URL = 'https://storage.supabase.co/cert.pdf?token=abc'

// ── Admin client mock factory ─────────────────────────────────────────────────

function makeAdminMock() {
  const mockThrowOnError  = vi.fn().mockResolvedValue(undefined)
  const mockEq            = vi.fn().mockReturnValue({ throwOnError: mockThrowOnError })
  const mockUpdate        = vi.fn().mockReturnValue({ eq: mockEq })
  const mockInsert        = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockUpload        = vi.fn().mockResolvedValue({ data: {}, error: null })
  const mockRemove        = vi.fn().mockResolvedValue({ data: [], error: null })
  const mockCreateSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null })

  const storageBucket = { upload: mockUpload, remove: mockRemove, createSignedUrl: mockCreateSignedUrl }
  const mockStorageFrom = vi.fn().mockReturnValue(storageBucket)
  const mockFrom = vi.fn().mockImplementation((table: string) =>
    table === 'diamonds' ? { update: mockUpdate } : { insert: mockInsert },
  )

  const admin = {
    storage: { from: mockStorageFrom },
    from: mockFrom,
  }

  return {
    admin: admin as unknown as ReturnType<typeof createAdminClient>,
    mockThrowOnError, mockEq, mockUpdate, mockInsert,
    mockUpload, mockRemove, mockCreateSignedUrl, mockStorageFrom, mockFrom,
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

let am: ReturnType<typeof makeAdminMock>

beforeEach(() => {
  vi.clearAllMocks()
  am = makeAdminMock()
  vi.mocked(createAdminClient).mockReturnValue(am.admin)
  vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_NO_CERT)
})

// ── getCertificateSignedUrl ───────────────────────────────────────────────────

describe('getCertificateSignedUrl', () => {
  it('super_admin can receive a certificate signed URL', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)

    const result = await getCertificateSignedUrl(SUPER_ADMIN, 'dia-001')

    expect(result.signed_url).toBe(SIGNED_URL)
    expect(result.expires_at).toBeTruthy()
    expect(am.mockCreateSignedUrl).toHaveBeenCalledOnce()
  })

  it('diamond_buyer can receive a certificate signed URL', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)

    const result = await getCertificateSignedUrl(DIAMOND_BUYER, 'dia-001')

    expect(result.signed_url).toBe(SIGNED_URL)
    expect(am.mockCreateSignedUrl).toHaveBeenCalledOnce()
  })

  it('sales_adviser is denied before DB, Storage, and audit calls', async () => {
    await expect(getCertificateSignedUrl(SALES_ADVISER, 'dia-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findDiamondById)).not.toHaveBeenCalled()
    expect(vi.mocked(createAdminClient)).not.toHaveBeenCalled()
  })

  it('non-staff actor with no roles is denied before DB, Storage, and audit calls', async () => {
    await expect(getCertificateSignedUrl(NO_ROLES, 'dia-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findDiamondById)).not.toHaveBeenCalled()
    expect(vi.mocked(createAdminClient)).not.toHaveBeenCalled()
  })

  it('certificate-view audit failure prevents signed URL generation and return', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)
    am.mockInsert.mockResolvedValue({ data: null, error: { message: 'DB timeout', code: 'PGRST' } })

    await expect(getCertificateSignedUrl(SUPER_ADMIN, 'dia-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'audit_write_failed',
    )

    expect(am.mockCreateSignedUrl).not.toHaveBeenCalled()
  })

  it('result does not expose a raw storage path', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)

    const result = await getCertificateSignedUrl(SUPER_ADMIN, 'dia-001')

    expect(result).not.toHaveProperty('cert_pdf_path')
    expect(result).not.toHaveProperty('storage_path')
    expect(result.signed_url).toMatch(/^https?:\/\//)
  })
})

// ── uploadCertificate ─────────────────────────────────────────────────────────

describe('uploadCertificate', () => {
  it('certificate first-upload uses a new immutable UUID path', async () => {
    await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    // storage.from is called with the bucket name; upload is called on the returned bucket object
    const storageBucketArg = am.mockStorageFrom.mock.calls[0][0] as string
    const uploadPath        = am.mockUpload.mock.calls[0][0] as string
    const uploadOptions     = am.mockUpload.mock.calls[0][2] as Record<string, unknown>

    expect(storageBucketArg).toBe('diamond-certificates')
    expect(uploadPath).toMatch(/^dia-001\/certificate-[0-9a-f-]{36}\.pdf$/)
    expect(uploadOptions.upsert).toBe(false)
  })

  it('uses diamond.certificate_uploaded action when no prior cert exists', async () => {
    await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    const insertArg = am.mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg.action).toBe('diamond.certificate_uploaded')
  })

  it('uses diamond.certificate_replaced action when a prior cert exists', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)

    await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    const insertArg = am.mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg.action).toBe('diamond.certificate_replaced')
  })

  it('upload audit failure returns success with auditWarning: true, not a 500', async () => {
    am.mockInsert.mockResolvedValue({ data: null, error: { message: 'Connection lost', code: 'PGRST' } })

    const result = await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    expect(result.auditWarning).toBe(true)
    expect(result.signed_url).toBe(SIGNED_URL)
    expect(result.expires_at).toBeTruthy()
  })

  it('DB update failure removes the newly uploaded object best-effort', async () => {
    am.mockThrowOnError.mockRejectedValue(new Error('DB constraint violation'))

    await expect(uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'db_error',
    )

    // The new object must be removed
    const removedPaths = am.mockRemove.mock.calls[0][0] as string[]
    expect(removedPaths).toHaveLength(1)
    expect(removedPaths[0]).toMatch(/^dia-001\/certificate-[0-9a-f-]{36}\.pdf$/)
  })

  it('old-object cleanup runs only after a successful DB update', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)

    await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    // remove must have been called with the OLD path (not the new one)
    const removedPaths = am.mockRemove.mock.calls[0][0] as string[]
    expect(removedPaths[0]).toBe(DIAMOND_WITH_CERT.cert_pdf_path)
  })

  it('old-object cleanup failure is logged and does not fail the operation', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(DIAMOND_WITH_CERT)
    am.mockRemove.mockRejectedValue(new Error('Storage timeout'))

    // Should still succeed; cleanup failure is swallowed internally
    const result = await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    expect(result.signed_url).toBe(SIGNED_URL)
    expect(result.auditWarning).toBeUndefined()
  })

  it('result does not expose a raw Storage path', async () => {
    const result = await uploadCertificate(SUPER_ADMIN, CERT_META, PDF_BYTES)

    expect(result).not.toHaveProperty('cert_pdf_path')
    expect(result).not.toHaveProperty('storage_path')
    expect(result.signed_url).toMatch(/^https?:\/\//)
  })

  it('invalid MIME is rejected before Storage upload', async () => {
    await expect(uploadCertificate(SUPER_ADMIN, CERT_META, UNKNOWN_BYTES)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'invalid_file_type',
    )

    expect(am.mockUpload).not.toHaveBeenCalled()
  })
})
