'use client'

import { useFormState as useActionState, useFormStatus } from 'react-dom'
import {
  ALL_METALS, METAL_LABELS, ALL_PRODUCT_STATUSES, PRODUCT_STATUS_LABELS,
  type RingMetal, type ProductStatus,
} from '@/lib/catalogue/enums'
import { BRACELET_STYLES, BRACELET_STYLE_LABELS } from '@/lib/bracelet-settings/types'
import {
  BRACELET_SETTING_ACTION_INITIAL,
  type BraceletSettingActionResult,
} from '@/app/admin/(console)/bracelet-settings/types'
import { Field, inputCls, FormError } from '@/components/admin/catalogue/FormControls'

interface DefaultValues {
  name:              string
  slug:              string
  collection:        string
  style:             string
  short_description: string
  description:       string
  metals:            RingMetal[]
  sizes_cm:  number[]
  base_price_gbp:    string
  status:            ProductStatus
  is_published:      boolean
  sort_order:        number
}

const DEFAULT: DefaultValues = {
  name: '', slug: '', collection: '', style: '', short_description: '', description: '',
  metals: ['platinum'], sizes_cm: [], base_price_gbp: '', status: 'available',
  is_published: false, sort_order: 0,
}

interface Props {
  action: (state: BraceletSettingActionResult, formData: FormData) => Promise<BraceletSettingActionResult>
  defaultValues?: Partial<DefaultValues>
}

export function BraceletSettingForm({ action, defaultValues }: Props) {
  const [state, formAction] = useActionState(action, BRACELET_SETTING_ACTION_INITIAL)
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
      <FormError show={!state.success && !!state.message} message={state.success ? '' : state.message} />

      <Field label="Name" error={fieldErrors['name']} required>
        <input type="text" name="name" id="name" defaultValue={values.name} onBlur={handleNameBlur}
          className={inputCls(!!fieldErrors['name'])} placeholder="e.g. The Victoria Tennis Bracelet" />
      </Field>

      <Field label="Slug (URL)" error={fieldErrors['slug']} required>
        <input type="text" name="slug" id="slug" defaultValue={values.slug}
          className={inputCls(!!fieldErrors['slug'])} placeholder="e.g. victoria-tennis-bracelet" />
        <p className="mt-1 text-xs text-neutral-600">Lowercase letters, numbers, and hyphens only. Auto-filled from name.</p>
      </Field>

      <Field label="Collection" error={fieldErrors['collection']}>
        <input type="text" name="collection" defaultValue={values.collection}
          className={inputCls(false)} placeholder="e.g. Éclat Classics" />
      </Field>

      <Field label="Style" error={fieldErrors['style']}>
        <select name="style" defaultValue={values.style} className={inputCls(false)}>
          <option value="">— Select a style —</option>
          {BRACELET_STYLES.map((s) => (
            <option key={s} value={s}>{BRACELET_STYLE_LABELS[s]}</option>
          ))}
        </select>
      </Field>

      <Field label="Short description" error={fieldErrors['short_description']}>
        <input type="text" name="short_description" defaultValue={values.short_description} maxLength={160}
          className={inputCls(!!fieldErrors['short_description'])} placeholder="One-sentence storefront teaser (max 160 characters)" />
      </Field>

      <Field label="Metals available" error={fieldErrors['metals']} required>
        <div className="flex flex-wrap gap-3">
          {ALL_METALS.map((metal) => (
            <label key={metal} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="metals" value={metal}
                defaultChecked={values.metals.includes(metal)} className="accent-amber-600" />
              <span className="text-sm text-neutral-300">{METAL_LABELS[metal]}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Sizes (cm)" error={fieldErrors['sizes_cm']}>
        <input type="text" name="sizes_cm" defaultValue={values.sizes_cm.join(', ')}
          className={inputCls(false)} placeholder="e.g. 16, 17, 18" />
        <p className="mt-1 text-xs text-neutral-600">Comma-separated wrist sizes in centimetres (decimals allowed).</p>
      </Field>

      <Field label="Base price (GBP)" error={fieldErrors['base_price_gbp']}>
        <div className="flex items-center gap-1">
          <span className="text-neutral-400">£</span>
          <input type="number" name="base_price_gbp" defaultValue={values.base_price_gbp} step="0.01" min="0"
            className={inputCls(false)} placeholder="e.g. 9500" />
        </div>
      </Field>

      <Field label="Description" error={fieldErrors['description']}>
        <textarea name="description" defaultValue={values.description} rows={4}
          className={inputCls(false) + ' resize-y'} placeholder="Describe the craftsmanship and design of this bracelet..." />
      </Field>

      <Field label="Sort order" error={fieldErrors['sort_order']}>
        <input type="number" name="sort_order" defaultValue={values.sort_order} min="0"
          className={`${inputCls(!!fieldErrors['sort_order'])} w-24`} />
        <p className="mt-1 text-xs text-neutral-600">Lower numbers appear first on the storefront.</p>
      </Field>

      <Field label="Status" error={fieldErrors['status']}>
        <select name="status" defaultValue={values.status} className={inputCls(false)}>
          {ALL_PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>)}
        </select>
      </Field>

      <Field label="Visibility">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="hidden" name="is_published" value="false" />
          <input type="checkbox" name="is_published" value="true" defaultChecked={values.is_published} className="accent-amber-600" />
          <span className="text-sm text-neutral-300">Publish to storefront</span>
        </label>
      </Field>

      <div className="pt-2"><SubmitButton /></div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="rounded bg-amber-700 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600 disabled:opacity-50">
      {pending ? 'Saving…' : 'Save bracelet setting'}
    </button>
  )
}
