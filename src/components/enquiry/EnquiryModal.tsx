'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { EnquiryForm } from '@/components/forms/EnquiryForm';
import { cn } from '@/lib/utils';

export function EnquiryModal({
  open,
  onClose,
  context,
  title = 'Request a Quote',
  intro,
}: {
  open: boolean;
  onClose: () => void;
  context?: string;
  title?: string;
  intro?: string;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className={cn('fixed inset-0 z-[85] flex items-center justify-center p-4', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-noir/60 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-lg bg-ivory p-8 shadow-luxe transition-all duration-300 ease-luxe md:p-10',
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
        role="dialog"
        aria-modal="true"
      >
        <button aria-label="Close" onClick={onClose} className="absolute right-5 top-5 text-ink/50 hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        <span className="eyebrow">Concierge</span>
        <h2 className="mt-2 font-display text-3xl font-light">{title}</h2>
        <p className="mt-2 text-sm font-light leading-relaxed text-ink/60">
          {intro ?? 'Share a few details and our concierge will respond within one business day.'}
        </p>
        <div className="mt-6">
          <EnquiryForm context={context} compact />
        </div>
      </div>
    </div>
  );
}
