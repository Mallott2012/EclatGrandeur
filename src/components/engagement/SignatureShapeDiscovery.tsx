'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

// Six shapes from ring-settings/types — exactly these, no others
const SHAPES: {
  id:      string;
  label:   string;
  viewBox: string;
  outer:   string;
  table:   string;
}[] = [
  {
    id: 'round', label: 'Round',
    viewBox: '0 0 40 44',
    outer: 'M20 3 C29.9 3 37 10.1 37 20 C37 29.9 29.9 37 20 37 C10.1 37 3 29.9 3 20 C3 10.1 10.1 3 20 3 Z',
    table: 'M26 12 L20 9 L14 12 L11 18 L14 26 L20 29 L26 26 L29 20 Z',
  },
  {
    id: 'oval', label: 'Oval',
    viewBox: '0 0 34 50',
    outer: 'M17 3 C26 3 31 11 31 25 C31 39 26 47 17 47 C8 47 3 39 3 25 C3 11 8 3 17 3 Z',
    table: 'M22 10 C25 15 25 35 22 40 L12 40 C9 35 9 15 12 10 Z',
  },
  {
    id: 'emerald', label: 'Emerald',
    viewBox: '0 0 44 38',
    outer: 'M10 3 L34 3 L41 10 L41 28 L34 35 L10 35 L3 28 L3 10 Z',
    table: 'M14 9 L30 9 L35 14 L35 24 L30 29 L14 29 L9 24 L9 14 Z',
  },
  {
    id: 'cushion', label: 'Cushion',
    viewBox: '0 0 44 44',
    outer: 'M10 3 L34 3 Q41 3 41 10 L41 34 Q41 41 34 41 L10 41 Q3 41 3 34 L3 10 Q3 3 10 3 Z',
    table: 'M14 10 L30 10 L34 14 L34 30 L30 34 L14 34 L10 30 L10 14 Z',
  },
  {
    id: 'pear', label: 'Pear',
    viewBox: '0 0 34 52',
    outer: 'M17 4 C24 4 30 10 30 19 C30 34 23 48 17 48 C11 48 4 34 4 19 C4 10 10 4 17 4 Z',
    table: 'M17 9 C21 9 25 13 25 19 L17 44 L9 19 C9 13 13 9 17 9 Z',
  },
  {
    id: 'radiant', label: 'Radiant',
    viewBox: '0 0 44 48',
    outer: 'M10 3 L34 3 L41 11 L41 37 L34 45 L10 45 L3 37 L3 11 Z',
    table: 'M14 10 L30 10 L36 16 L36 32 L30 38 L14 38 L8 32 L8 16 Z',
  },
];

interface Props {
  activeShape:   string | null;
  onShapeSelect: (shape: string) => void;
  onClear:       () => void;
  settingCount?: number;
}

export function SignatureShapeDiscovery({ activeShape, onShapeSelect, onClear, settingCount }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef  = useRef(false);

  // Fire section_viewed once when visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || viewedRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          trackEvent('engagement_shape_section_viewed', {});
          trackEvent('engagement_shape_filter_loaded', { resultCount: settingCount });
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [settingCount]);

  function handleSelect(id: string) {
    if (activeShape === id) {
      onClear();
      trackEvent('engagement_shape_filter_cleared', { previousShape: id });
    } else {
      onShapeSelect(id);
      trackEvent('engagement_shape_clicked', { shape: id, previousShape: activeShape ?? undefined });
    }
  }

  return (
    <section ref={sectionRef} style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="px-8 lg:px-14 pt-10 pb-0">
        {/* Eyebrow */}
        <p className="font-sans uppercase mb-1" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb' }}>
          Discover Your
        </p>
        <h2 className="font-display mb-1" style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 300, letterSpacing: '0.12em', color: G, textTransform: 'uppercase' }}>
          Signature Shape
        </h2>
        <p className="font-sans mb-7" style={{ fontSize: 12, color: '#999', fontWeight: 300, letterSpacing: '0.02em' }}>
          Every shape expresses a distinct character. Select one to explore compatible settings.
        </p>
      </div>

      {/* Shape row — horizontal scroll on mobile */}
      <div className="overflow-x-auto px-8 lg:px-14" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-end gap-6 lg:gap-10 pb-8" style={{ minWidth: 'max-content' }}>
          {SHAPES.map(({ id, label, viewBox, outer, table }) => {
            const active = activeShape === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                className="flex flex-col items-center gap-3 focus:outline-none group transition-opacity"
                style={{ opacity: activeShape && !active ? 0.35 : 1, transition: 'opacity 0.2s' }}
                aria-pressed={active}
              >
                {/* Shape illustration */}
                <div style={{ width: 44, height: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <svg viewBox={viewBox} width="44" height="52" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                    {/* Outer filled silhouette */}
                    <path
                      d={outer}
                      fill={active ? G : '#e8e8e8'}
                      style={{ transition: 'fill 0.2s' }}
                    />
                    {/* Table facet hint */}
                    <path
                      d={table}
                      fill="none"
                      stroke={active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)'}
                      strokeWidth="0.8"
                      style={{ transition: 'stroke 0.2s' }}
                    />
                  </svg>
                </div>

                {/* Label */}
                <span
                  className="font-sans"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color:      active ? G : '#aaa',
                    fontWeight: active ? 500 : 400,
                    transition: 'color 0.2s',
                    display: 'block',
                  }}
                >
                  {label}
                </span>

                {/* Active indicator dot */}
                <span
                  style={{
                    display: 'block',
                    width:  active ? 4 : 0,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: G,
                    transition: 'width 0.15s',
                    overflow: 'hidden',
                  }}
                />
              </button>
            );
          })}

          {/* All shapes / reset — shown when a shape is active */}
          {activeShape && (
            <button
              type="button"
              onClick={onClear}
              className="flex flex-col items-center gap-3 focus:outline-none"
              style={{ opacity: 0.55, transition: 'opacity 0.2s' }}
            >
              <div style={{ width: 44, height: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span
                  className="font-display flex items-center justify-center"
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid #ccc`, color: '#aaa', fontSize: 11 }}
                >
                  ✕
                </span>
              </div>
              <span className="font-sans" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa', fontWeight: 400 }}>
                All
              </span>
              <span style={{ display: 'block', width: 0, height: 4 }} />
            </button>
          )}
        </div>
      </div>

      {/* Active shape summary line */}
      {activeShape && (
        <div className="px-8 lg:px-14 pb-4" style={{ marginTop: -8 }}>
          <p className="font-sans" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', fontStyle: 'italic' }}>
            {settingCount != null
              ? `${settingCount} ${SHAPES.find(s => s.id === activeShape)?.label ?? ''} setting${settingCount === 1 ? '' : 's'} available`
              : `Showing ${SHAPES.find(s => s.id === activeShape)?.label ?? ''} compatible settings`
            }
          </p>
        </div>
      )}
    </section>
  );
}
