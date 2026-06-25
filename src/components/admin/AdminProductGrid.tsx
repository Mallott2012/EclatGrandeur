'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, EyeOff, Plus, Upload, Loader2, Trash2, Copy } from 'lucide-react';
import { StyleManager } from '@/components/admin/StyleManager';
import type { CatalogStyle, StyleCategory } from '@/lib/catalog/service';

const G      = '#1a2b1a';
const STONE  = '#f5f3ef';
const BORDER = '#e8e8e8';
const MUTED  = '#aaa';

export interface AdminProduct {
  id:             string;
  slug:           string;
  name:           string;
  subtitle:       string;
  price:          string;
  image:          string;
  hoverMediaUrl?: string;    // from default variant cardHoverMediaId
  hoverEnabled?:  boolean;   // from default variant hoverMediaEnabled
  video?:         string;    // legacy field (kept for backward compat; prefer hoverMediaUrl)
  style?:         string;
  published:      boolean;
  editHref:       string;
}

interface Props {
  title:            string;
  lede:             string;
  addHref:          string;
  products:         AdminProduct[];
  itemLabel:        string;
  category:         StyleCategory;
  styles:           CatalogStyle[];
  onUploadMedia?:   (productId: string, formData: FormData) => Promise<string>;
  onDeleteProduct?: (productId: string) => Promise<void>;
}

