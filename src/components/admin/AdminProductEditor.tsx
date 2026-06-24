'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp,
  Pencil, Check, X, Plus, Trash2, Eye, EyeOff, Heart,
  Upload, Loader2, Star, RotateCw,
} from 'lucide-react';
import { DiamondPanel, type DiamondRow } from '@/components/admin/DiamondPanel';
import { MediaDropZone } from '@/components/admin/MediaDropZone';
import { Media360Viewer } from '@/components/shared/Media360Viewer';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { EMPTY_GALLERY, type GalleryData, type GallerySlot } from '@/lib/gallery/types';

const isVideoUrl = (url: string) => url.toLowerCase().endsWith('.mp4');

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const ALL_METALS = [
  { id: 'platinum',        label: 'Platinum',        swatch: '#d0d0d0' },
  { id: 'white_gold_18k',  label: '18k White Gold',  swatch: '#c0c0c0' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold', swatch: '#c9a84c' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold',   swatch: '#c47d68' },
  { id: 'white_gold_9k',   label: '9k White Gold',   swatch: '#b8b8b8' },
  { id: 'yellow_gold_9k',  label: '9k Yellow Gold',  swatch: '#b8963c' },
];

const SERVICE_PROMISES = [
  'Complimentary shipping on all orders',
  'Complimentary gift packaging',
  'Free engraving service',
  'Lifetime warranty & servicing',
];

// ── Inline-editable text ────────────────────────────────────────────────────────
function InlineField({
  value, onSave, multiline = false, style, className, placeholder = 'Click to edit',
}: {
  value: string; onSave: (v: string) => void; multiline?: boolean;
  style?: React.CSSProperties; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  function commit() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <span className={`relative inline-flex flex-col w-full ${className ?? ''}`}>
        {multiline ? (
          <textarea
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
            className="w-full bg-white border-b-2 focus:outline-none resize-none"
            style={{ ...style, borderColor: G, padding: '2px 0', minHeight: 100 }}
          />
        ) : (
          <input
            autoFocus type="text" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="w-full bg-white border-b-2 focus:outline-none"
            style={{ ...style, borderColor: G, padding: '2px 0' }}
          />
        )}
        <span className="flex items-center gap-2 mt-1.5 self-end">
          <button type="button" onClick={commit} aria-label="Save">
            <Check className="w-3.5 h-3.5" style={{ color: G }} strokeWidth={2} />
          </button>
          <button type="button" onClick={cancel} aria-label="Cancel">
            <X className="w-3.5 h-3.5" style={{ color: '#bbb' }} strokeWidth={2} />
          </button>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`group/field relative inline-flex items-start gap-1.5 cursor-pointer ${className ?? ''}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      <span style={style}>{value || <em style={{ color: '#ccc', fontStyle: 'normal' }}>{placeholder}</em>}</span>
      <Pencil
        className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 opacity-0 group-hover/field:opacity-60 transition-opacity"
        style={{ color: '#bbb' }} strokeWidth={1.5}
      />
    </span>
  );
}

// ── Editable list item ──────────────────────────────────────────────────────────
function EditableListItem({ value, onSave, onDelete }: {
  value: string; onSave: (v: string) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  function commit() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }
  return (
    <div
      className="flex items-center gap-3 py-4 font-sans group/item"
      style={{ fontSize: 12, color: '#888', borderTop: `1px solid ${BORDER}`, fontWeight: 300, letterSpacing: '0.02em' }}
    >
      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#ccc', flexShrink: 0 }} />
      {editing ? (
        <>
          <input
            autoFocus type="text" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="flex-1 border-b focus:outline-none bg-transparent"
            style={{ fontSize: 12, color: '#888', borderColor: G }}
          />
          <button type="button" onClick={commit}><Check className="w-3 h-3" style={{ color: G }} strokeWidth={2} /></button>
          <button type="button" onClick={cancel}><X className="w-3 h-3" style={{ color: '#bbb' }} strokeWidth={2} /></button>
        </>
      ) : (
        <>
          <span className="flex-1">{value}</span>
          <span className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button type="button" onClick={() => { setDraft(value); setEditing(true); }}>
              <Pencil className="w-2.5 h-2.5" style={{ color: '#bbb' }} strokeWidth={1.5} />
            </button>
            <button type="button" onClick={onDelete}>
              <Trash2 className="w-2.5 h-2.5" style={{ color: '#e05050' }} strokeWidth={1.5} />
            </button>
          </span>
        </>
      )}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface MediaItem {
  id:          string;
  url:         string;
  isPrimary:   boolean;
  isSecondary: boolean;
  metal:       string | null;
}

function metalAbbr(metal: string | null) {
  if (!metal) return 'All';
  const map: Record<string, string> = { platinum: 'Pt', white_gold_18k: '18W', yellow_gold_18k: '18Y', rose_gold_18k: '18R', white_gold_9k: '9W', yellow_gold_9k: '9Y' };
  return map[metal] ?? metal.slice(0, 3).toUpperCase();
}

function metalSwatch(metal: string | null) {
  if (!metal) return '#e0e0e0';
  const m = ALL_METALS.find(x => x.id === metal);
  return m?.swatch ?? '#e0e0e0';
}

// ── Props ───────────────────────────────────────────────────────────────────────
export interface AdminProductData {
  id:          string;
  name:        string;
  subtitle:    string;
  description: string;
  basePrice:   number;
  metals:      string[];
  mediaItems:  MediaItem[];
  published:   boolean;
  categoryLabel: string;  // e.g. 'Engagement Rings'
  categoryHref:  string;  // e.g. '/engagement-rings' (frontend link)
  // gallery config
  galleryConfig?:  GalleryData;
  onSaveGallery?:  (data: GalleryData) => Promise<void>;
  // diamond management (full CRUD + assignment)
  assignedDiamondIds:  string[];
  allDiamonds:         DiamondRow[];
  // callbacks (server actions)
  onSave:              (patch: Partial<AdminProductData>) => Promise<void>;
  onTogglePublish:     () => Promise<void>;
  onDelete:            () => Promise<void>;
  onAssignDiamond:     (diamondId: string) => Promise<void>;
  onUnassignDiamond:   (diamondId: string) => Promise<void>;
  onCreateDiamond:     (data: Omit<DiamondRow, 'id' | 'sku'>) => Promise<DiamondRow>;
  onUpdateDiamond:     (id: string, data: Partial<Omit<DiamondRow, 'id' | 'sku'>>) => Promise<void>;
  onDeleteDiamond:     (id: string) => Promise<void>;
  // media upload/delete/reorder/primary/metal
  onUploadMedia:       (formData: FormData) => Promise<MediaItem>;
  onDeleteMedia:       (url: string) => Promise<void>;
  onReorderMedia:      (ids: string[]) => Promise<void>;
  onSetPrimaryMedia:   (id: string) => Promise<void>;
  onSetMediaMetal?:    (id: string, metal: string | null) => Promise<void>;
  // nav
  backHref:    string;  // admin back link
  backLabel:   string;
}

// ── Main component ──────────────────────────────────────────────────────────────
export function AdminProductEditor(props: AdminProductData) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name,           setName]           = useState(props.name);
  const [subtitle,       setSubtitle]       = useState(props.subtitle);
  const [description,    setDescription]    = useState(props.description);
  const [basePrice,      setBasePrice]      = useState(props.basePrice);
  const [metals,         setMetals]         = useState<string[]>(props.metals);
  const [mediaItems,     setMediaItems]     = useState<MediaItem[]>(props.mediaItems);
  const [published,      setPublished]      = useState(props.published);
  const [promises,       setPromises]       = useState<string[]>(SERVICE_PROMISES);
  const [activeImage,    setActiveImage]    = useState(0);
  const [metalOpen,        setMetalOpen]        = useState(false);
  const [diamondPanelOpen, setDiamondPanelOpen] = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [editPrice,      setEditPrice]      = useState(false);
  const [priceDraft,     setPriceDraft]     = useState(String(props.basePrice));
  const [panelDragOver,  setPanelDragOver]  = useState(false);
  const [panelUploading, setPanelUploading] = useState(false);
  const [panelUploadErr, setPanelUploadErr] = useState<string | null>(null);
  const [galleryData,    setGalleryData]    = useState<GalleryData>(props.galleryConfig ?? EMPTY_GALLERY);
  const gallerySaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedMetal = metals[0] ?? 'Platinum';
  const metalMeta = ALL_METALS.find(m => m.label === selectedMetal || m.id === selectedMetal) ?? ALL_METALS[0];

  function save(patch: Record<string, unknown>) {
    startTransition(async () => {
      await props.onSave(patch as Partial<AdminProductData>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    });
  }

  function toggleMetal(metalId: string) {
    const next = metals.includes(metalId)
      ? metals.filter(m => m !== metalId)
      : [...metals, metalId];
    setMetals(next);
    save({ metals: next });
  }

  function commitPrice() {
    const n = parseFloat(priceDraft);
    if (!isNaN(n) && n > 0) { setBasePrice(n); save({ basePrice: n }); }
    setEditPrice(false);
  }

  function handleMediaItemUploaded(item: MediaItem) {
    setMediaItems(prev => {
      const next = [...prev, item];
      setActiveImage(next.length - 1);
      return next;
    });
  }

  async function handlePanelDrop(files: FileList) {
    if (!files.length || panelUploading) return;
    setPanelUploading(true);
    setPanelUploadErr(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const item = await props.onUploadMedia(fd);
        handleMediaItemUploaded(item);
      } catch (e) {
        setPanelUploadErr(e instanceof Error ? e.message : 'Upload failed');
      }
    }
    setPanelUploading(false);
  }

  // Adapter so MediaDropZone (which expects Promise<string>) still works
  async function uploadForDropZone(formData: FormData): Promise<string> {
    const item = await props.onUploadMedia(formData);
    handleMediaItemUploaded(item);
    return item.url;
  }

  function removeMedia(i: number) {
    const item = mediaItems[i];
    const next = mediaItems.filter((_, idx) => idx !== i);
    setMediaItems(next);
    if (activeImage >= next.length) setActiveImage(Math.max(0, next.length - 1));
    startTransition(async () => { await props.onDeleteMedia(item.url); });
  }

  function moveMedia(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= mediaItems.length) return;
    const next = [...mediaItems];
    [next[i], next[j]] = [next[j], next[i]];
    const withFlags = next.map((m, idx) => ({ ...m, isSecondary: idx === 1 && !m.isPrimary }));
    setMediaItems(withFlags);
    setActiveImage(j);
    startTransition(async () => { await props.onReorderMedia(withFlags.map(m => m.id)); });
  }

  function setPrimary(id: string) {
    setMediaItems(prev => prev.map((m, i) => ({ ...m, isPrimary: m.id === id, isSecondary: m.id !== id && i === 1 })));
    startTransition(async () => { await props.onSetPrimaryMedia(id); });
  }

  function setSecondary(id: string) {
    const primary = mediaItems.find(m => m.isPrimary) ?? mediaItems[0];
    const target  = mediaItems.find(m => m.id === id)!;
    const rest    = mediaItems.filter(m => m.id !== id && m.id !== primary?.id);
    const next    = primary ? [primary, target, ...rest] : [target, ...rest];
    const withFlags = next.map((m, idx) => ({ ...m, isSecondary: idx === 1 && !m.isPrimary }));
    setMediaItems(withFlags);
    setActiveImage(1);
    startTransition(async () => { await props.onReorderMedia(withFlags.map(m => m.id)); });
  }

  function setMediaMetal(itemId: string, metal: string | null) {
    setMediaItems(prev => prev.map(m => m.id === itemId ? { ...m, metal } : m));
    if (props.onSetMediaMetal) {
      startTransition(async () => { await props.onSetMediaMetal!(itemId, metal); });
    }
  }

  async function handleGalleryUpload(_slot: GallerySlot, fd: FormData): Promise<string> {
    const item = await props.onUploadMedia(fd);
    return item.url;
  }

  function handleGalleryChange(data: GalleryData) {
    setGalleryData(data);
    if (!props.onSaveGallery) return;
    if (gallerySaveTimer.current) clearTimeout(gallerySaveTimer.current);
    gallerySaveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await props.onSaveGallery!(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      });
    }, 600);
  }

  const currentImage = mediaItems[activeImage]?.url ?? '';
  const displayPrice   = `Starting from £${basePrice.toLocaleString('en-GB')}`;

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── ADMIN BAR ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-[72px] z-30 bg-white flex items-center justify-between px-8 lg:px-14 py-2.5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <button
          type="button"
          onClick={() => router.push(props.backHref)}
          className="flex items-center gap-1.5 font-sans"
          style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999' }}
        >
          <ChevronLeft className="w-3 h-3" strokeWidth={2} />
          {props.backLabel}
        </button>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="font-sans flex items-center gap-1.5" style={{ fontSize: 11, color: '#4a9e6b', letterSpacing: '0.08em' }}>
              <Check className="w-3 h-3" strokeWidth={2.5} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => { const next = !published; setPublished(next); startTransition(async () => { await props.onTogglePublish(); }); }}
            disabled={pending}
            className="flex items-center gap-1.5 font-sans uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: published ? '#4a9e6b' : '#aaa', border: `1px solid ${published ? '#4a9e6b' : '#ddd'}`, padding: '6px 12px' }}
          >
            {published ? <Eye className="w-3 h-3" strokeWidth={2} /> : <EyeOff className="w-3 h-3" strokeWidth={2} />}
            {published ? 'Published' : 'Draft'}
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm('Delete this product? This cannot be undone.')) { startTransition(async () => { await props.onDelete(); router.push(props.backHref); }); } }}
            disabled={pending}
            className="flex items-center gap-1.5 font-sans uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: '#e05050', border: '1px solid #fcc', padding: '6px 12px' }}
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} /> Delete
          </button>
        </div>
      </div>

      {/* ── BREADCRUMB — exactly like frontend ──────────────────────────────── */}
      <nav
        className="flex items-center gap-2 px-8 lg:px-14 pt-6 pb-5"
        style={{ borderBottom: `1px solid ${BORDER}` }}
        aria-label="Breadcrumb"
      >
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
        <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <Link href={props.categoryHref} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{props.categoryLabel}</Link>
        <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{name}</span>
      </nav>

      {/* ── SPLIT LAYOUT ────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — sticky gallery panel */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-[113px] lg:h-[calc(100vh-113px)] overflow-y-auto"
          style={{ background: '#fff', padding: 16 }}
        >
          <ProductGallery
            data={galleryData}
            editable
            onUpload={handleGalleryUpload}
            onChange={handleGalleryChange}
          />
        </div>

        {/* RIGHT — configuration panel, mirrors frontend exactly */}
        <div
          className="lg:w-[42%] px-8 lg:px-12 pt-12 pb-28 flex flex-col"
          style={{ borderLeft: `1px solid ${BORDER}` }}
        >
          {/* Name — inline editable */}
          <h1
            className="font-display w-full"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
          >
            <InlineField
              value={name}
              onSave={v => { setName(v); save({ name: v }); }}
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
              placeholder="Product name"
              className="w-full"
            />
          </h1>

          {/* Subtitle + price — both inline editable */}
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <span className="font-sans flex-1 min-w-0" style={{ fontSize: 13, color: '#999', fontWeight: 300 }}>
              <InlineField
                value={subtitle}
                onSave={v => { setSubtitle(v); save({ subtitle: v }); }}
                style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}
                placeholder="Subtitle"
              />
            </span>

            {editPrice ? (
              <span className="flex items-center gap-1 flex-shrink-0">
                <span className="font-sans" style={{ fontSize: 14, color: G }}>£</span>
                <input
                  autoFocus type="number" value={priceDraft}
                  onChange={e => setPriceDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') setEditPrice(false); }}
                  className="w-24 border-b-2 focus:outline-none font-sans text-right"
                  style={{ fontSize: 14, color: G, borderColor: G }}
                />
                <button type="button" onClick={commitPrice}><Check className="w-3 h-3" style={{ color: G }} strokeWidth={2} /></button>
                <button type="button" onClick={() => setEditPrice(false)}><X className="w-3 h-3" style={{ color: '#bbb' }} strokeWidth={2} /></button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => { setPriceDraft(String(basePrice)); setEditPrice(true); }}
                className="group/price flex items-center gap-1.5 flex-shrink-0"
                title="Click to edit price"
              >
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>{displayPrice}</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-60 transition-opacity" style={{ color: '#bbb' }} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Ring Style / Metal row — collapsible, exactly like frontend */}
          <button
            type="button"
            onClick={() => setMetalOpen(v => !v)}
            className="flex items-center justify-between w-full py-4 text-left"
            style={{ borderBottom: metalOpen ? 'none' : `1px solid ${BORDER}` }}
          >
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
              Ring Style
            </span>
            <span className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: metalMeta.swatch, border: '1px solid #ddd', flexShrink: 0 }} />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                {metals.length === 0 ? 'None selected' : metals.length === 1 ? metalMeta.label : `${metals.length} metals`}
              </span>
              <ChevronDown
                className="w-3.5 h-3.5"
                style={{ color: '#bbb', transition: 'transform 0.2s', transform: metalOpen ? 'rotate(180deg)' : 'none' }}
                strokeWidth={1.5}
              />
            </span>
          </button>

          {/* Metal dropdown — admin adds a toggle on each option */}
          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {ALL_METALS.map(m => {
                const active = metals.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMetal(m.id)}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                    style={{
                      fontSize: 13,
                      color: active ? G : '#aaa',
                      fontWeight: active ? 400 : 300,
                      backgroundColor: active ? '#f9f9f9' : 'transparent',
                    }}
                  >
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: m.swatch, border: '1px solid #ddd', flexShrink: 0 }} />
                    <span className="flex-1 text-left">{m.label}</span>
                    {/* Admin tick/cross */}
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 8, letterSpacing: '0.15em', color: active ? '#4a9e6b' : '#ddd' }}
                    >
                      {active ? 'Enabled' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Diamond row — matches frontend display */}
          <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
              Diamond
            </span>
            <button
              type="button"
              onClick={() => setDiamondPanelOpen(v => !v)}
              className="font-sans"
              style={{ fontSize: 13, color: G, fontWeight: 300, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {props.assignedDiamondIds.length === 0
                ? 'None assigned — click to manage'
                : `${props.assignedDiamondIds.length} diamond${props.assignedDiamondIds.length === 1 ? '' : 's'} assigned`}
            </button>
          </div>

          {/* SELECT A DIAMOND — same dark full-width button as frontend */}
          <button
            type="button"
            onClick={() => setDiamondPanelOpen(v => !v)}
            className="w-full font-sans uppercase mt-8 py-4"
            style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
          >
            Manage Diamonds
          </button>

          {/* Save to Shortlist — same style, non-functional in admin (just for visual parity) */}
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 w-full font-sans uppercase mt-3 py-3 opacity-40 cursor-default"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: '#aaa', border: `1px solid #ddd` }}
          >
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
            Save to Shortlist
          </button>

          {/* Speak to a Consultant — same style, non-functional in admin */}
          <div className="mt-5" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
            <p className="font-sans text-center" style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.02em' }}>
              Prefer to speak with an Éclat diamond expert?
            </p>
            <button
              type="button"
              disabled
              className="flex items-center justify-center w-full font-sans uppercase mt-3 py-3 opacity-40 cursor-default"
              style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}
            >
              Speak to a Consultant
            </button>
          </div>

          {/* Divider */}
          <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Description — inline editable */}
          <InlineField
            value={description}
            onSave={v => { setDescription(v); save({ description: v }); }}
            multiline
            style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}
            className="w-full"
            placeholder="Product description — click to edit"
          />

          {/* Service promises — each one editable, deletable, add new */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-0">
              <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#ccc' }}>
                Service Promises
              </span>
              <button
                type="button"
                onClick={() => setPromises(p => [...p, 'New promise — click to edit'])}
                className="font-sans uppercase flex items-center gap-1"
                style={{ fontSize: 8, letterSpacing: '0.18em', color: '#bbb' }}
              >
                <Plus className="w-2.5 h-2.5" strokeWidth={2} /> Add
              </button>
            </div>
            {promises.map((item, idx) => (
              <EditableListItem
                key={idx}
                value={item}
                onSave={v => setPromises(p => p.map((x, i) => i === idx ? v : x))}
                onDelete={() => setPromises(p => p.filter((_, i) => i !== idx))}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ── DIAMOND DRAWER — fixed slide-over, opens immediately on button click ── */}
      {/* Backdrop */}
      {diamondPanelOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.18)' }}
          onClick={() => setDiamondPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white overflow-hidden"
        style={{
          width: 'min(560px, 96vw)',
          borderLeft: `1px solid ${BORDER}`,
          transform: diamondPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32,0,0.12,1)',
          boxShadow: diamondPanelOpen ? '-8px 0 32px rgba(0,0,0,0.08)' : 'none',
        }}
        aria-label="Diamond management"
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.26em', color: G }}>
            Diamond Management
          </p>
          <button
            type="button"
            onClick={() => setDiamondPanelOpen(false)}
            className="flex items-center gap-1.5 font-sans uppercase"
            style={{ fontSize: 9, letterSpacing: '0.15em', color: '#aaa' }}
            aria-label="Close diamond panel"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} /> Close
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <DiamondPanel
            diamonds={props.allDiamonds}
            assignedIds={props.assignedDiamondIds}
            onAssign={props.onAssignDiamond}
            onUnassign={props.onUnassignDiamond}
            onCreate={props.onCreateDiamond}
            onUpdate={props.onUpdateDiamond}
            onDelete={props.onDeleteDiamond}
          />
        </div>
      </div>
    </div>
  );
}
