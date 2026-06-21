import { signOut } from '@/app/admin/login/actions';
import { STAFF_ROLE_LABELS, type StaffRole } from '@/lib/auth/roles';

interface AdminTopbarProps {
  displayName: string;
  email: string;
  roles: StaffRole[];
}

export function AdminTopbar({ displayName, email, roles }: AdminTopbarProps) {
  const primaryRole = roles[0];

  return (
    <header className="flex items-center justify-between border-b border-admin-forest/10 bg-admin-panel px-8 py-4">
      <div>
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-admin-forest/50">
          Signed in as
        </p>
        <p className="font-display text-lg text-admin-forest">{displayName}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="font-sans text-xs text-admin-forest/60">{email}</p>
          {primaryRole ? (
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-admin-gold">
              {STAFF_ROLE_LABELS[primaryRole]}
              {roles.length > 1 ? ` +${roles.length - 1}` : ''}
            </p>
          ) : null}
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="border border-admin-forest/20 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.2em] text-admin-forest transition-colors hover:bg-admin-forest hover:text-admin-ivory"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
