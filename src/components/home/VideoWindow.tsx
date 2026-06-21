'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface VideoWindowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href: string;
  ctaLabel?: string;
  /** Optional looping model video (drop into /public/videos). */
  videoSrc?: string;
  /** Poster image shown before/instead of the video. */
  poster: string;
  posterAlt: string;
  priority?: boolean;
  align?: 'center' | 'left';
}

/**
 * A full-viewport "window" featuring a model wearing jewellery.
 * Uses a looping video when `videoSrc` is supplied; otherwise a poster
 * image with a slow drift so the section still feels alive.
 */
export function VideoWindow({
  eyebrow,
  title,
  subtitle,
  href,
  ctaLabel = 'Discover',
  videoSrc,
  poster,
  posterAlt,
  priority = false,
  align = 'center',
}: VideoWindowProps) {
  return (
    <section className="relative h-screen min-h-[600px] w-full snap-start overflow-hidden">
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
      ) : (
        <div className="absolute inset-0">
          <Image
            src={poster}
            alt={posterAlt}
            fill
            priority={priority}
            sizes="100vw"
            className="ken-burns object-cover"
          />
        </div>
      )}

      {/* Legibility veil */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/40" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-0 z-10 flex flex-col justify-center px-8 text-ivory md:px-16 ${
          align === 'center' ? 'items-center text-center' : 'items-start text-left'
        }`}
      >
        {eyebrow && (
          <span className="eyebrow text-champagne-soft">{eyebrow}</span>
        )}
        <h2 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] md:text-7xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-ivory/80">
            {subtitle}
          </p>
        )}
        <Link
          href={href}
          className="group mt-8 inline-flex items-center gap-3 border border-ivory/50 px-9 py-4 text-xs uppercase tracking-luxe text-ivory transition-colors duration-500 ease-luxe hover:bg-ivory hover:text-ink"
        >
          {ctaLabel}
        </Link>
      </motion.div>
    </section>
  );
}
