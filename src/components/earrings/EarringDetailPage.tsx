'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Heart } from 'lucide-react';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { useCart } from '@/lib/store/cart';
import { validateAndReserveEarringVariant } from '@/app/earrings/[slug]/actions';
import { buildEarringCartLineId, clarityLabel } from '@/lib/earrings/cart-helpers';
import { trackEvent } from '@/lib/analytics';
import { METAL_DISPLAY, EMPTY_GALLERY, variantToGalleryData } from '@/lib/gallery/types';
import type { GalleryData, MetalVariant, MetalKey } from '@/lib/gallery/types';
import type { JewelleryDetailConfig } from '@/components/jewellery/JewelleryDetailPage';
import type { PublicEarringVariant } from '@/lib/earrings/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const VARIANT_SWATCHES: Record<string, string> = {
  'platinum':        '#d0d0d0',
  'white-gold-18k':  '#c8c8c8',
  'yellow-gold-18k': '#c9a84c',
  'rose-gold-14k':   '#c47d68',
};

const CLARITY_ORDER = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];

const fetcher = (url: string): Promise<PublicEarringVariant[]> =>
  fetch(url).then(r => r.json()).then(d => Array.isArray(d?.variants) ? d.variants : []);

export interface EarringDetailPageProps {
  productId:          string;
  productSlug:        string;
  productName:        string;
  productSubtitle:    string;
  productDescription: string;
  earringType:        string;
  /** Short fixed-design note (e.g. halo) — shown only when provided by real product data. */
  fixedDesignNote:    string | null;
  galleryConfig:      GalleryData;
  metalVariants:      MetalVariant[] | null;
  config:             JewelleryDetailConfig;
}

type AddState = 'idle' | 'reserving' | 'success' | 'error';

