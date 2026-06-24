'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AppointmentInput } from '@/lib/validation';

const field =
  'w-full border-b border-ink/20 bg-transparent py-2.5 text-sm font-light text-ink placeholder:text-ink/40 focus:border-champagne focus:outline-none';
const labelCls = 'text-[11px] uppercase tracking-luxe text-ink/55';

const TYPES = [
  { value: 'atelier', label: 'In the Atelier' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'phone', label: 'By Phone' },
] as const;

export function AppointmentForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({ defaultValues: { type: 'atelier' } });
  const [sent, setSent] = useState(false);

  const onSubmit = async (data: AppointmentInput) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSent(true);
      reset();
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne/15 text-champagne-deep">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="font-display text-2xl">Your request is received</h3>
        <p className="max-w-sm font-light text-ink/60">
          Our concierge will confirm your private appointment shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Phone</label>
          <input className={field} placeholder="+44 …" {...register('phone', { required: true, minLength: 6 })} />
          {errors.phone && <span className="text-xs text-red-700">Please enter a contact number</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Preferred date</label>
          <input type="date" className={field} {...register('date', { required: true })} />
          {errors.date && <span className="text-xs text-red-700">Please choose a date</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelCls}>Appointment type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input type="radio" value={t.value} className="peer sr-only" {...register('type')} />
              <span className="block border border-ink/20 px-4 py-2 text-[11px] uppercase tracking-luxe text-ink/70 transition peer-checked:border-noir peer-checked:bg-noir peer-checked:text-ivory">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>What are you looking for? (optional)</label>
        <input className={field} placeholder="Engagement ring, a gift, a bespoke commission…" {...register('interest')} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Anything else? (optional)</label>
        <textarea className={`${field} min-h-20 resize-none`} placeholder="Notes for our concierge" {...register('message')} />
      </div>

      <Button type="submit" variant="gold" size="lg" disabled={isSubmitting} className="mt-1 w-full sm:w-auto">
        {isSubmitting ? 'Sending…' : 'Request Appointment'}
      </Button>
    </form>
  );
}
