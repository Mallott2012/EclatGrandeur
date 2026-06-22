'use client';

import Image from 'next/image';
import type { RingSettingRecord } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const GOLD  = '#b8965a';

const FALLBACK_SETTINGS = [
  { id: 'solitaire',   name: 'Solitaire',   image: '/images/engagement/hero-solitaire.png',  description: 'A single stone, timeless in its clarity.' },
  { id: 'halo',        name: 'Halo',        image: '/images/engagement/hero-halo.png',         description: 'A constellation of diamonds surrounds the centre.' },
  { id: 'three-stone', name: 'Three Stone', image: '/images/engagement/hero-three-stone.png', description: 'Past, present and future in one ring.' },
  { id: 'pave',        name: 'Pavé',        image: '/images/engagement/hero-pave.png',         description: 'Diamonds set closely, uninterrupted.' },
];

type SettingOption = { id: string; name: string; image: string; description: string };

function toOptions(records: RingSettingRecord[]): SettingOption[] {
  return records.map((r) => ({
    id: r.id,
    name: r.name,
    image: '/images/engagement/hero-solitaire.png',
    description: r.description ?? '',
  }));
}

interface Props {
  settings: RingSettingRecord[];
  selected: string | null;
  onChange: (id: string, heroImage: string) => void;
}

export function SettingSelector({ settings, selected, onChange }: Props) {
  const options = settings.length > 0 ? toOptions(settings) : FALLBACK_SETTINGS;

  return (
    <section>
      {/* Section label */}
      <p
        className="font-sans uppercase tracking-[0.35em] mb-10"
        style={{ fontSize: 9, color: `${GREEN}55` }}
      >
        Setting Style
      </p>

      {/* Setting tiles — horizontal, no borders, image-led */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ backgroundColor: '#e8e2d4' }}>
        {options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id, opt.image)}
              className="group relative flex flex-col bg-white text-left focus:outline-none"
              style={{ transition: 'background 0.2s' }}
            >
              {/* image */}
              <div
                className="relative overflow-hidden w-full"
                style={{ aspectRatio: '3/4', backgroundColor: '#f7f5f2' }}
              >
                <Image
                  src={opt.image}
                  alt={opt.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-103"
                  sizes="(max-width:768px) 50vw, 22vw"
                />
                {/* active indicator — thin top border */}
                <div
                  className="absolute inset-x-0 top-0 transition-all duration-300"
                  style={{ height: 2, backgroundColor: active ? GREEN : 'transparent' }}
                />
              </div>

              {/* name + active underline */}
              <div className="px-4 py-5">
                <p
                  className="font-display italic"
                  style={{
                    fontSize: 18,
                    fontWeight: 300,
                    color: GREEN,
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  {opt.name}
                </p>
                <p
                  className="font-sans mt-2 leading-relaxed"
                  style={{ fontSize: 12, color: `${GREEN}77`, lineHeight: 1.6 }}
                >
                  {opt.description}
                </p>
                {/* underline when active */}
                <div
                  className="mt-4 transition-all duration-300"
                  style={{ height: 1, backgroundColor: active ? GOLD : 'transparent', width: active ? 24 : 0 }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
