'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, X } from 'lucide-react';

const G      = '#1a2b1a';
const STONE  = '#f5f3ef';
const BORDER = '#e8e8e8';
const MUTED  = '#aaa';

const METALS = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

export interface EditorialItem {
  id:       string;
  slug:     string;
  name:     string;
  subtitle: string;       // e.g. collection name or style
  price:    string;
  image:    string;       // URL — primary still product image
  video?:   string;       // URL — optional hero video for this piece
  metal?:   string;       // optional — for ring metal filtering
  style?:   string;       // optional — for jewellery style filtering
}

export interface EditorialListingProps {
  categoryTitle:  string;             // e.g. "Engagement Rings"
  categoryLede:   string;             // one atmospheric line e.g. "Crafted to last a lifetime"
  basePath:       string;             // e.g. "/engagement-rings"
  itemLabel:      string;             // singular — "ring", "necklace"
  styles?:        { id: string; label: string }[];
  items:          EditorialItem[];
  enableMetals?:  boolean;
}

export function EditorialListing({
  categoryTitle,
  categoryLede,
  basePath,
  itemLabel,
  styles = [],
  items,
  enableMetals = false,
}: EditorialListingProps) {
  const [activeStyle,  setActiveStyle]  = useState<string | null>(null);
  const [activeMetal,  setActiveMetal]  = useState<string | null>(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  const filtered = items.filter(item => {
    if (activeStyle && item.style !== activeStyle) return false;
    if (activeMetal && item.metal !== activeMetal)  return false;
    return true;
  });

  const activeFilterCount = [activeStyle, activeMetal].filter(Boolean).length;

  function clearAll() {
    setActiveStyle(null);
    setActiveMetal(null);
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER ─────────────────────────────────────────────── */}
      <div style={{ paddingTop: 120, paddingBottom: 56, textAlign: 'center' }}>
        <p
          className="font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.36em', color: MUTED, marginBottom: 22 }}
        >
          Éclat Grandeur
        </p>
        <h1
          className="font-display text-balance"
          style={{
            fontSize: 'clamp(44px, 6vw, 78px)',
            fontWeight: 300,
            letterSpacing: '0.04em',
            lineHeight: 1.0,
            color: G,
          }}
        >
          {categoryTitle}
        </h1>
        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: G,
            margin: '28px auto 22px',
            opacity: 0.3,
          }}
        />
        <p
          className="font-sans"
          style={{ fontSize: 12, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', fontWeight: 300 }}
        >
          {categoryLede}
        </p>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 bg-white flex items-center justify-between"
        style={{
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 clamp(24px, 5vw, 80px)',
          height: 50,
        }}
      >
        <span className="font-sans" style={{ fontSize: 11, color: '#c8c8c8', letterSpacing: '0.08em' }}>
          {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`}
        </span>

        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 font-sans"
          style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: G }}
        >
          Refine
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <span
              style={{
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: G, color: '#fff',
                fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── ACTIVE FILTER CHIPS ─────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div
          className="flex items-center gap-3 flex-wrap"
          style={{ padding: '12px clamp(24px, 5vw, 80px)', borderBottom: `1px solid ${BORDER}` }}
        >
          {activeStyle && (
            <button
              type="button"
              onClick={() => setActiveStyle(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.04em' }}
            >
              {styles.find(s => s.id === activeStyle)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          {activeMetal && (
            <button
              type="button"
              onClick={() => setActiveMetal(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.04em' }}
            >
              {METALS.find(m => m.id === activeMetal)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="font-sans"
            style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.04em', textDecoration: 'underline' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── EDITORIAL ROWS ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '120px 0', textAlign: 'center' }}>
          <p
            className="font-display"
            style={{ fontSize: 28, fontWeight: 300, color: '#ccc', letterSpacing: '0.04em' }}
          >
            No {itemLabel}s available yet
          </p>
          <p
            className="font-sans"
            style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 16 }}
          >
            New pieces are added regularly
          </p>
        </div>
      ) : (
        <div style={{ padding: '48px clamp(24px, 6vw, 96px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((item, index) => {
            const mediaLeft = index % 2 === 0;

            return (
              <Link
                key={item.id}
                href={`${basePath}/${item.slug}`}
                className="group flex flex-col md:flex-row"
                style={{ border: `1px solid ${BORDER}`, marginBottom: 24 }}
              >
                {/* ── MEDIA HALF — full-bleed video or cover image ── */}
                <div
                  className={`relative w-full md:w-1/2 overflow-hidden ${mediaLeft ? 'md:order-1' : 'md:order-2'}`}
                  style={{
                    minHeight: 480,
                    backgroundColor: STONE,
                    borderRight: mediaLeft ? `1px solid ${BORDER}` : 'none',
                    borderLeft:  mediaLeft ? 'none' : `1px solid ${BORDER}`,
                  }}
                >
                  {item.video ? (
                    <video
                      src={item.video}
                      autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                    />
                  ) : item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                      sizes="50vw"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>No media</p>
                    </div>
                  )}
                </div>

                {/* ── PRODUCT CARD HALF — light bg, ring isolated, name + price below ── */}
                <div
                  className={`w-full md:w-1/2 flex flex-col ${mediaLeft ? 'md:order-2' : 'md:order-1'}`}
                  style={{ backgroundColor: '#f5f4f2' }}
                >
                  {/* Image area — takes most of the space */}
                  <div className="relative flex-1" style={{ minHeight: 380 }}>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-12 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                        sizes="50vw"
                        priority={index < 2}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>No image</p>
                      </div>
                    )}
                  </div>

                  {/* Name + price strip — below the image, white bg */}
                  <div style={{ backgroundColor: '#fff', padding: '28px 32px', borderTop: `1px solid ${BORDER}` }}>
                    <p
                      className="font-display"
                      style={{ fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.3 }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="font-sans"
                      style={{ fontSize: 13, fontWeight: 300, color: '#777', letterSpacing: '0.02em', marginTop: 10 }}
                    >
                      {item.price}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── FILTERS DRAWER ──────────────────────────────────────────────── */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.12)' }}
          onClick={() => setFiltersOpen(false)}
        />
      )}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white"
        style={{
          width: 300,
          transform: filtersOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0,0.12,1)',
          boxShadow: '-2px 0 40px rgba(0,0,0,0.08)',
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-7 py-6"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.32em', color: G }}>
            Refine
          </span>
          <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-8 space-y-10">
          {/* Style filter */}
          {styles.length > 0 && (
            <div>
              <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.32em', color: '#bbb' }}>
                Style
              </p>
              {styles.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStyle(prev => prev === s.id ? null : s.id)}
                  className="flex items-center justify-between w-full py-3.5 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeStyle === s.id ? G : '#666',
                    fontWeight: activeStyle === s.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {s.label}
                  {activeStyle === s.id && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Metal filter */}
          {enableMetals && (
            <div>
              <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.32em', color: '#bbb' }}>
                Metal
              </p>
              {METALS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                  className="flex items-center justify-between w-full py-3.5 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeMetal === m.id ? G : '#666',
                    fontWeight: activeMetal === m.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {m.label}
                  {activeMetal === m.id && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => { clearAll(); setFiltersOpen(false); }}
              className="font-sans"
              style={{ fontSize: 11, color: '#bbb', textDecoration: 'underline', letterSpacing: '0.06em' }}
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="px-7 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="w-full font-sans uppercase py-4"
            style={{ fontSize: 10, letterSpacing: '0.32em', backgroundColor: G, color: '#fff' }}
          >
            View {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`}
          </button>
        </div>
      </div>

    </div>
  );
}
