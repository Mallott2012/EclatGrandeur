'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Share2 } from 'lucide-react';
import { DiamondSelector } from './DiamondSelector';

const GREEN = '#1a2b1a';

interface Diamond {
  id: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  price: number;
}

interface RingData {
  slug: string;
  name: string;
  subtitle: string;
  basePrice: number;
  metal: string;
  description: string;
  image: string;
  images?: string[];
  setting: string;
  materials: string[];
}

// All rings catalogue — in production this would come from the DB
const RINGS: Record<string, RingData> = {
  'eclat-solitaire': {
    slug: 'eclat-solitaire',
    name: 'The Éclat Solitaire',
    subtitle: 'Engagement Ring in Platinum',
    basePrice: 4800,
    metal: 'Platinum',
    description: 'A modern interpretation of the classic six-prong solitaire. The elevated basket setting allows maximum light to enter the diamond from every angle, bringing out its natural brilliance and fire.',
    image: '/images/engagement/hero-solitaire.png',
    setting: 'Solitaire',
    materials: ['Platinum', '18k White Gold', '18k Yellow Gold', '18k Rose Gold'],
  },
  'lumiere-halo': {
    slug: 'lumiere-halo',
    name: 'Lumière Halo',
    subtitle: 'Engagement Ring with Diamond Halo',
    basePrice: 6200,
    metal: '18k White Gold',
    description: 'A halo of pavé-set diamonds encircles the centre stone, creating an illusion of greater size and unrivalled brilliance. The split shank adds a contemporary elegance.',
    image: '/images/engagement/hero-halo.png',
    setting: 'Halo',
    materials: ['18k White Gold', 'Platinum', '18k Yellow Gold'],
  },
  'trilogy-three-stone': {
    slug: 'trilogy-three-stone',
    name: 'Trilogy Three Stone',
    subtitle: 'Engagement Ring in 18k White Gold',
    basePrice: 7500,
    metal: '18k White Gold',
    description: 'Three diamonds representing the past, present, and future of your love story. Each stone is individually set in a seamless arc of precious metal.',
    image: '/images/engagement/hero-three-stone.png',
    setting: 'Three Stone',
    materials: ['18k White Gold', 'Platinum', '18k Rose Gold'],
  },
  'eclat-pave': {
    slug: 'eclat-pave',
    name: 'Éclat Pavé',
    subtitle: 'Engagement Ring with Pavé Band',
    basePrice: 3900,
    metal: 'Platinum',
    description: 'Micro-pavé diamonds run the full circumference of the band, ensuring brilliance from every angle. The flush-set shank is crafted to sit perfectly against a wedding band.',
    image: '/images/engagement/hero-pave.png',
    setting: 'Pavé',
    materials: ['Platinum', '18k White Gold'],
  },
  'signature-solitaire': {
    slug: 'signature-solitaire',
    name: 'Signature Solitaire',
    subtitle: 'Engagement Ring in Platinum',
    basePrice: 5200,
    metal: 'Platinum',
    description: 'Our signature four-prong design, refined over decades. The minimal prong structure lets the diamond speak for itself — clean, modern, and utterly timeless.',
    image: '/images/engagement/hero-solitaire.png',
    setting: 'Solitaire',
    materials: ['Platinum', '18k White Gold', '18k Yellow Gold', '18k Rose Gold'],
  },
  'constellation-halo': {
    slug: 'constellation-halo',
    name: 'Constellation Halo',
    subtitle: 'Engagement Ring in 18k Yellow Gold',
    basePrice: 8100,
    metal: '18k Yellow Gold',
    description: 'A celestial double-halo design with 64 individually set diamonds creating a starburst effect around the centre stone. Available in warm or cool tones.',
    image: '/images/engagement/hero-halo.png',
    setting: 'Halo',
    materials: ['18k Yellow Gold', 'Platinum', '18k Rose Gold'],
  },
  'classic-round': {
    slug: 'classic-round',
    name: 'Classic Round Brilliant',
    subtitle: 'Engagement Ring in Platinum',
    basePrice: 5500,
    metal: 'Platinum',
    description: 'The quintessential engagement ring. A round brilliant diamond in a six-claw platinum mount — the style that has defined engagement rings for over a century.',
    image: '/images/engagement/hero-collection.png',
    setting: 'Solitaire',
    materials: ['Platinum', '18k White Gold'],
  },
  'vintage-pave': {
    slug: 'vintage-pave',
    name: 'Vintage Pavé Band',
    subtitle: 'Engagement Ring with Diamond Accents',
    basePrice: 2475,
    metal: 'Platinum',
    description: 'Inspired by Edwardian milgrain detailing, this ring features hand-engraved shoulders and a delicate pavé band. A ring for those who appreciate jewellery with a story.',
    image: '/images/engagement/hero-pave.png',
    setting: 'Vintage',
    materials: ['Platinum', '18k White Gold', '18k Yellow Gold'],
  },
  'oval-side-stone': {
    slug: 'oval-side-stone',
    name: 'Oval Side Stone',
    subtitle: 'Engagement Ring in 18k Rose Gold',
    basePrice: 10300,
    metal: '18k Rose Gold',
    description: 'An oval centre diamond flanked by two elegant trillion-cut side stones. The elongated shape flatters the finger and creates a distinctly modern silhouette.',
    image: '/images/engagement/hero-three-stone.png',
    setting: 'Three Stone',
    materials: ['18k Rose Gold', '18k Yellow Gold', 'Platinum'],
  },
};

