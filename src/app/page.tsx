import { JewelTile } from '@/components/home/JewelTile';

/**
 * Home — a single page presenting a mosaic of five "windows", each a short
 * video of a jewellery category. Drop real loops into /public/videos and set
 * `videoSrc` on each tile; until then a cinematic gradient stands in.
 */
const tiles = [
  {
    eyebrow: 'The Promise',
    title: 'Engagement Rings',
    href: '/engagement-rings',
    gradient: 'linear-gradient(150deg, #211d18 0%, #3a3128 100%)',
    large: true,
    className: 'col-span-2 md:col-span-2 md:row-span-2',
    // videoSrc: '/videos/engagement-rings.mp4',
  },
  {
    eyebrow: 'Brilliance, Worn',
    title: 'Earrings',
    href: '/jewellery/earrings',
    gradient: 'linear-gradient(150deg, #1c1c1c 0%, #2a2622 100%)',
    // videoSrc: '/videos/earrings.mp4',
  },
  {
    eyebrow: 'The Décolletage',
    title: 'Necklaces',
    href: '/jewellery/necklaces',
    gradient: 'linear-gradient(150deg, #232020 0%, #161616 100%)',
    // videoSrc: '/videos/necklaces.mp4',
  },
  {
    eyebrow: 'Forever, in Line',
    title: 'Bracelets',
    href: '/jewellery/bracelets',
    gradient: 'linear-gradient(150deg, #1a1a1a 0%, #2b2520 100%)',
    // videoSrc: '/videos/bracelets.mp4',
  },
  {
    eyebrow: 'The Exceptional',
    title: 'High Jewellery',
    href: '/jewellery/high-jewellery',
    gradient: 'linear-gradient(150deg, #2a241c 0%, #15140f 100%)',
    // videoSrc: '/videos/high-jewellery.mp4',
  },
];

export default function HomePage() {
  return (
    <section className="grid h-[100svh] min-h-[640px] grid-cols-2 grid-rows-3 gap-1.5 p-1.5 md:grid-cols-4 md:grid-rows-2">
      {tiles.map((tile) => (
        <JewelTile key={tile.title} {...tile} />
      ))}
    </section>
  );
}
