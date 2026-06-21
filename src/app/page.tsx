import { Hero } from '@/components/home/Hero';
import { ServicePillars } from '@/components/home/ServicePillars';
import { SectionShowcase } from '@/components/home/SectionShowcase';
import { FeaturedPieces } from '@/components/home/FeaturedPieces';
import { BespokeBand } from '@/components/home/BespokeBand';
import { DiamondGuideTeaser } from '@/components/home/DiamondGuideTeaser';
import { Provenance } from '@/components/home/Provenance';
import { Testimonials } from '@/components/home/Testimonials';
import { PressMarquee } from '@/components/home/PressMarquee';
import { AppointmentCTA } from '@/components/home/AppointmentCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicePillars />
      <SectionShowcase />
      <FeaturedPieces />
      <BespokeBand />
      <DiamondGuideTeaser />
      <PressMarquee />
      <Provenance />
      <Testimonials />
      <AppointmentCTA />
    </>
  );
}
