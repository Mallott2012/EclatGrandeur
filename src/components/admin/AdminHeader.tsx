'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/login/actions';
import type { StaffUser } from '@/lib/staff-shared';

const G = '#1a2b1a';

const NAV_ITEMS = [
  { label: 'Ring Settings', href: '/admin/ring-settings', live: true  },
  { label: 'Diamonds',      href: '/admin/diamonds',      live: true  },
  { label: 'Jewellery',     href: '/admin/jewellery',     live: true  },
  { label: 'Enquiries',     href: '/admin/enquiries',     live: true  },
  { label: 'Hero Media',    href: '/admin/hero',          live: true  },
];

interface Props { user: StaffUser }

export function AdminHeader({ user }: Props) {
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-[70] bg-white"
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      <div className="relative flex h-20 items-center px-8 md:px-16">

        {/* Wordmark — centred absolutely, same as frontend */}
        <Link
          href="/admin"
          className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-4 whitespace-nowrap"
        >
          <span
            className="font-display uppercase"
            style={{
              color: G,
              fontSize: 'clamp(20px, 2.2vw, 30px)',
              fontWeight: 300,
              letterSpacing: '0.22em',
            }}
          >
            Éclat Grandeur
          </span>
          <span
            className="self-stretch"
            style={{ width: '1px', backgroundColor: `${G}30`, margin: '2px 0' }}
            aria-hidden="true"
          />
          <span
            className="font-sans uppercase"
            style={{
              color: `${G}55`,
              fontSize: 'clamp(8px, 0.65vw, 10px)',
              fontWeight: 300,
              letterSpacing: '0.35em',
            }}
          >
            Admin
          </span>
        </Link>

        {/* Right — admin nav links + sign out */}
        <div className="ml-auto flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="font-sans uppercase transition-opacity hover:opacity-50"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.25em',
                  color: isActive ? G : `${G}70`,
                  fontWeight: isActive ? 500 : 300,
                  textDecoration: isActive ? 'underline' : 'none',
                  textUnderlineOffset: '4px',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Divider */}
          <span style={{ width: '1px', height: 14, backgroundColor: `${G}20` }} aria-hidden="true" />

          {/* User + sign out */}
          <span
            className="font-sans uppercase"
            style={{ fontSize: 9, letterSpacing: '0.2em', color: `${G}45`, fontWeight: 300 }}
          >
            {user.email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="font-sans uppercase transition-opacity hover:opacity-50"
              style={{ fontSize: 9, letterSpacing: '0.25em', color: `${G}55`, fontWeight: 300 }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* hairline */}
      <div style={{ height: '1px', backgroundColor: `${G}08` }} />
    </header>
  );
}
