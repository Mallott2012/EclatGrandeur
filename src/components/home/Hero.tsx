'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Diamond } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-glacier-soft/60 via-ivory to-ivory">
      <div className="container-luxe grid grid-cols-1 items-center gap-10 pt-28 pb-12 md:pt-36 md:pb-16 lg:grid-cols-2">
        {/* copy */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="eyebrow"
          >
            The Original Online Jeweler
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="mt-4 font-display text-4xl font-semibold leading-[1.08] text-noir md:text-6xl"
          >
            Find the one.
            <br />
            <span className="text-champagne-deep">Build your own ring.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.2 }}
            className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink/60 lg:mx-0"
          >
            Choose a setting, search thousands of certified diamonds by the 4Cs, and complete a
            one-of-a-kind ring — with free shipping, free returns and a lifetime warranty.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button href="/build-a-ring" variant="primary" size="lg">
              Build Your Own Ring
            </Button>
            <Button href="/diamonds" variant="outline" size="lg">
              Search Diamonds
            </Button>
          </motion.div>
        </div>

        {/* visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative flex items-center justify-center"
        >
          <div className="relative flex aspect-square w-full max-w-md items-center justify-center rounded-full bg-gradient-to-b from-white to-glacier-soft/50 shadow-luxe">
            <SparkleField color="text-champagne/50" />
            <Diamond shape="round" size={300} id="hero-stone" className="animate-float" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
