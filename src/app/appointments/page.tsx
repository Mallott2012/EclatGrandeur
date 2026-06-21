import type { Metadata } from 'next';
import { Clock, MapPin, Video } from 'lucide-react';
import { AppointmentForm } from '@/components/forms/AppointmentForm';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description:
    'Arrange a private consultation with an Éclat Grandeur diamond specialist, in our boutique or by video.',
};

export default function AppointmentsPage() {
  return (
    <div className="container-luxe grid grid-cols-1 gap-16 py-16 lg:grid-cols-2">
      <div className="flex flex-col gap-8">
        <div>
          <span className="eyebrow">Client Services</span>
          <h1 className="mt-4 font-display text-5xl font-light text-ink">
            A Private Consultation
          </h1>
          <p className="mt-5 max-w-md font-light leading-relaxed text-ink/70">
            Whether selecting an engagement ring or commissioning a bespoke creation, our
            specialists offer their complete discretion and expertise — in our Mayfair
            boutique or from the comfort of your home.
          </p>
        </div>

        <div className="flex flex-col gap-5 border-t border-ink/10 pt-8">
          <Detail icon={MapPin} title="In Boutique" text={siteConfig.contact.address} />
          <Detail icon={Video} title="Virtual" text="A private video consultation at your convenience" />
          <Detail icon={Clock} title="Hours" text="Monday – Saturday, 10am – 6pm" />
        </div>
      </div>

      <div className="border border-ink/10 bg-ivory p-8 md:p-10">
        <AppointmentForm />
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="mt-0.5 h-5 w-5 text-champagne-deep" strokeWidth={1.25} />
      <div>
        <p className="text-xs uppercase tracking-luxe text-ink">{title}</p>
        <p className="mt-1 text-sm font-light text-ink/65">{text}</p>
      </div>
    </div>
  );
}
