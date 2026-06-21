import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact the Éclat Grandeur concierge.',
};

export default function ContactPage() {
  return (
    <div className="container-luxe grid grid-cols-1 gap-16 py-16 lg:grid-cols-2">
      <div>
        <span className="eyebrow">Client Services</span>
        <h1 className="mt-4 font-display text-5xl font-light text-ink">Contact Us</h1>
        <p className="mt-5 max-w-md font-light leading-relaxed text-ink/70">
          Our concierge is delighted to assist with any question, from a single diamond to a
          bespoke commission.
        </p>
        <div className="mt-10 flex flex-col gap-5">
          <Row icon={MapPin} text={siteConfig.contact.address} />
          <Row icon={Phone} text={siteConfig.contact.phone} />
          <Row icon={Mail} text={siteConfig.contact.email} />
        </div>
      </div>
      <div className="border border-ink/10 bg-ivory p-8 md:p-10">
        <h2 className="mb-6 font-display text-2xl text-ink">Send a Message</h2>
        <EnquiryForm type="general" source="contact" />
      </div>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-4">
      <Icon className="h-5 w-5 text-champagne-deep" strokeWidth={1.25} />
      <span className="text-sm font-light text-ink/75">{text}</span>
    </div>
  );
}
