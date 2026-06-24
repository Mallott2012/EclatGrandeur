'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown, RotateCw } from 'lucide-react';
import { DiamondSelector } from '@/components/engagement/DiamondSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { Heart } from 'lucide-react';
import { Media360Viewer } from '@/components/shared/Media360Viewer';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { EMPTY_GALLERY, type GalleryData } from '@/lib/gallery/types';


const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const METALS = [
  { id: 'platinum',        label: 'Platinum',        swatch: '#d0d0d0' },
  { id: 'white_gold_18k',  label: '18k White Gold',  swatch: '#c0c0c0' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold', swatch: '#c9a84c' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold',   swatch: '#c47d68' },
];

export interface JewelleryDetailProduct {
  name: string;
  subtitle: string;
  basePrice: number;
  description: string;
  media: { url: string; metal: string | null }[];
  materials: string[];
  /** 'total-carat' = simple carat total pill selector (pair-aware), 'pair' = full DiamondSelector ×2, 'single' = full DiamondSelector ×1, 'none' = fixed design */
  diamondMode?: 'total-carat' | 'pair' | 'single' | 'none';
  /** Price per carat added on top of basePrice — required when diamondMode is 'total-carat' */
  pricePerCarat?: number;
  /** When true and diamondMode is 'total-carat', the carat selector shows the pair label (e.g. earrings) */
  caratIsPair?: boolean;
}

export interface JewelleryDetailConfig {
  categoryLabel: string;    // e.g. 'Necklaces'
  categoryPath: string;     // e.g. '/necklaces'
}

interface Props {
  product:       JewelleryDetailProduct;
  config:        JewelleryDetailConfig;
  /** DB id of the jewellery_products row — when present the diamond selector is
   *  scoped to only the diamonds assigned to this product. */
  jewelleryId?:  string | null;
  galleryConfig?: GalleryData | null;
}

export function JewelleryDetailPage({ product, config, jewelleryId, galleryConfig }: Props) {
  const isVideo = (url: string) => url.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) !== null;
  const [selectedMetal,   setSelectedMetal]   = useState(product.materials[0]);
  const [metalOpen,       setMetalOpen]       = useState(false);
  const [diamondOpen,     setDiamondOpen]     = useState(false);
  const [selectedDiamond, setSelectedDiamond] = useState<{ id: string; carat: number; color: string; clarity: string; price: number } | null>(null);
  const [selectedCarat,   setSelectedCarat]   = useState<number | null>(null);

  const diamondMode  = product.diamondMode ?? 'single';
  const isTotalCarat = diamondMode === 'total-carat';
  const isPair       = diamondMode === 'pair';
  const showDiamond  = diamondMode !== 'none';

  // Filter media by selected metal; fall back to untagged if no metal-specific media exists
  const selectedMetalId = METALS.find(m => m.label === selectedMetal)?.id ?? null;
  const filteredMedia = (() => {
    if (!selectedMetalId) return product.media;
    const specific = product.media.filter(m => m.metal === selectedMetalId);
    if (specific.length > 0) return specific;
    const generic = product.media.filter(m => !m.metal);
    return generic.length > 0 ? generic : product.media;
  })();
  const video360Url   = filteredMedia.find(m => isVideo(m.url))?.url ?? null;
  const displayImages = filteredMedia.filter(m => !isVideo(m.url)).map(m => m.url);

  // Scope the diamond API to only assigned diamonds when we have a DB jewellery id
  const diamondApiUrl = jewelleryId
    ? `/api/diamonds?jewellery_id=${jewelleryId}`
    : '/api/diamonds'

  // Pre-warm the SWR cache so diamonds are ready before the panel opens
  useSWR(showDiamond ? diamondApiUrl : null, (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false });

  // Grid dimensions — computed before JSX
  const gridItems = (video360Url ? 1 : 0) + displayImages.length;
  const gridRows  = Math.max(1, Math.ceil(gridItems / 2));

  // price: base setting + diamond(s)
  const caratExtra   = isTotalCarat && selectedCarat ? Math.round(selectedCarat * (product.pricePerCarat ?? 0)) : 0;
  const diamondTotal = !isTotalCarat && selectedDiamond ? selectedDiamond.price * (isPair ? 2 : 1) : 0;
  const totalPrice   = product.basePrice + caratExtra + diamondTotal;
  const hasSelection = isTotalCarat ? selectedCarat !== null : selectedDiamond !== null;
  const displayPrice = hasSelection
    ? `£${totalPrice.toLocaleString('en-GB')}`
    : `Starting from £${product.basePrice.toLocaleString('en-GB')}`;

  const metalMeta = METALS.find(m => m.label === selectedMetal) ?? METALS[0];

  const { toggle, has } = useShortlist();
  const shortlistId   = `${config.categoryPath.replace('/', '')}-${product.name.toLowerCase().replace(/\s+/g, '-')}`;
  const isShortlisted = has(shortlistId);

  function buildShortlistItem(): ShortlistItem {
    return {
      id:           shortlistId,
      category:     config.categoryLabel,
      name:         product.name,
      subtitle:     product.subtitle,
      image:        displayImages[0] ?? product.media[0]?.url ?? '',
      href:         `${config.categoryPath}/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
      metal:        selectedMetal,
      basePrice:    product.basePrice,
      diamondCarat: isTotalCarat ? (selectedCarat ?? undefined) : (selectedDiamond?.carat),
      diamondColor:   selectedDiamond?.color,
      diamondClarity: selectedDiamond?.clarity,
      diamondPrice:   selectedDiamond?.price,
      totalPrice,
      savedAt:      Date.now(),
    };
  }

  // Live size preview
  const previewCarat = isTotalCarat ? selectedCarat : selectedDiamond?.carat ?? null;
  const diamondScale = previewCarat
    ? Math.min(1.28, Math.max(0.82, 0.88 + (previewCarat / (isTotalCarat ? 5 : 3)) * 0.4))
    : 1.0;

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
          {product.name}
        </span>
      </nav>

      {/* SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — gallery */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-[80px]"
          style={{ maxHeight: 'calc(100vh - 80px)', overflow: 'hidden', padding: 8, background: '#fff' }}
        >
          <ProductGallery data={galleryConfig ?? EMPTY_GALLERY} />
        </div>

        {/* RIGHT — sticky configuration panel */}
        <div
          className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col"
        >
          {/* Name */}
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
          >
            {product.name}
          </h1>

          {/* Subtitle + price */}
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>
              {product.subtitle}
            </p>
            <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>
              {displayPrice}
            </p>
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Ring Style / Metal row */}
          <button
            type="button"
            onClick={() => setMetalOpen(v => !v)}
            className="flex items-center justify-between w-full py-4 text-left"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
              Metal
            </span>
            <span className="flex items-center gap-2">
              <span
                style={{
                  width: 12, height: 12, borderRadius: '50%',
                  backgroundColor: metalMeta.swatch,
                  border: '1px solid #ddd', flexShrink: 0,
                }}
              />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                {selectedMetal}
              </span>
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: '#bbb', transition: 'transform 0.2s', transform: metalOpen ? 'rotate(180deg)' : 'none' }}
                strokeWidth={1.5}
              />
            </span>
          </button>

          {/* Metal dropdown */}
          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {product.materials.map(m => {
                const meta = METALS.find(x => x.label === m) ?? METALS[0];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setSelectedMetal(m); setMetalOpen(false); }}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans"
                    style={{
                      fontSize: 13, color: selectedMetal === m ? G : '#666',
                      fontWeight: selectedMetal === m ? 400 : 300,
                      backgroundColor: selectedMetal === m ? '#f9f9f9' : 'transparent',
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: meta.swatch, border: '1px solid #ddd', flexShrink: 0 }} />
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Diamond / carat row — static display, hidden for fixed designs */}
          {showDiamond && (
            <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                {isPair ? 'Diamonds (Pair)' : 'Diamond'}
              </span>
              {hasSelection ? (
                <button
                  type="button"
                  onClick={() => setDiamondOpen(true)}
                  className="font-sans"
                  style={{ fontSize: 13, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {isTotalCarat
                    ? `${selectedCarat}ct total`
                    : `${selectedDiamond!.carat.toFixed(2)} ct · ${selectedDiamond!.color} · ${selectedDiamond!.clarity}`}
                </button>
              ) : (
                <span className="font-sans" style={{ fontSize: 13, color: '#bbb', fontWeight: 300 }}>
                  Not yet selected
                </span>
              )}
            </div>
          )}

          {/* Primary CTA — "SELECT A DIAMOND" / "SELECT CARAT WEIGHT" opens drawer */}
          {showDiamond && (
            <button
              type="button"
              onClick={() => setDiamondOpen(true)}
              className="w-full font-sans uppercase mt-8 py-4"
              style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
            >
              {hasSelection ? 'Change Diamond' : 'Select a Diamond'}
            </button>
          )}

          {/* Add to Bag + Checkout — only appears once selection is made (or no diamond required) */}
          {(!showDiamond || hasSelection) && (
            <>
              {/* Add to Bag */}
              <button
                type="button"
                className="w-full font-sans uppercase mt-3 py-4"
                style={{
                  fontSize: 11, letterSpacing: '0.28em',
                  backgroundColor: showDiamond ? '#fff' : G,
                  color: showDiamond ? G : '#fff',
                  border: showDiamond ? `1px solid ${G}` : 'none',
                }}
              >
                {showDiamond
                  ? `Add to Bag — £${totalPrice.toLocaleString('en-GB')}`
                  : 'Add to Bag'}
              </button>

              {/* Checkout */}
              <Link
                href="/checkout"
                className="block w-full font-sans uppercase text-center mt-3 py-4"
                style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: '#fff', color: '#999', border: `1px solid ${BORDER}` }}
              >
                {showDiamond
                  ? `Checkout — £${totalPrice.toLocaleString('en-GB')}`
                  : 'Checkout'}
              </Link>
            </>
          )}

          {/* Save to Shortlist */}
          <button
            type="button"
            onClick={() => toggle(buildShortlistItem())}
            className="flex items-center justify-center gap-2 w-full font-sans uppercase mt-3 py-3 transition-opacity hover:opacity-70"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: isShortlisted ? G : '#aaa', border: `1px solid ${isShortlisted ? G : '#ddd'}` }}
          >
            <Heart
              className="w-3.5 h-3.5"
              strokeWidth={1.5}
              style={{ fill: isShortlisted ? G : 'none', color: isShortlisted ? G : '#aaa' }}
            />
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
            {product.description}
          </p>

          {/* Service promises */}
          <div className="mt-10">
            {[
              'Complimentary shipping on all orders',
              'Complimentary gift packaging',
              'Free engraving service',
              'Lifetime warranty & servicing',
            ].map(item => (
              <div
                key={item}
                className="flex items-center gap-3 py-4 font-sans"
                style={{ fontSize: 12, color: '#888', borderTop: `1px solid ${BORDER}`, fontWeight: 300, letterSpacing: '0.02em' }}
              >
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ccc', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DIAMOND SELECTOR DRAWER ────────────────────────────────────── */}
      {diamondOpen && (
        <div
          className="fixed inset-0 z-[80]"
          onClick={e => { if (e.target === e.currentTarget) setDiamondOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/5" />
          <div
            className="absolute right-0 top-0 bottom-0 flex flex-col bg-white"
            style={{ width: 'min(520px, 96vw)', boxShadow: '-4px 0 40px rgba(0,0,0,0.10)' }}
          >
            <DiamondSelector
              selectedId={isTotalCarat ? (selectedCarat ? `tier_${selectedCarat}` : null) : (selectedDiamond?.id ?? null)}
              onClose={() => setDiamondOpen(false)}
              onSelect={d => {
                if (isTotalCarat) {
                  setSelectedCarat(d.carat);
                } else {
                  setSelectedDiamond(d);
                }
                setDiamondOpen(false);
              }}
              pairMode={isPair || (isTotalCarat && product.caratIsPair === true)}
              totalCaratMode={isTotalCarat}
              pricePerCarat={product.pricePerCarat ?? 1000}
              diamondApiUrl={diamondApiUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}
