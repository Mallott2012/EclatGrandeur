'use client';

import Image from 'next/image';
import type { HeroMediaRecord } from '@/lib/hero/service';

interface Props {
  title:      string;
  subheading: string;
  slots:      (HeroMediaRecord | null)[];   // up to 6 items, sorted by sort_order
}

/**
 * Asymmetric 6-cell editorial collage for category pages.
 *
 * Layout (CSS grid, 3 cols × 3 rows, 2px gap):
 *   ┌───────┬───┬───┐
 *   │       │ 2 │ 3 │  row 1
 *   │   1   ├───┼───┤
 *   │       │ 4 │ 5 │  row 2
 *   ├───────┴───┴───┤
 *   │       6       │  row 3 (wide)
 *   └───────────────┘
 *
 * Cell 1 spans rows 1-2 (portrait). Cell 6 spans all 3 cols (landscape).
 * Cells 2-5 are square.
 */

const CELL_SPANS: { gridColumn: string; gridRow: string }[] = [
  { gridColumn: '1',    gridRow: '1 / 3'  }, // large portrait
  { gridColumn: '2',    gridRow: '1'       }, // square top-middle
  { gridColumn: '3',    gridRow: '1'       }, // square top-right
  { gridColumn: '2',    gridRow: '2'       }, // square bottom-middle
  { gridColumn: '3',    gridRow: '2'       }, // square bottom-right
  { gridColumn: '1/4',  gridRow: '3'       }, // full-width landscape
];

const G = '#1a2b1a';

export function CategoryCollage({ title, subheading, slots }: Props) {
  const normalised = Array.from({ length: 6 }, (_, i) => slots[i] ?? null);

  return (
    <section className="w-full" style={{ paddingTop: 81 }}>
      {/* ── Collage grid ──────────────────────────────────────────────── */}
      <div
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '28vw 28vw 18vw',
          gap: 2,
          maxHeight: '90vh',
        }}
      >
        {normalised.map((slot, i) => {
          const span = CELL_SPANS[i];
          const isEmpty = !slot?.storage_path;
          const isVideo = slot?.media_type === 'video' || slot?.media_type === 'video_360';

          return (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{
                gridColumn: span.gridColumn,
                gridRow:    span.gridRow,
                background: '#f0ede8',
              }}
            >
              {isEmpty ? (
                /* Empty slot — subtle placeholder */
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#ede9e3' }}>
                  <span className="font-sans" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#ccc', textTransform: 'uppercase' }}>
                    No media
                  </span>
                </div>
              ) : isVideo ? (
                <video
                  src={slot!.storage_path}
                  autoPlay muted loop playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={slot!.storage_path}
                  alt={slot!.headline ?? title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={i < 3}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Title strip ──────────────────────────────────────────────── */}
      <div
        className="w-full flex flex-col items-center justify-center py-10 px-6"
        style={{ borderBottom: '1px solid #e8e8e8' }}
      >
        <h1
          className="font-display text-center text-balance"
          style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 300,
            color: G,
            letterSpacing: '0.06em',
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subheading && (
          <p
            className="font-sans mt-3 text-center"
            style={{ fontSize: 11, letterSpacing: '0.22em', fontWeight: 300, color: '#999', textTransform: 'uppercase' }}
          >
            {subheading}
          </p>
        )}
      </div>
    </section>
  );
}
