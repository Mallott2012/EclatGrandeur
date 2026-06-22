'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, User, ChevronDown } from 'lucide-react';
import { siteConfig, primaryNav, utilityNav, type NavItem } from '@/config/site';
import { getProductBySlug } from '@/lib/data';
import { cn } from '@/lib/utils';
import { CartButton } from '@/components/cart/CartButton';
import { JewelArt } from '@/components/art/JewelArt';
import { AnnouncementBar } from './AnnouncementBar';

/** Representative piece shown in each pillar's mega-menu. */
const MENU_FEATURE: Record<string, { slug: string; line: string }> = {
  'Engagement Rings': { slug: 'aurora-solitaire-ring', line: 'The Aurora Solitaire' },
  Diamonds: { slug: 'aurora-solitaire-ring', line: 'Build your own ring' },
  Jewelry: { slug: 'cascade-drop-earrings', line: 'Cascade Drops' },
  Gifts: { slug: 'sovereign-riviere-necklace', line: 'The Sovereign Rivière' },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDrawer(false);
    setActive(null);
  }, [pathname]);

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActive(label);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/diamonds');
  };

  const activeItem = primaryNav.find((n) => n.label === active);

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <AnnouncementBar />

      <div
        className="bg-white text-ink shadow-[0_1px_0_rgba(19,40,60,0.08)]"
        onMouseLeave={scheduleClose}
      >
        {/* Top row */}
        <div className="container-luxe flex items-center gap-6 py-4">
          {/* left: mobile menu + logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open menu"
              className="lg:hidden"
              onClick={() => setDrawer(true)}
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <Link href="/" className="flex flex-col leading-none">
              <span className="font-display text-2xl font-bold tracking-tight text-noir md:text-[26px]">
                {siteConfig.name}
              </span>
              <span className="hidden text-[8px] uppercase tracking-wide2 text-ink/45 md:block">
                {siteConfig.tagline}
              </span>
            </Link>
          </div>

          {/* center: search */}
          <form
            onSubmit={onSearch}
            className="ml-auto hidden max-w-md flex-1 items-center gap-2 rounded-full border border-ink/15 bg-ivory-warm px-4 py-2 focus-within:border-champagne md:flex"
          >
            <Search className="h-4 w-4 text-ink/40" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search diamonds, rings, jewelry…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </form>

          {/* right: account + cart */}
          <div className="ml-auto flex items-center gap-5 md:ml-0">
            <button
              aria-label="Search"
              className="hover:text-champagne-deep md:hidden"
              onClick={() => router.push('/diamonds')}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Link
              href="/appointments"
              aria-label="Account"
              className="hidden hover:text-champagne-deep md:inline-flex"
            >
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>
            <CartButton light={false} />
          </div>
        </div>

        {/* Nav row (desktop) */}
        <nav className="hidden border-t border-ink/10 lg:block">
          <ul className="container-luxe flex items-center justify-center gap-9 py-3">
            {primaryNav.map((item) => (
              <li key={item.label} onMouseEnter={() => openMenu(item.label)}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 text-[13px] font-semibold uppercase tracking-luxe transition-colors hover:text-champagne-deep',
                    active === item.label ? 'text-champagne-deep' : 'text-noir'
                  )}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={2} />}
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
        'absolute inset-x-0 top-full hidden overflow-hidden border-t border-ink/10 bg-white text-ink shadow-luxe transition-all duration-300 ease-luxe lg:block',
        item ? 'pointer-events-auto max-h-[440px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
      )}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {item && (
        <div className="container-luxe grid grid-cols-12 gap-10 py-10">
          <div className="col-span-4">
            <span className="eyebrow">{item.label}</span>
            <ul className="mt-5 flex flex-col gap-3">
              {item.children?.map((c) => (
                <li key={`${c.href}-${c.label}`}>
                  <Link href={c.href} className="group flex items-baseline justify-between">
                    <span className="text-base font-medium text-ink transition-colors group-hover:text-champagne-deep">
                      {c.label}
                    </span>
                    {c.note && (
                      <span className="ml-3 text-[10px] font-semibold uppercase tracking-luxe text-champagne-deep">
                        {c.note}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {product && (
            <div className="col-span-8">
              <Link href={`/product/${product.slug}`} className="group grid grid-cols-2 gap-6">
                <div className="aspect-[4/5] overflow-hidden rounded-lg bg-ivory-warm">
                  <JewelArt
                    art={product.art}
                    gid={`menu-${product.slug}`}
                    className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="eyebrow">Featured</span>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-noir">{product.name}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/60">{product.description}</p>
                  <span className="mt-5 text-[12px] font-semibold uppercase tracking-luxe text-champagne-deep">
                    Discover →
                  </span>
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
          'absolute left-0 top-0 flex h-full w-full max-w-sm flex-col bg-white transition-transform duration-500 ease-luxe',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <span className="font-display text-2xl font-bold text-noir">{siteConfig.name}</span>
          <button aria-label="Close menu" onClick={onClose}>
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const isOpen = openAccordion === item.label;
              return (
                <li key={item.label} className="border-b border-ink/10">
                  <div className="flex items-center justify-between py-4">
                    <Link href={item.href} onClick={onClose} className="text-base font-semibold text-noir">
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
                    <ul className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-96 pb-4' : 'max-h-0')}>
                      {item.children.map((c) => (
                        <li key={`${c.href}-${c.label}`} className="py-2">
                          <Link href={c.href} onClick={onClose} className="text-sm text-ink/70 hover:text-champagne-deep">
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
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="block py-2 text-[12px] font-semibold uppercase tracking-luxe text-ink/60 hover:text-champagne-deep"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
