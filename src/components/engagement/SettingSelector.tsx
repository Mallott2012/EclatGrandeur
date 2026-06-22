'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { RingSettingRecord } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const IVORY = '#e8e2d4';
const GOLD  = '#b8965a';

// Fallback setting styles shown when no DB data is available
const FALLBACK_SETTINGS = [
  { id: 'solitaire',    name: 'Solitaire',    image: '/images/engagement/hero-solitaire.png',   description: 'A single stone, timeless in its clarity.' },
  { id: 'halo',         name: 'Halo',         image: '/images/engagement/hero-halo.png',          description: 'A constellation of diamonds surrounds the centre.' },
  { id: 'three-stone',  name: 'Three Stone',  image: '/images/engagement/hero-three-stone.png',  description: 'Past, present and future in one ring.' },
  { id: 'pave',         name: 'Pavé',         image: '/images/engagement/hero-pave.png',          description: 'Diamonds set closely together, uninterrupted.' },
];

type SettingOption = {
  id: string;
  name: string;
  image: string;
  description: string;
};

function toOptions(records: RingSettingRecord[]): SettingOption[] {
  return records.map((r) => ({
    id: r.id,
    name: r.name,
    image: '/images/engagement/hero-solitaire.png', // replaced by real media later
    description: r.description ?? '',
  }));
}

interface Props {
  settings: RingSettingRecord[];
  selected: string | null;
  onChange: (id: string, heroImage: string) => void;
}

export function SettingSelector({ settings, selected, onChange }: Props) {
  const options: SettingOption[] = settings.length > 0 ? toOptions(settings) : FALLBACK_SETTINGS;

  return (
    <section>
      {/* Section header */}
      <div className="mb-8">
        <p
          className="font-sans uppercase tracking-[0.3em] mb-3"
          style={{ fontSize: 10, color: `${GREEN}88` }}
        >
          Step 01
        </p>
        {/* thin gold rule */}
        <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 14 }} />
        <h2
          className="font-display"
          style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 300, color: GREEN, lineHeight: 1.1, letterSpacing: '0.01em' }}
        >
          Choose your setting
        </h2>
        <p
          className="mt-3 font-sans leading-relaxed"
          style={{ fontSize: 14, color: `${GREEN}99`, maxWidth: 360 }}
        >
          The setting defines the character of the ring. Each style is handcrafted in our London atelier.
        </p>
      </div>

      {/* Setting cards */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id, opt.image)}
              className={cn(
                'group relative overflow-hidden text-left transition-all duration-300',
                'border',
                active
                  ? 'border-[#1a2b1a]'
                  : 'border-[#1a2b1a22] hover:border-[#1a2b1a55]',
              )}
              style={{ borderRadius: 2 }}
            >
              {/* image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={opt.image}
                  alt={opt.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 50vw, 22vw"
                />
                {/* dark overlay on inactive */}
                <div
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{ backgroundColor: 'rgba(0,0,0,0.12)', opacity: active ? 0 : 1 }}
                />
              </div>

              {/* label row */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: active ? GREEN : IVORY, transition: 'background-color 0.3s' }}
              >
                <span
                  className="font-display italic"
                  style={{ fontSize: 17, fontWeight: 300, color: active ? IVORY : GREEN, letterSpacing: '0.02em' }}
                >
                  {opt.name}
                </span>
                {active && (
                  <span style={{ fontSize: 9, color: `${IVORY}99`, letterSpacing: '0.2em', fontFamily: 'var(--font-sans)' }}>
                    SELECTED
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
