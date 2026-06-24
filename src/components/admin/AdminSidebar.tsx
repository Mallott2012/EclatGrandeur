'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/login/actions';
import type { StaffUser } from '@/lib/staff-shared';
import { STAFF_ROLE_LABELS } from '@/lib/staff-shared';

/**
 * Admin sidebar navigation.
 *
 * IMPORTANT: Every future admin module linked from this sidebar must implement
 * its own requireStaffRole([...allowedRoles]) check in the page/layout server
 * component. Do not rely on sidebar visibility alone for access control.
 */

interface NavItem {
  label: string;
  href: string;
  live: boolean;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { items: [{ label: 'Dashboard', href: '/admin', live: true }] },
  {
    heading: 'Rings',
    items: [
      { label: 'Ring Settings', href: '/admin/ring-settings', live: true },
      { label: 'Diamonds',      href: '/admin/diamonds',      live: true },
    ],
  },
  {
    heading: 'Necklaces',
    items: [
      { label: 'Necklace Settings', href: '/admin/necklace-settings', live: true },
      { label: 'Necklace Stones',   href: '/admin/necklace-stones',   live: true },
    ],
  },
  {
    heading: 'Bracelets',
    items: [
      { label: 'Bracelet Settings', href: '/admin/bracelet-settings', live: true },
      { label: 'Bracelet Stones',   href: '/admin/bracelet-stones',   live: true },
    ],
  },
  {
    heading: 'Earrings',
    items: [
      { label: 'Earring Settings', href: '/admin/earring-settings', live: true },
      { label: 'Earring Stones',   href: '/admin/earring-stones',   live: true },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Enquiries', href: '/admin/enquiries', live: false },
      { label: 'Orders',    href: '/admin/orders',    live: false },
      { label: 'Team',      href: '/admin/team',      live: false },
    ],
  },
];

interface Props {
  user: StaffUser;
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
      {/* Wordmark */}
      <div className="border-b border-neutral-800 px-6 py-5">
        <span className="font-display text-sm font-light tracking-[0.2em] text-white">
          ÉCLAT GRANDEUR
        </span>
        <p className="mt-0.5 text-[10px] tracking-widest text-neutral-600">ADMIN</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.heading ?? `group-${gi}`}>
              {group.heading && (
                <p className="px-3 pb-1 text-[10px] font-semibold tracking-widest text-neutral-600">
                  {group.heading.toUpperCase()}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);

                  if (!item.live) {
                    return (
                      <li key={item.href}>
                        <span className="flex items-center justify-between rounded px-3 py-2 text-sm text-neutral-600 cursor-not-allowed">
                          {item.label}
                          <span className="text-[10px] tracking-wider text-neutral-700">SOON</span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex rounded px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-neutral-800 px-4 py-4">
        <p className="truncate text-xs text-neutral-400">{user.fullName ?? user.email}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <span key={role} className="text-[10px] tracking-wider text-amber-600">
              {STAFF_ROLE_LABELS[role]}
            </span>
          ))}
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="text-xs text-neutral-600 transition-colors hover:text-neutral-300"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
