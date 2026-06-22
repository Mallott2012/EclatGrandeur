'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { RingSettingRecord } from '@/lib/ring-settings/types';
import type { DiamondShape } from './ShapeSelector';
import type { RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const IVORY = '#e8e2d4';
const GOLD  = '#b8965a';

// Placeholder rings for when DB has no data yet
const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'The Lumière Solitaire',  price: '£4,850',  image: '/images/engagement/hero-solitaire.png',  slug: 'lumiere-solitaire'  },
  { id: 'p2', name: 'The Aura Halo',           price: '£5,650',  image: '/images/engagement/hero-halo.png',        slug: 'aura-halo'           },
  { id: 'p3', name: 'The Éternité Three Stone', price: '£7,200', image: '/images/engagement/hero-three-stone.png', slug: 'eternite-three-stone' },
  { id: 'p4', name: 'The Constellation Pavé',  price: '£6,100',  image: '/images/engagement/hero-pave.png',        slug: 'constellation-pave'  },
  { id: 'p5', name: 'The Classique Solitaire', price: '£3,950',  image: '/images/engagement/hero-collection.png',  slug: 'classique-solitaire' },
  { id: 'p6', name: 'The Rivière Halo',        price: '£8,400',  image: '/images/engagement/hero-halo.png',        slug: 'riviere-halo'        },
];

interface Props {
  settings: RingSettingRecord[];
  activeSetting: string | null;
  activeShape: DiamondShape | null;
  activeMetal: RingMetal | null;
}

export function RingGrid({ settings, activeSetting, activeShape, activeMetal }: Props) {
  // Filter from DB records or fall back to placeholders
  const rings = settings.length > 0
    ? settings
        .filter((r) => !activeSetting || r.id === activeSetting)
        .filter((r) => !activeMetal || r.metals.includes(activeMetal))
        .map((r) => ({
          id: r.id,
          name: r.name,
          price: r.base_price_gbp ? `£${Number(r.base_price_gbp).toLocaleString('en-GB')}` : 'Price on request',
          image: '/images/engagement/hero-solitaire.png',
          slug: r.slug,
        }))
    : PLACEHOLDER_RINGS;

  const hasFilters = activeSetting || activeShape || activeMetal;

  return (
    <section>
      <div className="mb-8">
        <p
          className="font-sans uppercase tracking-[0.3em] mb-3"
          style={{ fontSize: 10, color: `${GREEN}88` }}
        >
          Step 04
        </p>
        <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 14 }} />
        <div className="flex items-end justify-between">
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 300, color: GREEN, lineHeight: 1.1 }}
          >
            {hasFilters ? 'Your curated selection' : 'Our collection'}
          </h2>
          <span
            className="font-sans pb-1"
            style={{ fontSize: 11, color: `${GREEN}66`, letterSpacing: '0.1em' }}
          >
            {rings.length} {rings.length === 1 ? 'ring' : 'rings'}
          </span>
        </div>
      </div>

      {rings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 border"
          style={{ borderColor: `${GREEN}22`, borderRadius: 2 }}
        >
          <p className="font-display italic" style={{ fontSize: 20, color: `${GREEN}66`, fontWeight: 300 }}>
            No rings match your selection.
          </p>
          <p className="font-sans mt-2" style={{ fontSize: 13, color: `${GREEN}55` }}>
            Try adjusting your filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {rings.map((ring) => (
            <Link
              key={ring.id}
              href={`/engagement-rings/${ring.slug}`}
              className="group block"
            >
              <div
                className="overflow-hidden border transition-all duration-300 group-hover:border-[#1a2b1a55]"
                style={{ borderColor: `${GREEN}1a`, borderRadius: 2 }}
              >
                {/* image */}
                <div className="relative aspect-square overflow-hidden bg-[#f5f1e8]">
                  <Image
                    src={ring.image}
                    alt={ring.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width:768px) 50vw, 22vw"
                  />
                </div>

                {/* info */}
                <div className="px-4 py-4" style={{ backgroundColor: IVORY }}>
                  <h3
                    className="font-display italic"
                    style={{ fontSize: 16, fontWeight: 300, color: GREEN, lineHeight: 1.2, letterSpacing: '0.01em' }}
                  >
                    {ring.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="font-sans"
                      style={{ fontSize: 13, color: `${GREEN}bb` }}
                    >
                      {ring.price}
                    </span>
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 9, letterSpacing: '0.2em', color: GOLD }}
                    >
                      View
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
