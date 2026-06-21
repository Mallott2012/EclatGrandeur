import type { Metadata } from 'next';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { siteConfig } from '@/config/site';
import { Mail, Phone, MapPin, Clock, Instagram, type LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Speak to the Éclat Grandeur concierge — by email, by phone, or in our Mayfair atelier.',
};

export default function ContactPage() {
  return (
    <div className="container-luxe py-16 md:py-24">
      <SectionHeading
        eyebrow="Concierge"
        title="We are at your service"
        description="Whether you have a question about a piece, a commission in mind, or simply wish to talk diamonds — we would be glad to hear from you."
        className="mb-16"
      />

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
          <ContactRow icon={MapPin} title="The Atelier" lines={[siteConfig.contact.address]} />
          <ContactRow icon={Phone} title="Telephone" lines={[siteConfig.contact.phone]} href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} />
          <ContactRow icon={Mail} title="Email" lines={[siteConfig.contact.email]} href={`mailto:${siteConfig.contact.email}`} />
          <ContactRow icon={Clock} title="Hours" lines={['Monday – Saturday', '10am – 6pm, by appointment']} />
          <ContactRow icon={Instagram} title="Follow" lines={['@eclatgrandeur']} href={siteConfig.social.instagram} />
        </div>

        <div className="border border-ink/10 p-8 md:p-10">
          <h2 className="font-display text-3xl font-light text-ink">Send a message</h2>
          <p className="mt-2 text-sm font-light text-ink/60">Our concierge replies within one business day.</p>
          <div className="mt-7">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  title,
  lines,
  href,
}: {
  icon: LucideIcon;
  title: string;
  lines: string[];
  href?: string;
}) {
  const body = (
    <div className="flex items-start gap-5 border-b border-ink/10 pb-6">
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-champagne-deep" strokeWidth={1.1} />
      <div>
        <h3 className="text-[11px] uppercase tracking-luxe text-ink/50">{title}</h3>
        {lines.map((l) => (
          <p key={l} className="mt-1 font-light text-ink/80">{l}</p>
        ))}
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="transition-colors hover:text-champagne-deep">{body}</a>
  ) : (
    body
  );
}
