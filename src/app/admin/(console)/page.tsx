import { StatusCard } from '@/components/admin/StatusCard';
import { requireStaffRole } from '@/lib/auth/session';
import { ALL_STAFF_ROLES, STAFF_ROLE_LABELS } from '@/lib/auth/roles';

/**
 * Admin dashboard. Re-verifies the staff role server-side (independent of the
 * layout guard) and shows the signed-in user, their role, and foundation
 * status cards.
 */
export default async function AdminDashboardPage() {
  const { user, roles } = await requireStaffRole(ALL_STAFF_ROLES);

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    'Staff member';

  const roleLabels = roles.map((r) => STAFF_ROLE_LABELS[r]).join(', ');

  return (
    <div className="mx-auto max-w-container">
      <div className="mb-8">
        <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-admin-gold">
          Dashboard
        </p>
        <h1 className="mt-2 font-display text-4xl text-admin-forest">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 font-sans text-sm text-admin-forest/60">
          {user.email} · {roleLabels || 'No role assigned'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard title="System" status="System Ready" detail="Phase 0 foundation online." />
        <StatusCard
          title="Authentication"
          status="Active"
          detail="Supabase SSR session verified."
        />
        <StatusCard
          title="Access Level"
          status={roles[0] ? STAFF_ROLE_LABELS[roles[0]] : 'None'}
          detail={
            roles.length > 1
              ? `${roles.length} roles assigned.`
              : 'Primary staff role.'
          }
        />
      </div>

      <div className="mt-10 border border-admin-forest/10 bg-admin-panel p-6">
        <h2 className="font-display text-xl text-admin-forest">Next steps</h2>
        <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-admin-forest/70">
          The foundation is in place: authentication, staff roles, audit logging
          and the protected admin shell. Future modules — Diamonds, Ring
          Settings, Ready Rings, Enquiries, Reservations, Content and Team — will
          attach to this same auth and permissions system via{' '}
          <code className="rounded bg-admin-forest/5 px-1 py-0.5 text-admin-forest">
            requireStaffRole(...)
          </code>
          .
        </p>
      </div>
    </div>
  );
}
