import { Hero } from '@/components/home/Hero';
import { ServicePillars } from '@/components/home/ServicePillars';
import { BuildYourRingBand } from '@/components/home/BuildYourRingBand';
import { ShopByShape } from '@/components/home/ShopByShape';
import { FeaturedPieces } from '@/components/home/FeaturedPieces';
import { SectionShowcase } from '@/components/home/SectionShowcase';
import { DiamondGuideTeaser } from '@/components/home/DiamondGuideTeaser';
import { PressMarquee } from '@/components/home/PressMarquee';
import { Testimonials } from '@/components/home/Testimonials';
import { AppointmentCTA } from '@/components/home/AppointmentCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicePillars />
      <BuildYourRingBand />
      <ShopByShape />
      <FeaturedPieces />
      <SectionShowcase />
      <DiamondGuideTeaser />
      <PressMarquee />
      <Testimonials />
      <AppointmentCTA />
    </>
  );
}
