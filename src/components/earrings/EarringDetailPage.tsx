'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Heart } from 'lucide-react';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { EarringPairSelector } from './EarringPairSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import type { GalleryData, MetalVariant, MetalKey } from '@/lib/gallery/types';
import { METAL_DISPLAY, EMPTY_GALLERY, variantToGalleryData } from '@/lib/gallery/types';
import type { JewelleryDetailConfig } from '@/components/jewellery/JewelleryDetailPage';
import type { CompatiblePairCard, EarringConfigurationPrice } from '@/lib/earrings/types';
import type { JewelleryStoneSlot } from '@/lib/pairs/types';
import { isConfigurationComplete, getRequiredSelectorSlots, wouldCreateDuplicatePair } from '@/lib/earrings/validation';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const VARIANT_SWATCHES: Record<string, string> = {
  'platinum':        '#d0d0d0',
  'white-gold-18k':  '#c8c8c8',
  'yellow-gold-18k': '#c9a84c',
  'rose-gold-14k':   '#c47d68',
};

export interface EarringDetailPageProps {
  productId:          string;
  productName:        string;
  productSubtitle:    string;
  productDescription: string;
  basePrice:          number;
  slots:              JewelleryStoneSlot[];
  galleryConfig:      GalleryData;
  metalVariants:      MetalVariant[] | null;
  config:             JewelleryDetailConfig;
}

