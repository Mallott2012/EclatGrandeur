import type { Metadata } from 'next';
import { requireStaffRole } from '@/lib/staff';
import { STAFF_ROLE_LABELS } from '@/lib/staff';

export const metadata: Metadata = {
  title: 'Dashboard — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const user = await requireStaffRole([]);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl font-light tracking-widest text-white">DASHBOARD</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Welcome back,{' '}
          <span className="text-white">{user.fullName ?? user.email}</span>
        </p>
      </div>

      {/* Role badge */}
      <div className="mb-10 flex flex-wrap gap-2">
        {user.roles.map((role) => (
          <span
            key={role}
            className="rounded-full border border-amber-700/60 bg-amber-900/20 px-3 py-1 text-xs tracking-widest text-amber-400"
          >
            {STAFF_ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {/* Phase 0 status cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard label="Authentication" status="live" detail="Supabase Auth — email + password" />
        <StatusCard label="Profiles" status="live" detail="Auto-created on sign-up" />
        <StatusCard label="Staff Roles" status="live" detail="RLS-protected — super_admin managed" />
        <StatusCard label="Audit Logs" status="live" detail="Service-role append-only" />
        <StatusCard label="Route Protection" status="live" detail="Middleware + layout guard" />
        <StatusCard label="Admin Shell" status="live" detail="Phase 0 complete" />
      </div>

      {/* Phase 1 coming soon */}
      <div className="rounded border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">
          UPCOMING MODULES
        </h2>
        <ul className="space-y-2 text-sm text-neutral-500">
          {[
            'Diamond Inventory — live Supabase table, search & filter',
            'Ring Settings — setting catalogue management',
            'Ready Rings — pre-configured ring management',
            'Enquiries — customer enquiry queue',
            'Reservations — appointment management',
            'Content — collection & product editing',
            'Team — staff member management (super_admin only)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-neutral-700">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'live' | 'pending';
  detail: string;
}) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-neutral-300">{label}</span>
        {status === 'live' ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        ) : (
          <span className="text-xs text-neutral-600">Pending</span>
        )}
      </div>
      <p className="text-xs text-neutral-500">{detail}</p>
    </div>
  );
}
