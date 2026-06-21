'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, CalendarDays, ChevronDown } from 'lucide-react';
import { siteConfig, primaryNav, utilityNav, type NavItem } from '@/config/site';
import { getProductBySlug } from '@/lib/data';
import { cn } from '@/lib/utils';
import { CartButton } from '@/components/cart/CartButton';
import { JewelArt } from '@/components/art/JewelArt';
import { AnnouncementBar } from './AnnouncementBar';

/** Representative piece shown in each pillar's mega-menu. */
const MENU_FEATURE: Record<string, { slug: string; line: string }> = {
  Engagement: { slug: 'aurora-solitaire-ring', line: 'The Aurora Solitaire' },
  Earrings: { slug: 'cascade-drop-earrings', line: 'Cascade Drops' },
  Necklaces: { slug: 'sovereign-riviere-necklace', line: 'The Sovereign Rivière' },
  Bracelets: { slug: 'eternelle-tennis-bracelet', line: 'Éternelle Tennis' },
  Bespoke: { slug: 'empress-emerald-ring', line: 'A ring like no other' },
};

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDrawer(false);
    setActive(null);
  }, [pathname]);

  const overlay = pathname === '/' && !scrolled && !active;
  const light = overlay;

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  };

  const activeItem = primaryNav.find((n) => n.label === active);

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <AnnouncementBar />

      <div
        className={cn(
          'transition-colors duration-500 ease-luxe',
          light ? 'bg-transparent' : 'bg-ivory/95 backdrop-blur-md shadow-[0_1px_0_rgba(33,29,24,0.06)]'
        )}
        onMouseLeave={scheduleClose}
      >
        {/* Top row */}
        <div className={cn('container-luxe flex items-center justify-between py-4 md:py-5', light ? 'text-ivory' : 'text-ink')}>
          {/* left */}
          <div className="flex flex-1 items-center gap-6">
            <button
              type="button"
              aria-label="Open menu"
              className="lg:hidden"
              onClick={() => setDrawer(true)}
            >
              <Menu className="h-6 w-6" strokeWidth={1.25} />
            </button>
            <div className="hidden items-center gap-6 lg:flex">
              {utilityNav.slice(0, 2).map((l) => (
                <Link key={l.href} href={l.href} className="link-underline text-[11px] uppercase tracking-luxe opacity-80 hover:opacity-100">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* logo */}
          <Link href="/" className="flex flex-col items-center leading-none">
            <span className="font-display text-2xl font-medium tracking-wide md:text-[28px]">{siteConfig.name}</span>
            <span className={cn('mt-0.5 text-[8px] uppercase tracking-wide2', light ? 'text-ivory/60' : 'text-ink/45')}>
              Maison de Diamants · Est. {siteConfig.founded}
            </span>
          </Link>

          {/* right */}
          <div className="flex flex-1 items-center justify-end gap-5">
            <Link href="/appointments" aria-label="Book an appointment" className="hidden md:inline-flex hover:text-champagne-deep">
              <CalendarDays className="h-5 w-5" strokeWidth={1.25} />
            </Link>
            <button aria-label="Search" className="hidden md:inline-flex hover:text-champagne-deep">
              <Search className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <CartButton light={light} />
          </div>
        </div>

        {/* Nav row (desktop) */}
        <nav className={cn('hidden border-t lg:block', light ? 'border-ivory/15' : 'border-ink/10')}>
          <ul className={cn('container-luxe flex items-center justify-center gap-10 py-3.5', light ? 'text-ivory' : 'text-ink')}>
            {primaryNav.map((item) => (
              <li key={item.label} onMouseEnter={() => openMenu(item.label)}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 text-[12px] uppercase tracking-luxe transition-colors hover:text-champagne-deep',
                    active === item.label && 'text-champagne-deep'
                  )}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mega menu */}
        <MegaMenu item={activeItem} onEnter={() => active && openMenu(active)} onLeave={scheduleClose} />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
      />
    </header>
  );
}

function MegaMenu({
  item,
  onEnter,
  onLeave,
}: {
  item?: NavItem;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const feature = item ? MENU_FEATURE[item.label] : undefined;
  const product = feature ? getProductBySlug(feature.slug) : undefined;

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-full hidden overflow-hidden border-t border-ink/10 bg-ivory text-ink shadow-luxe transition-all duration-300 ease-luxe lg:block',
        item ? 'pointer-events-auto max-h-[420px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
      )}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {item && (
        <div className="container-luxe grid grid-cols-12 gap-10 py-10">
          <div className="col-span-4">
            <span className="eyebrow">{item.label}</span>
            <ul className="mt-5 flex flex-col gap-3.5">
              {item.children?.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="group flex items-baseline justify-between">
                    <span className="font-display text-2xl font-light leading-tight text-ink transition-colors group-hover:text-champagne-deep">
                      {c.label}
                    </span>
                    {c.note && <span className="ml-3 text-[10px] uppercase tracking-luxe text-ink/40">{c.note}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {product && (
            <div className="col-span-8">
              <Link href={`/product/${product.slug}`} className="group grid grid-cols-2 gap-6">
                <div className="aspect-[4/5] overflow-hidden">
                  <JewelArt art={product.art} gid={`menu-${product.slug}`} className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-105" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="eyebrow">Featured</span>
                  <h3 className="mt-2 font-display text-3xl font-light">{product.name}</h3>
                  <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-ink/60">{product.description}</p>
                  <span className="mt-5 text-[11px] uppercase tracking-luxe text-champagne-deep">Discover →</span>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
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
    <div className={cn('fixed inset-0 z-[90] lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-noir/50 transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-full max-w-sm flex-col bg-ivory transition-transform duration-500 ease-luxe',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <span className="font-display text-2xl">{siteConfig.name}</span>
          <button aria-label="Close menu" onClick={onClose}>
            <X className="h-6 w-6" strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} className="border-b border-ink/10">
                  <div className="flex items-center justify-between py-4">
                    <Link href={item.href} onClick={onClose} className="font-display text-2xl font-light">
                      {item.label}
                    </Link>
                    {item.children && (
                      <button
                        aria-label="Toggle submenu"
                        onClick={() => setOpenAccordion(isOpen ? null : item.label)}
                        className="p-2"
                      >
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    )}
                  </div>
                  {item.children && (
                    <ul className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-72 pb-4' : 'max-h-0')}>
                      {item.children.map((c) => (
                        <li key={c.href} className="py-2">
                          <Link href={c.href} onClick={onClose} className="text-sm font-light text-ink/70 hover:text-ink">
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

        <div className="border-t border-ink/10 px-6 py-6">
          {utilityNav.map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="block py-2 text-[11px] uppercase tracking-luxe text-ink/60 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
