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
//   1. validate privileged role
//   2. validate MIME from magic bytes (must be PDF)
//   3. upload new object to an immutable UUID path (upsert: false)
//   4. update diamond record; on DB failure → best-effort delete new object, rethrow
//   5. attempt audit write (diamond.certificate_uploaded or diamond.certificate_replaced)
//      — if audit fails: log server-side but do NOT throw; set auditWarning in result
//   6. best-effort delete the superseded object (if one existed); log cleanup failures
//   7. return a short-lived signed URL for the new certificate (with auditWarning if applicable)
//
// The DB update is the source of truth. Once it succeeds, the active certificate
// is the new one regardless of audit or cleanup outcomes.
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

  // Capture existing path before any mutation — needed for old-object cleanup.
  const oldPath       = diamond.cert_pdf_path
  const isReplacement = oldPath !== null
  const fileUuid      = crypto.randomUUID()
  const newPath       = makeCertPath(meta.diamond_id, fileUuid)
  const admin         = createAdminClient()

  // Step 3: upload to Storage (upsert: false — path is unique per UUID).
  const { error: uploadError } = await admin.storage
    .from(CERT_BUCKET)
    .upload(newPath, fileData, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    throw new ServiceException({ code: 'storage_error', message: 'Failed to upload certificate file', statusHint: 500 })
  }

  // Step 4: update diamond row. On DB failure, clean up the newly uploaded object.
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

  // Step 5: attempt audit write — non-blocking for uploads.
  // The DB update is authoritative; a failed audit does not reverse the replacement.
  const auditAction = isReplacement ? 'diamond.certificate_replaced' : 'diamond.certificate_uploaded'
  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_user_id: actor.id,
    action:        auditAction,
    entity_type:   'diamond',
    entity_id:     meta.diamond_id,
    metadata:      { cert_lab: meta.cert_lab, cert_number: meta.cert_number },
  })
  if (auditError) {
    console.error('[certificates] Audit write failed after certificate upload for diamond:', meta.diamond_id, auditError)
  }

  // Step 6: best-effort delete of the superseded object.
  cleanUpOldCert(admin, oldPath)

  // Step 7: return signed URL. Include auditWarning when the audit write failed.
  const result = await buildSignedUrl(admin, newPath)
  return auditError ? { ...result, auditWarning: true } : result
}

// Returns a short-lived signed URL for the diamond's certificate PDF.
// Restricted to super_admin and diamond_buyer — sales_adviser must not receive
// a certificate signed URL.
// The audit write is STRICT for viewing: a failed audit prevents URL generation.
// This is different from uploadCertificate — viewing creates a deliberate access
// record that must be durable before the URL is handed out.
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
    action:        'diamond.certificate_viewed',
    entity_type:   'diamond',
    entity_id:     diamondId,
    metadata:      { cert_lab: diamond.cert_lab, cert_number: diamond.cert_number },
  })
  if (auditError) {
    console.error('[certificates] Audit write failed on certificate view for diamond:', diamondId, auditError)
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
