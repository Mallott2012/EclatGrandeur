import Link from 'next/link';
import { DiamondShapeSvg } from '@/components/art/Diamond';
import { Reveal } from '@/components/ui/Reveal';
import { DIAMOND_SHAPE_LABELS, type DiamondShape } from '@/types';

const SHAPES = Object.keys(DIAMOND_SHAPE_LABELS) as DiamondShape[];

export function ShopByShape() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container-luxe">
        <Reveal className="mb-10 text-center">
          <span className="eyebrow">Loose Diamonds</span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-noir md:text-4xl">
            Shop diamonds by shape
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            Every diamond independently graded for cut, color, clarity and carat.
          </p>
        </Reveal>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
          {SHAPES.map((s) => (
            <Link
              key={s}
              href={`/diamonds?shape=${s}`}
              className="group flex flex-col items-center gap-2 rounded-lg border border-ink/10 px-2 py-4 text-center transition hover:border-champagne hover:shadow-card"
            >
              <DiamondShapeSvg
                shape={s}
                size={36}
                className="text-glacier-deep transition group-hover:text-champagne-deep"
              />
              <span className="text-[11px] font-medium text-ink/70 group-hover:text-champagne-deep">
                {DIAMOND_SHAPE_LABELS[s].replace(' Brilliant', '')}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
