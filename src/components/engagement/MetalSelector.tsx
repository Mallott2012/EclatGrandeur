'use client';

import { cn } from '@/lib/utils';
import type { RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const IVORY = '#ffffff';
const GOLD  = '#b8965a';

const METALS: { id: RingMetal; label: string; sublabel: string; swatch: string }[] = [
  { id: 'platinum',        label: 'Platinum',       sublabel: 'PT950',     swatch: '#E8E8EC' },
  { id: 'white_gold_18k',  label: '18k White Gold', sublabel: 'AU750',     swatch: '#D4D4D0' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold', sublabel: 'AU750',    swatch: '#C9A84C' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold',  sublabel: 'AU750',     swatch: '#C4846A' },
  { id: 'white_gold_9k',   label: '9k White Gold',  sublabel: 'AU375',     swatch: '#C8C8C4' },
  { id: 'yellow_gold_9k',  label: '9k Yellow Gold', sublabel: 'AU375',     swatch: '#B8943C' },
];

interface Props {
  selected: RingMetal | null;
  onChange: (metal: RingMetal) => void;
}

export function MetalSelector({ selected, onChange }: Props) {
  return (
    <section>
      <div className="mb-8">
        <p
          className="font-sans uppercase tracking-[0.3em] mb-3"
          style={{ fontSize: 10, color: `${GREEN}88` }}
        >
          Step 03
        </p>
        <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 14 }} />
        <h2
          className="font-display"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 300, color: GREEN, lineHeight: 1.1 }}
        >
          Choose your metal
        </h2>
        <p
          className="mt-3 font-sans leading-relaxed"
          style={{ fontSize: 14, color: `${GREEN}99`, maxWidth: 360 }}
        >
          All metals are sourced responsibly and hallmarked by the London Assay Office.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {METALS.map(({ id, label, sublabel, swatch }) => {
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'flex items-center gap-5 px-5 py-4 border text-left transition-all duration-200',
                active
                  ? 'border-[#1a2b1a]'
                  : 'border-[#1a2b1a22] hover:border-[#1a2b1a55]',
              )}
              style={{
                borderRadius: 2,
                backgroundColor: active ? `${GREEN}08` : 'transparent',
              }}
            >
              {/* swatch circle */}
              <span
                className="flex-shrink-0 rounded-full border"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: swatch,
                  borderColor: active ? GREEN : `${GREEN}33`,
                  boxShadow: active ? `0 0 0 2px ${GREEN}` : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              />

              <span className="flex-1 min-w-0">
                <span
                  className="font-display block"
                  style={{ fontSize: 17, fontWeight: 300, color: GREEN, letterSpacing: '0.01em' }}
                >
                  {label}
                </span>
                <span
                  className="font-sans block mt-0.5"
                  style={{ fontSize: 10, letterSpacing: '0.2em', color: `${GREEN}66` }}
                >
                  {sublabel}
                </span>
              </span>

              {active && (
                <span
                  className="font-sans uppercase flex-shrink-0"
                  style={{ fontSize: 8, letterSpacing: '0.25em', color: `${GREEN}88` }}
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
