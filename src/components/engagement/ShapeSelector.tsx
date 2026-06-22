'use client';

import { cn } from '@/lib/utils';

const GREEN = '#1a2b1a';
const IVORY = '#ffffff';
const GOLD  = '#b8965a';

export type DiamondShape =
  | 'round'
  | 'oval'
  | 'emerald'
  | 'pear'
  | 'cushion'
  | 'princess'
  | 'marquise'
  | 'radiant'
  | 'heart'
  | 'asscher';

// SVG silhouettes for each shape — precise, minimal, luxury
const SHAPE_SVGS: Record<DiamondShape, React.FC<{ active: boolean }>> = {
  round: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <circle cx="30" cy="30" r="22" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="30" y1="8" x2="30" y2="52" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="8" y1="30" x2="52" y2="30" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="14" y1="14" x2="46" y2="46" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="46" y1="14" x2="14" y2="46" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
    </svg>
  ),
  oval: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <ellipse cx="30" cy="30" rx="16" ry="23" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="30" y1="7" x2="30" y2="53" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="14" y1="30" x2="46" y2="30" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
    </svg>
  ),
  emerald: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <polygon points="16,10 44,10 50,20 50,40 44,50 16,50 10,40 10,20" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <rect x="16" y="15" width="28" height="30" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.35" />
      <rect x="20" y="19" width="20" height="22" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.35" />
    </svg>
  ),
  pear: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <path d="M30,8 C40,8 50,16 50,28 C50,40 40,52 30,52 C20,52 10,40 10,28 C10,16 20,8 30,8 Z" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="30" y1="8" x2="30" y2="52" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
    </svg>
  ),
  cushion: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <rect x="10" y="10" width="40" height="40" rx="8" ry="8" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <rect x="16" y="16" width="28" height="28" rx="4" ry="4" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.35" />
    </svg>
  ),
  princess: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <rect x="12" y="12" width="36" height="36" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="12" y1="12" x2="48" y2="48" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="48" y1="12" x2="12" y2="48" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="30" y1="12" x2="30" y2="48" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
      <line x1="12" y1="30" x2="48" y2="30" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
    </svg>
  ),
  marquise: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <path d="M30,8 L50,30 L30,52 L10,30 Z" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="30" y1="8" x2="30" y2="52" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
      <line x1="10" y1="30" x2="50" y2="30" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.4" />
    </svg>
  ),
  radiant: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <polygon points="18,10 42,10 50,18 50,42 42,50 18,50 10,42 10,18" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <line x1="18" y1="10" x2="42" y2="50" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
      <line x1="42" y1="10" x2="18" y2="50" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
      <line x1="10" y1="30" x2="50" y2="30" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
      <line x1="30" y1="10" x2="30" y2="50" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.3" />
    </svg>
  ),
  heart: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <path d="M30,50 C30,50 8,36 8,22 C8,14 14,8 21,8 C25,8 29,11 30,13 C31,11 35,8 39,8 C46,8 52,14 52,22 C52,36 30,50 30,50 Z" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
    </svg>
  ),
  asscher: ({ active }) => (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <polygon points="20,10 40,10 50,20 50,40 40,50 20,50 10,40 10,20" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="1.2" />
      <polygon points="22,16 38,16 44,22 44,38 38,44 22,44 16,38 16,22" fill="none" stroke={active ? IVORY : GREEN} strokeWidth="0.4" opacity="0.35" />
    </svg>
  ),
};

const SHAPES: { id: DiamondShape; label: string }[] = [
  { id: 'round',     label: 'Round'     },
  { id: 'oval',      label: 'Oval'      },
  { id: 'emerald',   label: 'Emerald'   },
  { id: 'pear',      label: 'Pear'      },
  { id: 'cushion',   label: 'Cushion'   },
  { id: 'princess',  label: 'Princess'  },
  { id: 'marquise',  label: 'Marquise'  },
  { id: 'radiant',   label: 'Radiant'   },
  { id: 'asscher',   label: 'Asscher'   },
  { id: 'heart',     label: 'Heart'     },
];

interface Props {
  selected: DiamondShape | null;
  onChange: (shape: DiamondShape) => void;
}

export function ShapeSelector({ selected, onChange }: Props) {
  return (
    <section>
      <div className="mb-8">
        <p
          className="font-sans uppercase tracking-[0.3em] mb-3"
          style={{ fontSize: 10, color: `${GREEN}88` }}
        >
          Step 02
        </p>
        <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 14 }} />
        <h2
          className="font-display"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 300, color: GREEN, lineHeight: 1.1 }}
        >
          Choose your stone shape
        </h2>
        <p
          className="mt-3 font-sans leading-relaxed"
          style={{ fontSize: 14, color: `${GREEN}99`, maxWidth: 360 }}
        >
          Each cut reveals a different character. Our GIA-certified stones are individually selected for brilliance.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {SHAPES.map(({ id, label }) => {
          const active = selected === id;
          const ShapeSVG = SHAPE_SVGS[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'group flex flex-col items-center gap-2 py-4 px-2 border transition-all duration-200',
                active
                  ? 'border-[#1a2b1a]'
                  : 'border-[#1a2b1a22] hover:border-[#1a2b1a55]',
              )}
              style={{
                borderRadius: 2,
                backgroundColor: active ? GREEN : 'transparent',
              }}
            >
              <div className="w-10 h-10">
                <ShapeSVG active={active} />
              </div>
              <span
                className="font-sans uppercase text-center"
                style={{ fontSize: 8, letterSpacing: '0.2em', color: active ? IVORY : `${GREEN}bb` }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
