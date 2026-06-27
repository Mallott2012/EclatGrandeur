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
import { ProductCard } from '@/components/shared/ProductCard';
import {
  EMPTY_GALLERY, type GalleryData, type GallerySlot,
  type MetalVariant, type MetalKey,
  METAL_KEYS, METAL_DISPLAY,
  buildDefaultVariants, variantToGalleryData, galleryDataToItems, emptyMetalVariant,
} from '@/lib/gallery/types';
import {
  ALL_DIAMOND_SHAPES, DIAMOND_SHAPE_LABELS, type DiamondShape,
} from '@/lib/ring-settings/types';

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

const UK_RING_SIZES = [
  'A',   'B',   'C',   'D',   'E',   'F',   'G',   'H',   'I',   'J',   'K',   'L',   'M',
  'N',   'O',   'P',   'Q',   'R',   'S',   'T',   'U',   'V',   'W',   'X',   'Y',   'Z',
  'Z+1', 'Z+2', 'Z+3', 'Z+4', 'Z+5', 'Z+6',
];

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
  // gallery config (legacy; migrated into metalVariants on first load)
  galleryConfig?:  GalleryData;
  onSaveGallery?:  (data: GalleryData) => Promise<void>;
  // metal variants (new system)
  metalVariants?:        MetalVariant[];
  onSaveMetalVariants?:  (variants: MetalVariant[]) => Promise<void>;
  // diamond shapes (multi-select for storefront shape filtering)
  diamondShapes?:        DiamondShape[];
  onSaveDiamondShapes?:  (shapes: DiamondShape[]) => Promise<void>;
  // compatible diamond counts (rings only — fetched server-side via getCompatibleDiamondCounts)
  compatibleCounts?: { white: number; yellow: number; pink: number };
  // engagement ring configuration (rings only)
  engagementConfig?: {
    minCarat?:                   number | null;
    maxCarat?:                   number | null;
    ringSizes?:                  string[];
    requiresDiamondSelection?:   boolean;
    requiresRingSizeSelection?:  boolean;
    settingStyle?:               string | null;
    bandStyle?:                  string | null;
    headStyle?:                  string | null;
  };
  onSaveEngagementConfig?: (config: {
    minCarat?:                   number | null;
    maxCarat?:                   number | null;
    ringSizes?:                  string[];
    requiresDiamondSelection?:   boolean;
    requiresRingSizeSelection?:  boolean;
    settingStyle?:               string | null;
    bandStyle?:                  string | null;
    headStyle?:                  string | null;
  }) => Promise<void>;
  // diamond management (full CRUD + assignment)
  // Earrings are pair-based: they hide this individual-diamond panel and manage
  // Earring Diamond Offers (in the earring product editor) instead.
  showDiamondPanel?:   boolean;   // default true
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

  // metal variant state — ensure every MetalKey has a slot even if not in saved DB data
  const initVariants = (() => {
    const base = props.metalVariants ?? buildDefaultVariants(props.galleryConfig);
    return METAL_KEYS.map(key => base.find(v => v.metal === key) ?? emptyMetalVariant(key));
  })();
  const [variants,       setVariants]       = useState<MetalVariant[]>(initVariants);
  const [activeMetalKey, setActiveMetalKey] = useState<MetalKey>(
    initVariants.find(v => v.enabled)?.metal ?? 'platinum'
  );
  const variantsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeVariant = variants.find(v => v.metal === activeMetalKey) ?? variants[0];

  const [localShapes, setLocalShapes] = useState<DiamondShape[]>(props.diamondShapes ?? []);
  const [shapesOpen,  setShapesOpen]  = useState(false);

  const _ec = props.engagementConfig ?? {};
  const [localMinCarat,        setLocalMinCarat]        = useState<string>(_ec.minCarat != null ? String(_ec.minCarat) : '');
  const [localMaxCarat,        setLocalMaxCarat]        = useState<string>(_ec.maxCarat != null ? String(_ec.maxCarat) : '');
  const [localRingSizes,       setLocalRingSizes]       = useState<string[]>(_ec.ringSizes ?? []);
  const [localRequiresDiamond, setLocalRequiresDiamond] = useState<boolean>(_ec.requiresDiamondSelection  ?? true);
  const [localRequiresSize,    setLocalRequiresSize]    = useState<boolean>(_ec.requiresRingSizeSelection ?? true);
  const [localSettingStyle,    setLocalSettingStyle]    = useState<string>(_ec.settingStyle ?? '');
  const [localBandStyle,       setLocalBandStyle]       = useState<string>(_ec.bandStyle    ?? '');
  const [localHeadStyle,       setLocalHeadStyle]       = useState<string>(_ec.headStyle    ?? '');
  const [engConfigOpen,        setEngConfigOpen]        = useState(false);
  const engConfigSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function toggleShape(shape: DiamondShape) {
    const next = localShapes.includes(shape)
      ? localShapes.filter(s => s !== shape)
      : [...localShapes, shape];
    setLocalShapes(next);
    if (props.onSaveDiamondShapes) {
      startTransition(async () => {
        await props.onSaveDiamondShapes!(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      });
    }
  }

  type EngagementConfigOverride = {
    minCarat?:                  number | null;
    maxCarat?:                  number | null;
    ringSizes?:                 string[];
    requiresDiamondSelection?:  boolean;
    requiresRingSizeSelection?: boolean;
    settingStyle?:              string | null;
    bandStyle?:                 string | null;
    headStyle?:                 string | null;
  };
  function scheduleEngagementSave(overrides: EngagementConfigOverride = {}) {
    if (!props.onSaveEngagementConfig) return;
    const config: EngagementConfigOverride = {
      minCarat:                 'minCarat'                 in overrides ? overrides.minCarat                 : (localMinCarat  === '' ? null : parseFloat(localMinCarat)  || null),
      maxCarat:                 'maxCarat'                 in overrides ? overrides.maxCarat                 : (localMaxCarat  === '' ? null : parseFloat(localMaxCarat)  || null),
      ringSizes:                'ringSizes'                in overrides ? overrides.ringSizes                : localRingSizes,
      requiresDiamondSelection: 'requiresDiamondSelection' in overrides ? overrides.requiresDiamondSelection : localRequiresDiamond,
      requiresRingSizeSelection:'requiresRingSizeSelection' in overrides ? overrides.requiresRingSizeSelection : localRequiresSize,
      settingStyle:             'settingStyle'             in overrides ? overrides.settingStyle             : (localSettingStyle || null),
      bandStyle:                'bandStyle'                in overrides ? overrides.bandStyle                : (localBandStyle    || null),
      headStyle:                'headStyle'                in overrides ? overrides.headStyle                : (localHeadStyle    || null),
      ...overrides,
    };
    if (engConfigSaveTimer.current) clearTimeout(engConfigSaveTimer.current);
    engConfigSaveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await props.onSaveEngagementConfig!(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      });
    }, 600);
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

  // ── Metal-variant helpers ────────────────────────────────────────────────────
  function scheduleVariantSave(next: MetalVariant[]) {
    if (!props.onSaveMetalVariants) return;
    if (variantsSaveTimer.current) clearTimeout(variantsSaveTimer.current);
    variantsSaveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await props.onSaveMetalVariants!(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      });
    }, 600);
  }

  function updateActiveVariant(patch: Partial<MetalVariant>) {
    setVariants(prev => {
      const next = prev.map(v => v.metal === activeMetalKey ? { ...v, ...patch } : v);
      scheduleVariantSave(next);
      return next;
    });
  }

  function updateActiveGallery(galleryPatch: Partial<(typeof activeVariant)['gallery']>) {
    setVariants(prev => {
      const next = prev.map(v =>
        v.metal === activeMetalKey
          ? { ...v, gallery: { ...v.gallery, ...galleryPatch } }
          : v
      );
      scheduleVariantSave(next);
      return next;
    });
  }

  function handleVariantGalleryChange(data: GalleryData) {
    const newItems = galleryDataToItems(data, activeVariant.gallery.items);
    const mainId   = newItems.find(it => it.id === activeVariant.gallery.cardMainMediaId)?.id
                     ?? (newItems[0]?.id ?? null);
    const hoverId  = newItems.find(it => it.id === activeVariant.gallery.cardHoverMediaId)?.id ?? null;
    setVariants(prev => {
      const next = prev.map(v =>
        v.metal === activeMetalKey
          ? { ...v, gallery: { ...v.gallery, items: newItems, cardMainMediaId: mainId, cardHoverMediaId: hoverId } }
          : v
      );
      scheduleVariantSave(next);
      return next;
    });
  }

  async function handleVariantGalleryUpload(_slot: GallerySlot, fd: FormData): Promise<string> {
    const item = await props.onUploadMedia(fd);
    return item.url;
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

        {/* LEFT — sticky gallery panel with metal variant controls */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-[113px] lg:h-[calc(100vh-113px)] overflow-y-auto"
          style={{ background: '#fff', padding: 16 }}
        >
          {/* Metal tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {METAL_KEYS.map(key => {
              const v   = variants.find(x => x.metal === key)!;
              const act = key === activeMetalKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMetalKey(key)}
                  style={{
                    fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.14em',
                    textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer',
                    border: `1px solid ${act ? G : '#e8e8e8'}`,
                    background: act ? G : '#fff',
                    color: act ? '#fff' : v.enabled ? G : '#ccc',
                    fontWeight: act ? 500 : 400,
                  }}
                >
                  {METAL_DISPLAY[key]}
                  {v.enabled && !act && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#4a9e6b', marginLeft: 5, verticalAlign: 'middle' }} />}
                </button>
              );
            })}
          </div>

          {/* Default indicator / Set as default */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            {activeVariant.isDefault ? (
              <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a9e6b' }}>
                ★ Default listing media
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setVariants(prev => {
                    const next = prev.map(v => ({ ...v, isDefault: v.metal === activeMetalKey }));
                    scheduleVariantSave(next);
                    return next;
                  });
                }}
                style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa', background: 'none', border: '1px solid #e8e8e8', padding: '3px 8px', cursor: 'pointer' }}
              >
                Set as default
              </button>
            )}
          </div>

          {/* Enable toggle + price for active variant */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={activeVariant.enabled}
                onChange={e => updateActiveVariant({ enabled: e.target.checked })}
                style={{ accentColor: G }}
              />
              <span style={{ fontFamily: 'sans-serif', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888' }}>
                Enabled
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#888' }}>£</span>
              <input
                type="number"
                value={activeVariant.price ?? ''}
                onChange={e => updateActiveVariant({ price: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="Price"
                style={{ width: 80, border: 'none', borderBottom: '1px solid #e8e8e8', fontFamily: 'sans-serif', fontSize: 12, color: G, outline: 'none', background: 'transparent' }}
              />
            </label>
          </div>

          {/* Gallery for the active variant — existingMedia allows reusing assets from other variants */}
          <ProductGallery
            data={variantToGalleryData(activeVariant)}
            editable={activeVariant.enabled}
            existingMedia={variants.flatMap(v => v.gallery.items)}
            onUpload={handleVariantGalleryUpload}
            onChange={handleVariantGalleryChange}
          />

          {/* Card media selectors */}
          <div style={{ marginTop: 14, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <p style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>
              Card Media
            </p>
            {(['cardMainMediaId', 'cardHoverMediaId'] as const).map(field => {
              const label = field === 'cardMainMediaId' ? 'Main' : 'Hover';
              const currentId = activeVariant.gallery[field];
              return (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'sans-serif', fontSize: 9, color: '#aaa', width: 34, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {label}
                  </span>
                  {/* None button */}
                  <button
                    type="button"
                    onClick={() => updateActiveGallery({ [field]: null })}
                    title="No card media"
                    style={{
                      width: 40, height: 40, border: `2px solid ${currentId === null ? G : '#e8e8e8'}`,
                      fontFamily: 'sans-serif', fontSize: 10, color: '#ccc',
                      background: 'none', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    ∅
                  </button>
                  {/* Item thumbnails */}
                  {activeVariant.gallery.items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateActiveGallery({ [field]: item.id })}
                      title={`Set as card ${label.toLowerCase()}`}
                      style={{
                        width: 40, height: 40, position: 'relative', overflow: 'hidden',
                        padding: 0, flexShrink: 0, cursor: 'pointer',
                        border: `2px solid ${currentId === item.id ? G : '#e8e8e8'}`,
                        background: '#f8f8f8',
                      }}
                    >
                      {item.type === 'video'
                        ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        /* eslint-disable-next-line @next/next/no-img-element */
                        : <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                    </button>
                  ))}
                </div>
              );
            })}
            {/* Hover enabled toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={activeVariant.gallery.hoverMediaEnabled}
                onChange={e => updateActiveGallery({ hoverMediaEnabled: e.target.checked })}
                style={{ accentColor: G }}
              />
              <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa' }}>
                Hover enabled
              </span>
            </label>
          </div>

          {/* Live card preview */}
          {(() => {
            const mainItem  = activeVariant.gallery.items.find(it => it.id === activeVariant.gallery.cardMainMediaId);
            const hoverItem = activeVariant.gallery.items.find(it => it.id === activeVariant.gallery.cardHoverMediaId);
            return (
              <div style={{ marginTop: 14, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <p style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>
                  Card Preview
                </p>
                <div style={{ width: 180 }}>
                  <ProductCard
                    name={name}
                    price={displayPrice}
                    href="#"
                    mainMedia={mainItem ? { url: mainItem.url, type: mainItem.type, posterUrl: mainItem.posterUrl } : null}
                    hoverMedia={hoverItem ? { url: hoverItem.url, type: hoverItem.type, posterUrl: hoverItem.posterUrl } : null}
                    hoverEnabled={activeVariant.gallery.hoverMediaEnabled}
                  />
                </div>
              </div>
            );
          })()}
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

          {/* Diamond Shape row */}
          {props.onSaveDiamondShapes !== undefined && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              <button
                type="button"
                onClick={() => setShapesOpen(v => !v)}
                className="flex items-center justify-between w-full py-4 text-left"
              >
                <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                  Compatible Centre-Stone Shapes
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                    {localShapes.length === 0
                      ? 'None selected'
                      : localShapes.length === 1
                      ? DIAMOND_SHAPE_LABELS[localShapes[0]]
                      : `${localShapes.length} shapes`}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5"
                    style={{ color: '#bbb', transition: 'transform 0.2s', transform: shapesOpen ? 'rotate(180deg)' : 'none' }}
                    strokeWidth={1.5}
                  />
                </span>
              </button>

              {shapesOpen && (
                <div style={{ paddingBottom: 8 }}>
                  {ALL_DIAMOND_SHAPES.map(shape => {
                    const active = localShapes.includes(shape);
                    return (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => toggleShape(shape)}
                        className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                        style={{
                          fontSize: 13,
                          color: active ? G : '#aaa',
                          fontWeight: active ? 400 : 300,
                          backgroundColor: active ? '#f9f9f9' : 'transparent',
                        }}
                      >
                        <span className="flex-1 text-left">{DIAMOND_SHAPE_LABELS[shape]}</span>
                        <span
                          className="font-sans uppercase"
                          style={{ fontSize: 8, letterSpacing: '0.15em', color: active ? '#4a9e6b' : '#ddd' }}
                        >
                          {active ? 'On' : 'Off'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Engagement Ring Configuration */}
          {props.onSaveEngagementConfig !== undefined && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              <button
                type="button"
                onClick={() => setEngConfigOpen(v => !v)}
                className="flex items-center justify-between w-full py-4 text-left"
              >
                <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
                  Engagement Ring Configuration
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
                    {localRingSizes.length === 0 ? 'Not configured' : `${localRingSizes.length} size${localRingSizes.length === 1 ? '' : 's'}`}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5"
                    style={{ color: '#bbb', transition: 'transform 0.2s', transform: engConfigOpen ? 'rotate(180deg)' : 'none' }}
                    strokeWidth={1.5}
                  />
                </span>
              </button>

              {engConfigOpen && (
                <div style={{ paddingBottom: 16 }}>
                  {/* Compatible diamond counts */}
                  <div style={{ marginBottom: 16 }}>
                    <span className="font-sans uppercase block mb-2" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>
                      Compatible Available Diamonds
                    </span>
                    {!props.compatibleCounts ? null : localShapes.length === 0 ? (
                      <p className="font-sans" style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>
                        Add compatible diamond shapes to calculate availability.
                      </p>
                    ) : props.compatibleCounts.white === 0 && props.compatibleCounts.yellow === 0 && props.compatibleCounts.pink === 0 ? (
                      <p className="font-sans" style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>
                        No compatible available diamonds yet.
                      </p>
                    ) : (
                      <div className="flex gap-6">
                        {[
                          { label: 'White', count: props.compatibleCounts.white },
                          { label: 'Yellow', count: props.compatibleCounts.yellow },
                          { label: 'Pink', count: props.compatibleCounts.pink },
                        ].map(({ label, count }) => (
                          <div key={label}>
                            <span className="font-sans block" style={{ fontSize: 9, letterSpacing: '0.15em', color: '#bbb', textTransform: 'uppercase' }}>{label}</span>
                            <span className="font-sans" style={{ fontSize: 18, color: count > 0 ? '#1a2b1a' : '#bbb', fontWeight: 300 }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Carat range */}
                  <div className="flex items-end gap-4 mb-5">
                    <div className="flex-1">
                      <label className="font-sans uppercase block mb-1.5" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>Min Carat</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localMinCarat}
                        onChange={e => {
                          setLocalMinCarat(e.target.value);
                          scheduleEngagementSave({ minCarat: e.target.value === '' ? null : (parseFloat(e.target.value) || null) });
                        }}
                        className="w-full border-b focus:outline-none bg-transparent font-sans"
                        style={{ fontSize: 12, color: G, borderColor: '#e0e0e0', paddingBottom: 4 }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-sans uppercase block mb-1.5" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>Max Carat</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={localMaxCarat}
                        onChange={e => {
                          setLocalMaxCarat(e.target.value);
                          scheduleEngagementSave({ maxCarat: e.target.value === '' ? null : (parseFloat(e.target.value) || null) });
                        }}
                        className="w-full border-b focus:outline-none bg-transparent font-sans"
                        style={{ fontSize: 12, color: G, borderColor: '#e0e0e0', paddingBottom: 4 }}
                        placeholder="No max"
                      />
                    </div>
                  </div>

                  {/* Ring sizes */}
                  <div className="mb-5">
                    <span className="font-sans uppercase block mb-2" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>
                      Ring Sizes ({localRingSizes.length} selected)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {UK_RING_SIZES.map(size => {
                        const active = localRingSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const next = active
                                ? localRingSizes.filter(s => s !== size)
                                : [...localRingSizes, size].sort((a, b) => UK_RING_SIZES.indexOf(a) - UK_RING_SIZES.indexOf(b));
                              setLocalRingSizes(next);
                              scheduleEngagementSave({ ringSizes: next });
                            }}
                            className="font-sans transition-colors"
                            style={{
                              fontSize: 9,
                              letterSpacing: '0.06em',
                              padding: '3px 6px',
                              border: `1px solid ${active ? G : '#e0e0e0'}`,
                              background: active ? G : 'transparent',
                              color: active ? '#fff' : '#aaa',
                              cursor: 'pointer',
                              lineHeight: 1.6,
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fixed attribute fields */}
                  <div className="flex flex-col gap-3 mb-4">
                    <div>
                      <label className="font-sans uppercase block mb-1.5" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>Setting Style</label>
                      <input
                        type="text"
                        value={localSettingStyle}
                        onChange={e => { setLocalSettingStyle(e.target.value); scheduleEngagementSave({ settingStyle: e.target.value || null }); }}
                        className="w-full border-b focus:outline-none bg-transparent font-sans"
                        style={{ fontSize: 12, color: G, borderColor: '#e0e0e0', paddingBottom: 4 }}
                        placeholder="Setting style (admin reference)"
                      />
                    </div>
                    <div>
                      <label className="font-sans uppercase block mb-1.5" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>Band Style</label>
                      <input
                        type="text"
                        value={localBandStyle}
                        onChange={e => { setLocalBandStyle(e.target.value); scheduleEngagementSave({ bandStyle: e.target.value || null }); }}
                        className="w-full border-b focus:outline-none bg-transparent font-sans"
                        style={{ fontSize: 12, color: G, borderColor: '#e0e0e0', paddingBottom: 4 }}
                        placeholder="Band style (admin reference)"
                      />
                    </div>
                    <div>
                      <label className="font-sans uppercase block mb-1.5" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#bbb' }}>Head Style</label>
                      <input
                        type="text"
                        value={localHeadStyle}
                        onChange={e => { setLocalHeadStyle(e.target.value); scheduleEngagementSave({ headStyle: e.target.value || null }); }}
                        className="w-full border-b focus:outline-none bg-transparent font-sans"
                        style={{ fontSize: 12, color: G, borderColor: '#e0e0e0', paddingBottom: 4 }}
                        placeholder="Head style (admin reference)"
                      />
                    </div>
                  </div>

                  {/* Boolean toggles */}
                  <div>
                    {(
                      [
                        { label: 'Requires Diamond Selection',  val: localRequiresDiamond, key: 'requiresDiamondSelection'  as const },
                        { label: 'Requires Ring Size Selection', val: localRequiresSize,    key: 'requiresRingSizeSelection' as const },
                      ] as const
                    ).map(({ label, val, key }) => (
                      <div key={key} className="flex items-center justify-between py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <span className="font-sans" style={{ fontSize: 11, color: '#888', fontWeight: 300 }}>{label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !val;
                            if (key === 'requiresDiamondSelection')  setLocalRequiresDiamond(next);
                            if (key === 'requiresRingSizeSelection') setLocalRequiresSize(next);
                            scheduleEngagementSave({ [key]: next });
                          }}
                          className="font-sans uppercase"
                          style={{
                            fontSize: 8,
                            letterSpacing: '0.15em',
                            color: val ? '#4a9e6b' : '#aaa',
                            border: `1px solid ${val ? '#4a9e6b' : '#e0e0e0'}`,
                            padding: '3px 10px',
                          }}
                        >
                          {val ? 'On' : 'Off'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Diamond assignment — hidden for pair-based products (e.g. earrings).
              Earrings are configured via Earring Diamond Offers in the product editor. */}
          {props.showDiamondPanel !== false && (
            <>
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
            </>
          )}

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

      {/* ── DIAMOND DRAWER — fixed slide-over (hidden for pair-based products) ── */}
      {props.showDiamondPanel !== false && (<>
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
      </>)}
    </div>
  );
}
