import { JewelTile } from '@/components/home/JewelTile';

/**
 * Home — a cinematic background with five small "windows" arranged on top,
 * each a short video of a jewellery category. Drop real loops into
 * /public/videos and set `videoSrc` on each window.
 */
const windows = [
  {
    eyebrow: 'The Promise',
    title: 'Engagement Rings',
    href: '/engagement-rings',
    gradient: 'linear-gradient(150deg, #2a241c 0%, #15130f 100%)',
    // videoSrc: '/videos/engagement-rings.mp4',
  },
  {
    eyebrow: 'Brilliance, Worn',
    title: 'Earrings',
    href: '/jewellery/earrings',
    gradient: 'linear-gradient(150deg, #232020 0%, #141414 100%)',
    // videoSrc: '/videos/earrings.mp4',
  },
  {
    eyebrow: 'The Décolletage',
    title: 'Necklaces',
    href: '/jewellery/necklaces',
    gradient: 'linear-gradient(150deg, #2a261f 0%, #16140f 100%)',
    // videoSrc: '/videos/necklaces.mp4',
  },
  {
    eyebrow: 'Forever, in Line',
    title: 'Bracelets',
    href: '/jewellery/bracelets',
    gradient: 'linear-gradient(150deg, #201d1a 0%, #131210 100%)',
    // videoSrc: '/videos/bracelets.mp4',
  },
  {
    eyebrow: 'The Exceptional',
    title: 'High Jewellery',
    href: '/jewellery/high-jewellery',
    gradient: 'linear-gradient(150deg, #2c2419 0%, #15120c 100%)',
    // videoSrc: '/videos/high-jewellery.mp4',
  },
];

export default function HomePage() {
  return (
    <section
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 22%, #38312a 0%, #211d18 45%, #100e0b 100%)',
      }}
    >
      {/* Drop a hero loop in later: a <video> here becomes the living backdrop. */}

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center gap-12 px-6 py-32 text-center">
        <div className="flex flex-col items-center">
          <span className="eyebrow text-champagne-soft">Éclat Grandeur</span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-light leading-[1.08] text-ivory md:text-6xl">
            The Art of the Extraordinary Diamond
          </h1>
          <p className="mt-5 max-w-md text-sm font-light leading-relaxed text-ivory/70">
            Rare stones, master-crafted into jewellery destined to be treasured.
          </p>
        </div>

        {/* Five small windows on the background */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {windows.map((w) => (
            <JewelTile
              key={w.title}
              {...w}
              className="aspect-[3/4] w-[44vw] max-w-[200px] sm:w-40 md:w-44"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
