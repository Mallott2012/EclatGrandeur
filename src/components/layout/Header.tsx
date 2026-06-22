'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { primaryNav, utilityNav } from '@/config/site';
import { cn } from '@/lib/utils';

const BG   = '#e8e2d4';   // dark ivory white
const TEXT = '#1a2b1a';   // deep forest green

export function Header() {
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <div
        className="flex h-[72px] items-center justify-between px-8 md:px-14"
        style={{ backgroundColor: BG }}
      >
        {/* Hamburger — left */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawer(true)}
          className="transition-opacity hover:opacity-60"
          style={{ color: TEXT }}
        >
          <Menu className="h-5 w-5" strokeWidth={1} />
        </button>

        {/* Logo lockup — centre */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-[3px]">
          <span
            className="font-display tracking-[0.32em] uppercase"
            style={{
              color: TEXT,
              fontSize: 'clamp(13px, 1.5vw, 17px)',
              fontWeight: 300,
              letterSpacing: '0.32em',
            }}
          >
            Éclat Grandeur
          </span>
          <span
            className="font-sans uppercase tracking-[0.45em]"
            style={{
              color: `${TEXT}70`,
              fontSize: '8px',
              fontWeight: 300,
              letterSpacing: '0.45em',
            }}
          >
            Est.&nbsp;1975
          </span>
        </Link>

        {/* Right — invisible spacer to balance the hamburger */}
        <div className="w-5" aria-hidden="true" />
      </div>

      {/* hairline rule */}
      <div style={{ height: '1px', backgroundColor: `${TEXT}14`, position: 'sticky', top: '72px' }} />

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
        className={cn('absolute inset-0 transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
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
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: `1px solid ${TEXT}14` }}
        >
          <div className="flex flex-col gap-[3px]">
            <span
              className="font-display uppercase tracking-[0.32em]"
              style={{ color: TEXT, fontSize: '13px', fontWeight: 300 }}
            >
              Éclat Grandeur
            </span>
            <span
              className="font-sans uppercase tracking-[0.45em]"
              style={{ color: `${TEXT}55`, fontSize: '7px', fontWeight: 300 }}
            >
              Est.&nbsp;1975
            </span>
          </div>
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="transition-opacity hover:opacity-60"
            style={{ color: `${TEXT}70` }}
          >
            <X className="h-4 w-4" strokeWidth={1} />
          </button>
        </div>

        {/* nav items */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} style={{ borderBottom: `1px solid ${TEXT}0e` }}>
                  <div className="flex items-center justify-between py-4">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="font-sans text-[10px] font-light uppercase tracking-[0.3em] transition-opacity hover:opacity-60"
                      style={{ color: `${TEXT}aa` }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        aria-label="Toggle submenu"
                        onClick={() => setOpenAccordion(isOpen ? null : item.label)}
                        className="p-1 transition-opacity hover:opacity-60"
                        style={{ color: `${TEXT}44` }}
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')} strokeWidth={1} />
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <ul className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-96 pb-4' : 'max-h-0')}>
                      {item.children.map((c) => (
                        <li key={`${c.href}-${c.label}`} className="py-2 pl-3">
                          <Link
                            href={c.href}
                            onClick={onClose}
                            className="font-sans text-[9px] uppercase tracking-[0.25em] transition-opacity hover:opacity-70"
                            style={{ color: `${TEXT}44` }}
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
        <div className="px-8 py-5" style={{ borderTop: `1px solid ${TEXT}0e` }}>
          {utilityNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block py-2 font-sans text-[9px] uppercase tracking-[0.35em] transition-opacity hover:opacity-60"
              style={{ color: `${TEXT}38` }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
