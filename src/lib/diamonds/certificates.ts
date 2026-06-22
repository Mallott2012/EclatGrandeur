import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import { detectMime, makeCertPath, isMimeAllowedForBucket, CERT_BUCKET } from '@/lib/storage/paths'
import { findDiamondById, setCertPdfPath } from './repository'
import type { CertSignedUrlResult } from './types'
import type { CertUploadMeta } from './schemas'
import type { StaffUser } from '@/lib/staff-shared'

const CERT_SIGNED_URL_SECONDS = 300 // 5 minutes — certs are sensitive; short TTL

function requirePrivileged(actor: StaffUser): void {
  const ok = actor.roles.includes('super_admin') || actor.roles.includes('diamond_buyer')
  if (!ok) {
    throw new ServiceException({ code: 'insufficient_role', message: "You don't have permission to manage certificates", statusHint: 403 })
  }
}

// Upload a certificate PDF and link it to the diamond's cert_lab/cert_number.
// Atomicity: storage upload → diamond row update → audit entry.
// If the DB update fails after upload, the orphaned object is removed before re-throwing.
export async function uploadCertificate(
  actor:    StaffUser,
  meta:     CertUploadMeta,
  fileData: Uint8Array,
): Promise<CertSignedUrlResult> {
  requirePrivileged(actor)

  const diamond = await findDiamondById(meta.diamond_id)
  if (!diamond) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })

  // File-signature validation
  const detectedMime = detectMime(fileData)
  if (!detectedMime || !isMimeAllowedForBucket(detectedMime, CERT_BUCKET)) {
    throw new ServiceException({ code: 'invalid_file_type', message: 'Only PDF files are permitted for certificates', statusHint: 400 })
  }

  const fileUuid = crypto.randomUUID()
  const path     = makeCertPath(meta.diamond_id, fileUuid)
  const admin    = createAdminClient()

  // Upload to storage (immutable path — never overwritten, keyed by server UUID).
  const { error: uploadError } = await admin.storage
    .from(CERT_BUCKET)
    .upload(path, fileData, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to upload certificate file', statusHint: 500 })
  }

  // Update the diamond row with the new cert fields and path.
  try {
    await admin
      .from('diamonds')
      .update({
        cert_lab:      meta.cert_lab,
        cert_number:   meta.cert_number,
        cert_pdf_path: path,
        updated_by:    actor.id,
      })
      .eq('id', meta.diamond_id)
      .throwOnError()
  } catch (err) {
    await admin.storage.from(CERT_BUCKET).remove([path])
    throw new ServiceException({ code: 'db_error', message: 'Failed to link certificate to diamond', statusHint: 500 })
  }

  // Audit write — throws on failure (certificate access must be audited).
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        'certificate_uploaded',
    entity_type:   'diamond',
    entity_id:     meta.diamond_id,
    metadata:      { cert_lab: meta.cert_lab, cert_number: meta.cert_number },
  })
  if (auditError) {
    throw new ServiceException({ code: 'audit_write_failed', message: 'Failed to record certificate upload audit event', statusHint: 500 })
  }

  return buildSignedUrl(admin, path)
}

// Returns a short-lived signed URL for the diamond's certificate PDF.
// The audit write is strict — it throws rather than soft-failing, because every
// certificate access must be recorded for compliance.
export async function getCertificateSignedUrl(
  actor:     StaffUser,
  diamondId: string,
): Promise<CertSignedUrlResult> {
  // All staff may download a certificate, but must be authenticated staff.
  if (actor.roles.length === 0) {
    throw new ServiceException({ code: 'not_staff', message: "You don't have permission to view certificates", statusHint: 403 })
  }

  const diamond = await findDiamondById(diamondId)
  if (!diamond) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })
  if (!diamond.cert_pdf_path) {
    throw new ServiceException({ code: 'no_certificate', message: 'No certificate has been uploaded for this diamond', statusHint: 404 })
  }

  const admin = createAdminClient()

  // Audit write — strict (must throw if it fails).
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        'certificate_viewed',
    entity_type:   'diamond',
    entity_id:     diamondId,
    metadata:      { cert_lab: diamond.cert_lab, cert_number: diamond.cert_number },
  })
  if (auditError) {
    throw new ServiceException({ code: 'audit_write_failed', message: 'Failed to record certificate access audit event', statusHint: 500 })
  }

  return buildSignedUrl(admin, diamond.cert_pdf_path)
}

async function buildSignedUrl(
  admin: ReturnType<typeof createAdminClient>,
  path:  string,
): Promise<CertSignedUrlResult> {
  const { data, error } = await admin.storage
    .from(CERT_BUCKET)
    .createSignedUrl(path, CERT_SIGNED_URL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to generate certificate signed URL', statusHint: 500 })
  }

  const expiresAt = new Date(Date.now() + CERT_SIGNED_URL_SECONDS * 1000).toISOString()
  return { signed_url: data.signedUrl, expires_at: expiresAt }
}
