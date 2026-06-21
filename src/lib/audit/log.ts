import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Audit logging foundation (server-only).
 *
 * Writes are performed with the service-role client because `audit_logs` has no
 * INSERT policy for regular users — logs can only be created through trusted
 * server code. The `import 'server-only'` guard prevents this from ever being
 * bundled into the browser.
 *
 * Future privileged admin actions (role changes, inventory edits, reservation
 * approvals, etc.) should call `writeAuditLog(...)` after performing the action.
 */

export interface AuditLogInput {
  /** The user performing the action (null for system events). */
  actorUserId: string | null;
  /** Machine-readable action key, e.g. 'staff_role.granted'. */
  action: string;
  /** The kind of entity affected, e.g. 'profile', 'staff_role'. */
  entityType?: string | null;
  /** The affected entity's id, if applicable. */
  entityId?: string | null;
  /** Arbitrary structured context. */
  metadata?: Record<string, unknown> | null;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('audit_logs').insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    // Never throw from audit logging into the caller's happy path; surface it
    // in server logs instead so the primary action is not rolled back.
    console.error('[audit] failed to write audit log', { action: input.action, error });
  }
}
