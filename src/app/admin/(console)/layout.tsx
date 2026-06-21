import { requireStaffRole } from '@/lib/staff';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Protected layout for all /admin/* console pages.
 *
 * requireStaffRole([]) is called here as the second layer of defence —
 * middleware redirects unauthenticated users, but this ensures that even if
 * middleware is bypassed the layout itself enforces authentication and a valid
 * staff role before rendering any child page.
 *
 * Every future admin module nested under this layout inherits this protection.
 * Individual pages should call requireStaffRole(['super_admin', ...]) with their
 * specific allowed roles for fine-grained access control.
 */
export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  // Allow any authenticated staff member — page-level guards narrow further.
  const user = await requireStaffRole([]);

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
