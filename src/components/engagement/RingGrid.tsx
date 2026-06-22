'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';
import type { DiamondShape } from './ShapeSelector';

const GREEN  = '#1a2b1a';
const IMG_BG = '#f0eeeb'; // warm grey — matches De Beers ring card background

const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'Aurora Solitaire',             price: 'From £4,800',  image: '/images/engagement/hero-solitaire.png',   setting: 'solitaire',   slug: 'aurora-solitaire'     },
  { id: 'p2', name: 'Lumière Halo',                 price: 'From £6,200',  image: '/images/engagement/hero-halo.png',         setting: 'halo',        slug: 'lumiere-halo'         },
  { id: 'p3', name: 'Trilogy Three Stone',          price: 'From £7,500',  image: '/images/engagement/hero-three-stone.png',  setting: 'three-stone', slug: 'trilogy-three-stone'  },
  { id: 'p4', name: 'Éclat Pavé Band',              price: 'From £3,900',  image: '/images/engagement/hero-pave.png',         setting: 'pave',        slug: 'eclat-pave'           },
  { id: 'p5', name: 'Signature Solitaire',          price: 'From £5,200',  image: '/images/engagement/hero-solitaire.png',   setting: 'solitaire',   slug: 'signature-solitaire'  },
  { id: 'p6', name: 'Constellation Halo',           price: 'From £8,100',  image: '/images/engagement/hero-halo.png',         setting: 'halo',        slug: 'constellation-halo'   },
  { id: 'p7', name: 'Classic Round Brilliant',      price: 'From £5,500',  image: '/images/engagement/hero-collection.png',  setting: 'solitaire',   slug: 'classic-round'        },
  { id: 'p8', name: 'Classic Pavé Brilliant',       price: 'From £2,475',  image: '/images/engagement/hero-pave.png',         setting: 'pave',        slug: 'classic-pave'         },
  { id: 'p9', name: 'Oval Side Stone',              price: 'From £10,300', image: '/images/engagement/hero-three-stone.png',  setting: 'three-stone', slug: 'oval-side-stone'      },
];

interface PlaceholderRing {
  id: string; name: string; price: string; image: string; setting: string; slug: string;
}

interface Props {
  settings: RingSettingRecord[];
  activeSetting: string | null;
  activeShape: DiamondShape | null;
  activeMetal: RingMetal | null;
}

export function RingGrid({ settings, activeSetting, activeMetal }: Props) {
  const rings: PlaceholderRing[] = settings.length > 0
    ? settings
        .filter(r => !activeSetting || r.setting_style === activeSetting)
        .filter(r => !activeMetal || r.metals?.includes(activeMetal))
        .map((r, i) => ({
          id: r.id,
          name: r.name,
          price: r.base_price_gbp ? `From £${Number(r.base_price_gbp).toLocaleString('en-GB')}` : 'Price on request',
          image: PLACEHOLDER_RINGS[i % PLACEHOLDER_RINGS.length].image,
          setting: r.setting_style ?? '',
          slug: r.slug,
        }))
    : PLACEHOLDER_RINGS.filter(r => !activeSetting || r.setting === activeSetting);

  const display = rings.length > 0 ? rings : PLACEHOLDER_RINGS;

  return (
    <section>
      <p className="font-sans mb-8" style={{ fontSize: 12, color: `${GREEN}55` }}>
        {display.length} {display.length === 1 ? 'ring' : 'rings'}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {display.map(ring => (
          <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block">

            {/* Square image on warm grey — exact De Beers pattern */}
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: '1/1', backgroundColor: IMG_BG }}
            >
              <Image
                src={ring.image}
                alt={ring.name}
                fill
                className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* Text below — left aligned, no italic, plain weight */}
            <div className="mt-4">
              <h3
                className="font-sans"
                style={{ fontSize: 14, fontWeight: 400, color: GREEN, lineHeight: 1.45, letterSpacing: '0.01em' }}
              >
                {ring.name}
              </h3>
              <p
                className="font-sans mt-1"
                style={{ fontSize: 13, color: `${GREEN}88`, fontWeight: 300 }}
              >
                {ring.price}
              </p>
            </div>

          </Link>
        ))}
      </div>
    </section>
  );
}
