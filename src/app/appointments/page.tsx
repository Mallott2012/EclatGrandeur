import type { Metadata } from 'next';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { Diamond } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';
import { siteConfig } from '@/config/site';
import { MapPin, Video, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description:
    'Reserve a private appointment with an Éclat Grandeur diamond specialist — in our Mayfair atelier, by video, or by phone.',
};

const modes = [
  { icon: MapPin, title: 'In the Atelier', copy: 'A private hour in Mayfair, with champagne.' },
  { icon: Video, title: 'Virtual Viewing', copy: 'See diamonds live over video, wherever you are.' },
  { icon: Phone, title: 'By Phone', copy: 'A relaxed conversation with a specialist.' },
];

export default function AppointmentsPage() {
  return (
    <>
      <section className="relative flex min-h-[44vh] items-center justify-center overflow-hidden ground-noir text-ivory">
        <SparkleField color="text-champagne/40" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 blur-[2px]">
          <Diamond shape="oval" size={360} id="appt-hero" className="animate-float" />
        </div>
        <div className="container-luxe relative z-10 text-center">
          <span className="eyebrow-light">Private Appointments</span>
          <h1 className="mt-4 font-display text-5xl font-light md:text-6xl">Meet your diamond</h1>
          <p className="mx-auto mt-4 max-w-xl font-light text-ivory/70">
            No obligation, no pressure — only the expertise of a specialist and the time to choose well.
          </p>
        </div>
      </section>

      <section className="container-luxe py-16 md:py-24">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="mt-3 font-display text-3xl font-light text-ink">Three ways to be welcomed</h2>
            <ul className="mt-8 flex flex-col gap-6">
              {modes.map((m) => (
                <li key={m.title} className="flex items-start gap-5 border-b border-ink/10 pb-6 last:border-0">
                  <m.icon className="mt-0.5 h-6 w-6 shrink-0 text-champagne-deep" strokeWidth={1.1} />
                  <div>
                    <h3 className="font-display text-xl text-ink">{m.title}</h3>
                    <p className="mt-1 font-light text-ink/60">{m.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 border border-ink/10 bg-ivory-warm p-6">
              <p className="text-[11px] uppercase tracking-luxe text-champagne-deep">The Atelier</p>
              <p className="mt-2 font-light text-ink/70">{siteConfig.contact.address}</p>
              <p className="mt-1 font-light text-ink/70">{siteConfig.contact.phone}</p>
              <p className="mt-1 font-light text-ink/70">Mon–Sat, 10am–6pm · by appointment</p>
            </div>
          </div>

          <div className="border border-ink/10 p-8 md:p-10">
            <h2 className="font-display text-3xl font-light text-ink">Request your appointment</h2>
            <p className="mt-2 text-sm font-light text-ink/60">We’ll confirm by email within one business day.</p>
            <div className="mt-7">
              <AppointmentForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
