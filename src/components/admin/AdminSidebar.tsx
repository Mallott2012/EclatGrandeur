import Link from 'next/link';

/**
 * Admin navigation. Phase 0 ships placeholders only — the linked modules are
 * not built yet. Each item notes the roles that will guard it in later phases;
 * those modules must call requireStaffRole(...) in their own server code.
 */
interface NavItem {
  label: string;
  href: string;
  /** Whether the destination route exists yet. */
  ready?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', ready: true },
  { label: 'Diamonds', href: '/admin/diamonds' }, // future: super_admin, diamond_buyer
  { label: 'Ring Settings', href: '/admin/ring-settings' }, // future: super_admin, content_editor
  { label: 'Ready Rings', href: '/admin/ready-rings' }, // future: super_admin, content_editor
  { label: 'Enquiries', href: '/admin/enquiries' }, // future: super_admin, sales_adviser
  { label: 'Reservations', href: '/admin/reservations' }, // future: super_admin, sales_adviser
  { label: 'Content', href: '/admin/content' }, // future: super_admin, content_editor
  { label: 'Team', href: '/admin/team' }, // future: super_admin
];

export function AdminSidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-admin-forest text-admin-ivory">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="font-display text-xl leading-none">Éclat Grandeur</p>
        <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.32em] text-admin-gold">
          Staff Console
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-disabled={!item.ready}
            className={[
              'flex items-center justify-between rounded px-3 py-2.5 font-sans text-[11px] uppercase tracking-[0.18em] transition-colors',
              item.ready
                ? 'text-admin-ivory hover:bg-white/5'
                : 'text-admin-ivory/45 hover:bg-white/5',
            ].join(' ')}
          >
            <span>{item.label}</span>
            {!item.ready ? (
              <span className="font-sans text-[8px] tracking-[0.2em] text-admin-gold/70">
                Soon
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-admin-ivory/40">
          Phase 0 · Foundation
        </p>
      </div>
    </aside>
  );
}
