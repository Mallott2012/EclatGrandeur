import { VideoWindow } from '@/components/home/VideoWindow';
import { placeholder } from '@/lib/utils';

/**
 * Home — a single page of full-viewport "windows", each a model wearing a
 * category of jewellery. Drop real looping videos into /public/videos and set
 * `videoSrc` on each window; until then a poster image drifts gently.
 */
const windows = [
  {
    eyebrow: 'Éclat Grandeur',
    title: 'The Art of the Extraordinary Diamond',
    subtitle: 'Rare stones, master-crafted into jewellery destined to be treasured.',
    href: '/collections',
    ctaLabel: 'Enter',
    poster: placeholder(2000, 1200, 'Model+High+Jewellery'),
    posterAlt: 'A model wearing Éclat Grandeur high jewellery',
    priority: true,
    // videoSrc: '/videos/hero.mp4',
  },
  {
    eyebrow: 'The Promise',
    title: 'Engagement Rings',
    subtitle: 'A single diamond, raised to the light — or created entirely your own.',
    href: '/engagement-rings',
    ctaLabel: 'Discover',
    poster: placeholder(2000, 1200, 'Model+Engagement+Ring'),
    posterAlt: 'A model wearing a diamond engagement ring',
    // videoSrc: '/videos/engagement-rings.mp4',
  },
  {
    eyebrow: 'Brilliance, Worn',
    title: 'Earrings',
    subtitle: 'Studs, drops and hoops set with diamonds of exacting match.',
    href: '/jewellery/earrings',
    ctaLabel: 'Discover',
    poster: placeholder(2000, 1200, 'Model+Diamond+Earrings'),
    posterAlt: 'A model wearing diamond earrings',
    // videoSrc: '/videos/earrings.mp4',
  },
  {
    eyebrow: 'The Décolletage',
    title: 'Necklaces',
    subtitle: 'Pendants and rivières that draw the eye and hold it.',
    href: '/jewellery/necklaces',
    ctaLabel: 'Discover',
    poster: placeholder(2000, 1200, 'Model+Diamond+Necklace'),
    posterAlt: 'A model wearing a diamond necklace',
    // videoSrc: '/videos/necklaces.mp4',
  },
  {
    eyebrow: 'Forever, in Line',
    title: 'Bracelets',
    subtitle: 'From the timeless tennis line to delicate everyday diamonds.',
    href: '/jewellery/bracelets',
    ctaLabel: 'Discover',
    poster: placeholder(2000, 1200, 'Model+Diamond+Bracelet'),
    posterAlt: 'A model wearing a diamond bracelet',
    // videoSrc: '/videos/bracelets.mp4',
  },
];

export default function HomePage() {
  return (
    <>
      {windows.map((w) => (
        <VideoWindow key={w.title} {...w} />
      ))}
    </>
  );
}
