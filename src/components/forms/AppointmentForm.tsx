'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CATEGORY_LABELS, type Category } from '@/types/common';
import { cn } from '@/lib/utils';

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredDate: string;
  message?: string;
}

const fieldClass =
  'w-full border border-ink/20 bg-transparent px-4 py-3 text-sm font-light text-ink placeholder:text-ink/40 focus:border-champagne focus:outline-none';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function AppointmentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [mode, setMode] = useState<'in-store' | 'virtual'>('in-store');
  const [interests, setInterests] = useState<Category[]>([]);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const toggleInterest = (c: Category) =>
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      type: 'appointment' as const,
      source: 'appointments' as const,
      mode,
      interests,
      preferredDates: [values.preferredDate],
      message: values.message,
      contact: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
    };
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  });

  if (status === 'sent') {
    return (
      <div className="py-12 text-center">
        <p className="font-display text-3xl text-ink">Your request is received</p>
        <p className="mt-3 text-sm font-light text-ink/70">
          Our concierge will confirm your appointment within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {/* Mode */}
      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-luxe text-ink/60">Appointment Type</span>
        <div className="flex gap-2">
          {(['in-store', 'virtual'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 border px-4 py-3 text-xs uppercase tracking-luxe transition',
                mode === m ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink'
              )}
            >
              {m === 'in-store' ? 'In Boutique' : 'Virtual'}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-luxe text-ink/60">
          I’m interested in (optional)
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleInterest(c)}
              className={cn(
                'border px-3 py-2 text-[11px] uppercase tracking-luxe transition',
                interests.includes(c)
                  ? 'border-ink bg-ink text-ivory'
                  : 'border-ink/20 hover:border-ink'
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <input
            className={fieldClass}
            placeholder="First name"
            {...register('firstName', { required: true })}
          />
          {errors.firstName && <span className="mt-1 block text-xs text-red-700">Required</span>}
        </div>
        <div>
          <input
            className={fieldClass}
            placeholder="Last name"
            {...register('lastName', { required: true })}
          />
          {errors.lastName && <span className="mt-1 block text-xs text-red-700">Required</span>}
        </div>
      </div>
      <div>
        <input
          type="email"
          className={fieldClass}
          placeholder="Email"
          {...register('email', { required: true, pattern: /\S+@\S+\.\S+/ })}
        />
        {errors.email && (
          <span className="mt-1 block text-xs text-red-700">Please enter a valid email</span>
        )}
      </div>
      <input className={fieldClass} placeholder="Phone (optional)" {...register('phone')} />
      <div>
        <label className="mb-2 block text-xs uppercase tracking-luxe text-ink/60">
          Preferred date
        </label>
        <input
          type="date"
          className={fieldClass}
          {...register('preferredDate', { required: true })}
        />
        {errors.preferredDate && (
          <span className="mt-1 block text-xs text-red-700">Please choose a date</span>
        )}
      </div>
      <textarea
        className={fieldClass}
        rows={3}
        placeholder="Anything we should know? (optional)"
        {...register('message')}
      />

      {status === 'error' && (
        <p className="text-xs text-red-700">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory transition hover:bg-ink-soft disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Request Appointment'}
      </button>
    </form>
  );
}