/* ── Admin card ─────────────────────────────────────────────────────────────── */
function AdminCard({
  product,
  priority,
  onUploadMedia,
  onDeleteProduct,
}: {
  product:          AdminProduct;
  priority:         boolean;
  onUploadMedia?:   (productId: string, formData: FormData) => Promise<string>;
  onDeleteProduct?: (productId: string) => Promise<void>;
}) {
  const videoRef                  = useRef<HTMLVideoElement>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [hovered,   setHovered]   = useState(false);
  const [imgSrc,    setImgSrc]    = useState(product.image);
  const [hoverSrc]                = useState(product.hoverMediaUrl ?? product.video ?? '');
  const [dragOver,  setDragOver]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [deleting,  setDeleting]  = useState(false);

  const hoverIsVideo = /\.(mp4|mov|webm)(\?|$)/i.test(hoverSrc);
  const showHover    = Boolean(product.hoverEnabled ?? Boolean(product.video)) && Boolean(hoverSrc);

  function mediaEnter() {
    setHovered(true);
    if (showHover && hoverIsVideo) {
      const v = videoRef.current;
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    }
  }
  function mediaLeave() {
    setHovered(false);
    if (hoverIsVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  async function handleFileDrop(files: File[]) {
    if (!files.length || !onUploadMedia) return;
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

  async function handleDelete() {
    if (!onDeleteProduct) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDeleteProduct(product.id); }
    catch { setDeleting(false); }
  }

  return (
    <div className="flex flex-col">
      {/* ── Media square ─────────────────────────────────────────────────── */}
      <div
        className="group/card relative overflow-hidden bg-white"
        style={{ aspectRatio: '1 / 1' }}
        onMouseEnter={mediaEnter}
        onMouseLeave={mediaLeave}
        onDragOver={e => { e.preventDefault(); if (onUploadMedia) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files).filter(f => f.size > 0);
          handleFileDrop(files);
        }}
      >
        {/* Main image */}
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={priority}
            className="object-contain transition-opacity duration-700 ease-out"
            style={{ opacity: hovered && showHover ? 0 : 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>
              No image
            </p>
          </div>
        )}

        {/* Hover: video */}
        {showHover && hoverIsVideo && (
          <video
            ref={videoRef}
            src={hoverSrc}
            muted loop playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {/* Hover: image */}
        {showHover && !hoverIsVideo && hoverSrc && (
          <Image
            src={hoverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="absolute inset-0 object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        {/* Navigation link — full area, behind overlay */}
        <Link href={product.editHref} className="absolute inset-0 z-0" aria-label={`Edit ${product.name}`} />

        {/* Draft badge */}
        {!product.published && (
          <div
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 font-sans uppercase"
            style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 10px' }}
          >
            <EyeOff className="w-2.5 h-2.5" strokeWidth={2} /> Draft
          </div>
        )}

        {/* Admin action overlay — appears on hover */}
        {!dragOver && !uploading && !deleting && (
          <div
            className="absolute inset-x-0 bottom-0 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
            style={{ background: 'linear-gradient(transparent, rgba(26,43,26,0.82))', paddingBottom: 12, paddingTop: 28 }}
          >
            <div className="flex items-center justify-center gap-2 px-3">
              {/* Edit */}
              <Link
                href={product.editHref}
                className="flex items-center gap-1 font-sans uppercase"
                style={{ fontSize: 9, letterSpacing: '0.16em', color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '5px 10px', flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <Pencil className="w-2.5 h-2.5" strokeWidth={2} /> Edit
              </Link>
              {/* Replace main media */}
              {onUploadMedia && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}
                  className="flex items-center gap-1 font-sans uppercase"
                  style={{ fontSize: 9, letterSpacing: '0.16em', color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '5px 10px', flexShrink: 0, cursor: 'pointer', border: 'none' }}
                >
                  <Upload className="w-2.5 h-2.5" strokeWidth={2} /> Replace
                </button>
              )}
              {/* Duplicate (placeholder) */}
              <button
                type="button"
                disabled
                title="Duplicate coming soon"
                className="flex items-center gap-1 font-sans uppercase opacity-40"
                style={{ fontSize: 9, letterSpacing: '0.16em', color: '#fff', background: 'rgba(255,255,255,0.12)', padding: '5px 10px', flexShrink: 0, cursor: 'not-allowed', border: 'none' }}
              >
                <Copy className="w-2.5 h-2.5" strokeWidth={2} /> Duplicate
              </button>
              {/* Delete */}
              {onDeleteProduct && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                  className="flex items-center gap-1 font-sans uppercase"
                  style={{ fontSize: 9, letterSpacing: '0.16em', color: '#fff', background: 'rgba(224,80,80,0.75)', padding: '5px 10px', flexShrink: 0, cursor: 'pointer', border: 'none' }}
                >
                  <Trash2 className="w-2.5 h-2.5" strokeWidth={2} /> Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drag-over overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.92)', border: `2px dashed ${G}` }}>
            <Upload className="w-6 h-6" style={{ color: G }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: G }}>Drop to replace</span>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.88)' }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: G }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: G }}>Uploading…</span>
          </div>
        )}

        {/* Deleting overlay */}
        {deleting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.88)' }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#e05050' }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#e05050' }}>Deleting…</span>
          </div>
        )}

        {/* No-image upload hint */}
        {!imgSrc && !dragOver && !uploading && onUploadMedia && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload className="w-5 h-5" style={{ color: '#ddd' }} strokeWidth={1.5} />
            <span className="font-sans uppercase" style={{ fontSize: 8, letterSpacing: '0.18em', color: '#ccc' }}>Drop image here</span>
          </div>
        )}

        {/* Upload error */}
        {uploadErr && (
          <div className="absolute bottom-0 inset-x-0 z-10 px-3 py-2" style={{ background: 'rgba(224,80,80,0.9)' }}>
            <p className="font-sans text-center" style={{ fontSize: 9, color: '#fff', letterSpacing: '0.08em' }}>{uploadErr}</p>
          </div>
        )}
      </div>

      {/* Hidden file input for Replace */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFileDrop([f]);
          e.target.value = '';
        }}
      />

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

/* ── Add product card ───────────────────────────────────────────────────────── */
function AddProductCard({ href, itemLabel }: { href: string; itemLabel: string }) {
  return (
    <Link href={href} className="flex flex-col group/add">
      <div
        className="relative overflow-hidden transition-colors"
        style={{ aspectRatio: '1 / 1', border: `1px dashed ${BORDER}`, background: STONE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}
      >
        <div
          className="flex items-center justify-center transition-transform group-hover/add:scale-110"
          style={{ width: 48, height: 48, border: `1px solid ${BORDER}`, background: '#fff', borderRadius: '50%' }}
        >
          <Plus style={{ width: 18, height: 18, color: G }} strokeWidth={1.5} />
        </div>
        <span
          className="font-sans uppercase"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: MUTED }}
        >
          Add {itemLabel}
        </span>
      </div>
      <div style={{ paddingTop: 20, opacity: 0 }}>
        <p style={{ fontSize: 'clamp(15px, 1.3vw, 19px)' }}>&nbsp;</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>&nbsp;</p>
      </div>
    </Link>
  );
}

/* ── Grid ───────────────────────────────────────────────────────────────────── */
export function AdminProductGrid({
  title, lede, addHref, products, itemLabel, category, styles,
  onUploadMedia, onDeleteProduct,
}: Props) {
  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER ─────────────────────────────────────────────── */}
      <div style={{ paddingTop: 48, paddingBottom: 28, textAlign: 'center' }}>
        <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.36em', color: MUTED, marginBottom: 12 }}>
          Admin
        </p>
        <h1 className="font-display" style={{ fontSize: 'clamp(30px, 3.4vw, 46px)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.0, color: G }}>
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{
          padding: 'clamp(40px, 5vw, 72px) clamp(24px, 6vw, 96px) clamp(56px, 6vw, 96px)',
          columnGap: 'clamp(16px, 3vw, 48px)',
          rowGap:    'clamp(40px, 5vw, 72px)',
        }}
      >
        {products.map((product, index) => (
          <AdminCard
            key={product.id}
            product={product}
            priority={index < 3}
            onUploadMedia={onUploadMedia}
            onDeleteProduct={onDeleteProduct}
          />
        ))}
        {/* Add Product card — always at end */}
        <AddProductCard href={addHref} itemLabel={itemLabel} />
      </div>
    </div>
  );
}
