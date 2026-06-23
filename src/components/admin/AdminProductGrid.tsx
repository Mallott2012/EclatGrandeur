'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, EyeOff, Plus, ArrowRight } from 'lucide-react';

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
        <div style={{ padding: '40px clamp(24px, 6vw, 96px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {products.map((product, index) => {
            const imageLeft = index % 2 === 0;
            return (
              <div
                key={product.id}
                className="group relative flex flex-col md:flex-row"
                style={{ border: `1px solid ${BORDER}`, height: 'clamp(260px, 30vw, 400px)' }}
              >
                {/* ── VIDEO PANEL (35%) ── */}
                <div
                  className={`relative flex-shrink-0 w-full md:w-[35%] overflow-hidden ${imageLeft ? 'md:order-1' : 'md:order-3'}`}
                  style={{ minHeight: 160, backgroundColor: STONE, borderRight: imageLeft ? `1px solid ${BORDER}` : 'none', borderLeft: imageLeft ? 'none' : `1px solid ${BORDER}` }}
                >
                  {product.video ? (
                    <video
                      src={product.video}
                      autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                  ) : product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                      sizes="35vw"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#c8c8c8' }}>No media</p>
                    </div>
                  )}
                  {/* Draft badge */}
                  {!product.published && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '3px 8px' }}>
                      <EyeOff className="w-2.5 h-2.5" strokeWidth={2} />
                      Draft
                    </div>
                  )}
                  {/* Edit overlay */}
                  <Link
                    href={product.editHref}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(26,43,26,0.14)', backdropFilter: 'blur(2px)' }}
                    aria-label={`Edit ${product.name}`}
                  >
                    <span className="flex items-center gap-2 font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#fff', background: 'rgba(26,43,26,0.88)', padding: '10px 20px' }}>
                      <Pencil className="w-3 h-3" strokeWidth={2} />
                      Edit
                    </span>
                  </Link>
                </div>

                {/* ── STILL PHOTO PANEL (25%) ── */}
                <div
                  className={`relative flex-shrink-0 w-full md:w-[25%] overflow-hidden md:order-2`}
                  style={{ minHeight: 160, backgroundColor: '#faf9f7', borderRight: `1px solid ${BORDER}` }}
                >
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-5 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                      sizes="25vw"
                      priority={index < 2}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#c8c8c8' }}>No image</p>
                    </div>
                  )}
                </div>

                {/* ── TEXT HALF — exact mirror of EditorialListing ── */}
                <div
                  className={`flex-1 flex flex-col justify-center ${imageLeft ? 'md:order-3' : 'md:order-1'}`}
                  style={{ padding: 'clamp(24px, 3vw, 48px) clamp(20px, 3vw, 52px)', backgroundColor: '#fff' }}
                >
                  {/* Index */}
                  <p className="font-sans" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#d8d8d8', textTransform: 'uppercase', marginBottom: 14 }}>
                    {String(index + 1).padStart(2, '0')}
                  </p>

                  {/* Name */}
                  <h2
                    className="font-display text-balance"
                    style={{ fontSize: 'clamp(18px, 2.2vw, 34px)', fontWeight: 300, letterSpacing: '0.03em', lineHeight: 1.1, color: G }}
                  >
                    {product.name}
                  </h2>

                  {/* Subtitle */}
                  {product.subtitle && (
                    <p className="font-sans" style={{ fontSize: 10, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', fontWeight: 300, marginTop: 10 }}>
                      {product.subtitle}
                    </p>
                  )}

                  {/* Rule */}
                  <div style={{ width: 28, height: 1, backgroundColor: BORDER, margin: '16px 0' }} />

                  {/* Price */}
                  <p className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#555', letterSpacing: '0.04em' }}>
                    {product.price}
                  </p>

                  {/* CTA row */}
                  <div className="flex items-center gap-5 mt-6">
                    <Link
                      href={product.editHref}
                      className="flex items-center gap-2 font-sans uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${G}`, padding: '9px 20px' }}
                    >
                      <Pencil className="w-3 h-3" strokeWidth={1.8} />
                      Edit
                    </Link>

                    {/* Discover arrow — same as frontend */}
                    <div className="flex items-center gap-3" style={{ color: '#bbb' }}>
                      <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', fontWeight: 400 }}>
                        Discover
                      </span>
                      <div style={{ width: 32, height: 1, backgroundColor: BORDER }} />
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
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
