import type { Metadata } from 'next';
import { EnquiryForm } from '@/components/forms/EnquiryForm';

export const metadata: Metadata = {
  title: 'Request a Quote',
  description: 'Request a personal quote from the Éclat Grandeur concierge.',
};

export default function EnquiryPage() {
  return (
    <div className="container-luxe max-w-2xl py-20">
      <div className="mb-10 text-center">
        <span className="eyebrow">Concierge</span>
        <h1 className="mt-4 font-display text-5xl font-light text-ink">Request a Quote</h1>
        <p className="mx-auto mt-5 max-w-md font-light leading-relaxed text-ink/70">
          Tell us what you have in mind — a particular piece, a bespoke commission, or simply
          a question. Our specialists will respond personally.
        </p>
      </div>
      <div className="border border-ink/10 bg-ivory p-8 md:p-10">
        <EnquiryForm type="general" source="contact" />
      </div>
    </div>
  );
}
