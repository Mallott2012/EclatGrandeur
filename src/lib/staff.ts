import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StaffRole, StaffUser } from '@/lib/staff-shared';

// Re-export everything so callers only need to import from '@/lib/staff'.
export type { StaffRole, StaffUser };
export { STAFF_ROLES, STAFF_ROLE_LABELS } from '@/lib/staff-shared';

// ── Server-side helpers ───────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user and their staff roles, or null if
 * the session is absent or invalid.
 *
 * Uses supabase.auth.getUser() which re-validates the JWT with Supabase's
 * Auth server on every call — never trusts client-supplied data.
 */
export async function getCurrentStaffUser(): Promise<StaffUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  // Use the admin client to query staff_roles so this works regardless of
  // whether the RLS session context is fully initialised.
  const adminClient = createAdminClient();
  const { data: roleRows, error: rolesError } = await adminClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id);

  if (rolesError) {
    console.error('[staff] Failed to fetch staff roles:', rolesError.message);
    return null;
  }

  const roles = (roleRows ?? []).map((r) => r.role as StaffRole);

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
    roles,
  };
}

/**
 * Returns the role array for the current authenticated user, or an empty array
 * if there is no session. Does not throw.
 */
export async function getCurrentStaffRoles(): Promise<StaffRole[]> {
  const staffUser = await getCurrentStaffUser();
  return staffUser?.roles ?? [];
}

/**
 * Guard for Server Components and Server Actions.
 *
 * If the current user is not authenticated, or does not hold at least one of
 * the required roles, they are redirected to /admin/login.
 *
 * Pass an empty array to allow any authenticated staff member.
 *
 * @example
 *   // Allow any staff member
 *   const user = await requireStaffRole([]);
 *
 *   // Allow only super_admin
 *   const user = await requireStaffRole(['super_admin']);
 *
 *   // Allow super_admin or diamond_buyer
 *   const user = await requireStaffRole(['super_admin', 'diamond_buyer']);
 */
export async function requireStaffRole(allowedRoles: StaffRole[]): Promise<StaffUser> {
  const staffUser = await getCurrentStaffUser();

  if (!staffUser) {
    redirect('/admin/login');
  }

  if (staffUser.roles.length === 0) {
    redirect('/admin/login?error=no_staff_role');
  }

  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => staffUser.roles.includes(role));
    if (!hasRequiredRole) {
      redirect('/admin/forbidden');
    }
  }

  return staffUser;
}
