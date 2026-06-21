import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Reveal } from '@/components/shared/Reveal';
import { getArticles } from '@/lib/data/education';
import { SHIMMER_BLUR } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'The Diamond Guide',
  description:
    'Expert guides to the 4Cs, diamond certification, ethical sourcing and choosing the perfect piece.',
};

export default function EducationPage() {
  const articles = getArticles();

  return (
    <div className="container-luxe py-16">
      <SectionHeading
        as="h1"
        eyebrow="The Diamond Guide"
        title="Buy with Knowledge"
        description="The more you understand a diamond, the more deeply you will treasure it. Our specialists share the essentials."
        className="mb-16"
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
          <Reveal key={article.slug} delay={(i % 3) * 0.1}>
            <Link href={`/education/${article.slug}`} className="group block">
              <div className="relative aspect-[16/11] w-full overflow-hidden">
                <Image
                  src={article.heroImage.src}
                  alt={article.heroImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  placeholder="blur"
                  blurDataURL={SHIMMER_BLUR}
                  className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                />
              </div>
              <span className="mt-5 block text-[10px] uppercase tracking-luxe text-champagne-deep">
                {article.readingTime} min read
              </span>
              <h2 className="mt-2 font-display text-2xl text-ink">{article.title}</h2>
              <p className="mt-2 text-sm font-light leading-relaxed text-ink/65">
                {article.excerpt}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