export function EarringDetailPage({
  productId, productName, productSubtitle, productDescription,
  basePrice, slots, galleryConfig, metalVariants, config,
}: EarringDetailPageProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // ── Metal state ─────────────────────────────────────────────────────────────
  const enabledVariants = metalVariants?.filter(v => v.enabled) ?? [];
  const hasVariants     = enabledVariants.length > 0;
  const initialMetal    = (() => {
    const urlMetal = searchParams.get('metal') as MetalKey | null;
    if (urlMetal && enabledVariants.some(v => v.metal === urlMetal)) return urlMetal;
    return enabledVariants[0]?.metal ?? null;
  })();
  const [activeVariantMetal, setActiveVariantMetal] = useState<MetalKey | null>(initialMetal);
  const [galleryOpacity, setGalleryOpacity]         = useState(1);
  const [metalOpen, setMetalOpen]                   = useState(false);

  const activeVariant    = activeVariantMetal ? metalVariants?.find(v => v.metal === activeVariantMetal) ?? null : null;
  const galleryVariant   = (activeVariant?.metal === 'white-gold-18k' && activeVariant.gallery.items.length === 0)
    ? (metalVariants?.find(v => v.metal === 'platinum') ?? activeVariant)
    : activeVariant;
  const effectiveGallery = galleryVariant ? variantToGalleryData(galleryVariant) : (galleryConfig ?? EMPTY_GALLERY);

  const ringStyleLabel  = hasVariants && activeVariantMetal ? METAL_DISPLAY[activeVariantMetal] : 'Select metal';
  const ringStyleSwatch = hasVariants && activeVariantMetal ? (VARIANT_SWATCHES[activeVariantMetal] ?? '#d0d0d0') : '#d0d0d0';

  function switchVariantMetal(key: MetalKey) {
    if (key === activeVariantMetal) return;
    setGalleryOpacity(0);
    setTimeout(() => { setActiveVariantMetal(key); setGalleryOpacity(1); }, 200);
    updateUrl({ metal: key });
  }

  // ── Pair selection state ─────────────────────────────────────────────────────
  const matchedPairSlots = getRequiredSelectorSlots(
    slots.map(s => ({ slot_key: s.slot_key, selection_mode: s.selection_mode, required: s.required }))
  );
  const fixedSlots = slots.filter(s => s.selection_mode === 'fixed');
  const isSingleSlot = matchedPairSlots.length === 1;

  const [selectedPairs, setSelectedPairs] = useState<Map<string, CompatiblePairCard>>(new Map());
  const [activeSelectorSlot, setActiveSelectorSlot] = useState<string | null>(null);
  const [configPrice, setConfigPrice] = useState<EarringConfigurationPrice | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const validatedOnce = useRef(false);

  const selectedPairIds = new Map([...selectedPairs.entries()].map(([k, p]) => [k, p.id]));
  const slotDescriptors = slots.map(s => ({
    slot_key: s.slot_key, selection_mode: s.selection_mode, required: s.required,
  }));
  const isComplete = isConfigurationComplete(slotDescriptors, selectedPairIds);

  // ── URL state helpers ────────────────────────────────────────────────────────
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // ── Initialise pair state from URL, then validate ───────────────────────────
  useEffect(() => {
    if (validatedOnce.current) return;
    validatedOnce.current = true;

    const urlPairs: Array<{ slotKey: string; pairId: string }> = [];
    for (const slot of matchedPairSlots) {
      const pairId = searchParams.get(slot.slot_key);
      if (pairId) urlPairs.push({ slotKey: slot.slot_key, pairId });
    }
    if (urlPairs.length === 0) return;

    // Validate the URL-provided pairs via server
    fetch(`/api/earrings/${productId}/configuration`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        metalVariantId: activeVariantMetal ?? undefined,
        selectedPairs:  urlPairs,
      }),
    })
      .then(r => r.json())
      .then((data: { valid: boolean; errors: Array<{ code: string; slotKey?: string }>; price?: EarringConfigurationPrice }) => {
        if (data.valid && data.price) {
          // All URL pairs are valid — we can't reconstruct full CompatiblePairCard from just an ID,
          // so we leave selectedPairs empty and let the user re-select if they open a selector.
          // The URL params remain; pairs will auto-validate when the summary re-fetches.
          setConfigPrice(data.price);
        } else {
          // Clear invalid pair URL params silently
          const invalidSlotKeys = new Set(data.errors?.map(e => e.slotKey).filter(Boolean));
          const next = new URLSearchParams(searchParams.toString());
          for (const slotKey of invalidSlotKeys) next.delete(slotKey!);
          router.replace(`${pathname}?${next.toString()}`, { scroll: false });
        }
      })
      .catch(() => {
        // Network error: clear all pair params silently
        const next = new URLSearchParams(searchParams.toString());
        for (const slot of matchedPairSlots) next.delete(slot.slot_key);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch server-validated price when configuration is complete ──────────────
  useEffect(() => {
    if (!isComplete) { setConfigPrice(null); return; }
    setPriceLoading(true);
    const body = {
      metalVariantId: activeVariantMetal ?? undefined,
      selectedPairs:  [...selectedPairIds.entries()].map(([slotKey, pairId]) => ({ slotKey, pairId })),
    };
    fetch(`/api/earrings/${productId}/configuration`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
      .then(r => r.json())
      .then((data: { valid: boolean; price?: EarringConfigurationPrice }) => {
        if (data.valid && data.price) setConfigPrice(data.price);
        else setConfigPrice(null);
      })
      .catch(() => setConfigPrice(null))
      .finally(() => setPriceLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, activeVariantMetal, productId, JSON.stringify([...selectedPairIds.entries()])]);

  // ── Pair selection handler ───────────────────────────────────────────────────
  function handlePairSelect(pair: CompatiblePairCard) {
    if (!activeSelectorSlot) return;
    if (wouldCreateDuplicatePair(selectedPairIds, activeSelectorSlot, pair.id)) return;
    setSelectedPairs(prev => { const n = new Map(prev); n.set(activeSelectorSlot!, pair); return n; });
    updateUrl({ [activeSelectorSlot]: pair.id });
    setActiveSelectorSlot(null);
  }

  // ── Shortlist ────────────────────────────────────────────────────────────────
  const { toggle, has } = useShortlist();
  const shortlistId   = `${config.categoryPath.replace('/', '')}-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  const isShortlisted = has(shortlistId);

  function buildShortlistItem(): ShortlistItem {
    return {
      id:        shortlistId,
      category:  config.categoryLabel,
      name:      productName,
      subtitle:  productSubtitle,
      image:     effectiveGallery.topLeft?.url ?? '',
      href:      `${config.categoryPath}/${productName.toLowerCase().replace(/\s+/g, '-')}`,
      metal:     ringStyleLabel,
      basePrice,
      totalPrice: configPrice?.totalPrice ?? basePrice,
      savedAt:   Date.now(),
    };
  }

  // ── Price display ────────────────────────────────────────────────────────────
  const displayPrice = configPrice
    ? `£${configPrice.totalPrice.toLocaleString('en-GB')}`
    : `Starting from £${basePrice.toLocaleString('en-GB')}`;

  // ── Disabled pair IDs for duplicate prevention ───────────────────────────────
  const activeDisabledIds = useMemo(() => {
    if (!activeSelectorSlot) return new Set<string>();
    const disabled = new Set<string>();
    for (const [slotKey, pair] of selectedPairs.entries()) {
      if (slotKey !== activeSelectorSlot) disabled.add(pair.id);
    }
    return disabled;
  }, [activeSelectorSlot, selectedPairs]);

  return (
    <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>

      {/* BREADCRUMB */}
      <nav
        className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
        aria-label="Breadcrumb"
      >
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Home
        </Link>
        <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <Link href={config.categoryPath} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {config.categoryLabel}
        </Link>
        <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {productName}
        </span>
      </nav>

      {/* SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — gallery */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-[80px]"
          style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}
        >
          <div style={{ opacity: galleryOpacity, transition: 'opacity 0.2s ease' }}>
            <ProductGallery data={effectiveGallery} />
          </div>
        </div>

        {/* RIGHT — configuration panel */}
        <div className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col">

          {/* Name */}
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
          >
            {productName}
          </h1>

          {/* Subtitle + price */}
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>
              {productSubtitle}
            </p>
            <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>
              {displayPrice}
            </p>
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Metal selector */}
          <button
            type="button"
            onClick={() => setMetalOpen(v => !v)}
            className="flex items-center justify-between w-full py-4 text-left"
            style={{ borderBottom: metalOpen ? 'none' : `1px solid ${BORDER}` }}
          >
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
              Metal
            </span>
            <span className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: ringStyleSwatch, border: '1px solid #ddd', flexShrink: 0 }} />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>{ringStyleLabel}</span>
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: '#bbb', transition: 'transform 0.2s', transform: metalOpen ? 'rotate(180deg)' : 'none' }}
                strokeWidth={1.5}
              />
            </span>
          </button>

          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {enabledVariants.map(v => {
                const active = v.metal === activeVariantMetal;
                return (
                  <button
                    key={v.metal}
                    type="button"
                    onClick={() => { switchVariantMetal(v.metal); setMetalOpen(false); }}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                    style={{ fontSize: 13, color: active ? G : '#666', fontWeight: active ? 400 : 300, backgroundColor: active ? '#f9f9f9' : 'transparent' }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: VARIANT_SWATCHES[v.metal] ?? '#d0d0d0', border: '1px solid #ddd', flexShrink: 0 }} />
                    {METAL_DISPLAY[v.metal]}
                    {active && <span style={{ marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}>Selected</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Stone slot selectors */}
          {matchedPairSlots.map(slot => {
            const slotFull = slots.find(s => s.slot_key === slot.slot_key);
            const selectedPair = selectedPairs.get(slot.slot_key) ?? null;
            const selectorLabel = isSingleSlot ? 'Diamond Pair' : (slotFull?.label ?? slot.slot_key);

            return (
              <div key={slot.slot_key}>
                {/* Slot row */}
                <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                    {selectorLabel}
                  </span>
                  {selectedPair ? (
                    <button
                      type="button"
                      onClick={() => setActiveSelectorSlot(slot.slot_key)}
                      className="font-sans"
                      style={{ fontSize: 13, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}
                    >
                      {selectedPair.carat_per_stone
                        ? `${selectedPair.carat_per_stone.toFixed(2)}ct × 2`
                        : `${selectedPair.total_carat.toFixed(2)}ct total`}
                      {selectedPair.colour ? ` · ${selectedPair.colour}` : ''}
                    </button>
                  ) : (
                    <span className="font-sans" style={{ fontSize: 13, color: '#bbb', fontWeight: 300 }}>
                      Not yet selected
                    </span>
                  )}
                </div>

                {/* Select CTA for this slot */}
                <button
                  type="button"
                  onClick={() => setActiveSelectorSlot(slot.slot_key)}
                  className="w-full font-sans uppercase mt-4 py-4"
                  style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
                >
                  {selectedPair
                    ? `Change ${isSingleSlot ? 'Diamond Pair' : selectorLabel}`
                    : `Select ${isSingleSlot ? 'Your Diamond Pair' : selectorLabel}`}
                </button>
              </div>
            );
          })}

          {/* Fixed slots notice */}
          {fixedSlots.length > 0 && (
            <p
              className="font-sans mt-5"
              style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', lineHeight: 1.6 }}
            >
              {fixedSlots.map(s => s.label ?? s.slot_key).join(' & ')} — fixed stones included in the setting price.
            </p>
          )}

          {/* YOUR EARRINGS summary — only shown when configuration is complete */}
          {isComplete && (
            <div
              className="mt-8 pt-6"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <p className="font-sans uppercase mb-4" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>
                Your Earrings
              </p>

              {/* Metal line */}
              {activeVariantMetal && (
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>
                    Setting — {METAL_DISPLAY[activeVariantMetal]}
                  </span>
                  <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>
                    £{basePrice.toLocaleString('en-GB')}
                  </span>
                </div>
              )}

              {/* Selected pairs */}
              {[...selectedPairs.entries()].map(([slotKey, pair]) => {
                const slotFull = slots.find(s => s.slot_key === slotKey);
                const label = isSingleSlot ? 'Diamond Pair' : (slotFull?.label ?? slotKey);
                const caratStr = pair.carat_per_stone
                  ? `${pair.carat_per_stone.toFixed(2)}ct × 2`
                  : `${pair.total_carat.toFixed(2)}ct total`;
                const pairPriceItem = configPrice?.selectedPairs.find(sp => sp.slotKey === slotKey);
                return (
                  <div key={slotKey} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>
                      {label} — {caratStr}
                      {pair.colour ? `, ${pair.colour}` : ''}
                    </span>
                    <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>
                      {pairPriceItem ? `£${pairPriceItem.pairPrice.toLocaleString('en-GB')}` : '—'}
                    </span>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex justify-between pt-3">
                <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#999' }}>
                  Total
                </span>
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>
                  {priceLoading
                    ? '—'
                    : configPrice
                      ? `£${configPrice.totalPrice.toLocaleString('en-GB')}`
                      : '—'}
                </span>
              </div>

              {/* E5 placeholder CTA */}
              <button
                type="button"
                disabled
                className="w-full font-sans uppercase mt-6 py-4"
                style={{
                  fontSize: 11, letterSpacing: '0.28em',
                  backgroundColor: '#f2f2f0', color: '#aaa',
                  cursor: 'not-allowed',
                }}
              >
                Enquire About This Design
              </button>
              <p className="font-sans text-center mt-2" style={{ fontSize: 10, color: '#ccc', letterSpacing: '0.06em' }}>
                Enquiry wiring coming soon
              </p>
            </div>
          )}

          {/* Incomplete configuration placeholder */}
          {!isComplete && matchedPairSlots.length > 0 && (
            <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="font-sans text-center" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.06em', lineHeight: 1.7 }}>
                Complete your selection above to see your total price and continue.
              </p>
            </div>
          )}

          {/* Save to Shortlist */}
          <button
            type="button"
            onClick={() => toggle(buildShortlistItem())}
            className="flex items-center justify-center gap-2 w-full font-sans uppercase mt-6 py-3 transition-opacity hover:opacity-70"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: isShortlisted ? G : '#aaa', border: `1px solid ${isShortlisted ? G : '#ddd'}` }}
          >
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} style={{ fill: isShortlisted ? G : 'none', color: isShortlisted ? G : '#aaa' }} />
            {isShortlisted ? 'Saved to Shortlist' : 'Save to Shortlist'}
          </button>

          {/* Speak to a Consultant */}
          <div className="mt-5" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
            <p className="font-sans text-center" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.02em' }}>
              Prefer to speak with an Éclat expert?
            </p>
            <Link
              href="/contact"
              className="flex items-center justify-center w-full font-sans uppercase mt-3 py-3 transition-opacity hover:opacity-70"
              style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}
            >
              Speak to a Consultant
            </Link>
          </div>

          <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Description */}
          <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>
            {productDescription}
          </p>

          {/* Service promises */}
          <div className="mt-10">
            {[
              'Complimentary shipping on all orders',
              'Complimentary gift packaging',
              'Free engraving service',
              'Lifetime warranty & servicing',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 py-4 font-sans" style={{ fontSize: 12, color: '#888', borderTop: `1px solid ${BORDER}`, fontWeight: 300, letterSpacing: '0.02em' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ccc', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PAIR SELECTOR DRAWER */}
      {activeSelectorSlot && (() => {
        const slotFull = slots.find(s => s.slot_key === activeSelectorSlot);
        const selectorLabel = isSingleSlot ? 'Diamond Pair' : (slotFull?.label ?? activeSelectorSlot);
        return (
          <div
            className="fixed inset-0 z-[80]"
            onClick={e => { if (e.target === e.currentTarget) setActiveSelectorSlot(null); }}
          >
            <div className="absolute inset-0 bg-black/5" />
            <div
              className="absolute right-0 top-0 bottom-0 flex flex-col bg-white"
              style={{ width: 'min(480px, 96vw)', boxShadow: '-4px 0 40px rgba(0,0,0,0.10)' }}
            >
              <EarringPairSelector
                productId={productId}
                slotKey={activeSelectorSlot}
                slotLabel={selectorLabel}
                selectedPairId={selectedPairs.get(activeSelectorSlot)?.id ?? null}
                disabledPairIds={activeDisabledIds}
                onSelect={handlePairSelect}
                onClose={() => setActiveSelectorSlot(null)}
                isSingleSlot={isSingleSlot}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
