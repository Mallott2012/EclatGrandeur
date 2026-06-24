import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ── Writer ────────────────────────────────────────────────────────────────────

/**
 * Appends a record to the audit_logs table via the service-role admin client.
 *
 * Must only be called from server-side code (Server Actions, Route Handlers,
 * Server Components). Never call from a browser client.
 *
 * Failures are logged to the server console but do not throw — audit logging
 * must never break the primary operation being audited.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('audit_logs').insert({
      actor_user_id: entry.actorUserId ?? null,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    });

    if (error) {
      console.error('[audit] Failed to write audit log:', error.message, { entry });
    }
  } catch (err) {
    console.error('[audit] Unexpected error writing audit log:', err, { entry });
  }
}
