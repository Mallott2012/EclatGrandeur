'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown, RotateCw } from 'lucide-react';
import { DiamondSelector } from './DiamondSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { Heart } from 'lucide-react';
import { Media360Viewer } from '@/components/shared/Media360Viewer';
import { ProductGallery } from '@/components/shared/ProductGallery';
import {
  EMPTY_GALLERY, type GalleryData,
  type MetalVariant, type MetalKey,
  METAL_DISPLAY, variantToGalleryData,
} from '@/lib/gallery/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const METALS = [
  { id: 'platinum',        label: 'Platinum',        swatch: '#d0d0d0' },
  { id: 'white_gold_18k',  label: '18k White Gold',  swatch: '#c0c0c0' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold', swatch: '#c9a84c' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold',   swatch: '#c47d68' },
];

interface Diamond {
  id: string;
  carat: number;
  color: string;
  clarity: string;
  price: number;
}

const toMedia = (...urls: string[]): RingMediaItem[] => urls.map(url => ({ url, metal: null }));

const RINGS: Record<string, RingData> = {
  'eclat-solitaire':    { name: 'The Éclat Solitaire',  subtitle: 'Engagement Ring', basePrice: 4800,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold', '18k Rose Gold'], media: toMedia('/images/rings/ring-1.png', '/images/rings/ring-3.png', '/images/rings/ring-7.png'), description: 'The Éclat Solitaire is the definitive expression of the solitaire engagement ring. A single brilliant-cut diamond elevated on a slender platinum band, placing all focus on the diamond. Handcrafted to order in our London atelier.' },
  'lumiere-halo':       { name: 'Lumière Halo',         subtitle: 'Engagement Ring', basePrice: 6200,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], media: toMedia('/images/rings/ring-2.png', '/images/rings/ring-5.png', '/images/rings/ring-8.png'), description: 'A brilliant-cut diamond encircled by a halo of pavé-set diamonds, dramatically amplifying the appearance of the centre stone. Set in platinum with a split-shank band.' },
  'trilogy':            { name: 'The Trilogy',          subtitle: 'Three Stone Engagement Ring', basePrice: 7500, materials: ['Platinum', '18k White Gold'], media: toMedia('/images/rings/ring-3.png', '/images/rings/ring-1.png', '/images/rings/ring-9.png'), description: 'Three brilliant diamonds representing the past, present and future. The Trilogy is one of the most meaningful and enduring of all engagement ring designs.' },
  'oval-solitaire':     { name: 'Oval Solitaire',       subtitle: 'Engagement Ring', basePrice: 3850,  materials: ['Platinum', '18k White Gold', '18k Rose Gold'], media: toMedia('/images/rings/ring-4.png', '/images/rings/ring-2.png', '/images/rings/ring-6.png'), description: 'An elongated oval brilliant-cut diamond in a classic four-claw solitaire setting. The oval silhouette creates the appearance of longer, more slender fingers.' },
  'constellation':      { name: 'Constellation Pavé',  subtitle: 'Pavé Band Engagement Ring', basePrice: 4100, materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], media: toMedia('/images/rings/ring-5.png', '/images/rings/ring-4.png', '/images/rings/ring-8.png'), description: 'A brilliant-cut centre diamond set above a band of continuous pavé-set diamonds. Each stone hand-selected and individually set for seamless, scintillating brilliance.' },
  'cushion-soleste':    { name: 'Cushion Soleste',      subtitle: 'Halo Engagement Ring', basePrice: 5650, materials: ['Platinum', '18k Yellow Gold'], media: toMedia('/images/rings/ring-6.png', '/images/rings/ring-2.png', '/images/rings/ring-5.png'), description: 'A cushion-cut diamond surrounded by two rows of brilliants in the signature Soleste halo setting. The double halo creates exceptional fire and brilliance.' },
  'emerald-solitaire':  { name: 'Emerald Solitaire',   subtitle: 'Engagement Ring', basePrice: 4450,  materials: ['Platinum', '18k White Gold'], media: toMedia('/images/rings/ring-7.png', '/images/rings/ring-3.png', '/images/rings/ring-9.png'), description: 'The architectural clarity of an emerald-cut diamond in a clean four-claw setting. Step-cut facets create broad flashes of light distinct from brilliant-cut diamonds.' },
  'vintage-halo':       { name: 'Vintage Halo',        subtitle: 'Vintage-Style Engagement Ring', basePrice: 6200, materials: ['Platinum', '18k White Gold'], media: toMedia('/images/rings/ring-8.png', '/images/rings/ring-1.png', '/images/rings/ring-4.png'), description: 'Inspired by the jewellery of the Art Deco period, the Vintage Halo features milgrain detailing and hand-engraving around a brilliant-cut diamond halo.' },
  'princess-solitaire': { name: 'Princess Solitaire',  subtitle: 'Engagement Ring', basePrice: 3700,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], media: toMedia('/images/rings/ring-9.png', '/images/rings/ring-6.png', '/images/rings/ring-2.png'), description: 'A square princess-cut diamond in a modern four-claw solitaire. The sharp corners maximise the diamond\'s brilliance and surface area.' },
};

