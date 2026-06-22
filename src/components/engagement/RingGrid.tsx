'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';
import type { DiamondShape } from './ShapeSelector';

const GREEN = '#1a2b1a';
const GOLD  = '#b8965a';

const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'The Lumière Solitaire',    price: '£4,850',  image: '/images/engagement/hero-solitaire.png',  slug: 'lumiere-solitaire'   },
  { id: 'p2', name: 'The Aura Halo',             price: '£5,650',  image: '/images/engagement/hero-halo.png',        slug: 'aura-halo'            },
  { id: 'p3', name: 'The Éternité Three Stone',  price: '£7,200',  image: '/images/engagement/hero-three-stone.png', slug: 'eternite-three-stone' },
  { id: 'p4', name: 'The Constellation Pavé',    price: '£6,100',  image: '/images/engagement/hero-pave.png',        slug: 'constellation-pave'   },
  { id: 'p5', name: 'The Classique Solitaire',   price: '£3,950',  image: '/images/engagement/hero-collection.png',  slug: 'classique-solitaire'  },
  { id: 'p6', name: 'The Rivière Halo',          price: '£8,400',  image: '/images/engagement/hero-halo.png',        slug: 'riviere-halo'         },
];

interface Props {
  settings: RingSettingRecord[];
  activeSetting: string | null;
  activeShape: DiamondShape | null;
  activeMetal: RingMetal | null;
}

export function RingGrid({ settings, activeSetting, activeShape, activeMetal }: Props) {
  const rings = settings.length > 0
    ? settings
        .filter((r) => !activeSetting || r.id === activeSetting)
        .filter((r) => !activeMetal || r.metals.includes(activeMetal))
        .map((r) => ({
          id: r.id,
          name: r.name,
          price: r.base_price_gbp
            ? `From £${Number(r.base_price_gbp).toLocaleString('en-GB')}`
            : 'Price on request',
          image: '/images/engagement/hero-solitaire.png',
          slug: r.slug,
        }))
    : PLACEHOLDER_RINGS;

  return (
    <section>
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <p
            className="font-sans uppercase tracking-[0.35em] mb-3"
            style={{ fontSize: 9, color: `${GREEN}55` }}
          >
            The Collection
          </p>
          <h2
            className="font-display italic"
            style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 300, color: GREEN, lineHeight: 1.1 }}
          >
            {rings.length} {rings.length === 1 ? 'ring' : 'rings'}
          </h2>
        </div>
        {(activeSetting || activeShape || activeMetal) && (
          <p className="font-sans" style={{ fontSize: 11, color: `${GREEN}55`, letterSpacing: '0.05em' }}>
            Filtered selection
          </p>
        )}
      </div>

      {rings.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display italic" style={{ fontSize: 22, color: `${GREEN}44`, fontWeight: 300 }}>
            No rings match your selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {rings.map((ring) => (
            <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block">
              {/* image — white background, no border, generous aspect */}
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '3/4', backgroundColor: '#f7f5f2' }}
              >
                <Image
                  src={ring.image}
                  alt={ring.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width:768px) 50vw, 20vw"
                />
              </div>

              {/* name + price — minimal, below image */}
              <div className="mt-5">
                <h3
                  className="font-display italic"
                  style={{ fontSize: 16, fontWeight: 300, color: GREEN, lineHeight: 1.3, letterSpacing: '0.01em' }}
                >
                  {ring.name}
                </h3>
                <p
                  className="font-sans mt-1.5"
                  style={{ fontSize: 12, color: `${GREEN}77`, letterSpacing: '0.04em' }}
                >
                  {ring.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
