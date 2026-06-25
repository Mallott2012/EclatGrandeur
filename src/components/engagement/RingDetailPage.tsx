'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { DiamondSelector, type PublicDiamond } from './DiamondSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { Heart } from 'lucide-react';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { trackEvent }  from '@/lib/analytics';
import { useCart }     from '@/lib/store/cart';
import { validateAndReserveConfiguredRing } from '@/app/engagement-rings/[slug]/actions';
import type { DiamondShape, Metal } from '@/types';
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

const VARIANT_SWATCHES: Record<string, string> = {
  'platinum':        '#d0d0d0',
  'white-gold-18k':  '#c8c8c8',
  'yellow-gold-18k': '#c9a84c',
  'rose-gold-14k':   '#c47d68',
};

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

interface RingMediaItem { url: string; metal: string | null; }

interface RingData {
  name:        string;
  subtitle:    string;
  basePrice:   number;
  description: string;
  media:       RingMediaItem[];
  materials:   string[];
}

/** Reusable across Phase 6 basket validation and enquiry. */
export type EngagementRingConfiguration = {
  settingId:      string;
  metalVariantId: string;
  diamondId?:     string;
  ringSize?:      string;
};

interface Props {
  slug:                    string;
  dbRing?:                 RingData | null;
  ringSettingId?:          string | null;
  galleryConfig?:          GalleryData | null;
  metalVariants?:          MetalVariant[] | null;
  compatibleShapes?:       string[];
  minCarat?:               number | null;
  maxCarat?:               number | null;
  initialSelectedDiamond?: PublicDiamond | null;
  initialMetal?:           MetalKey | null;
  /** Phase 5 */
  ringSizes?:              string[];
  requiresRingSize?:       boolean;
  initialSize?:            string | null;
}

