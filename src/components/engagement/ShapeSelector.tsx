'use client';

const GREEN = '#1a2b1a';
const GOLD  = '#b8965a';

export type DiamondShape =
  | 'round' | 'oval' | 'emerald' | 'pear' | 'cushion'
  | 'princess' | 'marquise' | 'radiant' | 'heart' | 'asscher';

// Clean outline SVGs — no internal facet lines, just the silhouette
const SHAPES: { id: DiamondShape; label: string; viewBox: string; path: string }[] = [
  {
    id: 'round', label: 'Round', viewBox: '0 0 64 64',
    path: 'M32 6 L54 20 L54 44 L32 58 L10 44 L10 20 Z',
  },
  {
    id: 'oval', label: 'Oval', viewBox: '0 0 52 72',
    path: 'M26 4 C38 4 48 14 48 36 C48 58 38 68 26 68 C14 68 4 58 4 36 C4 14 14 4 26 4 Z',
  },
  {
    id: 'emerald', label: 'Emerald', viewBox: '0 0 64 56',
    path: 'M16 4 L48 4 L60 14 L60 42 L48 52 L16 52 L4 42 L4 14 Z',
  },
  {
    id: 'pear', label: 'Pear', viewBox: '0 0 52 72',
    path: 'M26 6 C38 6 48 17 48 30 C48 50 36 66 26 66 C16 66 4 50 4 30 C4 17 14 6 26 6 Z',
  },
  {
    id: 'cushion', label: 'Cushion', viewBox: '0 0 64 64',
    path: 'M14 4 L50 4 Q60 4 60 14 L60 50 Q60 60 50 60 L14 60 Q4 60 4 50 L4 14 Q4 4 14 4 Z',
  },
  {
    id: 'princess', label: 'Princess', viewBox: '0 0 60 60',
    path: 'M4 4 L56 4 L56 56 L4 56 Z',
  },
  {
    id: 'marquise', label: 'Marquise', viewBox: '0 0 40 72',
    path: 'M20 4 C30 18 36 28 36 36 C36 52 30 62 20 68 C10 62 4 52 4 36 C4 28 10 18 20 4 Z',
  },
  {
    id: 'radiant', label: 'Radiant', viewBox: '0 0 58 64',
    path: 'M14 4 L44 4 L54 16 L54 48 L44 60 L14 60 L4 48 L4 16 Z',
  },
  {
    id: 'asscher', label: 'Asscher', viewBox: '0 0 64 64',
    path: 'M20 4 L44 4 L60 20 L60 44 L44 60 L20 60 L4 44 L4 20 Z',
  },
  {
    id: 'heart', label: 'Heart', viewBox: '0 0 64 64',
    path: 'M32 58 C32 58 4 38 4 20 C4 10 12 4 20 4 C26 4 30 8 32 12 C34 8 38 4 44 4 C52 4 60 10 60 20 C60 38 32 58 32 58 Z',
  },
];

interface Props {
  selected: DiamondShape | null;
  onChange: (shape: DiamondShape) => void;
}

export function ShapeSelector({ selected, onChange }: Props) {
  return (
    <section>
      <p
        className="font-sans uppercase tracking-[0.35em] mb-10"
        style={{ fontSize: 9, color: `${GREEN}55` }}
      >
        Stone Shape
      </p>

      {/* Single row — scrollable on mobile */}
      <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {SHAPES.map(({ id, label, viewBox, path }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex-shrink-0 flex flex-col items-center gap-4 focus:outline-none group"
              style={{ width: 68 }}
            >
              {/* SVG silhouette */}
              <div className="w-12 h-14 flex items-center justify-center">
                <svg viewBox={viewBox} className="max-w-full max-h-full" style={{ overflow: 'visible' }}>
                  <path
                    d={path}
                    fill="none"
                    stroke={active ? GREEN : `${GREEN}44`}
                    strokeWidth={active ? 1.8 : 1.2}
                    style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                  />
                </svg>
              </div>

              {/* label */}
              <span
                className="font-sans uppercase text-center block"
                style={{
                  fontSize: 8.5,
                  letterSpacing: '0.2em',
                  color: active ? GREEN : `${GREEN}66`,
                  transition: 'color 0.2s',
                }}
              >
                {label}
              </span>

              {/* active dot */}
              <div
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  backgroundColor: active ? GOLD : 'transparent',
                  transition: 'background 0.2s',
                  marginTop: -8,
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
