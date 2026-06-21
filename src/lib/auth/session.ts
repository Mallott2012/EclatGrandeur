import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isStaffRole, type StaffRole } from '@/lib/auth/roles';

/**
 * Server-side session & authorisation helpers.
 *
 * These are the single source of truth for "who is signed in and what may they
 * do". Every privileged Server Component, Server Action and Route Handler must
 * call `requireStaffRole(...)` itself — never rely on hidden UI alone.
 */

/** Returns the current authenticated user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the staff roles for the current user.
 *
 * Uses the `get_my_roles()` SECURITY DEFINER function, which lets a user read
 * ONLY their own role rows without any permissive RLS policy on `staff_roles`
 * and without routing the request through the service-role key.
 */
export async function getStaffRoles(): Promise<StaffRole[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_my_roles');
  if (error || !data) return [];
  return data.map((r) => r.role).filter(isStaffRole);
}

export interface StaffSession {
  user: User;
  roles: StaffRole[];
}

/**
 * Guard for staff-only server code.
 *
 * - Redirects to /admin/login if not authenticated.
 * - Redirects to /admin/login?error=forbidden if the user holds none of the
 *   `allowedRoles`.
 *
 * Returns the verified user + their roles on success.
 */
export async function requireStaffRole(
  allowedRoles: StaffRole[],
): Promise<StaffSession> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/admin/login');
  }

  const roles = await getStaffRoles();
  const permitted = roles.some((role) => allowedRoles.includes(role));
  if (!permitted) {
    redirect('/admin/login?error=forbidden');
  }

  return { user, roles };
}
