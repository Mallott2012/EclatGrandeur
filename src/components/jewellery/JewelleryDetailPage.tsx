'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { DiamondSelector } from '@/components/engagement/DiamondSelector';

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
  images: string[];
  materials: string[];
}

export interface JewelleryDetailConfig {
  categoryLabel: string;    // e.g. 'Necklaces'
  categoryPath: string;     // e.g. '/necklaces'
}

interface Props {
  product: JewelleryDetailProduct;
  config: JewelleryDetailConfig;
}

export function JewelleryDetailPage({ product, config }: Props) {
  const [selectedMetal,   setSelectedMetal]   = useState(product.materials[0]);
  const [activeImage,     setActiveImage]     = useState(0);
  const [metalOpen,       setMetalOpen]       = useState(false);
  const [diamondOpen,     setDiamondOpen]     = useState(false);
  const [selectedDiamond, setSelectedDiamond] = useState<{ id: string; carat: number; color: string; clarity: string; price: number } | null>(null);

  const displayPrice = `Starting from £${product.basePrice.toLocaleString('en-GB')}`;
  const metalMeta    = METALS.find(m => m.label === selectedMetal) ?? METALS[0];

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

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

        {/* LEFT — sticky image panel */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-0 lg:h-screen flex flex-col"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center p-10 lg:p-16">
            <div className="relative w-full" style={{ maxWidth: 500, aspectRatio: '1/1' }}>
              <Image
                key={activeImage}
                src={product.images[activeImage]}
                alt={`${product.name} — view ${activeImage + 1}`}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
          </div>

          {/* Thumbnail row */}
          <div className="flex items-center justify-center gap-3 pb-8">
            {product.images.map((img, i) => (
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

          {/* Diamond row */}
          <button
            type="button"
            onClick={() => setDiamondOpen(true)}
            className="flex items-center justify-between w-full py-4 text-left"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
              Diamond
            </span>
            <span className="flex items-center gap-2">
              <span className="font-sans" style={{ fontSize: 13, color: selectedDiamond ? G : '#aaa', fontWeight: 300 }}>
                {selectedDiamond
                  ? `${selectedDiamond.carat.toFixed(2)} ct · ${selectedDiamond.clarity} ${selectedDiamond.color}`
                  : 'Select a Diamond'}
              </span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#bbb' }} strokeWidth={1.5} />
            </span>
          </button>

          {/* Add to Bag CTA */}
          <button
            type="button"
            className="w-full font-sans uppercase mt-8 py-4"
            style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
          >
            Add to Bag
          </button>

          {/* Expert link */}
          <p className="font-sans text-center mt-5" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.02em' }}>
            Need an Éclat jewellery expert?{' '}
            <Link
              href="/contact"
              style={{ color: G, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Book an appointment
            </Link>
          </p>

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
              selectedId={selectedDiamond?.id ?? null}
              onClose={() => setDiamondOpen(false)}
              onSelect={d => { setSelectedDiamond(d); setDiamondOpen(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
