'use client';

const GREEN = '#1a2b1a';

export type DiamondShape =
  | 'round' | 'oval' | 'emerald' | 'pear' | 'cushion'
  | 'princess' | 'marquise' | 'radiant' | 'asscher' | 'heart';

const SHAPES: { id: DiamondShape; label: string; viewBox: string; path: string }[] = [
  { id: 'round',    label: 'Round',    viewBox: '0 0 40 40', path: 'M20 3 C29.9 3 38 11.1 38 21 C38 30.9 29.9 38 20 38 C10.1 38 2 30.9 2 21 C2 11.1 10.1 3 20 3 Z' },
  { id: 'oval',     label: 'Oval',     viewBox: '0 0 34 50', path: 'M17 3 C26 3 31 11 31 25 C31 39 26 47 17 47 C8 47 3 39 3 25 C3 11 8 3 17 3 Z' },
  { id: 'emerald',  label: 'Emerald',  viewBox: '0 0 44 38', path: 'M10 3 L34 3 L41 10 L41 28 L34 35 L10 35 L3 28 L3 10 Z' },
  { id: 'pear',     label: 'Pear',     viewBox: '0 0 34 52', path: 'M17 4 C24 4 30 10 30 19 C30 34 23 48 17 48 C11 48 4 34 4 19 C4 10 10 4 17 4 Z' },
  { id: 'cushion',  label: 'Cushion',  viewBox: '0 0 44 44', path: 'M10 3 L34 3 Q41 3 41 10 L41 34 Q41 41 34 41 L10 41 Q3 41 3 34 L3 10 Q3 3 10 3 Z' },
  { id: 'princess', label: 'Princess', viewBox: '0 0 40 40', path: 'M3 3 L37 3 L37 37 L3 37 Z' },
  { id: 'marquise', label: 'Marquise', viewBox: '0 0 28 52', path: 'M14 3 C20 13 24 20 24 26 C24 38 20 46 14 50 C8 46 4 38 4 26 C4 20 8 13 14 3 Z' },
  { id: 'radiant',  label: 'Radiant',  viewBox: '0 0 44 48', path: 'M10 3 L34 3 L41 11 L41 37 L34 45 L10 45 L3 37 L3 11 Z' },
  { id: 'asscher',  label: 'Asscher',  viewBox: '0 0 44 44', path: 'M14 3 L30 3 L41 14 L41 30 L30 41 L14 41 L3 30 L3 14 Z' },
  { id: 'heart',    label: 'Heart',    viewBox: '0 0 44 44', path: 'M22 40 C22 40 3 26 3 14 C3 7 8 3 14 3 C18 3 21 5 22 8 C23 5 26 3 30 3 C36 3 41 7 41 14 C41 26 22 40 22 40 Z' },
];

interface Props {
  selected: DiamondShape | null;
  onChange: (shape: DiamondShape) => void;
}

export function ShapeSelector({ selected, onChange }: Props) {
  return (
    <div className="flex items-end gap-6 lg:gap-8" style={{ minWidth: 'max-content' }}>
      {SHAPES.map(({ id, label, viewBox, path }) => {
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-2 focus:outline-none group"
          >
            <div style={{ width: 36, height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <svg viewBox={viewBox} width="100%" height="100%">
                <path
                  d={path}
                  fill="none"
                  stroke={active ? GREEN : '#aaa'}
                  strokeWidth={active ? 1.5 : 1}
                  style={{ transition: 'stroke 0.15s' }}
                />
              </svg>
            </div>
            <span
              className="font-sans"
              style={{
                fontSize: 9,
                letterSpacing: '0.2em',
                color: active ? GREEN : '#999',
                textTransform: 'uppercase',
                fontWeight: active ? 500 : 400,
                transition: 'color 0.15s',
              }}
            >
              {label}
            </span>
            {/* active dot — like Tiffany */}
            <span
              style={{
                display: 'block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: active ? GREEN : 'transparent',
                transition: 'background 0.15s',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
