'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { siteConfig, primaryNav, utilityNav } from '@/config/site';
import { cn } from '@/lib/utils';

// Deep forest green from the live eclatgrandeur.com/landing site
const BG   = '#162218';
const TEXT = '#f0ece0';

export function Header() {
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <div
        className="flex h-16 items-center justify-between px-6 md:px-10"
        style={{ backgroundColor: BG }}
      >
        {/* Left — logo */}
        <Link href="/" className="flex items-baseline gap-3">
          <span
            className="font-display text-sm font-light uppercase tracking-[0.25em] md:text-base"
            style={{ color: TEXT }}
          >
            Éclat Grandeur
          </span>
        </Link>

        {/* Right — EST. 1975 + hamburger */}
        <div className="flex items-center gap-6">
          <span
            className="hidden font-sans text-[10px] font-light uppercase tracking-[0.3em] md:block"
            style={{ color: `${TEXT}99` }}
          >
            Est. 1975
          </span>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className="transition hover:opacity-70"
            style={{ color: TEXT }}
          >
            <Menu className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>
      </div>

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
        className={cn('absolute inset-0 bg-black/50 transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-full max-w-xs flex-col transition-transform duration-500 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: BG }}
      >
        {/* drawer header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${TEXT}18` }}
        >
          <span
            className="font-display text-sm font-light uppercase tracking-[0.25em]"
            style={{ color: TEXT }}
          >
            Éclat Grandeur
          </span>
          <button aria-label="Close menu" onClick={onClose} style={{ color: `${TEXT}80` }}>
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        {/* nav items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} style={{ borderBottom: `1px solid ${TEXT}12` }}>
                  <div className="flex items-center justify-between py-4">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="text-xs font-light uppercase tracking-[0.2em] transition hover:opacity-70"
                      style={{ color: `${TEXT}cc` }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        aria-label="Toggle submenu"
                        onClick={() => setOpenAccordion(isOpen ? null : item.label)}
                        className="p-2"
                        style={{ color: `${TEXT}50` }}
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
                            className="text-xs transition hover:opacity-80"
                            style={{ color: `${TEXT}55` }}
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
        <div className="px-6 py-5" style={{ borderTop: `1px solid ${TEXT}12` }}>
          {utilityNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block py-2 text-[10px] uppercase tracking-[0.25em] transition hover:opacity-70"
              style={{ color: `${TEXT}44` }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
