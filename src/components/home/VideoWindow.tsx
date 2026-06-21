import Link from 'next/link';

interface VideoWindowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href: string;
  ctaLabel?: string;
  /** Optional looping model video (drop into /public/videos). */
  videoSrc?: string;
  /** Optional poster/photo shown when there is no video. */
  poster?: string;
  posterAlt?: string;
  /** CSS gradient used as the cinematic backdrop until real media lands. */
  gradient: string;
}

/**
 * A full-viewport "window" featuring a model wearing jewellery.
 * - Plays a looping video when `videoSrc` is supplied.
 * - Otherwise shows a poster photo if given, over a distinct gradient backdrop.
 * Content is always visible (no scroll-gated fade) so every window reads clearly.
 */
export function VideoWindow({
  eyebrow,
  title,
  subtitle,
  href,
  ctaLabel = 'Discover',
  videoSrc,
  poster,
  posterAlt = '',
  gradient,
}: VideoWindowProps) {
  return (
    <section
      className="relative h-screen min-h-[600px] w-full snap-start overflow-hidden"
      style={{ backgroundImage: gradient }}
    >
      {videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={posterAlt}
          className="ken-burns absolute inset-0 h-full w-full object-cover opacity-80"
        />
      ) : null}

      {/* Legibility veil */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/50" />

      <div className="absolute inset-0 z-10 flex animate-fade-up flex-col items-center justify-center px-8 text-center text-ivory">
        {eyebrow && <span className="eyebrow text-champagne-soft">{eyebrow}</span>}
        <h2 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] md:text-7xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-ivory/85">
            {subtitle}
          </p>
        )}
        <Link
          href={href}
          className="mt-8 inline-flex items-center gap-3 border border-ivory/60 px-9 py-4 text-xs uppercase tracking-luxe text-ivory transition-colors duration-500 ease-luxe hover:bg-ivory hover:text-ink"
        >
          {ctaLabel}
        </Link>
      </div>

      {/* Window index marker for a clear sense of separate panels */}
      <span className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-luxe text-ivory/50">
        Scroll
      </span>
    </section>
  );
}
