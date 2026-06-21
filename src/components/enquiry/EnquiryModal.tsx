'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import type { EnquirySource, EnquiryType } from '@/types/enquiry';

interface EnquiryModalProps {
  triggerLabel: string;
  title?: string;
  subtitle?: string;
  type?: EnquiryType;
  source: EnquirySource;
  productSlug?: string;
  builtRing?: { settingSlug: string; diamondSku: string; metal: string };
  triggerClassName?: string;
}

export function EnquiryModal({
  triggerLabel,
  title = 'Request a Quote',
  subtitle = 'Share a few details and our diamond specialists will be in touch.',
  type = 'quote',
  source,
  productSlug,
  builtRing,
  triggerClassName = 'w-full bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory transition hover:bg-ink-soft',
}: EnquiryModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto bg-ivory p-8 shadow-2xl md:p-10">
            <button
              aria-label="Close"
              className="absolute right-5 top-5 text-ink/60 hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <p className="eyebrow mb-2">Concierge</p>
            <h2 className="mb-2 font-display text-3xl text-ink">{title}</h2>
            <p className="mb-6 text-sm font-light text-ink/70">{subtitle}</p>
            <EnquiryForm
              type={type}
              source={source}
              productSlug={productSlug}
              builtRing={builtRing}
            />
          </div>
        </div>
      )}
    </>
  );
}
