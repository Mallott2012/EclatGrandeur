import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Diamond } from '@/components/art/Diamond';
import { siteConfig } from '@/config/site';

export function AppointmentCTA() {
  return (
    <section className="ground-ivory py-20 md:py-28">
      <div className="container-luxe">
        <Reveal>
          <div className="relative flex flex-col items-center overflow-hidden border border-champagne/30 px-6 py-16 text-center md:py-20">
            <div className="pointer-events-none absolute -left-10 -top-10 opacity-10">
              <Diamond shape="round" size={180} id="cta-l" sparkle={false} />
            </div>
            <div className="pointer-events-none absolute -bottom-12 -right-8 opacity-10">
              <Diamond shape="oval" size={200} id="cta-r" sparkle={false} />
            </div>

            <span className="eyebrow">The Private Appointment</span>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-light leading-tight md:text-5xl">
              Meet your diamond in person
            </h2>
            <p className="mt-5 max-w-xl font-light leading-relaxed text-ink/65">
              Spend an hour with a diamond specialist in our Mayfair atelier, by video, or by
              phone. No obligation — only expertise, and a glass of champagne.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button href="/appointments" variant="gold" size="lg">Book an Appointment</Button>
              <Button href="/contact" variant="outline" size="lg">Speak to the Concierge</Button>
            </div>
            <p className="mt-7 text-[11px] uppercase tracking-luxe text-ink/40">
              {siteConfig.contact.address}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