interface Props { slug: string; }

export function RingDetailPage({ slug }: Props) {
  const ring = RINGS[slug] ?? RINGS['eclat-solitaire'];

  const [selectedMetal,   setSelectedMetal]   = useState(ring.metal);
  const [selectedDiamond, setSelectedDiamond] = useState<Diamond | null>(null);
  const [diamondOpen,     setDiamondOpen]     = useState(false);
  const [metalOpen,       setMetalOpen]       = useState(false);

  const totalPrice = ring.basePrice + (selectedDiamond?.price ?? 0);
  const formattedPrice = selectedDiamond
    ? `£${totalPrice.toLocaleString('en-GB')}`
    : `Starting from £${ring.basePrice.toLocaleString('en-GB')}`;

  return (
    <div style={{ backgroundColor: '#fff', color: GREEN, minHeight: '100vh' }}>

      {/* Breadcrumb */}
      <div className="px-6 lg:px-10 pt-5 pb-4 flex items-center gap-2" style={{ borderBottom: '1px solid #eee' }}>
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em' }}>Home</Link>
        <ChevronRight className="w-3 h-3" style={{ color: '#ccc' }} strokeWidth={1.5} />
        <Link href="/engagement-rings" className="font-sans" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em' }}>
          Engagement Rings
        </Link>
        <ChevronRight className="w-3 h-3" style={{ color: '#ccc' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: GREEN, letterSpacing: '0.08em' }}>{ring.name}</span>
      </div>

      {/* Main 2-col layout */}
      <div className="flex flex-col lg:flex-row">

        {/* ── LEFT — large ring image ────────────────────────────────────── */}
        <div
          className="lg:sticky lg:top-0 lg:self-start flex-1"
          style={{ backgroundColor: '#fafafa', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}
        >
          <div className="relative w-full max-w-sm" style={{ aspectRatio: '1/1' }}>
            <Image
              src={ring.image}
              alt={ring.name}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Caption under image */}
          {selectedDiamond && (
            <div className="mt-8 text-center">
              <p className="font-sans" style={{ fontSize: 13, color: '#888', letterSpacing: '0.04em' }}>
                {selectedDiamond.carat.toFixed(2)} ct · {selectedDiamond.cut} Cut · {selectedMetal}
              </p>
              <p className="font-display mt-1" style={{ fontSize: 20, fontWeight: 300, color: GREEN }}>
                £{(ring.basePrice + selectedDiamond.price).toLocaleString('en-GB')}
              </p>
              <p className="font-sans mt-1" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em' }}>
                Complimentary delivery & returns
              </p>
            </div>
          )}

          {/* Share */}
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{ color: '#bbb' }}
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── RIGHT — configuration panel ───────────────────────────────── */}
        <div
          className="lg:w-96 xl:w-[420px] px-8 py-10 flex flex-col gap-6"
          style={{ borderLeft: '1px solid #eee', flexShrink: 0 }}
        >
          {/* Name + subtitle + price */}
          <div>
            <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 300, lineHeight: 1.2, letterSpacing: '0.02em' }}>
              {ring.name}
            </h1>
            <p className="font-sans mt-1.5" style={{ fontSize: 13, color: '#777', fontWeight: 300 }}>
              {ring.subtitle}
            </p>
            <p className="font-sans mt-3" style={{ fontSize: 15, color: GREEN, fontWeight: 400, letterSpacing: '0.02em' }}>
              {formattedPrice}
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: '#eee' }} />

          {/* Ring style row */}
          <button
            type="button"
            onClick={() => setMetalOpen(v => !v)}
            className="flex items-center justify-between w-full"
          >
            <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>Ring Style</span>
            <span className="flex items-center gap-2 font-sans" style={{ fontSize: 13, color: GREEN }}>
              {selectedMetal}
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
          </button>

          {/* Metal chooser inline */}
          {metalOpen && (
            <div className="grid grid-cols-3 gap-3">
              {ring.materials.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setSelectedMetal(m); setMetalOpen(false); }}
                  className="flex flex-col items-center gap-2 py-3 px-2 border transition-colors"
                  style={{
                    borderColor: selectedMetal === m ? GREEN : '#e5e5e5',
                    backgroundColor: selectedMetal === m ? '#f8f8f6' : '#fff',
                  }}
                >
                  {/* Metal swatch dot */}
                  <span
                    className="rounded-full"
                    style={{
                      width: 16, height: 16,
                      backgroundColor:
                        m.includes('Yellow') ? '#d4a843' :
                        m.includes('Rose')   ? '#c8856a' :
                        m.includes('White')  ? '#c8c8c8' :
                        '#b0b0b0',
                    }}
                  />
                  <span className="font-sans text-center" style={{ fontSize: 10, color: GREEN, lineHeight: 1.3, letterSpacing: '0.04em' }}>
                    {m.replace('18k ', '')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Diamond row */}
          <button
            type="button"
            onClick={() => setDiamondOpen(true)}
            className="flex items-center justify-between w-full"
          >
            <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>Diamond</span>
            <span className="flex items-center gap-2 font-sans" style={{ fontSize: 13, color: GREEN }}>
              {selectedDiamond
                ? `${selectedDiamond.carat.toFixed(2)} ct · ${selectedDiamond.color} · ${selectedDiamond.clarity}`
                : 'Select a Diamond'}
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
          </button>

          <div style={{ height: 1, backgroundColor: '#eee' }} />

          {/* CTA */}
          {selectedDiamond ? (
            <button
              type="button"
              className="w-full font-sans uppercase py-4 transition-opacity hover:opacity-80"
              style={{ fontSize: 11, letterSpacing: '0.3em', backgroundColor: GREEN, color: '#fff' }}
            >
              Add to Bag — £{(ring.basePrice + selectedDiamond.price).toLocaleString('en-GB')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDiamondOpen(true)}
              className="w-full font-sans uppercase py-4 transition-opacity hover:opacity-80"
              style={{ fontSize: 11, letterSpacing: '0.3em', backgroundColor: GREEN, color: '#fff' }}
            >
              Select a Diamond
            </button>
          )}

          {/* Expert link */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 font-sans"
            style={{ fontSize: 12, color: '#888', letterSpacing: '0.04em' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Need a Diamond Expert?
          </button>

          <div style={{ height: 1, backgroundColor: '#eee' }} />

          {/* Description */}
          <div>
            <p className="font-sans uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>About this Ring</p>
            <p className="font-sans" style={{ fontSize: 13, color: '#555', lineHeight: 1.8, fontWeight: 300 }}>
              {ring.description}
            </p>
          </div>

          {/* Service promises */}
          <div className="flex flex-col gap-3 pt-2">
            {[
              'Complimentary Delivery & Returns',
              'Certificate of Authenticity',
              'Lifetime Resizing & Cleaning',
              'Gift-Ready Presentation Box',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ccc', flexShrink: 0 }} />
                <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>{item}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── DIAMOND SELECTOR DRAWER ────────────────────────────────────── */}
      {diamondOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setDiamondOpen(false)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white"
            style={{ width: 'min(520px, 95vw)', boxShadow: '-4px 0 32px rgba(0,0,0,0.1)' }}
          >
            <DiamondSelector
              onClose={() => setDiamondOpen(false)}
              onSelect={(d) => { setSelectedDiamond(d); setDiamondOpen(false); }}
              selectedId={selectedDiamond?.id ?? null}
            />
          </div>
        </>
      )}

    </div>
  );
}
