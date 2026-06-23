'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { DiamondSelector } from './DiamondSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { Heart } from 'lucide-react';

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
  cut: string;
  price: number;
}

const RINGS: Record<string, {
  name: string; subtitle: string; basePrice: number;
  description: string; images: string[]; materials: string[];
}> = {
  'eclat-solitaire':    { name: 'The Éclat Solitaire',  subtitle: 'Engagement Ring', basePrice: 4800,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold', '18k Rose Gold'], images: ['/images/rings/ring-1.png', '/images/rings/ring-3.png', '/images/rings/ring-7.png'], description: 'The Éclat Solitaire is the definitive expression of the solitaire engagement ring. A single brilliant-cut diamond elevated on a slender platinum band, placing all focus on the diamond. Handcrafted to order in our London atelier.' },
  'lumiere-halo':       { name: 'Lumière Halo',         subtitle: 'Engagement Ring', basePrice: 6200,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], images: ['/images/rings/ring-2.png', '/images/rings/ring-5.png', '/images/rings/ring-8.png'], description: 'A brilliant-cut diamond encircled by a halo of pavé-set diamonds, dramatically amplifying the appearance of the centre stone. Set in platinum with a split-shank band.' },
  'trilogy':            { name: 'The Trilogy',          subtitle: 'Three Stone Engagement Ring', basePrice: 7500, materials: ['Platinum', '18k White Gold'], images: ['/images/rings/ring-3.png', '/images/rings/ring-1.png', '/images/rings/ring-9.png'], description: 'Three brilliant diamonds representing the past, present and future. The Trilogy is one of the most meaningful and enduring of all engagement ring designs.' },
  'oval-solitaire':     { name: 'Oval Solitaire',       subtitle: 'Engagement Ring', basePrice: 3850,  materials: ['Platinum', '18k White Gold', '18k Rose Gold'], images: ['/images/rings/ring-4.png', '/images/rings/ring-2.png', '/images/rings/ring-6.png'], description: 'An elongated oval brilliant-cut diamond in a classic four-claw solitaire setting. The oval silhouette creates the appearance of longer, more slender fingers.' },
  'constellation':      { name: 'Constellation Pavé',  subtitle: 'Pavé Band Engagement Ring', basePrice: 4100, materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], images: ['/images/rings/ring-5.png', '/images/rings/ring-4.png', '/images/rings/ring-8.png'], description: 'A brilliant-cut centre diamond set above a band of continuous pavé-set diamonds. Each stone hand-selected and individually set for seamless, scintillating brilliance.' },
  'cushion-soleste':    { name: 'Cushion Soleste',      subtitle: 'Halo Engagement Ring', basePrice: 5650, materials: ['Platinum', '18k Yellow Gold'], images: ['/images/rings/ring-6.png', '/images/rings/ring-2.png', '/images/rings/ring-5.png'], description: 'A cushion-cut diamond surrounded by two rows of brilliants in the signature Soleste halo setting. The double halo creates exceptional fire and brilliance.' },
  'emerald-solitaire':  { name: 'Emerald Solitaire',   subtitle: 'Engagement Ring', basePrice: 4450,  materials: ['Platinum', '18k White Gold'], images: ['/images/rings/ring-7.png', '/images/rings/ring-3.png', '/images/rings/ring-9.png'], description: 'The architectural clarity of an emerald-cut diamond in a clean four-claw setting. Step-cut facets create broad flashes of light distinct from brilliant-cut diamonds.' },
  'vintage-halo':       { name: 'Vintage Halo',        subtitle: 'Vintage-Style Engagement Ring', basePrice: 6200, materials: ['Platinum', '18k White Gold'], images: ['/images/rings/ring-8.png', '/images/rings/ring-1.png', '/images/rings/ring-4.png'], description: 'Inspired by the jewellery of the Art Deco period, the Vintage Halo features milgrain detailing and hand-engraving around a brilliant-cut diamond halo.' },
  'princess-solitaire': { name: 'Princess Solitaire',  subtitle: 'Engagement Ring', basePrice: 3700,  materials: ['Platinum', '18k White Gold', '18k Yellow Gold'], images: ['/images/rings/ring-9.png', '/images/rings/ring-6.png', '/images/rings/ring-2.png'], description: 'A square princess-cut diamond in a modern four-claw solitaire. The sharp corners maximise the diamond\'s brilliance and surface area.' },
};

const FALLBACK = RINGS['eclat-solitaire'];

interface Props { slug: string; }

export function RingDetailPage({ slug }: Props) {
  const ring = RINGS[slug] ?? FALLBACK;

  const [selectedMetal,   setSelectedMetal]   = useState(ring.materials[0]);
  const [activeImage,     setActiveImage]     = useState(0);
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
      image:          ring.images[0],
      href:           `/engagement-rings/${slug}`,
      metal:          selectedMetal,
      basePrice:      ring.basePrice,
      diamondCarat:   selectedDiamond?.carat,
      diamondColor:   selectedDiamond?.color,
      diamondClarity: selectedDiamond?.clarity,
      diamondCut:     selectedDiamond?.cut,
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
      <div className="min-h-screen bg-white" style={{ color: G }}>

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

          {/* LEFT — image panel, sticky on desktop, pure white */}
          <div className="lg:w-[58%] lg:sticky lg:top-0 lg:h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>

            {/* Main image */}
            <div className="flex-1 flex items-center justify-center p-10 lg:p-16">
              <div className="relative w-full" style={{ maxWidth: 500, aspectRatio: '1/1' }}>
                <Image
                  key={activeImage}
                  src={ring.images[activeImage]}
                  alt={`${ring.name} — view ${activeImage + 1}`}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  style={{ transform: `scale(${diamondScale})`, transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', transformOrigin: 'center center' }}
                />
                {selectedDiamond && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#aaa' }}>
                      {selectedDiamond.carat.toFixed(2)}ct · approximate size
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail row */}
            <div className="flex items-center justify-center gap-3 pb-8">
              {ring.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`View ${i + 1}`}
                  className="relative flex-shrink-0"
                  style={{
                    width: 60, height: 60,
                    border: i === activeImage ? `1px solid ${G}` : `1px solid ${BORDER}`,
                    padding: 4,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Image src={img} alt="" fill className="object-contain" sizes="60px" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — configuration panel */}
          <div
            className="lg:w-[42%] px-8 lg:px-12 pt-12 pb-20 flex flex-col"
            style={{ borderLeft: `1px solid ${BORDER}` }}
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

            {/* SELECT A DIAMOND — full-width dark button, exactly Tiffany */}
            <button
              type="button"
              onClick={() => setDiamondOpen(true)}
              className="w-full font-sans uppercase mt-8 py-4"
              style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
            >
              {selectedDiamond ? 'Change Diamond' : 'Select a Diamond'}
            </button>

            {/* Secondary CTA once diamond chosen */}
            {selectedDiamond && (
              <button
                type="button"
                className="w-full font-sans uppercase mt-3 py-4"
                style={{
                  fontSize: 11, letterSpacing: '0.28em',
                  backgroundColor: '#fff', color: G,
                  border: `1px solid ${G}`,
                }}
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

            {/* Expert link — exactly Tiffany */}
            <p className="font-sans text-center mt-5" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.02em' }}>
              Need an Éclat Diamond Expert?{' '}
              <Link
                href="/contact"
                style={{ color: G, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                Book an appointment
              </Link>
            </p>

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
            />
          </div>
        </div>
      )}
    </>
  );
}
