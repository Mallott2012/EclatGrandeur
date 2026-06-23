'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, EyeOff, Plus } from 'lucide-react';

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
  published: boolean;
  editHref:  string;
}

interface Props {
  title:     string;
  lede:      string;
  addHref:   string;
  products:  AdminProduct[];
  itemLabel: string;
}

export function AdminProductGrid({ title, lede, addHref, products, itemLabel }: Props) {
  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER — exact mirror of EditorialListing ─────────── */}
      <div style={{ paddingTop: 40, paddingBottom: 48, textAlign: 'center', borderBottom: `1px solid ${BORDER}` }}>
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

      {/* ── TOOLBAR ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '0 clamp(24px, 5vw, 80px)', height: 50, borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}>
          {products.length} {products.length === 1 ? itemLabel : `${itemLabel}s`}
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

      {/* ── EDITORIAL ROWS ─────────────────────────────────────────────── */}
      {products.length === 0 ? (
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
        <div style={{ padding: '40px clamp(24px, 6vw, 96px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {products.map((product, index) => {
            const mediaLeft = index % 2 === 0;
            return (
              <div
                key={product.id}
                className="group relative flex flex-col md:flex-row"
                style={{ border: `1px solid ${BORDER}`, marginBottom: 0 }}
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
                  {product.video ? (
                    <video
                      src={product.video}
                      autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                    />
                  ) : product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                      sizes="50vw"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#c8c8c8' }}>No media</p>
                    </div>
                  )}

                  {/* Draft badge */}
                  {!product.published && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 10px' }}>
                      <EyeOff className="w-2.5 h-2.5" strokeWidth={2} />
                      Draft
                    </div>
                  )}

                  {/* Edit overlay on hover */}
                  <Link
                    href={product.editHref}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(26,43,26,0.18)', backdropFilter: 'blur(2px)' }}
                    aria-label={`Edit ${product.name}`}
                  >
                    <span className="flex items-center gap-2 font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#fff', background: 'rgba(26,43,26,0.88)', padding: '12px 24px' }}>
                      <Pencil className="w-3 h-3" strokeWidth={2} />
                      Edit
                    </span>
                  </Link>
                </div>

                {/* ── PRODUCT CARD HALF — isolated ring, name + price below ── */}
                <div
                  className={`w-full md:w-1/2 flex flex-col ${mediaLeft ? 'md:order-2' : 'md:order-1'}`}
                  style={{ backgroundColor: '#f5f4f2' }}
                >
                  {/* Image area */}
                  <div className="relative flex-1" style={{ minHeight: 380 }}>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
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

                  {/* Name + price + edit button */}
                  <div style={{ backgroundColor: '#fff', padding: '28px 32px', borderTop: `1px solid ${BORDER}` }}>
                    <p className="font-display" style={{ fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.3 }}>
                      {product.name}
                    </p>
                    <p className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#777', letterSpacing: '0.02em', marginTop: 10 }}>
                      {product.price}
                    </p>
                    <Link
                      href={product.editHref}
                      className="inline-flex items-center gap-2 font-sans uppercase mt-5"
                      style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${G}`, padding: '9px 20px' }}
                    >
                      <Pencil className="w-3 h-3" strokeWidth={1.8} />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
