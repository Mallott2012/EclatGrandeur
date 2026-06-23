'use client';

import { useState, useTransition, useRef } from 'react';
import { X, ImageIcon, Video, Pencil } from 'lucide-react';
import type { HeroMediaRecord, HeroPlacement } from '@/lib/hero/service';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface HeroEditCallbacks {
  onSave:    (data: HeroSavePayload) => Promise<HeroMediaRecord>;
  onDelete?: (id: string) => Promise<void>;
}

export interface HeroSavePayload {
  id?:          string;
  placement:    HeroPlacement;
  media_type:   'image' | 'video';
  storage_path: string;
  headline:     string | null;
  subheadline:  string | null;
  is_published: boolean;
}

/* ── Button shown on hero image in the listing grid ─────────────────────── */

export function HeroEditButton({
  current,
  placement,
  callbacks,
}: {
  current:   HeroMediaRecord | null;
  placement: HeroPlacement;
  callbacks: HeroEditCallbacks;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-sans uppercase transition-opacity hover:opacity-80"
        style={{
          fontSize: 10,
          letterSpacing: '0.2em',
          color: '#fff',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.25)',
          padding: '8px 16px',
        }}
      >
        <Pencil className="w-3 h-3" strokeWidth={1.75} />
        {current ? 'Change Hero' : 'Set Hero'}
      </button>

      {open && (
        <HeroEditModal
          current={current}
          placement={placement}
          callbacks={callbacks}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────────── */

function HeroEditModal({
  current,
  placement,
  callbacks,
  onClose,
}: {
  current:   HeroMediaRecord | null;
  placement: HeroPlacement;
  callbacks: HeroEditCallbacks;
  onClose:   () => void;
}) {
  const [mediaType,   setMediaType]   = useState<'image' | 'video'>(current?.media_type === 'video' ? 'video' : 'image');
  const [storagePath, setStoragePath] = useState(current?.storage_path ?? '');
  const [headline,    setHeadline]    = useState(current?.headline    ?? '');
  const [subheadline, setSubheadline] = useState(current?.subheadline ?? '');
  const [published,   setPublished]   = useState(current?.is_published ?? true);
  const [error,       setError]       = useState('');
  const [pending,     startTransition] = useTransition();
  const backdropRef = useRef<HTMLDivElement>(null);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function handleSave() {
    if (!storagePath.trim()) { setError('Please enter an image or video URL / storage path.'); return; }
    setError('');
    startTransition(async () => {
      try {
        await callbacks.onSave({
          id:           current?.id,
          placement,
          media_type:   mediaType,
          storage_path: storagePath.trim(),
          headline:     headline.trim() || null,
          subheadline:  subheadline.trim() || null,
          is_published: published,
        });
        onClose();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
      }
    });
  }

  function handleDelete() {
    if (!current || !callbacks.onDelete) return;
    if (!confirm('Remove this hero media permanently?')) return;
    startTransition(async () => {
      await callbacks.onDelete!(current.id);
      onClose();
    });
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >

        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <div>
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              Hero Media
            </p>
            <p className="font-display mt-1 capitalize" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.04em', color: '#1a2b1a' }}>
              {placement.replace(/-/g, ' ')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 transition-opacity hover:opacity-50">
            <X className="w-4 h-4" style={{ color: '#aaa' }} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-7">

          {/* Media type */}
          <div>
            <Label>Media type</Label>
            <div className="flex gap-3 mt-2">
              {(['image', 'video'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMediaType(type)}
                  className="flex items-center gap-2 px-4 py-2.5 font-sans uppercase transition-colors"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    border: `1px solid ${mediaType === type ? '#1a2b1a' : '#e0e0e0'}`,
                    color:  mediaType === type ? '#1a2b1a' : '#aaa',
                    background: mediaType === type ? '#f8f8f6' : '#fff',
                  }}
                >
                  {type === 'image'
                    ? <ImageIcon className="w-3 h-3" strokeWidth={1.5} />
                    : <Video     className="w-3 h-3" strokeWidth={1.5} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Storage path / URL */}
          <div>
            <Label required>
              {mediaType === 'image' ? 'Image' : 'Video'} URL or storage path
            </Label>
            <input
              type="text"
              value={storagePath}
              onChange={e => setStoragePath(e.target.value)}
              placeholder={mediaType === 'image' ? '/images/hero/ring.png  or  https://…' : 'https://cdn.example.com/video.mp4'}
              className="w-full mt-2 font-sans"
              style={{
                fontSize: 13,
                color: '#1a2b1a',
                border: '1px solid #e0e0e0',
                padding: '10px 14px',
                outline: 'none',
                letterSpacing: '0.01em',
              }}
            />
            <p className="font-sans mt-1.5" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.02em' }}>
              Supabase storage path or any public URL.
            </p>
          </div>

          {/* Headline */}
          <div>
            <Label>Headline</Label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="The Éclat Collection"
              className="w-full mt-2 font-sans"
              style={{
                fontSize: 13,
                color: '#1a2b1a',
                border: '1px solid #e0e0e0',
                padding: '10px 14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Subheadline */}
          <div>
            <Label>Subheadline</Label>
            <input
              type="text"
              value={subheadline}
              onChange={e => setSubheadline(e.target.value)}
              placeholder="A woman in full"
              className="w-full mt-2 font-sans"
              style={{
                fontSize: 13,
                color: '#1a2b1a',
                border: '1px solid #e0e0e0',
                padding: '10px 14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Published */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setPublished(p => !p)}
              className="relative flex-shrink-0"
              style={{ width: 36, height: 20 }}
            >
              <div
                className="absolute inset-0 rounded-full transition-colors"
                style={{ background: published ? '#1a2b1a' : '#d8d8d8' }}
              />
              <div
                className="absolute top-1 transition-transform rounded-full bg-white"
                style={{
                  width: 14,
                  height: 14,
                  left: published ? 19 : 3,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                }}
              />
            </div>
            <span className="font-sans" style={{ fontSize: 12, color: '#555', letterSpacing: '0.03em' }}>
              Publish immediately (visible on storefront)
            </span>
          </label>

          {/* Error */}
          {error && (
            <p className="font-sans" style={{ fontSize: 12, color: '#b85a5a', letterSpacing: '0.02em' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ borderTop: '1px solid #f0f0f0' }}
        >
          {current && callbacks.onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: '#b85a5a' }}
            >
              Remove
            </button>
          ) : <span />}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: '#aaa' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color: '#fff',
                background: '#1a2b1a',
                padding: '10px 24px',
              }}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#aaa' }}>
      {children}{required && <span style={{ color: '#1a2b1a', marginLeft: 2 }}>*</span>}
    </p>
  );
}
