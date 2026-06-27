'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/login/actions';
import type { StaffUser } from '@/lib/staff-shared';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface NavItem {
  label:    string;
  href:     string;
  exact?:   boolean;
  soon?:    boolean; // greyed out — placeholder
}

const NAV: NavItem[] = [
  // Overview
  { label: 'Dashboard',        href: '/admin',                    exact: true },
  // Catalogue
  { label: 'Rings',            href: '/admin/rings'              },
  { label: 'Necklaces',        href: '/admin/necklaces'          },
  { label: 'Bracelets',        href: '/admin/bracelets'          },
  { label: 'Earrings',         href: '/admin/earrings'           },
  // Earring pairs
  { label: 'Diamond Pairs',    href: '/admin/diamond-pairs'      },
  // Client & commerce
  { label: 'Enquiries',        href: '/admin/enquiries'          },
  { label: 'Orders',           href: '/admin/orders',   soon: true },
  { label: 'Clients',          href: '/admin/clients',  soon: true },
  { label: 'Sales',            href: '/admin/sales',    soon: true },
  // Content & comms
  { label: 'Homepage',         href: '/admin/homepage'           },
  { label: 'Communications',   href: '/admin/communications',    soon: true },
  { label: 'Email Templates',  href: '/admin/email-templates',   soon: true },
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

      {/* Nav — scrollable on smaller screens */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
        {NAV.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="font-sans px-2.5 py-1.5 flex-shrink-0 flex items-center gap-1 transition-colors"
              style={{
                fontSize: 10,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: isActive ? G : item.soon ? '#d0d0d0' : '#999',
                fontWeight: isActive ? 500 : 300,
                borderBottom: isActive ? `1px solid ${G}` : '1px solid transparent',
              }}
            >
              {item.label}
              {item.soon && (
                <span
                  className="font-sans uppercase"
                  style={{ fontSize: 7, letterSpacing: '0.15em', color: '#ccc', marginTop: 1 }}
                >
                  soon
                </span>
              )}
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
