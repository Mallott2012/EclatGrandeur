'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, EyeOff, Plus } from 'lucide-react';
import { StyleScroller, type StyleCard } from '@/components/shared/StyleScroller';

const G      = '#1a2b1a';
const STONE  = '#f5f3ef';
const BORDER = '#e8e8e8';
const MUTED  = '#aaa';

export interface AdminProduct {
  id:        string;
  slug:      string;
  name:      string;
  subtitle:  string;
  price:     string;
  image:     string;
  video?:    string;   // optional hero video for this piece
  style?:    string;   // optional — for the style scroller
  published: boolean;
  editHref:  string;
}

interface Props {
  title:     string;
  lede:      string;
  addHref:   string;
  products:  AdminProduct[];
  itemLabel: string;
  styles?:   { id: string; label: string }[];
}

/* ── Admin card — mirrors the public ProductCard, with draft + edit affordances ── */
function AdminCard({ product, priority }: { product: AdminProduct; priority: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const hasVideo = Boolean(product.video);

  function enter() {
    setHovered(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }
  function leave() {
    setHovered(false);
    videoRef.current?.pause();
  }

  return (
    <Link
      href={product.editHref}
      className="group flex flex-col"
      style={{ borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      aria-label={`Edit ${product.name}`}
    >
      <div className="relative overflow-hidden bg-white" style={{ aspectRatio: '1 / 1' }}>
        {/* Still product image */}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={priority}
            className="object-contain transition-opacity duration-700 ease-out"
            style={{ padding: '12%', opacity: hovered && hasVideo ? 0 : 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>
              No image
            </p>
          </div>
        )}

        {/* Hover reveal — hero video */}
        {hasVideo && (
          <video
            ref={videoRef}
            src={product.video}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {/* Draft badge */}
        {!product.published && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 font-sans uppercase"
            style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 10px' }}
          >
            <EyeOff className="w-2.5 h-2.5" strokeWidth={2} />
            Draft
          </div>
        )}

        {/* Edit pill on hover */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <span
            className="flex items-center gap-2 font-sans uppercase"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: '#fff', background: 'rgba(26,43,26,0.9)', padding: '10px 22px' }}
          >
            <Pencil className="w-3 h-3" strokeWidth={2} />
            Edit
          </span>
        </div>
      </div>

      {/* Name + price */}
      <div style={{ padding: '24px 28px 32px' }}>
        <p
          className="font-display"
          style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.3 }}
        >
          {product.name}
        </p>
        <p
          className="font-sans"
          style={{ fontSize: 12, fontWeight: 300, color: '#888', letterSpacing: '0.04em', marginTop: 8 }}
        >
          {product.price}
        </p>
      </div>
    </Link>
  );
}

export function AdminProductGrid({ title, lede, addHref, products, itemLabel, styles = [] }: Props) {
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  const styleHasMatches = activeStyle ? products.some(p => p.style === activeStyle) : false;
  const filtered = products.filter(p => {
    if (activeStyle && styleHasMatches && p.style !== activeStyle) return false;
    return true;
  });

  const styleCards: StyleCard[] = styles.map((s, i) => ({
    id:    s.id,
    label: s.label,
    image: products.find(p => p.style === s.id)?.image
        ?? (products.length ? products[i % products.length].image : undefined),
  }));

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER — mirror of the public listing ─────────────── */}
      <div style={{ paddingTop: 40, paddingBottom: 40, textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
        <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.36em', color: MUTED, marginBottom: 18 }}>
          Admin
        </p>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.0, color: G }}
        >
          {title}
        </h1>
        <div style={{ width: 40, height: 1, backgroundColor: G, margin: '24px auto 18px', opacity: 0.2 }} />
        <p className="font-sans" style={{ fontSize: 11, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', fontWeight: 300 }}>
          {lede}
        </p>
      </div>

      {/* ── STYLE SCROLLER — identical to the public page ──────────────── */}
      <StyleScroller
        cards={styleCards}
        activeId={activeStyle}
        onSelect={(id) => setActiveStyle(prev => (prev === id ? null : id))}
      />

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 clamp(24px, 5vw, 80px)', height: 50, borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}>
          {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`}
        </span>
        <Link
          href={addHref}
          className="flex items-center gap-2 font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '7px 16px' }}
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add New
        </Link>
      </div>

      {/* ── PRODUCT GRID ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '120px 0', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 26, fontWeight: 300, color: '#ccc', letterSpacing: '0.04em' }}>
            No {itemLabel}s yet
          </p>
          <Link
            href={addHref}
            className="inline-flex items-center gap-2 font-sans uppercase mt-8"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '10px 22px' }}
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add First {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}
          </Link>
        </div>
      ) : (
        <div style={{ paddingTop: 'clamp(40px, 5vw, 72px)' }}>
          <div
            className="grid grid-cols-2 md:grid-cols-3"
            style={{ borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}
          >
            {filtered.map((product, index) => (
              <AdminCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
