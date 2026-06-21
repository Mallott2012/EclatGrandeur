'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Menu, X } from 'lucide-react';
import { primaryNav, siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { CartButton } from '@/components/cart/CartButton';

export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-ivory/90 backdrop-blur-md">
      <div className="container-luxe flex items-center justify-between py-5">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" strokeWidth={1.25} />
        </button>

        {/* Brand */}
        <Link href="/" className="flex flex-col items-center lg:items-start">
          <span className="font-display text-2xl font-medium leading-none tracking-wide text-ink">
            {siteConfig.name}
          </span>
          <span className="mt-1 hidden text-[9px] uppercase tracking-luxe text-champagne-deep lg:block">
            {siteConfig.tagline}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-8 lg:flex"
          onMouseLeave={() => setActive(null)}
        >
          {primaryNav.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setActive(item.label)}
            >
              <Link
                href={item.href}
                className="link-underline py-2 text-xs uppercase tracking-luxe text-ink/80 hover:text-ink"
              >
                {item.label}
              </Link>
              {item.children && active === item.label && (
                <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-4">
                  <div className="min-w-[220px] border border-ink/10 bg-ivory p-6 shadow-xl">
                    <ul className="flex flex-col gap-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="link-underline text-sm font-light text-ink/80 hover:text-ink"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/appointments"
            className="hidden items-center gap-2 text-xs uppercase tracking-luxe text-ink/80 hover:text-ink lg:flex"
          >
            <Calendar className="h-4 w-4" strokeWidth={1.25} />
            Appointments
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/40 transition-opacity duration-500',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-[85%] max-w-sm bg-ivory p-8 transition-transform duration-500 ease-luxe',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-xl text-ink">{siteConfig.name}</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {primaryNav.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm uppercase tracking-luxe text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mt-3 flex flex-col gap-2 pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="text-sm font-light text-ink/70"
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
