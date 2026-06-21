import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { requireStaffRole } from '@/lib/auth/session';
import { ALL_STAFF_ROLES } from '@/lib/auth/roles';

export const metadata: Metadata = {
  title: 'Admin — Éclat Grandeur',
  robots: { index: false, follow: false },
};

/**
 * Admin console shell (route group). This layout wraps every protected /admin
 * page but NOT /admin/login, which lives outside this group.
 *
 * Defence in depth: the middleware blocks unauthenticated users, and this
 * layout independently verifies that the authenticated user holds at least one
 * staff role. Future module routes (e.g. /admin/diamonds) should call
 * requireStaffRole(...) again with their own narrower role set.
 */
export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const { user, roles } = await requireStaffRole(ALL_STAFF_ROLES);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    'Staff member';

  return (
    <div className="flex min-h-screen bg-admin-ivory text-admin-forest">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar displayName={displayName} email={user.email ?? ''} roles={roles} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
