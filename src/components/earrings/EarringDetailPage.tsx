'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Heart } from 'lucide-react';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { EarringOfferSelector } from './EarringOfferSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { useCart } from '@/lib/store/cart';
import { validateAndSelectEarringOffer } from '@/app/earrings/[slug]/actions';
import { buildEarringCartLineId, cutLabel } from '@/lib/earrings/cart-helpers';
import { clarityLabel, type PublicEarringOffer } from '@/lib/earrings/offer-types';
import { trackEvent } from '@/lib/analytics';
import { METAL_DISPLAY, EMPTY_GALLERY, variantToGalleryData } from '@/lib/gallery/types';
import type { GalleryData, MetalVariant, MetalKey } from '@/lib/gallery/types';
import type { JewelleryDetailConfig } from '@/components/jewellery/JewelleryDetailPage';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';
const VARIANT_SWATCHES: Record<string, string> = {
  'platinum': '#d0d0d0', 'white-gold-18k': '#c8c8c8', 'yellow-gold-18k': '#c9a84c', 'rose-gold-14k': '#c47d68',
};

export interface EarringDetailPageProps {
  productId:          string;
  productSlug:        string;
  productName:        string;
  productSubtitle:    string;
  productDescription: string;
  earringType:        string;
  fixedDesignNote:    string | null;
  /** All published offers, fetched server-side so the selector opens instantly. */
  offers:             PublicEarringOffer[];
  galleryConfig:      GalleryData;
  metalVariants:      MetalVariant[] | null;
  config:             JewelleryDetailConfig;
}

type AddState = 'idle' | 'reserving' | 'success' | 'error';

