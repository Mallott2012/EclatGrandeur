'use client';

import type { RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const GOLD  = '#b8965a';

const METALS: { id: RingMetal; label: string; purity: string; swatch: string }[] = [
  { id: 'platinum',        label: 'Platinum',        purity: 'PT950',  swatch: '#dcdce0' },
  { id: 'white_gold_18k',  label: '18k White Gold',  purity: 'AU750',  swatch: '#d0d0cc' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold', purity: 'AU750',  swatch: '#c9a84c' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold',   purity: 'AU750',  swatch: '#c4846a' },
  { id: 'white_gold_9k',   label: '9k White Gold',   purity: 'AU375',  swatch: '#c4c4c0' },
  { id: 'yellow_gold_9k',  label: '9k Yellow Gold',  purity: 'AU375',  swatch: '#b8943c' },
];

interface Props {
  selected: RingMetal | null;
  onChange: (metal: RingMetal) => void;
}

export function MetalSelector({ selected, onChange }: Props) {
  return (
    <section>
      <p
        className="font-sans uppercase tracking-[0.35em] mb-10"
        style={{ fontSize: 9, color: `${GREEN}55` }}
      >
        Metal
      </p>

      {/* Swatch row */}
      <div className="flex flex-wrap gap-8">
        {METALS.map(({ id, label, purity, swatch }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-3 focus:outline-none group"
            >
              {/* circular swatch */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: swatch,
                  outline: active ? `2px solid ${GREEN}` : '2px solid transparent',
                  outlineOffset: 3,
                  transition: 'outline 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              />
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="font-sans text-center"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: active ? GREEN : `${GREEN}88`,
                    fontWeight: active ? 500 : 400,
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </span>
                <span
                  className="font-sans"
                  style={{ fontSize: 9, letterSpacing: '0.2em', color: `${GREEN}44` }}
                >
                  {purity}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
