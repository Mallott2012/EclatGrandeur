'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { SupplierActionResult } from '@/app/admin/(console)/suppliers/types'
import { SUPPLIER_ACTION_INITIAL } from '@/app/admin/(console)/suppliers/types'
import type { SupplierFull } from '@/lib/suppliers/types'

interface Props {
  action:      (state: SupplierActionResult, formData: FormData) => Promise<SupplierActionResult>
  initialData?: Partial<SupplierFull>
  submitLabel: string
  cancelHref:  string
}

export function SupplierForm({ action, initialData, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useFormState(action, SUPPLIER_ACTION_INITIAL)

  const fe = state.success ? {} : (state.fieldErrors ?? {})

  return (
    <form action={formAction} className="space-y-6">
      {/* Top-level error banner */}
      {!state.success && state.message && (
        <div className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {state.message}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Name */}
        <Field label="Supplier name" error={fe.name} required>
          <input
            name="name"
            type="text"
            required
            defaultValue={initialData?.name ?? ''}
            className={inputCls(!!fe.name)}
          />
        </Field>

        {/* Code */}
        <Field label="Code" hint="Uppercase letters, numbers, hyphens or underscores" error={fe.code} required>
          <input
            name="code"
            type="text"
            required
            defaultValue={initialData?.code ?? ''}
            className={`${inputCls(!!fe.code)} uppercase`}
          />
        </Field>

        {/* Contact name */}
        <Field label="Contact name" error={fe.contact_name}>
          <input
            name="contact_name"
            type="text"
            defaultValue={initialData?.contact_name ?? ''}
            className={inputCls(!!fe.contact_name)}
          />
        </Field>

        {/* Email */}
        <Field label="Email" error={fe.email}>
          <input
            name="email"
            type="email"
            defaultValue={initialData?.email ?? ''}
            className={inputCls(!!fe.email)}
          />
        </Field>

        {/* Phone */}
        <Field label="Phone" error={fe.phone}>
          <input
            name="phone"
            type="text"
            defaultValue={initialData?.phone ?? ''}
            className={inputCls(!!fe.phone)}
          />
        </Field>

        {/* Country */}
        <Field label="Country" error={fe.country}>
          <input
            name="country"
            type="text"
            defaultValue={initialData?.country ?? ''}
            className={inputCls(!!fe.country)}
          />
        </Field>

        {/* Currency */}
        <Field label="Currency" hint="3-letter ISO code (e.g. USD, EUR, AED)" error={fe.currency} required>
          <input
            name="currency"
            type="text"
            required
            maxLength={3}
            defaultValue={initialData?.currency ?? 'USD'}
            className={`${inputCls(!!fe.currency)} uppercase`}
          />
        </Field>

        {/* Active status */}
        <Field label="Status" error={undefined}>
          <label className="flex cursor-pointer items-center gap-3 pt-2">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={initialData?.is_active ?? true}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-amber-500"
            />
            <span className="text-sm text-neutral-300">Active</span>
          </label>
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes" error={fe.notes}>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? ''}
          className={`${inputCls(!!fe.notes)} resize-y`}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-neutral-800 pt-6">
        <SubmitButton label={submitLabel} />
        <a href={cancelHref} className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
          Cancel
        </a>
      </div>
    </form>
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-amber-700 px-5 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label:    string
  hint?:    string
  error?:   string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium tracking-widest text-neutral-400">
        {label.toUpperCase()}
        {required && <span className="ml-1 text-amber-600">*</span>}
      </label>
      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full rounded border ${
    hasError ? 'border-red-700 bg-red-950/20' : 'border-neutral-700 bg-neutral-900'
  } px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700/50`
}
