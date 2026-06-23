import { Hero } from '@/components/home/Hero';
import { getPublishedHero } from '@/lib/hero/service';

export const revalidate = 60; // ISR: re-fetch hero data every 60 seconds

export default async function HomePage() {
  // Fetch hero overrides for each placement (null = use static fallback)
  const [heroHome, heroEngagement, heroEarrings, heroNecklaces, heroBracelets] =
    await Promise.allSettled([
      getPublishedHero('homepage'),
      getPublishedHero('engagement-rings'),
      getPublishedHero('earrings'),
      getPublishedHero('necklaces'),
      getPublishedHero('bracelets'),
    ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : null)));

  return (
    <Hero
      heroHome={heroHome}
      heroEngagement={heroEngagement}
      heroEarrings={heroEarrings}
      heroNecklaces={heroNecklaces}
      heroBracelets={heroBracelets}
    />
  );
}