export function EarringDetailPage({
  productId, productSlug, productName, productSubtitle, productDescription,
  fixedDesignNote, galleryConfig, metalVariants, config,
}: EarringDetailPageProps) {
  const { add: addToCart, cartToken, setOpen: setCartOpen } = useCart();

  const { data: variants = [], isLoading } = useSWR<PublicEarringVariant[]>(
    `/api/earrings/${productId}/variants`, fetcher, { revalidateOnFocus: false },
  );

  // ── Selection state ───────────────────────────────────────────────────────────
  const [metal,   setMetal]   = useState<string | null>(null);
  const [carat,   setCarat]   = useState<number | null>(null);
  const [colour,  setColour]  = useState<string | null>(null);
  const [clarity, setClarity] = useState<string | null>(null);
  const [metalOpen, setMetalOpen] = useState(false);
  const [addState, setAddState] = useState<AddState>('idle');
  const [addError, setAddError] = useState<string | null>(null);

  // ── Option derivation (only genuinely configured combinations) ─────────────────
  const metals = useMemo(
    () => [...new Set(variants.map(v => v.metal))],
    [variants],
  );
  const carats = useMemo(
    () => [...new Set(variants.filter(v => v.metal === metal).map(v => v.total_carat))].sort((a, b) => a - b),
    [variants, metal],
  );
  const colours = useMemo(
    () => [...new Set(variants.filter(v => v.metal === metal && v.total_carat === carat).map(v => v.colour))]
            .sort((a, b) => 'DEF'.indexOf(a) - 'DEF'.indexOf(b)),
    [variants, metal, carat],
  );
  const clarities = useMemo(
    () => [...new Set(variants.filter(v => v.metal === metal && v.total_carat === carat && v.colour === colour).map(v => v.clarity))]
            .sort((a, b) => CLARITY_ORDER.indexOf(a) - CLARITY_ORDER.indexOf(b)),
    [variants, metal, carat, colour],
  );

  // Default the metal once variants arrive.
  useEffect(() => {
    if (metal === null && metals.length > 0) setMetal(metals[0]);
  }, [metals, metal]);

  // Clear invalid downstream selections when an upstream option changes.
  useEffect(() => { if (carat !== null && !carats.includes(carat)) { setCarat(null); setColour(null); setClarity(null); } }, [carats, carat]);
  useEffect(() => { if (colour !== null && !(colours as string[]).includes(colour)) { setColour(null); setClarity(null); } }, [colours, colour]);
  useEffect(() => { if (clarity !== null && !(clarities as string[]).includes(clarity)) setClarity(null); }, [clarities, clarity]);

  const selectedVariant = useMemo(
    () => variants.find(v => v.metal === metal && v.total_carat === carat && v.colour === colour && v.clarity === clarity) ?? null,
    [variants, metal, carat, colour, clarity],
  );

  function resetAdd() { setAddState('idle'); setAddError(null); }

  // ── Metal / gallery ────────────────────────────────────────────────────────────
  const activeVariant  = metal ? metalVariants?.find(v => v.metal === metal) ?? null : null;
  const effectiveGallery = activeVariant ? variantToGalleryData(activeVariant) : (galleryConfig ?? EMPTY_GALLERY);
  const metalLabel  = metal ? (METAL_DISPLAY[metal as MetalKey] ?? metal) : 'Select metal';
  const metalSwatch = metal ? (VARIANT_SWATCHES[metal] ?? '#d0d0d0') : '#d0d0d0';

  // ── Price / availability ───────────────────────────────────────────────────────
  const priceLabel = selectedVariant
    ? `£${selectedVariant.price_gbp.toLocaleString('en-GB')}`
    : variants.length > 0
      ? `From £${Math.min(...variants.map(v => v.price_gbp)).toLocaleString('en-GB')}`
      : '';
  const isMadeToOrder = selectedVariant?.availability === 'made_to_order';

  // ── Add to Bag ─────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!selectedVariant || addState === 'reserving') return;
    setAddState('reserving'); setAddError(null);
    trackEvent('earring_add_to_bag_initiated', { productId });

    const result = await validateAndReserveEarringVariant(productId, selectedVariant.id, cartToken);
    if (!result.ok) {
      setAddState('error'); setAddError(result.error);
      trackEvent('earring_reservation_failed', { productId });
      return;
    }
    const { earring } = result;
    addToCart({
      id:    buildEarringCartLineId(productId, earring.variantId),
      name:  earring.productName,
      href:  `${config.categoryPath}/${productSlug}`,
      price: { amount: earring.totalPrice, currency: 'GBP' },
      meta:  earring.metalLabel,
      art:   { kind: 'stud-earrings', shape: 'round', metal: 'platinum' },
      earringConfig: earring,
    });
    setAddState('success');
    trackEvent('earring_added_to_bag', { productId });
  }

  // ── Shortlist ──────────────────────────────────────────────────────────────────
  const { toggle, has } = useShortlist();
  const shortlistId   = `${config.categoryPath.replace('/', '')}-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  const isShortlisted = has(shortlistId);
  function buildShortlistItem(): ShortlistItem {
    return {
      id: shortlistId, category: config.categoryLabel, name: productName, subtitle: productSubtitle,
      image: effectiveGallery.topLeft?.url ?? '', href: `${config.categoryPath}/${productSlug}`,
      metal: metalLabel, basePrice: variants.length ? Math.min(...variants.map(v => v.price_gbp)) : 0,
      totalPrice: selectedVariant?.price_gbp ?? 0, savedAt: Date.now(),
    };
  }

  const Step = ({ n, label }: { n: number; label: string }) => (
    <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
      <span style={{ color: '#cbb78a' }}>{n}.</span> {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <Link href={config.categoryPath} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{config.categoryLabel}</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{productName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row">
        {/* LEFT — gallery */}
        <div className="lg:w-[58%] lg:sticky lg:top-[80px]" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}>
          <ProductGallery data={effectiveGallery} />
        </div>

        {/* RIGHT — configurator */}
        <div className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col">
          <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}>{productName}</h1>
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>{productSubtitle}</p>
            <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>{priceLabel}</p>
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* 1. METAL */}
          <button type="button" onClick={() => setMetalOpen(v => !v)} className="flex items-center justify-between w-full py-4 text-left" style={{ borderBottom: metalOpen ? 'none' : `1px solid ${BORDER}` }}>
            <Step n={1} label="Metal" />
            <span className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: metalSwatch, border: '1px solid #ddd' }} />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>{metalLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#bbb', transform: metalOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} strokeWidth={1.5} />
            </span>
          </button>
          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {metals.map(m => {
                const active = m === metal;
                return (
                  <button key={m} type="button" onClick={() => { setMetal(m); setMetalOpen(false); resetAdd(); }}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                    style={{ fontSize: 13, color: active ? G : '#666', fontWeight: active ? 400 : 300, backgroundColor: active ? '#f9f9f9' : 'transparent' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: VARIANT_SWATCHES[m] ?? '#d0d0d0', border: '1px solid #ddd' }} />
                    {METAL_DISPLAY[m as MetalKey] ?? m}
                    {active && <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}>Selected</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. TOTAL CARAT WEIGHT */}
          <div className="py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Step n={2} label="Total Carat Weight" />
            <div className="flex flex-wrap gap-2 mt-3">
              {carats.map(ct => {
                const active = ct === carat;
                return (
                  <button key={ct} type="button" onClick={() => { setCarat(ct); resetAdd(); }}
                    className="font-sans" style={{ fontSize: 12, padding: '8px 14px', border: `1px solid ${active ? G : BORDER}`, color: active ? '#fff' : G, backgroundColor: active ? G : '#fff' }}>
                    {ct.toFixed(2)}ct
                  </button>
                );
              })}
              {carats.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select a metal first</span>}
            </div>
          </div>

          {/* 3. COLOUR */}
          <div className="py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Step n={3} label="Colour" />
            <div className="flex flex-wrap gap-2 mt-3">
              {colours.map(c => {
                const active = c === colour;
                return (
                  <button key={c} type="button" onClick={() => { setColour(c); resetAdd(); }}
                    className="font-sans" style={{ fontSize: 12, width: 44, padding: '8px 0', border: `1px solid ${active ? G : BORDER}`, color: active ? '#fff' : G, backgroundColor: active ? G : '#fff' }}>
                    {c}
                  </button>
                );
              })}
              {colours.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select carat weight</span>}
            </div>
          </div>

          {/* 4. CLARITY */}
          <div className="py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <Step n={4} label="Clarity" />
            <div className="flex flex-wrap gap-2 mt-3">
              {clarities.map(cl => {
                const active = cl === clarity;
                return (
                  <button key={cl} type="button" onClick={() => { setClarity(cl); resetAdd(); }}
                    className="font-sans" style={{ fontSize: 12, padding: '8px 14px', border: `1px solid ${active ? G : BORDER}`, color: active ? '#fff' : G, backgroundColor: active ? G : '#fff' }}>
                    {clarityLabel(cl)}
                  </button>
                );
              })}
              {clarities.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select colour</span>}
            </div>
          </div>

          {/* Fixed design note (e.g. halo) — only when supplied by real product data */}
          {fixedDesignNote && (
            <p className="font-sans mt-5" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', lineHeight: 1.6 }}>{fixedDesignNote}</p>
          )}

          {/* YOUR EARRINGS */}
          {selectedVariant && (
            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>Your Earrings</p>
              {([
                ['Metal', metalLabel],
                ['Total carat', `${selectedVariant.total_carat.toFixed(2)}ct`],
                ['Colour', selectedVariant.colour],
                ['Clarity', clarityLabel(selectedVariant.clarity)],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>{k}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#999' }}>Total</span>
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>£{selectedVariant.price_gbp.toLocaleString('en-GB')}</span>
              </div>
              {isMadeToOrder && (
                <p className="font-sans mt-3 text-center" style={{ fontSize: 11, color: '#b08d57', letterSpacing: '0.04em' }}>Available to order · crafted for you</p>
              )}

              {addError && <p className="font-sans mt-4 text-center" style={{ fontSize: 11, color: '#c0392b', lineHeight: 1.5 }}>{addError}</p>}
              <button type="button" onClick={addState === 'success' ? () => setCartOpen(true) : handleAdd} disabled={addState === 'reserving'}
                className="w-full font-sans uppercase mt-6 py-4"
                style={{ fontSize: 11, letterSpacing: '0.28em', color: '#fff', cursor: addState === 'reserving' ? 'not-allowed' : 'pointer',
                  backgroundColor: addState === 'success' ? '#4a9e6b' : addState === 'reserving' ? '#888' : G }}>
                {addState === 'idle'      && 'Add to Bag'}
                {addState === 'reserving' && 'Reserving your selection…'}
                {addState === 'success'   && 'Added to Bag'}
                {addState === 'error'     && 'Try Again'}
              </button>
            </div>
          )}

          {/* Incomplete prompt */}
          {!selectedVariant && (
            <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button type="button" disabled className="w-full font-sans uppercase py-4" style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: '#f2f2f0', color: '#bbb', cursor: 'not-allowed' }}>
                {isLoading ? 'Loading options…' : 'Complete your selection to continue'}
              </button>
            </div>
          )}

          {/* Shortlist */}
          <button type="button" onClick={() => toggle(buildShortlistItem())}
            className="flex items-center justify-center gap-2 w-full font-sans uppercase mt-6 py-3 transition-opacity hover:opacity-70"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: isShortlisted ? G : '#aaa', border: `1px solid ${isShortlisted ? G : '#ddd'}` }}>
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} style={{ fill: isShortlisted ? G : 'none', color: isShortlisted ? G : '#aaa' }} />
            {isShortlisted ? 'Saved to Shortlist' : 'Save to Shortlist'}
          </button>

          <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />
          <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>{productDescription}</p>
        </div>
      </div>
    </div>
  );
}
