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

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/admin',               live: true  },
  { label: 'Ring Settings', href: '/admin/ring-settings', live: true  },
  { label: 'Diamonds',      href: '/admin/diamonds',      live: true  },
  { label: 'Jewellery',     href: '/admin/jewellery',     live: true  },
  { label: 'Enquiries',     href: '/admin/enquiries',     live: true  },
  { label: 'Orders',        href: '/admin/orders',        live: false },
  { label: 'Hero Media',     href: '/admin/hero',           live: true  },
  { label: 'Team',          href: '/admin/team',          live: false },
];

interface Props {
  user: StaffUser;
}

export function AdminSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
      {/* Wordmark */}
      <div className="border-b border-stone-200 px-6 py-5">
        <span className="font-display text-sm font-light tracking-[0.2em] text-stone-900">
          ÉCLAT GRANDEUR
        </span>
        <p className="mt-0.5 text-[10px] tracking-widest text-stone-400">ADMIN</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

            if (!item.live) {
              return (
                <li key={item.href}>
                  <span className="flex items-center justify-between rounded px-3 py-2 text-sm text-stone-400 cursor-not-allowed">
                    {item.label}
                    <span className="text-[10px] tracking-wider text-stone-300">SOON</span>
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
                      ? 'bg-stone-100 text-stone-900 font-medium'
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-stone-200 px-4 py-4">
        <p className="truncate text-xs text-stone-600">{user.fullName ?? user.email}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <span key={role} className="text-[10px] tracking-wider text-amber-700">
              {STAFF_ROLE_LABELS[role]}
            </span>
          ))}
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="text-xs text-stone-400 transition-colors hover:text-stone-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
