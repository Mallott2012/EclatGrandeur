import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getArticleBySlug, getArticles } from '@/lib/data/education';
import { Button } from '@/components/ui/Button';
import { articleJsonLd } from '@/lib/seo';
import type { ArticleBlock } from '@/types/content';
import { SHIMMER_BLUR } from '@/lib/utils';

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="mt-12 font-display text-3xl text-ink">{block.text}</h2>;
    case 'paragraph':
      return (
        <p className="mt-5 text-base font-light leading-relaxed text-ink/75">
          {block.text}
        </p>
      );
    case 'quote':
      return (
        <blockquote className="my-10 border-l-2 border-champagne pl-6 font-display text-2xl font-light italic text-ink">
          {block.text}
        </blockquote>
      );
    case 'list':
      return (
        <ul className="mt-5 flex flex-col gap-3">
          {block.items?.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 text-base font-light leading-relaxed text-ink/75"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
              {item}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = (article.related ?? [])
    .map((s) => getArticleBySlug(s))
    .filter(Boolean);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />

      <div className="relative flex min-h-[45vh] items-end overflow-hidden">
        <Image
          src={article.heroImage.src}
          alt={article.heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
        <div className="container-luxe relative z-10 pb-12 text-ivory">
          <span className="eyebrow text-champagne-soft">The Diamond Guide</span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-light md:text-6xl">
            {article.title}
          </h1>
        </div>
      </div>

      <div className="container-luxe max-w-3xl py-16">
        <p className="text-lg font-light leading-relaxed text-ink/80">
          {article.excerpt}
        </p>
        {article.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <div className="mt-16 border-t border-ink/10 pt-10 text-center">
          <p className="font-display text-2xl text-ink">
            Have a question for our specialists?
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button href="/appointments">Book an Appointment</Button>
            <Button href="/enquiry" variant="outline">
              Ask a Question
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-ink/10 bg-ivory-deep/40 py-16">
          <div className="container-luxe">
            <h2 className="mb-8 text-center font-display text-3xl text-ink">
              Continue Reading
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {related.map(
                (a) =>
                  a && (
                    <Link
                      key={a.slug}
                      href={`/education/${a.slug}`}
                      className="group flex items-center gap-5 border border-ink/10 bg-ivory p-5"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden">
                        <Image
                          src={a.heroImage.src}
                          alt={a.heroImage.alt}
                          fill
                          sizes="96px"
                          placeholder="blur"
                          blurDataURL={SHIMMER_BLUR}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-display text-xl text-ink">{a.title}</h3>
                        <p className="mt-1 text-sm font-light text-ink/60">
                          {a.excerpt}
                        </p>
                      </div>
                    </Link>
                  )
              )}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
