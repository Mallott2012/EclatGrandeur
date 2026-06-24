'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, EyeOff, Plus, Upload, Loader2 } from 'lucide-react';
import { StyleManager } from '@/components/admin/StyleManager';
import type { CatalogStyle, StyleCategory } from '@/lib/catalog/service';

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
  video?:    string;
  style?:    string;
  published: boolean;
  editHref:  string;
}

interface Props {
  title:          string;
  lede:           string;
  addHref:        string;
  products:       AdminProduct[];
  itemLabel:      string;
  category:       StyleCategory;
  styles:         CatalogStyle[];
  onUploadMedia?: (productId: string, formData: FormData) => Promise<string>;
}

/* ── Admin card ─────────────────────────────────────────────────────────────── */
function AdminCard({
  product,
  priority,
  onUploadMedia,
}: {
  product:        AdminProduct;
  priority:       boolean;
  onUploadMedia?: (productId: string, formData: FormData) => Promise<string>;
}) {
  const videoRef              = useRef<HTMLVideoElement>(null);
  const [hovered,  setHovered]  = useState(false);
  const [imgSrc,   setImgSrc]   = useState(product.image);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const hasVideo = Boolean(product.video);

  function videoEnter() {
    setHovered(true);
    const v = videoRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
  }
  function videoLeave() {
    setHovered(false);
    videoRef.current?.pause();
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!onUploadMedia) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.size > 0);
    if (!files.length) return;
    setUploading(true);
    setUploadErr('');
    const fd = new FormData();
    fd.append('file', files[0]);
    try {
      const url = await onUploadMedia(product.id, fd);
      setImgSrc(url);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col">
      {/* Image area — drag/drop zone + click navigates */}
      <div
        className="group/card relative overflow-hidden bg-white"
        style={{ aspectRatio: '1 / 1' }}
        onMouseEnter={videoEnter}
        onMouseLeave={videoLeave}
        onDragOver={e => { e.preventDefault(); if (onUploadMedia) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Main content behind the link */}
        {imgSrc ? (
          <Image
            src={imgSrc}
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

        {hasVideo && (
          <video
            ref={videoRef}
            src={product.video}
            muted loop playsInline preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {/* Clickable overlay for navigation */}
        <Link
          href={product.editHref}
          className="absolute inset-0 z-0"
          aria-label={`Edit ${product.name}`}
        />

        {/* Draft badge */}
        {!product.published && (
          <div
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 font-sans uppercase"
            style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 10px' }}
          >
            <EyeOff className="w-2.5 h-2.5" strokeWidth={2} />
            Draft
          </div>
        )}

        {/* Edit pill — shown on hover when not dragging */}
        {!dragOver && !uploading && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center pb-4 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 pointer-events-none">
            <span
              className="flex items-center gap-2 font-sans uppercase"
              style={{ fontSize: 10, letterSpacing: '0.22em', color: '#fff', background: 'rgba(26,43,26,0.9)', padding: '10px 22px' }}
            >
              <Pencil className="w-3 h-3" strokeWidth={2} />
              Edit
            </span>
          </div>
        )}

        {/* Drag-over overlay */}
        {dragOver && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.92)', border: `2px dashed ${G}` }}
          >
            <Upload className="w-6 h-6" style={{ color: G }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: G }}>
              Drop to upload
            </span>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.88)' }}
          >
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: G }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: G }}>
              Uploading…
            </span>
          </div>
        )}

        {/* Upload drop hint — visible when card has no image */}
        {!imgSrc && !dragOver && !uploading && onUploadMedia && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload className="w-5 h-5" style={{ color: '#ddd' }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 8, letterSpacing: '0.18em', color: '#ccc' }}>
              Drop image here
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadErr && (
        <p className="font-sans mt-1" style={{ fontSize: 10, color: '#e05050', letterSpacing: '0.02em' }}>
          {uploadErr}
        </p>
      )}

      {/* Name + price */}
      <Link href={product.editHref} style={{ paddingTop: 20 }}>
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
      </Link>
    </div>
  );
}

export function AdminProductGrid({ title, lede, addHref, products, itemLabel, category, styles, onUploadMedia }: Props) {
  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER ─────────────────────────────────────────────── */}
      <div style={{ paddingTop: 48, paddingBottom: 28, textAlign: 'center' }}>
        <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.36em', color: MUTED, marginBottom: 12 }}>
          Admin
        </p>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(30px, 3.4vw, 46px)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.0, color: G }}
        >
          {title}
        </h1>
      </div>

      {/* ── STYLE MANAGER ───────────────────────────────────────────────── */}
      <StyleManager category={category} initialStyles={styles} />

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
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

      {/* ── PRODUCT GRID ────────────────────────────────────────────────── */}
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
        <div
          className="grid grid-cols-2 md:grid-cols-3"
          style={{ padding: 'clamp(40px, 5vw, 72px) clamp(24px, 6vw, 96px) clamp(56px, 6vw, 96px)', columnGap: 'clamp(16px, 3vw, 48px)', rowGap: 'clamp(40px, 5vw, 72px)' }}
        >
          {products.map((product, index) => (
            <AdminCard
              key={product.id}
              product={product}
              priority={index < 3}
              onUploadMedia={onUploadMedia}
            />
          ))}
        </div>
      )}
    </div>
  );
}
