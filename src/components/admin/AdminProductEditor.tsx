'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, Plus, Trash2, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { DiamondAssignmentPanel, type DiamondSummary } from '@/components/admin/DiamondAssignmentPanel';

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

export interface AdminProductData {
  id:          string;
  name:        string;
  subtitle:    string;
  description: string;
  basePrice:   number;
  metals:      string[];
  images:      string[];
  published:   boolean;
  // diamond assignment
  assignedDiamondIds: string[];
  allDiamonds:        DiamondSummary[];
  // callbacks (server actions)
  onSave:            (patch: Partial<AdminProductData>) => Promise<void>;
  onTogglePublish:   () => Promise<void>;
  onDelete:          () => Promise<void>;
  onAssignDiamond:   (diamondId: string) => Promise<void>;
  onUnassignDiamond: (diamondId: string) => Promise<void>;
  // nav
  backHref:    string;
  backLabel:   string;
}

// ── Inline-editable text field ─────────────────────────────────────────────────
function InlineField({
  value,
  onSave,
  multiline = false,
  style,
  className,
}: {
  value:     string;
  onSave:    (v: string) => void;
  multiline?: boolean;
  style?:    React.CSSProperties;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);

  function commit() {
    onSave(draft);
    setEditing(false);
  }
  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="relative inline-flex flex-col w-full">
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
            className="w-full bg-white border-b-2 focus:outline-none resize-none"
            style={{ ...style, borderColor: G, padding: '2px 0', minHeight: 80 }}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
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
      className={`group/field relative inline-flex items-start gap-2 cursor-pointer ${className ?? ''}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      <span style={style}>{value || <em style={{ color: '#ccc' }}>Click to edit</em>}</span>
      <Pencil
        className="w-3 h-3 mt-1 flex-shrink-0 opacity-0 group-hover/field:opacity-100 transition-opacity"
        style={{ color: '#bbb' }}
        strokeWidth={1.5}
      />
    </span>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────
export function AdminProductEditor(props: AdminProductData) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Local state for all fields
  const [name,        setName]        = useState(props.name);
  const [subtitle,    setSubtitle]    = useState(props.subtitle);
  const [description, setDescription] = useState(props.description);
  const [basePrice,   setBasePrice]   = useState(props.basePrice);
  const [metals,      setMetals]      = useState<string[]>(props.metals);
  const [images,      setImages]      = useState<string[]>(props.images);
  const [published,   setPublished]   = useState(props.published);
  const [activeImage, setActiveImage] = useState(0);
  const [saved,       setSaved]       = useState(false);
  const [editPrice,   setEditPrice]   = useState(false);
  const [priceDraft,  setPriceDraft]  = useState(String(props.basePrice));
  const fileRef = useRef<HTMLInputElement>(null);

  function save(patch: Record<string, unknown>) {
    startTransition(async () => {
      await props.onSave(patch as Partial<AdminProductData>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function toggleMetal(metalId: string) {
    const next = metals.includes(metalId)
      ? metals.filter(m => m !== metalId)
      : [...metals, metalId];
    setMetals(next);
    save({ metals: next });
  }

  function togglePublish() {
    const next = !published;
    setPublished(next);
    startTransition(async () => { await props.onTogglePublish(); });
  }

  function commitPrice() {
    const n = parseFloat(priceDraft);
    if (!isNaN(n) && n > 0) {
      setBasePrice(n);
      save({ basePrice: n });
    }
    setEditPrice(false);
  }

  function handleImageUrlAdd() {
    const url = window.prompt('Enter image URL or Supabase storage path:');
    if (url?.trim()) {
      const next = [...images, url.trim()];
      setImages(next);
      save({ images: next });
    }
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    if (activeImage >= next.length) setActiveImage(Math.max(0, next.length - 1));
    save({ images: next });
  }

  const currentImage = images[activeImage] ?? '/images/rings/ring-1.png';
  const displayPrice = `Starting from £${basePrice.toLocaleString('en-GB')}`;

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── ADMIN TOP BAR ────────────────────────────────────────────────── */}
      <div
        className="sticky top-[72px] z-30 bg-white flex items-center justify-between px-8 lg:px-14 py-3"
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

        <div className="flex items-center gap-4">
          {saved && (
            <span className="font-sans flex items-center gap-1.5" style={{ fontSize: 11, color: '#4a9e6b', letterSpacing: '0.08em' }}>
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Saved
            </span>
          )}

          {/* Published toggle */}
          <button
            type="button"
            onClick={togglePublish}
            disabled={pending}
            className="flex items-center gap-2 font-sans uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{
              fontSize: 10, letterSpacing: '0.18em',
              color: published ? '#4a9e6b' : '#aaa',
              border: `1px solid ${published ? '#4a9e6b' : '#ddd'}`,
              padding: '7px 14px',
            }}
          >
            {published ? <Eye className="w-3 h-3" strokeWidth={2} /> : <EyeOff className="w-3 h-3" strokeWidth={2} />}
            {published ? 'Published' : 'Draft'}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this product? This cannot be undone.')) {
                startTransition(async () => {
                  await props.onDelete();
                  router.push(props.backHref);
                });
              }
            }}
            disabled={pending}
            className="flex items-center gap-1.5 font-sans uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: '#e05050', border: '1px solid #fcc', padding: '7px 14px' }}
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            Delete
          </button>
        </div>
      </div>

      {/* ── SPLIT LAYOUT — mirrors frontend product page ────────────────── */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT — image panel */}
        <div
          className="lg:w-[58%] lg:sticky lg:top-[113px] lg:h-[calc(100vh-113px)] flex flex-col"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center p-10 lg:p-16 relative">
            <div className="relative w-full" style={{ maxWidth: 500, aspectRatio: '1/1' }}>
              <Image
                key={activeImage}
                src={currentImage}
                alt={name}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>

            {/* Remove current image button */}
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => removeImage(activeImage)}
                className="absolute top-4 right-4 flex items-center gap-1.5 font-sans uppercase"
                style={{ fontSize: 9, letterSpacing: '0.2em', color: '#fff', background: 'rgba(180,50,50,0.75)', padding: '5px 10px' }}
              >
                <Trash2 className="w-2.5 h-2.5" strokeWidth={2} />
                Remove photo
              </button>
            )}
          </div>

          {/* Thumbnail row + add button */}
          <div className="flex items-center justify-center gap-3 pb-6 flex-wrap px-6">
            {images.map((img, i) => (
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
                }}
              >
                <Image src={img} alt="" fill className="object-contain" sizes="60px" />
              </button>
            ))}
            {/* Add photo */}
            <button
              type="button"
              onClick={handleImageUrlAdd}
              className="relative flex-shrink-0 flex items-center justify-center"
              style={{ width: 60, height: 60, border: `1px dashed #ccc` }}
              aria-label="Add photo"
            >
              <Plus className="w-5 h-5" style={{ color: '#ccc' }} strokeWidth={1.5} />
            </button>
          </div>

          {/* Hidden file input for future upload support */}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" />
        </div>

        {/* RIGHT — details panel */}
        <div
          className="lg:w-[42%] px-8 lg:px-12 pt-12 pb-28 flex flex-col"
          style={{ borderLeft: `1px solid ${BORDER}` }}
        >
          {/* Name */}
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
          >
            <InlineField
              value={name}
              onSave={v => { setName(v); save({ name: v }); }}
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}
            />
          </h1>

          {/* Subtitle + price */}
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans flex-1" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>
              <InlineField
                value={subtitle}
                onSave={v => { setSubtitle(v); save({ subtitle: v }); }}
                style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}
              />
            </p>

            {/* Price inline edit */}
            {editPrice ? (
              <span className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-sans" style={{ fontSize: 14, color: G }}>£</span>
                <input
                  autoFocus
                  type="number"
                  value={priceDraft}
                  onChange={e => setPriceDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') setEditPrice(false); }}
                  className="w-24 border-b-2 focus:outline-none font-sans text-right"
                  style={{ fontSize: 14, color: G, borderColor: G }}
                />
                <button type="button" onClick={commitPrice}><Check className="w-3.5 h-3.5" style={{ color: G }} strokeWidth={2} /></button>
                <button type="button" onClick={() => setEditPrice(false)}><X className="w-3.5 h-3.5" style={{ color: '#bbb' }} strokeWidth={2} /></button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => { setPriceDraft(String(basePrice)); setEditPrice(true); }}
                className="group/price flex items-center gap-1.5 flex-shrink-0"
                title="Click to edit price"
              >
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>{displayPrice}</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/price:opacity-100 transition-opacity" style={{ color: '#bbb' }} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* Metals */}
          <div className="py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="font-sans uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#bbb' }}>
              Metals Available
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_METALS.map(m => {
                const active = metals.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMetal(m.id)}
                    className="flex items-center gap-2 font-sans transition-all"
                    style={{
                      fontSize: 11, letterSpacing: '0.06em',
                      padding: '6px 12px',
                      border: `1px solid ${active ? G : '#ddd'}`,
                      color: active ? G : '#aaa',
                      fontWeight: active ? 500 : 300,
                      backgroundColor: active ? '#f9f9f9' : 'transparent',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: m.swatch, border: '1px solid #ddd', flexShrink: 0 }} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="font-sans uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#bbb' }}>
              Description
            </p>
            <InlineField
              value={description}
              onSave={v => { setDescription(v); save({ description: v }); }}
              multiline
              style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}
              className="w-full"
            />
          </div>

          {/* Diamond assignment */}
          <div className="pt-6">
            <p className="font-sans uppercase mb-4" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#bbb' }}>
              Available Diamonds
            </p>
            <DiamondAssignmentPanel
              diamonds={props.allDiamonds}
              assignedIds={props.assignedDiamondIds}
              onAssign={props.onAssignDiamond}
              onUnassign={props.onUnassignDiamond}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
