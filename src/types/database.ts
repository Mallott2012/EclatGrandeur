/**
 * Hand-written database types for the Phase 0 foundation tables.
 *
 * When later phases add tables, this file can be replaced by output from
 * `supabase gen types typescript`. For now it is kept minimal and aligned
 * with supabase/migrations.
 */

import type { StaffRole } from '@/lib/auth/roles';

// Note: these are `type` aliases (not interfaces) on purpose — interfaces are
// not assignable to `Record<string, unknown>`, which supabase-js requires for
// its GenericSchema constraint, so using interfaces here would silently make
// the typed client fall back to `never`.
export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffRoleRow = {
  id: string;
  user_id: string;
  role: StaffRole;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      staff_roles: {
        Row: StaffRoleRow;
        Insert: Omit<StaffRoleRow, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<StaffRoleRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<StaffRoleRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, 'id' | 'created_at'> &
          Partial<Pick<AuditLogRow, 'id' | 'created_at'>>;
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_roles: {
        Args: Record<string, never>;
        Returns: { role: StaffRole }[];
      };
    };
    Enums: {
      staff_role: StaffRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
