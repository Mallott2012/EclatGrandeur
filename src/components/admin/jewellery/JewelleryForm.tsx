'use client'

import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { RING_METALS } from '@/lib/diamonds/schemas'
import { JEWELLERY_CATEGORIES } from '@/lib/jewellery/schemas'
import { METAL_LABELS } from '@/lib/diamonds/types'
import type { JewelleryActionResult } from '@/app/admin/(console)/jewellery/types'
import { JEWELLERY_ACTION_INITIAL } from '@/app/admin/(console)/jewellery/types'
import type { JewelleryCategory } from '@/lib/jewellery/types'
import type { RingMetal } from '@/lib/diamonds/types'

const CATEGORY_LABELS: Record<JewelleryCategory, string> = {
  earrings:  'Earrings',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
}

interface DefaultValues {
  slug?:           string
  category?:       JewelleryCategory
  name?:           string
  subtitle?:       string | null
  description?:    string | null
  base_price_gbp?: number | null
  metals?:         RingMetal[]
  show_diamond?:   boolean
  is_total_carat?: boolean
  is_pair?:        boolean
  is_published?:   boolean
  sort_order?:     number
}

interface Props {
  action:         (state: JewelleryActionResult, formData: FormData) => Promise<JewelleryActionResult>
  defaultValues?: DefaultValues
  submitLabel:    string
  cancelHref:     string
}

export function JewelleryForm({ action, defaultValues: dv = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, JEWELLERY_ACTION_INITIAL)
  const fe = state.success ? {} : (state.fieldErrors ?? {})

  return (
    <form action={formAction} className="space-y-8">
      {!state.success && state.message && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Saved successfully.
        </div>
      )}

      {/* ── Identity ── */}
      <Fieldset title="Identity">
        <Grid>
          <Field label="Category" required error={fe.category}>
            <Select name="category" defaultValue={dv.category ?? ''} required>
              <option value="">— Select category —</option>
              {JEWELLERY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Slug" required error={fe.slug}
            hint="URL-safe identifier, e.g. 'brilliance-studs'">
            <Input name="slug" defaultValue={dv.slug ?? ''} placeholder="e.g. brilliance-studs" required />
          </Field>
        </Grid>

        <Field label="Name" required error={fe.name}>
          <Input name="name" defaultValue={dv.name ?? ''} placeholder="e.g. Brilliance Studs" required />
        </Field>

        <Field label="Subtitle" error={fe.subtitle}>
          <Input name="subtitle" defaultValue={dv.subtitle ?? ''} placeholder="e.g. Diamond Stud Earrings" />
        </Field>

        <Field label="Description" error={fe.description}>
          <textarea
            name="description"
            rows={4}
            defaultValue={dv.description ?? ''}
            placeholder="Atmospheric product description…"
            className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none resize-y"
          />
        </Field>
      </Fieldset>

      {/* ── Pricing & metals ── */}
      <Fieldset title="Pricing & metals">
        <Grid>
          <Field label="Base price (GBP)" required error={fe.base_price_gbp}
            hint="Setting price before diamond — enter 0 for free setting">
            <Input name="base_price_gbp" type="number" step="0.01" min="0"
              defaultValue={dv.base_price_gbp != null ? String(dv.base_price_gbp) : ''}
              placeholder="e.g. 3400.00" required />
          </Field>

          <Field label="Sort order" error={fe.sort_order}
            hint="Lower = appears first">
            <Input name="sort_order" type="number" step="1" min="0"
              defaultValue={dv.sort_order != null ? String(dv.sort_order) : '0'} />
          </Field>
        </Grid>

        <Field label="Available metals" required error={fe.metals}
          hint="Check all available metals for this piece">
          <div className="flex flex-wrap gap-3 mt-1">
            {RING_METALS.map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="metals"
                  value={m}
                  defaultChecked={dv.metals?.includes(m) ?? false}
                  className="h-4 w-4 accent-amber-600"
                />
                <span className="text-sm text-stone-700">{METAL_LABELS[m]}</span>
              </label>
            ))}
          </div>
          {fe.metals && <p className="mt-1 text-xs text-red-600">{fe.metals}</p>}
        </Field>
      </Fieldset>

      {/* ── Diamond options ── */}
      <Fieldset title="Diamond options">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="show_diamond"
              defaultChecked={dv.show_diamond ?? true}
              className="h-4 w-4 accent-amber-600"
            />
            <span className="text-sm text-stone-700">Show diamond selector (customer chooses a diamond)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="is_total_carat"
              defaultChecked={dv.is_total_carat ?? false}
              className="h-4 w-4 accent-stone-700"
            />
            <span className="text-sm text-stone-700">Total carat mode (earrings: combined weight)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="is_pair"
              defaultChecked={dv.is_pair ?? false}
              className="h-4 w-4 accent-stone-700"
            />
            <span className="text-sm text-stone-700">Pair mode (earrings: matched pair selection)</span>
          </label>
        </div>
      </Fieldset>

      {/* ── Visibility ── */}
      <Fieldset title="Visibility">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={dv.is_published ?? false}
            className="h-4 w-4 accent-amber-600"
          />
          <span className="text-sm text-stone-700">Published (visible on storefront)</span>
        </label>
      </Fieldset>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 border-t border-stone-200 pt-6">
        <SubmitButton label={submitLabel} />
        <a href={cancelHref} className="text-sm text-stone-400 transition-colors hover:text-stone-700">
          Cancel
        </a>
      </div>
    </form>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-stone-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold tracking-widest text-stone-400">{title.toUpperCase()}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}

function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium tracking-widest text-stone-500">
        {label.toUpperCase()}{required && <span className="ml-0.5 text-stone-900">*</span>}
      </label>
      {hint && <p className="mb-1 text-xs text-stone-400">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none ${className ?? ''}`}
    />
  )
}

function Select({
  children, className, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-500 focus:outline-none ${className ?? ''}`}
    >
      {children}
    </select>
  )
}
