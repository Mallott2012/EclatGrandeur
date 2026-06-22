import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import { detectMime, makeCertPath, isMimeAllowedForBucket, CERT_BUCKET } from '@/lib/storage/paths'
import { findDiamondById } from './repository'
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
//
// Sequence:
//   1. validate MIME from magic bytes
//   2. upload new object (immutable versioned path)
//   3. update diamond record (cert_lab, cert_number, cert_pdf_path)
//   4. on DB failure → best-effort delete the new object, then rethrow
//   5. write audit entry (strict — throws on failure)
//   6. best-effort delete the old object (if one existed); log cleanup failures
//   7. return a short-lived signed URL for the new certificate
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

  // Capture existing path before any mutation — needed for step 6.
  const oldPath  = diamond.cert_pdf_path
  const fileUuid = crypto.randomUUID()
  const newPath  = makeCertPath(meta.diamond_id, fileUuid)
  const admin    = createAdminClient()

  // Step 2: upload to Storage (upsert: false — path is unique per UUID).
  const { error: uploadError } = await admin.storage
    .from(CERT_BUCKET)
    .upload(newPath, fileData, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to upload certificate file', statusHint: 500 })
  }

  // Step 3: update diamond row. Step 4: on failure, delete the new object.
  try {
    await admin
      .from('diamonds')
      .update({
        cert_lab:      meta.cert_lab,
        cert_number:   meta.cert_number,
        cert_pdf_path: newPath,
        updated_by:    actor.id,
      })
      .eq('id', meta.diamond_id)
      .throwOnError()
  } catch {
    await admin.storage.from(CERT_BUCKET).remove([newPath]).catch((e) =>
      console.error('[certificates] Failed to clean up new cert after DB failure:', newPath, e),
    )
    throw new ServiceException({ code: 'db_error', message: 'Failed to link certificate to diamond', statusHint: 500 })
  }

  // Step 5: audit write — strict (must succeed before returning a URL).
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        'certificate_uploaded',
    entity_type:   'diamond',
    entity_id:     meta.diamond_id,
    metadata:      { cert_lab: meta.cert_lab, cert_number: meta.cert_number },
  })
  if (auditError) {
    // DB and storage are updated; old object orphan is cleaned up below anyway.
    // Old path cleanup still runs before rethrowing.
    cleanUpOldCert(admin, oldPath)
    throw new ServiceException({ code: 'audit_write_failed', message: 'Failed to record certificate upload audit event', statusHint: 500 })
  }

  // Step 6: best-effort delete of the superseded object.
  cleanUpOldCert(admin, oldPath)

  // Step 7: return signed URL for the new certificate.
  return buildSignedUrl(admin, newPath)
}

// Returns a short-lived signed URL for the diamond's certificate PDF.
// Restricted to super_admin and diamond_buyer — sales_adviser must not receive
// a certificate signed URL.
// The audit write is strict — it throws before generating the URL if it fails.
export async function getCertificateSignedUrl(
  actor:     StaffUser,
  diamondId: string,
): Promise<CertSignedUrlResult> {
  requirePrivileged(actor)

  const diamond = await findDiamondById(diamondId)
  if (!diamond) throw new ServiceException({ code: 'not_found', message: 'Diamond not found', statusHint: 404 })
  if (!diamond.cert_pdf_path) {
    throw new ServiceException({ code: 'no_certificate', message: 'No certificate has been uploaded for this diamond', statusHint: 404 })
  }

  const admin = createAdminClient()

  // Audit write — strict: URL is not returned if this fails.
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

// Best-effort deletion of a superseded certificate object.
// Failures are logged but never rethrown — the primary operation already succeeded.
function cleanUpOldCert(
  admin:   ReturnType<typeof createAdminClient>,
  oldPath: string | null,
): void {
  if (!oldPath) return
  admin.storage.from(CERT_BUCKET).remove([oldPath]).catch((e) =>
    console.error('[certificates] Orphan cleanup failed for old cert path:', oldPath, e),
  )
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
