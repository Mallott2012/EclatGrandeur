'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Link from 'next/link';

/**
 * Concierge live-chat affordance. In v1 this is a lightweight panel that routes
 * to enquiry/appointments; in production it wraps a 3rd-party widget (Crisp/Intercom).
 */
export function LiveChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-72 border border-ink/10 bg-ivory p-6 shadow-2xl">
          <p className="eyebrow mb-2">Client Concierge</p>
          <p className="mb-4 text-sm font-light leading-relaxed text-ink/70">
            Our diamond specialists are here to help — book a private appointment or
            request a personal quote.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/appointments"
              className="bg-ink px-4 py-2.5 text-center text-[10px] uppercase tracking-luxe text-ivory hover:bg-ink-soft"
            >
              Book an Appointment
            </Link>
            <Link
              href="/enquiry"
              className="border border-ink/30 px-4 py-2.5 text-center text-[10px] uppercase tracking-luxe text-ink hover:border-ink"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label="Open concierge"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-ink shadow-xl transition hover:bg-champagne-deep hover:text-ivory"
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}
