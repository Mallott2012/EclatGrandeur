'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronDown } from 'lucide-react';
import { primaryNav, utilityNav } from '@/config/site';
import { cn } from '@/lib/utils';

const THEMES = {
  ivory: { bg: '#ede7d9', text: '#1a2b1a' },
  white: { bg: '#ffffff', text: '#1a2b1a' },
};

interface HeaderProps { theme?: 'ivory' | 'white'; }

export function Header({ theme = 'ivory' }: HeaderProps) {
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const BG   = THEMES[theme].bg;
  const TEXT = THEMES[theme].text;

  return (
    <header className="fixed inset-x-0 top-0 z-[70]" style={{ backgroundColor: BG, borderBottom: theme === 'white' ? '1px solid #f0f0f0' : 'none' }}>
      <div className="relative flex h-20 items-center px-8 md:px-16">

        {/* Hamburger — left */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawer(true)}
          className="flex flex-col gap-[5px] transition-opacity hover:opacity-50"
        >
          <span className="block h-px w-6" style={{ backgroundColor: TEXT }} />
          <span className="block h-px w-6" style={{ backgroundColor: TEXT }} />
          <span className="block h-px w-4" style={{ backgroundColor: TEXT }} />
        </button>

        {/* Wordmark — centred absolutely */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-4 whitespace-nowrap"
        >
          <span
            className="font-display"
            style={{
              color: TEXT,
              fontSize: 'clamp(20px, 2.2vw, 30px)',
              fontWeight: 300,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Éclat Grandeur
          </span>
          {/* thin vertical rule */}
          <span
            className="self-stretch"
            style={{ width: '1px', backgroundColor: `${TEXT}30`, margin: '2px 0' }}
            aria-hidden="true"
          />
          <span
            className="font-sans"
            style={{
              color: `${TEXT}55`,
              fontSize: 'clamp(8px, 0.65vw, 10px)',
              fontWeight: 300,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
            }}
          >
            Est.&nbsp;1975
          </span>
        </Link>

        {/* Right spacer — mirrors hamburger width */}
        <div className="ml-auto w-6" aria-hidden="true" />
      </div>

      {/* hairline — only on ivory theme */}
      {theme === 'ivory' && <div style={{ height: '1px', backgroundColor: `${TEXT}12` }} />}

      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        bg={BG}
        text={TEXT}
      />
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  openAccordion,
  setOpenAccordion,
  bg: BG,
  text: TEXT,
}: {
  open: boolean;
  onClose: () => void;
  openAccordion: string | null;
  setOpenAccordion: (v: string | null) => void;
  bg: string;
  text: string;
}) {
  return (
    <div className={cn('fixed inset-0 z-[90]', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      {/* backdrop */}
      <div
        className={cn('absolute inset-0 transition-opacity duration-700', open ? 'opacity-100' : 'opacity-0')}
        style={{ backgroundColor: 'rgba(10,18,10,0.5)' }}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-80 flex-col transition-transform duration-500 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: BG }}
      >
        {/* drawer header */}
        <div
          className="flex items-center justify-between px-8 py-7"
          style={{ borderBottom: `1px solid ${TEXT}12` }}
        >
          <div className="flex items-baseline gap-3">
            <span
              className="font-display uppercase"
              style={{ color: TEXT, fontSize: '15px', fontWeight: 300, letterSpacing: '0.22em' }}
            >
              Éclat Grandeur
            </span>
            <span
              className="font-sans uppercase"
              style={{ color: `${TEXT}45`, fontSize: '8px', fontWeight: 300, letterSpacing: '0.35em' }}
            >
              Est.&nbsp;1975
            </span>
          </div>
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="transition-opacity hover:opacity-50"
            style={{ color: `${TEXT}60` }}
          >
            <X className="h-4 w-4" strokeWidth={1} />
          </button>
        </div>

        {/* nav */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} style={{ borderBottom: `1px solid ${TEXT}0c` }}>
                  <div className="flex items-center justify-between py-4">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="font-display italic transition-opacity hover:opacity-50"
                      style={{ color: TEXT, fontSize: '18px', fontWeight: 300, letterSpacing: '0.04em' }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        aria-label="Toggle"
                        onClick={() => setOpenAccordion(isOpen ? null : item.label)}
                        className="transition-opacity hover:opacity-50"
                        style={{ color: `${TEXT}40` }}
                      >
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')}
                          strokeWidth={1}
                        />
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
                            className="font-sans uppercase transition-opacity hover:opacity-60"
                            style={{ color: `${TEXT}50`, fontSize: '9px', letterSpacing: '0.28em', fontWeight: 300 }}
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

        {/* utility */}
        <div className="px-8 py-6" style={{ borderTop: `1px solid ${TEXT}0c` }}>
          {utilityNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block py-2 font-sans uppercase transition-opacity hover:opacity-60"
              style={{ color: `${TEXT}35`, fontSize: '9px', letterSpacing: '0.35em', fontWeight: 300 }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