export function RingDetailPage({
  slug, dbRing, ringSettingId, galleryConfig, metalVariants,
  compatibleShapes, minCarat, maxCarat,
  initialSelectedDiamond, initialMetal,
  ringSizes = [], requiresRingSize = true, initialSize,
}: Props) {
  const router = useRouter();
  const ring   = dbRing ?? RINGS[slug] ?? FALLBACK;

  const { add: addToCart, cartToken, setOpen: setCartOpen } = useCart();

  const enabledVariants = metalVariants?.filter(v => v.enabled) ?? [];
  const hasVariants     = enabledVariants.length > 0;

  const resolvedInitialMetal: MetalKey | null = (() => {
    if (initialMetal && hasVariants && enabledVariants.some(v => v.metal === initialMetal)) {
      return initialMetal;
    }
    return enabledVariants[0]?.metal ?? null;
  })();

  const [activeVariantMetal, setActiveVariantMetal] = useState<MetalKey | null>(resolvedInitialMetal);
  const [selectedMetal,      setSelectedMetal]      = useState(ring.materials[0]);
  const [galleryOpacity,     setGalleryOpacity]     = useState(1);
  const [metalOpen,          setMetalOpen]          = useState(false);
  const [diamondOpen,        setDiamondOpen]        = useState(false);
  const [sizeOpen,           setSizeOpen]           = useState(false);
  const [selectedDiamond,    setSelectedDiamond]    = useState<PublicDiamond | null>(initialSelectedDiamond ?? null);
  const [selectedRingSize,   setSelectedRingSize]   = useState<string | null>(initialSize ?? null);
  const [incompleteNote,     setIncompleteNote]     = useState<string | null>(null);
  const [isReserving,        setIsReserving]        = useState(false);
  const [reservationError,   setReservationError]   = useState<string | null>(null);
  const incompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCompletedKey = useRef<string | null>(null);

  const { toggle, has } = useShortlist();
  const shortlistId   = `ring-${slug}`;
  const isShortlisted = has(shortlistId);

  // ── Gallery ────────────────────────────────────────────────────────────────────

  const activeVariant = activeVariantMetal
    ? metalVariants?.find(v => v.metal === activeVariantMetal) ?? null
    : null;
  const galleryVariant = (activeVariant?.metal === 'white-gold-18k' && activeVariant.gallery.items.length === 0)
    ? (metalVariants?.find(v => v.metal === 'platinum') ?? activeVariant)
    : activeVariant;
  const effectiveGalleryData = galleryVariant
    ? variantToGalleryData(galleryVariant)
    : (galleryConfig ?? EMPTY_GALLERY);

  const ringStyleLabel  = hasVariants && activeVariantMetal
    ? METAL_DISPLAY[activeVariantMetal]
    : selectedMetal;
  const ringStyleSwatch = hasVariants && activeVariantMetal
    ? (VARIANT_SWATCHES[activeVariantMetal] ?? '#d0d0d0')
    : (METALS.find(m => m.label === selectedMetal)?.swatch ?? '#d0d0d0');

  // ── Price ──────────────────────────────────────────────────────────────────────

  const settingPrice = activeVariant?.price ?? ring.basePrice;
  const diamondPrice = selectedDiamond?.price ?? 0;
  const totalPrice   = settingPrice + diamondPrice;

  const displayPrice = selectedDiamond
    ? `£${totalPrice.toLocaleString('en-GB')}`
    : `Starting from £${settingPrice.toLocaleString('en-GB')}`;

  // ── Configuration completeness ─────────────────────────────────────────────────

  const isComplete = Boolean(selectedDiamond) &&
    (!requiresRingSize || Boolean(selectedRingSize));

  // ── URL helpers ────────────────────────────────────────────────────────────────

  function pushUrl(overrides: {
    metal?:   MetalKey | null;
    diamond?: PublicDiamond | null;
    size?:    string | null;
  } = {}) {
    const params = new URLSearchParams();
    const m = 'metal'   in overrides ? overrides.metal   : activeVariantMetal;
    const d = 'diamond' in overrides ? overrides.diamond : selectedDiamond;
    const s = 'size'    in overrides ? overrides.size    : selectedRingSize;
    if (m) params.set('metal',   m);
    if (d) params.set('diamond', d!.id);
    if (s) params.set('size',    s);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ── Metal switch ───────────────────────────────────────────────────────────────

  function switchVariantMetal(key: MetalKey) {
    if (key === activeVariantMetal) return;
    setGalleryOpacity(0);
    setTimeout(() => { setActiveVariantMetal(key); setGalleryOpacity(1); }, 200);
    pushUrl({ metal: key });
    trackEvent('engagement_metal_selected', {
      settingId:   ringSettingId ?? undefined,
      settingName: ring.name,
      metal:       key,
    });
  }

  // ── Diamond API ────────────────────────────────────────────────────────────────

  const isVideo = (url: string) => url.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) !== null;
  const activeDiamondMetal = hasVariants && activeVariantMetal
    ? activeVariantMetal
    : (METALS.find(m => m.label === selectedMetal)?.id ?? selectedMetal);

  const compatibilityApiUrl = ringSettingId ? `/api/diamonds?ring_setting_id=${ringSettingId}` : null;
  const legacyApiUrl = ringSettingId
    ? `/api/diamonds?ring_setting_id=${ringSettingId}&metal=${encodeURIComponent(activeDiamondMetal)}`
    : '/api/diamonds';
  const diamondApiUrl = compatibilityApiUrl ?? legacyApiUrl;

  useSWR(diamondApiUrl, (url: string) =>
    fetch(url).then(r => r.json()).then((d: { diamonds: PublicDiamond[] }) => d.diamonds),
    { revalidateOnFocus: false },
  );

  // ── Legacy media (non-variant path) ───────────────────────────────────────────

  const filteredMedia = (() => {
    const legacyMetalId = METALS.find(m => m.label === selectedMetal)?.id ?? selectedMetal;
    const specific = ring.media.filter(m => m.metal === legacyMetalId);
    if (specific.length > 0) return specific;
    const generic = ring.media.filter(m => !m.metal);
    return generic.length > 0 ? generic : ring.media;
  })();
  const displayImages = filteredMedia.filter(m => !isVideo(m.url)).map(m => m.url);

  // ── Diamond display ────────────────────────────────────────────────────────────

  function diamondSummaryLine(d: PublicDiamond): string {
    if (d.diamond_category === 'coloured') {
      const intensityLabels: Record<string, string> = {
        fancy_light:   'Fancy Light',
        fancy:         'Fancy',
        fancy_intense: 'Fancy Intense',
        fancy_vivid:   'Fancy Vivid',
      };
      const familyLabels: Record<string, string> = { yellow: 'Yellow', pink: 'Pink' };
      const parts = [`${d.carat.toFixed(2)}ct`];
      if (d.colour_intensity) parts.push(intensityLabels[d.colour_intensity] ?? d.colour_intensity);
      if (d.colour_family)    parts.push(familyLabels[d.colour_family] ?? d.colour_family);
      if (d.shape)            parts.push(d.shape.charAt(0).toUpperCase() + d.shape.slice(1));
      parts.push(`· ${d.clarity}`);
      return parts.join(' ');
    }
    return `${d.carat.toFixed(2)}ct ${d.shape.charAt(0).toUpperCase() + d.shape.slice(1)} · ${d.color} · ${d.clarity}`;
  }

  // ── Diamond select / change ────────────────────────────────────────────────────

  function handleDiamondSelect(d: PublicDiamond) {
    const wasSelected = Boolean(selectedDiamond);
    setSelectedDiamond(d);
    setDiamondOpen(false);
    pushUrl({ diamond: d });
    if (wasSelected) {
      trackEvent('engagement_diamond_changed', {
        settingId:       ringSettingId ?? undefined,
        settingName:     ring.name,
        diamondId:       d.id,
        diamondType:     d.diamond_category,
        diamondShape:    d.shape,
        diamondCarat:    d.carat,
        colourFamily:    d.colour_family ?? undefined,
        colourIntensity: d.colour_intensity ?? undefined,
      });
    }
  }

  function openDiamondSelector() {
    setDiamondOpen(true);
    trackEvent('engagement_diamond_selector_opened', {
      settingId:   ringSettingId ?? undefined,
      settingName: ring.name,
      source:      'product_page',
    });
  }

  // ── Ring size ──────────────────────────────────────────────────────────────────

  function handleSizeSelect(size: string) {
    setSelectedRingSize(size);
    setSizeOpen(false);
    pushUrl({ size });
    trackEvent('engagement_ring_size_selected', {
      settingId:   ringSettingId ?? undefined,
      settingName: ring.name,
      ringSize:    size,
    });
  }

  // ── Configuration complete analytics (fires once per distinct complete state) ──

  useEffect(() => {
    if (!isComplete || !selectedDiamond) return;
    const key = `${activeVariantMetal}-${selectedDiamond.id}-${selectedRingSize ?? ''}`;
    if (lastCompletedKey.current === key) return;
    lastCompletedKey.current = key;
    trackEvent('engagement_configuration_completed', {
      settingId:       ringSettingId ?? undefined,
      settingName:     ring.name,
      metal:           activeVariantMetal ?? undefined,
      diamondId:       selectedDiamond.id,
      diamondType:     selectedDiamond.diamond_category,
      diamondShape:    selectedDiamond.shape,
      diamondCarat:    selectedDiamond.carat,
      colourFamily:    selectedDiamond.colour_family ?? undefined,
      colourIntensity: selectedDiamond.colour_intensity ?? undefined,
      ringSize:        selectedRingSize ?? undefined,
      settingPrice,
      diamondPrice:    selectedDiamond.price,
      totalPrice,
    });
  }, [isComplete, activeVariantMetal, selectedDiamond, selectedRingSize]);

  // ── Incomplete note auto-clear ─────────────────────────────────────────────────

  function showIncompleteNote(msg: string) {
    if (incompleteTimer.current) clearTimeout(incompleteTimer.current);
    setIncompleteNote(msg);
    incompleteTimer.current = setTimeout(() => setIncompleteNote(null), 3500);
  }

  // ── Add to Bag ─────────────────────────────────────────────────────────────────

  async function handleAddToBag() {
    if (!isComplete) {
      if (!selectedDiamond) {
        showIncompleteNote('Please select a diamond to continue.');
      } else {
        showIncompleteNote('Please select a ring size to continue.');
      }
      return;
    }

    if (!ringSettingId || !activeVariant || !selectedDiamond) {
      showIncompleteNote('Please complete all selections to continue.');
      return;
    }

    setReservationError(null);
    setIsReserving(true);

    trackEvent('engagement_add_to_bag_initiated', {
      settingId:       ringSettingId,
      settingName:     ring.name,
      metal:           activeVariantMetal ?? undefined,
      diamondId:       selectedDiamond.id,
      diamondType:     selectedDiamond.diamond_category,
      diamondShape:    selectedDiamond.shape,
      diamondCarat:    selectedDiamond.carat,
      colourFamily:    selectedDiamond.colour_family ?? undefined,
      colourIntensity: selectedDiamond.colour_intensity ?? undefined,
      ringSize:        selectedRingSize ?? undefined,
      settingPrice,
      diamondPrice:    selectedDiamond.price,
      totalPrice,
    });

    try {
      const result = await validateAndReserveConfiguredRing(
        ringSettingId,
        activeVariant.id,
        selectedDiamond.id,
        selectedRingSize,
        cartToken,
      );

      if (!result.ok) {
        setReservationError(result.error);
        trackEvent('engagement_reservation_failed', {
          settingId: ringSettingId,
          diamondId: selectedDiamond.id,
          reservationError: result.error,
        });
        return;
      }

      trackEvent('engagement_reservation_succeeded', {
        settingId:    ringSettingId,
        diamondId:    selectedDiamond.id,
        settingPrice: result.ring.settingPrice / 100,
        diamondPrice: result.ring.diamondPrice / 100,
        totalPrice:   result.ring.totalPrice / 100,
      });

      const cartHref = `/engagement-rings/${slug}?metal=${result.ring.metal}&diamond=${selectedDiamond.id}${selectedRingSize ? `&size=${selectedRingSize}` : ''}`;

      addToCart({
        id:         `ring-${ringSettingId}-${selectedDiamond.id}`,
        name:       ring.name,
        href:       cartHref,
        price:      { amount: result.ring.totalPrice, currency: 'GBP' },
        meta:       result.ring.diamondDescription,
        art:        { kind: 'solitaire-ring', shape: selectedDiamond.shape as DiamondShape, metal: (result.ring.metal as Metal) ?? 'platinum' },
        ringConfig: result.ring,
      });

      trackEvent('engagement_ring_added_to_bag', {
        settingId:   ringSettingId,
        settingName: ring.name,
        diamondId:   selectedDiamond.id,
        totalPrice:  result.ring.totalPrice / 100,
      });

      setCartOpen(true);
    } catch (err) {
      console.error('[add-to-bag]', err);
      setReservationError('Something went wrong. Please try again.');
      trackEvent('engagement_reservation_failed', {
        settingId: ringSettingId,
        diamondId: selectedDiamond.id,
      });
    } finally {
      setIsReserving(false);
    }
  }

  // ── Shortlist ──────────────────────────────────────────────────────────────────

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
      totalPrice:     isComplete ? totalPrice : ring.basePrice,
      savedAt:        Date.now(),
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>

        {/* ── BREADCRUMB ─────────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
          <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
          <Link href="/engagement-rings" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Engagement Rings</Link>
          <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
          <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{ring.name}</span>
        </nav>

        {/* ── SPLIT LAYOUT ───────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row">

          {/* LEFT — gallery (unchanged) */}
          <div
            className="lg:w-[58%] lg:sticky lg:top-[80px]"
            style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}
          >
            <div style={{ opacity: galleryOpacity, transition: 'opacity 0.2s ease' }}>
              <ProductGallery data={effectiveGalleryData} />
            </div>
          </div>

          {/* RIGHT — configuration panel */}
          <div className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col">

            {/* Name */}
            <h1
              className="font-display"
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
            >
              {ring.name}
            </h1>

            {/* Subtitle + price */}
            <div className="flex items-baseline justify-between mt-2 gap-4">
              <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>
                {ring.subtitle}
              </p>
              <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>
                {displayPrice}
              </p>
            </div>

            <div className="mt-8 mb-0" style={{ height: 1, backgroundColor: BORDER }} />

            {/* ── METAL (was RING STYLE) ────────────────────────────────────── */}
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
                <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                  {ringStyleLabel}
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
                {hasVariants ? (
                  enabledVariants.map(v => {
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
                        {v.price && !active && (
                          <span style={{ marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: 10, color: '#aaa' }}>
                            From £{v.price.toLocaleString('en-GB')}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  ring.materials.map(m => {
                    const meta = METALS.find(x => x.label === m) ?? METALS[0];
                    const active = selectedMetal === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMetal(m);
                          setMetalOpen(false);
                          trackEvent('engagement_metal_selected', {
                            settingId: ringSettingId ?? undefined,
                            settingName: ring.name,
                            metal: m,
                          });
                        }}
                        className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                        style={{ fontSize: 13, color: active ? G : '#666', fontWeight: active ? 400 : 300, backgroundColor: active ? '#f9f9f9' : 'transparent' }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: meta.swatch, border: '1px solid #ddd', flexShrink: 0 }} />
                        {m}
                        {active && <span style={{ marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}>Selected</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* ── DIAMOND ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                Diamond
              </span>
              {selectedDiamond ? (
                <button
                  type="button"
                  onClick={openDiamondSelector}
                  className="font-sans text-right"
                  style={{ fontSize: 12, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  {diamondSummaryLine(selectedDiamond)}
                </button>
              ) : (
                <span className="font-sans" style={{ fontSize: 13, color: '#bbb', fontWeight: 300 }}>
                  Not yet selected
                </span>
              )}
            </div>

            {/* SELECT / CHANGE DIAMOND button */}
            <button
              type="button"
              onClick={openDiamondSelector}
              className="w-full font-sans uppercase mt-6 py-4"
              style={{
                fontSize: 11, letterSpacing: '0.28em',
                backgroundColor: selectedDiamond ? '#fff' : G,
                color:           selectedDiamond ? G      : '#fff',
                border:          selectedDiamond ? `1px solid ${G}` : 'none',
              }}
            >
              {selectedDiamond ? 'Change Diamond' : 'Select a Diamond'}
            </button>

            {/* ── RING SIZE — shown only after diamond is selected ──────────── */}
            {selectedDiamond && (
              <>
                <button
                  type="button"
                  onClick={() => setSizeOpen(v => !v)}
                  className="flex items-center justify-between w-full py-4 text-left mt-4"
                  style={{ borderTop: `1px solid ${BORDER}`, borderBottom: sizeOpen ? 'none' : `1px solid ${BORDER}` }}
                >
                  <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                    Ring Size
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-sans" style={{ fontSize: 13, color: selectedRingSize ? G : '#bbb', fontWeight: 300 }}>
                      {selectedRingSize ?? 'Select size'}
                    </span>
                    {ringSizes.length > 0 && (
                      <ChevronDown
                        className="w-3.5 h-3.5"
                        style={{ color: '#bbb', transition: 'transform 0.2s', transform: sizeOpen ? 'rotate(180deg)' : 'none' }}
                        strokeWidth={1.5}
                      />
                    )}
                  </span>
                </button>

                {sizeOpen && ringSizes.length > 0 && (
                  <div style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <div className="flex flex-wrap gap-1.5 py-4">
                      {ringSizes.map(size => {
                        const active = selectedRingSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSizeSelect(size)}
                            className="font-sans"
                            style={{
                              padding: '6px 14px', fontSize: 12,
                              border: `1px solid ${active ? G : '#ddd'}`,
                              backgroundColor: active ? G : '#fff',
                              color: active ? '#fff' : '#555',
                              transition: 'all 0.15s',
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizeOpen && ringSizes.length === 0 && (
                  <div className="py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <p className="font-sans" style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic', letterSpacing: '0.03em' }}>
                      Ring sizes are available on request — speak with a consultant to confirm your size.
                    </p>
                  </div>
                )}

                {!sizeOpen && ringSizes.length === 0 && (
                  <p className="font-sans mt-1" style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>
                    Sizes available on request
                  </p>
                )}
              </>
            )}

            {/* ── YOUR RING SUMMARY — only when configuration is complete ───── */}
            {isComplete && selectedDiamond && (
              <div className="mt-6 mb-2 py-6" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
                  Your Ring
                </p>

                {/* Configuration description */}
                <p className="font-display mb-1" style={{ fontSize: 16, fontWeight: 300, color: G, letterSpacing: '0.04em' }}>
                  {ring.name}
                </p>
                <p className="font-sans mb-0.5" style={{ fontSize: 12, color: '#666', fontWeight: 300 }}>
                  {diamondSummaryLine(selectedDiamond)}
                </p>
                <p className="font-sans mb-0.5" style={{ fontSize: 12, color: '#666', fontWeight: 300 }}>
                  {ringStyleLabel}
                </p>
                {selectedRingSize && (
                  <p className="font-sans mb-0" style={{ fontSize: 12, color: '#666', fontWeight: 300 }}>
                    Ring size: {selectedRingSize}
                  </p>
                )}

                {/* Price breakdown */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans" style={{ fontSize: 11, color: '#888', letterSpacing: '0.04em' }}>Setting</span>
                    <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                      £{settingPrice.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans" style={{ fontSize: 11, color: '#888', letterSpacing: '0.04em' }}>Diamond</span>
                    <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                      £{selectedDiamond.price.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <span className="font-sans uppercase" style={{ fontSize: 10, color: G, letterSpacing: '0.12em', fontWeight: 500 }}>Total</span>
                    <span className="font-sans" style={{ fontSize: 16, color: G, fontWeight: 400 }}>
                      £{totalPrice.toLocaleString('en-GB')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ADD TO BAG ────────────────────────────────────────────────── */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={isReserving}
                className="w-full font-sans uppercase py-4"
                style={{
                  fontSize: 11, letterSpacing: '0.28em',
                  backgroundColor: isComplete && !isReserving ? G : '#d8d8d8',
                  color: '#fff',
                  cursor: isComplete && !isReserving ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
              >
                {isReserving
                  ? 'Reserving…'
                  : isComplete
                    ? `Add to Bag — £${totalPrice.toLocaleString('en-GB')}`
                    : 'Add to Bag'}
              </button>

              {/* Incomplete or reservation error note */}
              {(incompleteNote || reservationError) && (
                <p className="font-sans text-center mt-2" style={{ fontSize: 11, color: '#c0614a', letterSpacing: '0.02em' }}>
                  {incompleteNote ?? reservationError}
                </p>
              )}
            </div>

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

            {/* ── SPEAK TO A CONSULTANT — always available ─────────────────── */}
            <div className="mt-5" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
              <p className="font-sans text-center" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.02em' }}>
                Prefer to speak with an Éclat diamond expert?
              </p>
              <Link
                href="/contact"
                onClick={() => trackEvent('engagement_consultant_clicked', {
                  settingId:   ringSettingId ?? undefined,
                  settingName: ring.name,
                  source:      'product_page',
                })}
                className="flex items-center justify-center w-full font-sans uppercase mt-3 py-3 transition-opacity hover:opacity-70"
                style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}
              >
                Speak to a Consultant
              </Link>
            </div>

            <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />

            {/* Description */}
            <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>
              {ring.description}
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
      </div>

      {/* ── FOOTER HEADER REPEAT ────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #f0f0f0', backgroundColor: '#ffffff' }}>
        <div className="relative flex h-20 items-center px-8 md:px-16">
          <div className="flex flex-col gap-[5px]">
            <span className="block h-px w-6" style={{ backgroundColor: G }} />
            <span className="block h-px w-6" style={{ backgroundColor: G }} />
            <span className="block h-px w-4" style={{ backgroundColor: G }} />
          </div>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-4 whitespace-nowrap">
            <span className="font-display" style={{ color: G, fontSize: 'clamp(20px, 2.2vw, 30px)', fontWeight: 300, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Éclat Grandeur
            </span>
            <span className="self-stretch" style={{ width: 1, backgroundColor: `${G}30`, margin: '2px 0' }} aria-hidden="true" />
            <span className="font-sans" style={{ color: `${G}55`, fontSize: 'clamp(8px, 0.65vw, 10px)', fontWeight: 300, letterSpacing: '0.35em', textTransform: 'uppercase' }}>
              Est.&nbsp;1975
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-6">
            <Link href="/about" className="font-sans uppercase transition-opacity hover:opacity-50" style={{ fontSize: 9, letterSpacing: '0.25em', color: G, fontWeight: 300 }}>About Us</Link>
            <Link href="/account" className="font-sans uppercase transition-opacity hover:opacity-50" style={{ fontSize: 9, letterSpacing: '0.25em', color: G, fontWeight: 300 }}>My Account</Link>
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: `${G}12` }} />
      </div>

      {/* ── DIAMOND SELECTOR DRAWER ─────────────────────────────────────────── */}
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
              onSelect={handleDiamondSelect}
              selectedId={selectedDiamond?.id ?? null}
              ringSettingId={ringSettingId ?? undefined}
              compatibleShapes={compatibleShapes}
              minCarat={minCarat ?? undefined}
              maxCarat={maxCarat ?? undefined}
              settingName={ring.name}
              diamondApiUrl={diamondApiUrl}
            />
          </div>
        </div>
      )}
    </>
  );
}
