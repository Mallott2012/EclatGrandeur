'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { EnquiryType, EnquirySource } from '@/types/enquiry';

interface EnquiryFormProps {
  type?: EnquiryType;
  source: EnquirySource;
  productSlug?: string;
  builtRing?: { settingSlug: string; diamondSku: string; metal: string };
  onSuccess?: () => void;
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
}

const fieldClass =
  'w-full border border-ink/20 bg-transparent px-4 py-3 text-sm font-light text-ink placeholder:text-ink/40 focus:border-champagne focus:outline-none';

export function EnquiryForm({
  type = 'quote',
  source,
  productSlug,
  builtRing,
  onSuccess,
}: EnquiryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      type,
      source,
      productSlug,
      builtRing,
      message: values.message,
      contact: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      },
    };
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      onSuccess?.();
    } catch {
      setStatus('error');
    }
  });

  if (status === 'sent') {
    return (
      <div className="py-8 text-center">
        <p className="font-display text-2xl text-ink">Thank you</p>
        <p className="mt-2 text-sm font-light text-ink/70">
          A member of our concierge will be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <input
            className={fieldClass}
            placeholder="First name"
            {...register('firstName', { required: true })}
          />
          {errors.firstName && (
            <span className="mt-1 block text-xs text-red-700">Required</span>
          )}
        </div>
        <div>
          <input
            className={fieldClass}
            placeholder="Last name"
            {...register('lastName', { required: true })}
          />
          {errors.lastName && (
            <span className="mt-1 block text-xs text-red-700">Required</span>
          )}
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
          <span className="mt-1 block text-xs text-red-700">
            Please enter a valid email
          </span>
        )}
      </div>
      <input className={fieldClass} placeholder="Phone (optional)" {...register('phone')} />
      <textarea
        className={fieldClass}
        rows={4}
        placeholder="How may we help?"
        {...register('message')}
      />
      {status === 'error' && (
        <p className="text-xs text-red-700">
          Something went wrong. Please try again or email our concierge.
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-7 py-3.5 text-xs uppercase tracking-luxe text-ivory transition hover:bg-ink-soft disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Submit enquiry'}
      </button>
    </form>
  );
}