export function EarringDetailPage({
  productId, productSlug, productName, productSubtitle, productDescription,
  earringType, fixedDesignNote, offers, galleryConfig, metalVariants, config,
}: EarringDetailPageProps) {
  void earringType;
  const { add: addToCart, cartToken, setOpen: setCartOpen } = useCart();

  // ── Metal ──────────────────────────────────────────────────────────────────
  const enabledVariants = metalVariants?.filter(v => v.enabled) ?? [];
  const [metal, setMetal]         = useState<MetalKey | null>(enabledVariants[0]?.metal ?? null);
  const [metalOpen, setMetalOpen] = useState(false);
  const activeVariant = metal ? metalVariants?.find(v => v.metal === metal) ?? null : null;
  const effectiveGallery = activeVariant ? variantToGalleryData(activeVariant) : (galleryConfig ?? EMPTY_GALLERY);
  const metalLabel  = metal ? (METAL_DISPLAY[metal] ?? metal) : 'Select metal';
  const metalSwatch = metal ? (VARIANT_SWATCHES[metal] ?? '#d0d0d0') : '#d0d0d0';

  // ── Offer selection ──────────────────────────────────────────────────────────
  const [offer, setOffer]   = useState<PublicEarringOffer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addState, setAddState] = useState<AddState>('idle');
  const [addError, setAddError] = useState<string | null>(null);

  function chooseOffer(o: PublicEarringOffer) {
    setOffer(o); setDrawerOpen(false); setAddState('idle'); setAddError(null);
  }
  // Changing metal can invalidate an offer that isn't supported in that metal.
  function chooseMetal(m: MetalKey) {
    setMetal(m); setMetalOpen(false);
    if (offer && offer.supported_metals.length > 0 && !offer.supported_metals.includes(m)) {
      setOffer(null);
    }
    setAddState('idle'); setAddError(null);
  }

  const minOfferPrice = offers.length ? Math.min(...offers.map(o => o.price_gbp)) : null;
  const priceLabel = offer
    ? `£${offer.price_gbp.toLocaleString('en-GB')}`
    : (minOfferPrice !== null ? `From £${minOfferPrice.toLocaleString('en-GB')}` : '');

  async function handleAdd() {
    if (!offer || addState === 'reserving') return;
    setAddState('reserving'); setAddError(null);
    trackEvent('earring_add_to_bag_initiated', { productId });
    const result = await validateAndSelectEarringOffer(productId, offer.id, metal ?? null, cartToken);
    if (!result.ok) { setAddState('error'); setAddError(result.error); trackEvent('earring_reservation_failed', { productId }); return; }
    const { earring } = result;
    addToCart({
      id:    buildEarringCartLineId(productId, earring.offerId),
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

  // ── Shortlist ──────────────────────────────────────────────────────────────
  const { toggle, has } = useShortlist();
  const shortlistId   = `${config.categoryPath.replace('/', '')}-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  const isShortlisted = has(shortlistId);
  function buildShortlistItem(): ShortlistItem {
    return { id: shortlistId, category: config.categoryLabel, name: productName, subtitle: productSubtitle,
      image: effectiveGallery.topLeft?.url ?? '', href: `${config.categoryPath}/${productSlug}`,
      metal: metalLabel, basePrice: offer?.price_gbp ?? 0, totalPrice: offer?.price_gbp ?? 0, savedAt: Date.now() };
  }

  return (
    <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>
      <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <Link href={config.categoryPath} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{config.categoryLabel}</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{productName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[58%] lg:sticky lg:top-[80px]" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}>
          <ProductGallery data={effectiveGallery} />
        </div>

        <div className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col">
          <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}>{productName}</h1>
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>{productSubtitle}</p>
            {priceLabel && <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>{priceLabel}</p>}
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* METAL */}
          <button type="button" onClick={() => setMetalOpen(v => !v)} className="flex items-center justify-between w-full py-4 text-left" style={{ borderBottom: metalOpen ? 'none' : `1px solid ${BORDER}` }}>
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>Metal</span>
            <span className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: metalSwatch, border: '1px solid #ddd' }} />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>{metalLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#bbb', transform: metalOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} strokeWidth={1.5} />
            </span>
          </button>
          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {enabledVariants.map(v => {
                const active = v.metal === metal;
                return (
                  <button key={v.metal} type="button" onClick={() => chooseMetal(v.metal)}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                    style={{ fontSize: 13, color: active ? G : '#666', fontWeight: active ? 400 : 300, backgroundColor: active ? '#f9f9f9' : 'transparent' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: VARIANT_SWATCHES[v.metal] ?? '#d0d0d0', border: '1px solid #ddd' }} />
                    {METAL_DISPLAY[v.metal]}
                    {active && <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}>Selected</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* CHOOSE YOUR DIAMONDS */}
          <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>Diamonds</span>
            {offer ? (
              <button type="button" onClick={() => setDrawerOpen(true)} className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {offer.total_carat.toFixed(2)}ct · {offer.colour} · {clarityLabel(offer.clarity)}
              </button>
            ) : (
              <span className="font-sans" style={{ fontSize: 13, color: '#bbb', fontWeight: 300 }}>Not yet selected</span>
            )}
          </div>
          <button type="button" onClick={() => setDrawerOpen(true)} className="w-full font-sans uppercase mt-4 py-4"
            style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}>
            {offer ? 'Change Your Diamonds' : 'Choose Your Diamonds'}
          </button>

          {fixedDesignNote && (
            <p className="font-sans mt-5" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', lineHeight: 1.6 }}>{fixedDesignNote}</p>
          )}

          {/* YOUR EARRINGS */}
          {offer && (
            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>Your Earrings</p>
              {([
                ['Selected diamond pair', cutLabel(offer.cut)],
                ['Total carat', `${offer.total_carat.toFixed(2)}ct`],
                ['Colour', offer.colour],
                ['Clarity', clarityLabel(offer.clarity)],
                ['Metal', metalLabel],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>{k}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#999' }}>Total</span>
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>£{offer.price_gbp.toLocaleString('en-GB')}</span>
              </div>
              {offer.availability === 'made_to_order' && (
                <p className="font-sans mt-3 text-center" style={{ fontSize: 11, color: '#b08d57', letterSpacing: '0.04em' }}>Available to order · crafted for you</p>
              )}

              {addError && <p className="font-sans mt-4 text-center" style={{ fontSize: 11, color: '#c0392b', lineHeight: 1.5 }}>{addError}</p>}
              <button type="button" onClick={addState === 'success' ? () => setCartOpen(true) : handleAdd} disabled={addState === 'reserving'}
                className="w-full font-sans uppercase mt-6 py-4"
                style={{ fontSize: 11, letterSpacing: '0.28em', color: '#fff', cursor: addState === 'reserving' ? 'not-allowed' : 'pointer',
                  backgroundColor: addState === 'success' ? '#4a9e6b' : addState === 'reserving' ? '#888' : G }}>
                {addState === 'idle'      && 'Add to Bag'}
                {addState === 'reserving' && 'Adding…'}
                {addState === 'success'   && 'Added to Bag'}
                {addState === 'error'     && 'Try Again'}
              </button>
              <Link href="/contact" className="block w-full font-sans uppercase mt-3 py-3 text-center transition-opacity hover:opacity-70" style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}>
                Enquire
              </Link>
            </div>
          )}

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

      {/* Offer selector drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80]" onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute right-0 top-0 bottom-0 flex flex-col bg-white" style={{ width: 'min(520px, 96vw)', boxShadow: '-4px 0 40px rgba(0,0,0,0.10)' }}>
            <EarringOfferSelector
              offers={offers}
              metal={metal}
              selectedOfferId={offer?.id ?? null}
              onSelect={chooseOffer}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
