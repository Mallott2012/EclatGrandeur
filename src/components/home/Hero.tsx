'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Diamond } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';
import { siteConfig } from '@/config/site';

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden ground-noir text-ivory">
      {/* atmospheric layers */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[2px]">
        <Diamond shape="round" size={620} id="hero-bg" className="animate-float" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
        <SparkleField color="text-champagne/40" />
      </div>
      <SparkleField color="text-champagne/60" />

      {/* content */}
      <div className="container-luxe relative z-10 flex flex-col items-center pt-28 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease }}
          className="mb-7"
        >
          <Diamond shape="round" size={96} id="hero-accent" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.15 }}
          className="eyebrow-light"
        >
          {siteConfig.name} · Maison de Diamants
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.3 }}
          className="mt-6 max-w-4xl font-display text-5xl font-light leading-[1.04] md:text-7xl lg:text-[5.4rem]"
        >
          The Art of the
          <br />
          <span className="text-gold-foil">Extraordinary Diamond</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.45 }}
          className="mt-7 max-w-xl text-base font-light leading-relaxed text-ivory/70"
        >
          Rare stones, master-crafted into jewellery destined to be treasured for
          generations. Discover our collections, or create something entirely your own.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.6 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button href="/engagement-rings" variant="gold" size="lg">Explore Engagement</Button>
          <Button href="/builder" variant="light" size="lg">Design Your Own</Button>
        </motion.div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-ivory/50">
        <ChevronDown className="h-5 w-5 animate-bounce" strokeWidth={1.25} />
      </div>
    </section>
  );
}
