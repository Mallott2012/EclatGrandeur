import type { Metadata } from 'next';
import Image from 'next/image';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { placeholder } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'The story and craftsmanship of Éclat Grandeur.',
};

export default function AboutPage() {
  return (
    <>
      <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden">
        <Image
          src={placeholder(2000, 1100, 'The+Maison')}
          alt="The Éclat Grandeur atelier"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="container-luxe relative z-10 text-center text-ivory">
          <span className="eyebrow text-champagne-soft">The Maison</span>
          <h1 className="mt-5 font-display text-5xl font-light md:text-6xl">Our Story</h1>
        </div>
      </section>

      <section className="container-luxe max-w-3xl py-20">
        <p className="text-lg font-light leading-relaxed text-ink/80">
          Éclat Grandeur was founded on a singular belief: that a diamond is not merely
          bought, but inherited by the future. Each stone we select is chosen by hand,
          judged not only by the certificate it carries but by the way it answers the light.
        </p>
        <p className="mt-6 text-base font-light leading-relaxed text-ink/75">
          From our atelier in Mayfair, our master craftsmen shape settings that disappear in
          service of the diamond — every claw, every bead of pavé considered to return the
          greatest possible brilliance. We work in platinum and the noble golds, and we work
          slowly, because the extraordinary cannot be hurried.
        </p>
        <p className="mt-6 text-base font-light leading-relaxed text-ink/75">
          We believe luxury and responsibility are inseparable. Every diamond is conflict-free
          and traceable, accompanied by independent certification, and backed by our lifetime
          commitment to its care.
        </p>
      </section>

      <section className="bg-ink py-20 text-ivory">
        <div className="container-luxe text-center">
          <SectionHeading
            eyebrow="An Invitation"
            title="Visit Us in Mayfair"
            description="Experience our collections in person, or arrange a private virtual consultation."
            className="mb-10 [&_h2]:text-ivory [&_p]:text-ivory/75"
          />
          <Button href="/appointments" variant="gold" size="lg">
            Book an Appointment
          </Button>
        </div>
      </section>
    </>
  );
}
