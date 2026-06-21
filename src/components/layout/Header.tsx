'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import { CartButton } from '@/components/cart/CartButton';

const primaryLinks = [
  { label: 'Engagement Rings', href: '/engagement-rings' },
  { label: 'Earrings', href: '/jewellery/earrings' },
  { label: 'Necklaces', href: '/jewellery/necklaces' },
  { label: 'Bracelets', href: '/jewellery/bracelets' },
];

const secondaryLinks = [
  { label: 'Create Your Own', href: '/engagement-rings/builder' },
  { label: 'The Diamond Guide', href: '/education' },
  { label: 'Book an Appointment', href: '/appointments' },
  { label: 'Contact', href: '/contact' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Transparent (light text) only at the top of the home page.
  const overlay = pathname === '/' && !scrolled && !open;

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-luxe',
          overlay ? 'bg-transparent' : 'bg-ivory/95 backdrop-blur-md'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between px-6 py-5 md:px-10',
            overlay ? 'text-ivory' : 'text-ink'
          )}
        >
          {/* Hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="flex items-center gap-3"
          >
            <Menu className="h-6 w-6" strokeWidth={1.25} />
            <span className="hidden text-xs uppercase tracking-luxe sm:inline">Menu</span>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-display text-2xl font-medium tracking-wide md:text-3xl"
          >
            {siteConfig.name}
          </Link>

          <CartButton />
        </div>
      </header>

      {/* Slide-down / drawer menu */}
      <div
        className={cn(
          'fixed inset-0 z-[60] transition',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/50 transition-opacity duration-500',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setOpen(false)}
        />
        <nav
          className={cn(
            'absolute left-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory px-10 py-8 transition-transform duration-500 ease-luxe',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="mb-12 flex items-center justify-between">
            <span className="font-display text-2xl text-ink">{siteConfig.name}</span>
            <button aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-6 w-6" strokeWidth={1.25} />
            </button>
          </div>

          <ul className="flex flex-col gap-6">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-3xl font-light text-ink transition-colors hover:text-champagne-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-auto flex flex-col gap-4 border-t border-ink/10 pt-8">
            {secondaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-luxe text-ink/70 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
