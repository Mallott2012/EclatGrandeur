'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { siteConfig, primaryNav, utilityNav } from '@/config/site';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Close drawer on navigation
  if (typeof window !== 'undefined') {
    // handled via key below
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      {/* Minimal top bar */}
      <div className="flex h-16 items-center bg-[#2c3d2e] px-6">
        {/* Hamburger — left */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawer(true)}
          className="flex items-center text-[#f5f0e8]/80 transition hover:text-[#f5f0e8]"
        >
          <Menu className="h-6 w-6" strokeWidth={1.5} />
        </button>

        {/* Logo — absolutely centred */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-xl font-light tracking-wide text-[#f5f0e8] md:text-2xl"
        >
          {siteConfig.name}
        </Link>
      </div>

      {/* Mobile / full-screen drawer */}
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
      />
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  openAccordion,
  setOpenAccordion,
}: {
  open: boolean;
  onClose: () => void;
  openAccordion: string | null;
  setOpenAccordion: (v: string | null) => void;
}) {
  return (
    <div className={cn('fixed inset-0 z-[90]', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      {/* backdrop */}
      <div
        className={cn('absolute inset-0 bg-black/40 transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-full max-w-xs flex-col bg-[#2c3d2e] transition-transform duration-500 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* drawer header */}
        <div className="flex items-center justify-between border-b border-[#f5f0e8]/10 px-6 py-5">
          <span className="font-display text-xl font-light text-[#f5f0e8]">{siteConfig.name}</span>
          <button aria-label="Close menu" onClick={onClose} className="text-[#f5f0e8]/70 hover:text-[#f5f0e8]">
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* nav items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} className="border-b border-[#f5f0e8]/10">
                  <div className="flex items-center justify-between py-4">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="text-sm font-medium uppercase tracking-widest text-[#f5f0e8]/80 hover:text-[#f5f0e8]"
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        aria-label="Toggle submenu"
                        onClick={() => setOpenAccordion(isOpen ? null : item.label)}
                        className="p-2 text-[#f5f0e8]/50"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <ul className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-96 pb-4' : 'max-h-0')}>
                      {item.children.map((c) => (
                        <li key={`${c.href}-${c.label}`} className="py-2 pl-2">
                          <Link
                            href={c.href}
                            onClick={onClose}
                            className="text-sm text-[#f5f0e8]/50 hover:text-[#f5f0e8]/90"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* utility links */}
        <div className="border-t border-[#f5f0e8]/10 px-6 py-5">
          {utilityNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block py-2 text-[11px] uppercase tracking-widest text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