const FALLBACK = RINGS['eclat-solitaire'];

interface RingMediaItem {
  url:   string;
  metal: string | null;
}

interface RingData {
  name:         string;
  subtitle:     string;
  basePrice:    number;
  description:  string;
  media:        RingMediaItem[];
  materials:    string[];
}

interface Props {
  slug:           string;
  dbRing?:        RingData | null;
  /** DB id of the ring_settings row — when present the diamond selector is scoped
   *  to only the diamonds assigned to this ring + selected metal. */
  ringSettingId?: string | null;
  galleryConfig?: GalleryData | null;
  metalVariants?: MetalVariant[] | null;
}

export function RingDetailPage({ slug, dbRing, ringSettingId, galleryConfig, metalVariants }: Props) {
  const ring = dbRing ?? RINGS[slug] ?? FALLBACK;

  const [selectedMetal,   setSelectedMetal]   = useState(ring.materials[0]);

  // Metal variant gallery switching
  const enabledVariants = metalVariants?.filter(v => v.enabled) ?? [];
  const [activeVariantMetal, setActiveVariantMetal] = useState<MetalKey | null>(
    enabledVariants[0]?.metal ?? null
  );
  const [galleryOpacity, setGalleryOpacity] = useState(1);
  const activeVariant = activeVariantMetal
    ? metalVariants?.find(v => v.metal === activeVariantMetal) ?? null
    : null;
  const effectiveGalleryData = activeVariant
    ? variantToGalleryData(activeVariant)
    : (galleryConfig ?? EMPTY_GALLERY);

  function switchVariantMetal(key: MetalKey) {
    if (key === activeVariantMetal) return;
    setGalleryOpacity(0);
    setTimeout(() => {
      setActiveVariantMetal(key);
      setGalleryOpacity(1);
    }, 200);
  }

  // Build diamond API URL: scoped when we have a DB ring setting id, otherwise all diamonds
  // Look up the DB metal key (e.g. 'white_gold_18k') from the display label
  const isVideo = (url: string) => url.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) !== null;
  const selectedMetalId = METALS.find(m => m.label === selectedMetal)?.id ?? selectedMetal
  const diamondApiUrl = ringSettingId
    ? `/api/diamonds?ring_setting_id=${ringSettingId}&metal=${encodeURIComponent(selectedMetalId)}`
    : '/api/diamonds'

  // Pre-warm the SWR cache so diamonds are ready before the panel opens
  useSWR(diamondApiUrl, (url: string) => fetch(url).then(r => r.json()).then((d: { diamonds: Diamond[] }) => d.diamonds), { revalidateOnFocus: false });

  // Filter media by selected metal; fall back to untagged (null) if no metal-specific images exist
  const filteredMedia = (() => {
    const specific = ring.media.filter(m => m.metal === selectedMetalId);
    if (specific.length > 0) return specific;
    const generic = ring.media.filter(m => !m.metal);
    return generic.length > 0 ? generic : ring.media;
  })();
  const video360Url   = filteredMedia.find(m => isVideo(m.url))?.url ?? null;
  const displayImages = filteredMedia.filter(m => !isVideo(m.url)).map(m => m.url);

  // Grid dimensions — computed before return so no IIFE needed in JSX
  const gridItems = (video360Url ? 1 : 0) + displayImages.length;
  const gridRows  = Math.max(1, Math.ceil(gridItems / 2));

  const [metalOpen,       setMetalOpen]       = useState(false);
  const [diamondOpen,     setDiamondOpen]     = useState(false);
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null);
  const { toggle, has } = useShortlist();

  const shortlistId   = `ring-${slug}`;
  const isShortlisted = has(shortlistId);

  function buildShortlistItem(): ShortlistItem {
    return {
      id:             shortlistId,
      category:       'Engagement Rings',
      name:           ring.name,
      subtitle:       ring.subtitle,
      image:          displayImages[0] ?? ring.media[0]?.url ?? '',
      href:           `/engagement-rings/${slug}`,
      metal:          selectedMetal,
      basePrice:      ring.basePrice,
      diamondCarat:   selectedDiamond?.carat,
      diamondColor:   selectedDiamond?.color,
      diamondClarity: selectedDiamond?.clarity,
      diamondPrice:   selectedDiamond?.price,
      totalPrice,
      savedAt:        Date.now(),
    };
  }

  const totalPrice  = ring.basePrice + (selectedDiamond?.price ?? 0);
  const displayPrice = selectedDiamond
    ? `£${totalPrice.toLocaleString('en-GB')}`
    : `Starting from £${ring.basePrice.toLocaleString('en-GB')}`;

  const metalMeta = METALS.find(m => m.label === selectedMetal) ?? METALS[0];

  // Live size preview — scale the ring image proportionally to the diamond carat
  // Baseline: 1.0ct = scale 1.0. Range: 0.5ct → 0.88, 3ct → 1.22
  const diamondScale = selectedDiamond
    ? Math.min(1.28, Math.max(0.82, 0.88 + (selectedDiamond.carat / 3) * 0.4))
    : 1.0;

  return (
    <>
      <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>

        {/* ── BREADCRUMB — pt clears fixed header ────────────────────────── */}
        <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
          <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
          <Link href="/engagement-rings" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Engagement Rings</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
          <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{ring.name}</span>
        </nav>

        {/* ── SPLIT LAYOUT ───────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row">

          {/* LEFT — gallery with optional metal variant tabs */}
          <div
            className="lg:w-[58%] lg:sticky lg:top-[80px]"
            style={{ maxHeight: 'calc(100vh - 80px)', overflow: 'hidden', padding: 8, background: '#fff' }}
          >
            {/* Metal variant tabs — only shown when there are multiple enabled variants */}
            {enabledVariants.length > 1 && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {enabledVariants.map(v => {
                  const act = v.metal === activeVariantMetal;
                  return (
                    <button
                      key={v.metal}
                      type="button"
                      onClick={() => switchVariantMetal(v.metal)}
                      style={{
                        fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.14em',
                        textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer',
                        border: `1px solid ${act ? G : '#e8e8e8'}`,
                        background: act ? G : '#fff',
                        color: act ? '#fff' : G,
                      }}
                    >
                      {METAL_DISPLAY[v.metal]}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ opacity: galleryOpacity, transition: 'opacity 0.2s ease' }}>
              <ProductGallery data={effectiveGalleryData} />
            </div>
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
              {ring.name}
            </h1>

            {/* Subtitle + price on same row, exactly like Tiffany */}
            <div className="flex items-baseline justify-between mt-2 gap-4">
              <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>
                {ring.subtitle}
              </p>
              <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>
                {displayPrice}
              </p>
            </div>

            {/* Divider */}
            <div className="mt-8 mb-0" style={{ height: 1, backgroundColor: BORDER }} />

            {/* Ring Style row — label left, current metal + chevron right */}
            <button
              type="button"
              onClick={() => setMetalOpen(v => !v)}
              className="flex items-center justify-between w-full py-4 text-left"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                Ring Style
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
                {ring.materials.map(m => {
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

            {/* Diamond row */}
            <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                Diamond
              </span>
              {selectedDiamond ? (
                <button
                  type="button"
                  onClick={() => setDiamondOpen(true)}
                  className="font-sans"
                  style={{ fontSize: 13, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {selectedDiamond.carat.toFixed(2)} ct · {selectedDiamond.color} · {selectedDiamond.clarity}
                </button>
              ) : (
                <span className="font-sans" style={{ fontSize: 13, color: '#bbb', fontWeight: 300 }}>
                  Not yet selected
                </span>
              )}
            </div>

            {/* SELECT / CHANGE DIAMOND */}
            <button
              type="button"
              onClick={() => setDiamondOpen(true)}
              className="w-full font-sans uppercase mt-8 py-4"
              style={{
                fontSize: 11, letterSpacing: '0.28em',
                backgroundColor: selectedDiamond ? '#fff' : G,
                color:           selectedDiamond ? G      : '#fff',
                border:          selectedDiamond ? `1px solid ${G}` : 'none',
              }}
            >
              {selectedDiamond ? 'Change Diamond' : 'Select a Diamond'}
            </button>

            {/* ADD TO BAG — only once diamond is chosen */}
            {selectedDiamond && (
              <button
                type="button"
                className="w-full font-sans uppercase mt-3 py-4"
                style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
              >
                Add to Bag — £{totalPrice.toLocaleString('en-GB')}
              </button>
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
                Prefer to speak with an Éclat diamond expert?
              </p>
              <Link
                href="/contact"
                className="flex items-center justify-center w-full font-sans uppercase mt-3 py-3 transition-opacity hover:opacity-70"
                style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}
              >
                Speak to a Consultant
              </Link>
            </div>

            {/* Divider */}
            <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />

            {/* Description */}
            <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>
              {ring.description}
            </p>

            {/* Service promises — thin rule between, exactly Tiffany */}
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
      </div>

      {/* ── HEADER REPEAT BAR ───────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #f0f0f0', backgroundColor: '#ffffff' }}>
        <div className="relative flex h-20 items-center px-8 md:px-16">
          {/* Hamburger */}
          <div className="flex flex-col gap-[5px]">
            <span className="block h-px w-6" style={{ backgroundColor: G }} />
            <span className="block h-px w-6" style={{ backgroundColor: G }} />
            <span className="block h-px w-4" style={{ backgroundColor: G }} />
          </div>

          {/* Wordmark — centred */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-4 whitespace-nowrap"
          >
            <span className="font-display" style={{ color: G, fontSize: 'clamp(20px, 2.2vw, 30px)', fontWeight: 300, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Éclat Grandeur
            </span>
            <span className="self-stretch" style={{ width: 1, backgroundColor: `${G}30`, margin: '2px 0' }} aria-hidden="true" />
            <span className="font-sans" style={{ color: `${G}55`, fontSize: 'clamp(8px, 0.65vw, 10px)', fontWeight: 300, letterSpacing: '0.35em', textTransform: 'uppercase' }}>
              Est.&nbsp;1975
            </span>
          </Link>

          {/* Right links */}
          <div className="ml-auto flex items-center gap-6">
            <Link href="/about" className="font-sans uppercase transition-opacity hover:opacity-50" style={{ fontSize: 9, letterSpacing: '0.25em', color: G, fontWeight: 300 }}>About Us</Link>
            <Link href="/account" className="font-sans uppercase transition-opacity hover:opacity-50" style={{ fontSize: 9, letterSpacing: '0.25em', color: G, fontWeight: 300 }}>My Account</Link>
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: `${G}12` }} />
      </div>

      {/* ── DIAMOND SELECTOR DRAWER — z above header (z-[70]) ────────────── */}
      {diamondOpen && (
        <div
          className="fixed inset-0 z-[80]"
          onClick={(e) => { if (e.target === e.currentTarget) setDiamondOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/5" />
          <div
            className="absolute right-0 top-0 bottom-0 flex flex-col bg-white"
            style={{ width: 'min(520px, 96vw)', boxShadow: '-4px 0 40px rgba(0,0,0,0.10)' }}
          >
            <DiamondSelector
              onClose={() => setDiamondOpen(false)}
              onSelect={(d) => { setSelectedDiamond(d); setDiamondOpen(false); }}
              selectedId={selectedDiamond?.id ?? null}
              diamondApiUrl={diamondApiUrl}
            />
          </div>
        </div>
      )}
    </>
  );
}
