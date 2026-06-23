'use client'

import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { ALL_METALS, METAL_LABELS, type RingMetal } from '@/lib/ring-settings/types'
import { RING_SETTING_ACTION_INITIAL, type RingSettingActionResult } from '@/app/admin/(console)/ring-settings/types'

interface DefaultValues {
  name:           string
  slug:           string
  collection:     string
  description:    string
  metals:         RingMetal[]
  base_price_gbp: string
  is_published:   boolean
  sort_order:     number
}

const DEFAULT: DefaultValues = {
  name:           '',
  slug:           '',
  collection:     '',
  description:    '',
  metals:         ['platinum'],
  base_price_gbp: '',
  is_published:   false,
  sort_order:     0,
}

interface Props {
  action: (state: RingSettingActionResult, formData: FormData) => Promise<RingSettingActionResult>
  defaultValues?: Partial<DefaultValues>
}

export function RingSettingForm({ action, defaultValues }: Props) {
  const [state, formAction] = useActionState(action, RING_SETTING_ACTION_INITIAL)
  const values = { ...DEFAULT, ...defaultValues }
  const fieldErrors = state.success ? {} : state.fieldErrors

  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    const slugInput = document.getElementById('slug') as HTMLInputElement | null
    if (slugInput && !slugInput.value) {
      slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && state.message && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Name */}
      <Field label="Name" error={fieldErrors['name']} required>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={values.name}
          onBlur={handleNameBlur}
          className={inputCls(!!fieldErrors['name'])}
          placeholder="e.g. The Éclat Solitaire"
        />
      </Field>

      {/* Slug */}
      <Field label="Slug (URL)" error={fieldErrors['slug']} required>
        <input
          type="text"
          name="slug"
          id="slug"
          defaultValue={values.slug}
          className={inputCls(!!fieldErrors['slug'])}
          placeholder="e.g. eclat-solitaire"
        />
        <p className="mt-1 text-xs text-stone-400">Lowercase letters, numbers, and hyphens only. Auto-filled from name.</p>
      </Field>

      {/* Collection */}
      <Field label="Collection" error={fieldErrors['collection']}>
        <input
          type="text"
          name="collection"
          defaultValue={values.collection}
          className={inputCls(false)}
          placeholder="e.g. Éclat Classics"
        />
      </Field>

      {/* Metals */}
      <Field label="Metals available" error={fieldErrors['metals']} required>
        <div className="flex flex-wrap gap-2">
          {ALL_METALS.map((metal) => (
            <label key={metal} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="metals"
                value={metal}
                defaultChecked={values.metals.includes(metal)}
                className="accent-amber-600"
              />
              <span className="text-sm text-stone-700">{METAL_LABELS[metal]}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* Base price */}
      <Field label="Base price (GBP)" error={fieldErrors['base_price_gbp']}>
        <div className="flex items-center gap-1">
          <span className="text-stone-500">£</span>
          <input
            type="number"
            name="base_price_gbp"
            defaultValue={values.base_price_gbp}
            step="0.01"
            min="0"
            className={inputCls(false)}
            placeholder="e.g. 2400"
          />
        </div>
        <p className="mt-1 text-xs text-stone-400">Starting price for this ring setting without a diamond.</p>
      </Field>

      {/* Description */}
      <Field label="Description" error={fieldErrors['description']}>
        <textarea
          name="description"
          defaultValue={values.description}
          rows={4}
          className={inputCls(false) + ' resize-y'}
          placeholder="Describe the craftsmanship and design of this setting..."
        />
      </Field>

      {/* Sort order */}
      <Field label="Sort order" error={fieldErrors['sort_order']}>
        <input
          type="number"
          name="sort_order"
          defaultValue={values.sort_order}
          min="0"
          className={`${inputCls(!!fieldErrors['sort_order'])} w-24`}
        />
        <p className="mt-1 text-xs text-stone-400">Lower numbers appear first on the storefront.</p>
      </Field>

      {/* Published */}
      <Field label="Visibility" error={undefined}>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="hidden"
            name="is_published"
            value="false"
          />
          <input
            type="checkbox"
            name="is_published"
            value="true"
            defaultChecked={values.is_published}
            className="accent-amber-600"
          />
          <span className="text-sm text-stone-700">Publish to storefront</span>
        </label>
      </Field>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-stone-900 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save ring setting'}
    </button>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium tracking-wider text-stone-500">
        {label.toUpperCase()}
        {required && <span className="ml-1 text-stone-900">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full rounded border ${
    hasError ? 'border-red-300 bg-red-50' : 'border-stone-300 bg-white'
  } px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none`
}
