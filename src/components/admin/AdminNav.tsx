'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/login/actions';
import type { StaffUser } from '@/lib/staff-shared';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const NAV: { label: string; href: string }[] = [
  { label: 'Rings',      href: '/admin/rings'     },
  { label: 'Necklaces',  href: '/admin/necklaces' },
  { label: 'Bracelets',  href: '/admin/bracelets' },
  { label: 'Earrings',   href: '/admin/earrings'  },
  { label: 'Diamonds',   href: '/admin/diamonds'  },
  { label: 'Enquiries',  href: '/admin/enquiries' },
];

export function AdminNav({ user }: { user: StaffUser }) {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white flex items-center px-8 lg:px-14"
      style={{ height: 72, borderBottom: `1px solid ${BORDER}` }}
    >
      {/* Wordmark */}
      <Link
        href="/admin"
        className="font-display flex-shrink-0 mr-10"
        style={{ fontSize: 14, fontWeight: 300, letterSpacing: '0.22em', color: G, textTransform: 'uppercase' }}
      >
        Éclat Grandeur
        <span
          className="font-sans ml-2"
          style={{ fontSize: 9, letterSpacing: '0.3em', color: '#aaa', textTransform: 'uppercase', verticalAlign: 'middle' }}
        >
          Admin
        </span>
      </Link>

      {/* Category nav — centre */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV.map(item => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans px-3 py-1.5 transition-colors"
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isActive ? G : '#999',
                fontWeight: isActive ? 500 : 300,
                borderBottom: isActive ? `1px solid ${G}` : '1px solid transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out — right */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <span className="font-sans hidden lg:block" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.04em' }}>
          {user.fullName ?? user.email}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="font-sans uppercase transition-opacity hover:opacity-60"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: '#aaa' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
