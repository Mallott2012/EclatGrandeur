import { requireStaffRole } from '@/lib/staff';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffRole([]);

  return (
    <div className="min-h-screen bg-white">
      <AdminNav user={user} />
      {/* pt-[72px] clears the fixed nav bar */}
      <main style={{ paddingTop: 72 }}>{children}</main>
    </div>
  );
}
