'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { testimonials } from '@/config/site';
import { Divider } from '@/components/ui/Divider';

export function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % testimonials.length), 6500);
    return () => clearInterval(t);
  }, []);
  const t = testimonials[i];

  return (
    <section className="container-luxe py-20 text-center md:py-28">
      <span className="eyebrow">In Their Words</span>
      <Divider className="mx-auto mt-6 max-w-xs" />
      <div className="relative mx-auto mt-10 flex min-h-[210px] max-w-3xl items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.figure
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <blockquote className="font-display text-3xl font-light leading-snug text-ink md:text-4xl">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-7 text-[11px] uppercase tracking-luxe text-ink/50">
              {t.author} · <span className="text-champagne-deep">{t.detail}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex items-center justify-center gap-2">
        {testimonials.map((_, n) => (
          <button
            key={n}
            aria-label={`Testimonial ${n + 1}`}
            onClick={() => setI(n)}
            className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-champagne' : 'w-1.5 bg-ink/20'}`}
          />
        ))}
      </div>
    </section>
  );
}
