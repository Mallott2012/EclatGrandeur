'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, X, CalendarDays, Phone, Mail } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

export function LiveChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[75] flex flex-col items-end gap-3">
      <div
        className={cn(
          'w-72 origin-bottom-right rounded-sm border border-ink/10 bg-ivory shadow-luxe transition-all duration-300 ease-luxe',
          open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
        )}
      >
        <div className="ground-noir flex items-center justify-between px-5 py-4 text-ivory">
          <div>
            <p className="font-display text-lg leading-none">Concierge</p>
            <p className="mt-1 text-[10px] uppercase tracking-luxe text-ivory/60">Here to help</p>
          </div>
          <button aria-label="Close concierge" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col p-2">
          <Link href="/appointments" className="flex items-center gap-3 px-3 py-3 text-sm font-light hover:bg-ivory-deep" onClick={() => setOpen(false)}>
            <CalendarDays className="h-4 w-4 text-champagne-deep" strokeWidth={1.5} /> Book an appointment
          </Link>
          <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 px-3 py-3 text-sm font-light hover:bg-ivory-deep">
            <Phone className="h-4 w-4 text-champagne-deep" strokeWidth={1.5} /> {siteConfig.contact.phone}
          </a>
          <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3 px-3 py-3 text-sm font-light hover:bg-ivory-deep">
            <Mail className="h-4 w-4 text-champagne-deep" strokeWidth={1.5} /> Email the concierge
          </a>
        </div>
      </div>

      <button
        aria-label="Open concierge"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-noir text-ivory shadow-luxe transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" strokeWidth={1.5} />}
      </button>
    </div>
  );
}
