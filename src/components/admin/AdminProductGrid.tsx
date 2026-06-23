'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Eye, EyeOff, Plus } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

export interface AdminProduct {
  id:          string;
  slug:        string;
  name:        string;
  subtitle:    string;
  price:       string;
  image:       string;
  published:   boolean;
  editHref:    string;
}

interface Props {
  title:      string;
  heroCopy:   string;
  heroImage:  string;
  addHref:    string;
  products:   AdminProduct[];
}

export function AdminProductGrid({ title, heroCopy, heroImage, addHref, products }: Props) {
  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── HERO — identical to frontend, click overlay to change ──────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 'min(500px, 58vh)' }}>
        <Image
          src={heroImage}
          alt={title}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.38) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 px-6 text-center">
          <h1
            className="font-display text-white text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 300, letterSpacing: '0.08em', lineHeight: 1.1 }}
          >
            {title}
          </h1>
          <p
            className="font-sans text-white mt-4"
            style={{ fontSize: 12, letterSpacing: '0.2em', fontWeight: 300, opacity: 0.8, textTransform: 'uppercase' }}
          >
            {heroCopy}
          </p>
        </div>

        {/* Admin badge */}
        <div
          className="absolute top-4 left-4 font-sans uppercase"
          style={{ fontSize: 9, letterSpacing: '0.3em', color: '#fff', background: 'rgba(0,0,0,0.35)', padding: '4px 10px', backdropFilter: 'blur(4px)' }}
        >
          Admin
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 lg:px-14 py-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </span>
        <Link
          href={addHref}
          className="flex items-center gap-2 font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '8px 16px' }}
        >
          <Plus className="w-3 h-3" strokeWidth={2} />
          Add New
        </Link>
      </div>

      {/* ── PRODUCT GRID ─────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-14 py-16">
        {products.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#ccc', letterSpacing: '0.06em' }}>
              No products yet.
            </p>
            <Link
              href={addHref}
              className="inline-flex items-center gap-2 font-sans uppercase mt-6"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '10px 20px' }}
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Add First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
            {products.map(product => (
              <div key={product.id} className="group relative block">

                {/* Card — same 4:5 portrait as frontend */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '4/5', backgroundColor: '#fafafa' }}
                >
                  <div className="absolute inset-[8%]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>

                  {/* Draft badge */}
                  {!product.published && (
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1 font-sans uppercase"
                      style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '3px 8px' }}
                    >
                      <EyeOff className="w-2.5 h-2.5" strokeWidth={2} />
                      Draft
                    </div>
                  )}

                  {/* Edit overlay — appears on hover */}
                  <Link
                    href={product.editHref}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(26,43,26,0.12)', backdropFilter: 'blur(1px)' }}
                    aria-label={`Edit ${product.name}`}
                  >
                    <span
                      className="flex items-center gap-2 font-sans uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.22em', color: '#fff', background: 'rgba(26,43,26,0.85)', padding: '10px 20px' }}
                    >
                      <Pencil className="w-3 h-3" strokeWidth={2} />
                      Edit
                    </span>
                  </Link>
                </div>

                {/* Text block — same as frontend */}
                <div className="mt-5 px-1 flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="font-display text-balance"
                      style={{ fontSize: 16, fontWeight: 300, color: G, letterSpacing: '0.02em', lineHeight: 1.3 }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="font-sans mt-1.5"
                      style={{ fontSize: 11, fontWeight: 300, color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    >
                      {product.subtitle}
                    </p>
                    <p
                      className="font-sans mt-1"
                      style={{ fontSize: 13, fontWeight: 300, color: '#666', letterSpacing: '0.02em' }}
                    >
                      {product.price}
                    </p>
                  </div>
                  <Link
                    href={product.editHref}
                    className="flex-shrink-0 mt-0.5 p-1.5 rounded-full transition-colors hover:bg-stone-100"
                    aria-label={`Edit ${product.name}`}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: '#bbb' }} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
