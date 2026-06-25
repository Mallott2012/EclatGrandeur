'use client';

import { useForm }  from 'react-hook-form';
import { useState } from 'react';
import { Check }    from 'lucide-react';
import { Button }   from '@/components/ui/Button';
import type { EnquiryInput }             from '@/lib/validation';
import type { ConfiguredEngagementRing } from '@/types';

const field =
  'w-full border-b border-ink/20 bg-transparent py-2.5 text-sm font-light text-ink placeholder:text-ink/40 focus:border-champagne focus:outline-none';
const labelCls = 'text-[11px] uppercase tracking-luxe text-ink/55';

export function EnquiryForm({
  context,
  compact = false,
  ringConfig,
  cartToken,
}: {
  context?:    string;
  compact?:    boolean;
  ringConfig?: ConfiguredEngagementRing;
  cartToken?:  string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({ defaultValues: { context } });
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: EnquiryInput) => {
    setSubmitError(null);
    const res = await fetch('/api/enquiry', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...data, context, ringConfig, cartToken }),
    });
    if (res.ok) {
      setSent(true);
      reset();
    } else {
      const json = await res.json().catch(() => ({}));
      setSubmitError(
        (json as { error?: string }).error ??
        'We could not send your enquiry at the moment. Please try again shortly.'
      );
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne/15 text-champagne-deep">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="font-display text-2xl">Thank you</h3>
        <p className="max-w-sm font-light text-ink/60">
          Your enquiry is with our concierge. We will be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className={compact ? 'flex flex-col gap-5' : 'grid grid-cols-1 gap-5 sm:grid-cols-2'}>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Name</label>
          <input className={field} placeholder="Your name" {...register('name', { required: true, minLength: 2 })} />
          {errors.name && <span className="text-xs text-red-700">Please enter your name</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Email</label>
          <input className={field} placeholder="you@email.com" {...register('email', { required: true, pattern: /.+@.+\..+/ })} />
          {errors.email && <span className="text-xs text-red-700">Please enter a valid email</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Phone (optional)</label>
        <input className={field} placeholder="+44 …" {...register('phone')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Message</label>
        <textarea
          className={`${field} min-h-24 resize-none`}
          placeholder="Tell us what you have in mind…"
          {...register('message', { required: true, minLength: 10 })}
        />
        {errors.message && <span className="text-xs text-red-700">Please tell us a little more</span>}
      </div>
      {submitError && (
        <p role="alert" className="text-xs text-red-700">{submitError}</p>
      )}
      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} className="mt-1 w-full sm:w-auto">
        {isSubmitting ? 'Sending…' : 'Send Enquiry'}
      </Button>
    </form>
  );
}
