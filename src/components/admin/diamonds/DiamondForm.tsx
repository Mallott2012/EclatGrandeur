'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type { DiamondActionResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_ACTION_INITIAL } from '@/app/admin/(console)/diamonds/types'
import {
  DIAMOND_SHAPES,
  DIAMOND_COLOUR_GRADES,
  FANCY_COLOUR_INTENSITIES,
  DIAMOND_CLARITIES,
  DIAMOND_CUTS,
  DIAMOND_FINISHES,
  DIAMOND_FLUORESCENCES,
  CERTIFICATE_LABS,
  DIAMOND_ORIGINS,
} from '@/lib/diamonds/schemas'
import { FANCY_HUES } from '@/lib/diamonds/types'

interface SupplierOption {
  id:   string
  code: string
  name: string
}

interface DefaultValues {
  origin?:                 string | null
  supplier_id?:            string | null
  supplier_sku?:           string | null
  colour_category?:        string | null
  colour_grade?:           string | null
  fancy_colour_hue?:       string | null
  fancy_colour_intensity?: string | null
  fancy_colour_overtone?:  string | null
  shape?:                  string | null
  carat?:                  number | null
  clarity?:                string | null
  cut?:                    string | null
  polish?:                 string | null
  symmetry?:               string | null
  fluorescence?:           string | null
  meas_length_mm?:         number | null
  meas_width_mm?:          number | null
  meas_depth_mm?:          number | null
  table_pct?:              number | null
  depth_pct?:              number | null
  girdle?:                 string | null
  culet?:                  string | null
  cert_lab?:               string | null
  cert_number?:            string | null
  retail_price_amount?:    number | null
  retail_price_currency?:  string | null
  supplier_cost_amount?:   number | null
  supplier_cost_currency?: string | null
  selection_note?:         string | null
  internal_notes?:         string | null
  is_visible?:             boolean
}

interface Props {
  action:          (state: DiamondActionResult, formData: FormData) => Promise<DiamondActionResult>
  supplierOptions: SupplierOption[]
  defaultValues?:  DefaultValues
  submitLabel:     string
  cancelHref:      string
}

export function DiamondForm({ action, supplierOptions, defaultValues: dv = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useFormState(action, DIAMOND_ACTION_INITIAL)
  const [colourCat, setColourCat] = useState<'standard' | 'fancy'>(
    (dv.colour_category as 'standard' | 'fancy') ?? 'standard',
  )

  const fe = state.success ? {} : (state.fieldErrors ?? {})

  return (
    <form action={formAction} className="space-y-8">
      {/* Top-level error banner */}
      {!state.success && state.message && (
        <div className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {state.message}
        </div>
      )}

      {/* ── Origin & supplier ── */}
      <Fieldset title="Origin & supplier">
        <Grid>
          <Field label="Origin" required error={fe.origin}>
            <Select name="origin" defaultValue={dv.origin ?? 'natural'}>
              {DIAMOND_ORIGINS.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}
            </Select>
          </Field>

          <Field label="Supplier" error={fe.supplier_id}>
            <Select name="supplier_id" defaultValue={dv.supplier_id ?? ''}>
              <option value="">— None —</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Supplier SKU" error={fe.supplier_sku}>
            <Input name="supplier_sku" defaultValue={dv.supplier_sku ?? ''} />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Shape & grading ── */}
      <Fieldset title="Shape & grading">
        <Grid>
          <Field label="Shape" required error={fe.shape}>
            <Select name="shape" defaultValue={dv.shape ?? ''}>
              <option value="">— Select —</option>
              {DIAMOND_SHAPES.map((s) => <option key={s} value={s}>{fmt(s)}</option>)}
            </Select>
          </Field>

          <Field label="Carat" required error={fe.carat}>
            <Input name="carat" type="number" step="0.001" min="0.001" defaultValue={dv.carat?.toString() ?? ''} />
          </Field>

          <Field label="Clarity" required error={fe.clarity}>
            <Select name="clarity" defaultValue={dv.clarity ?? ''}>
              <option value="">— Select —</option>
              {DIAMOND_CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>

          <Field label="Cut" error={fe.cut}>
            <Select name="cut" defaultValue={dv.cut ?? ''}>
              <option value="">— None —</option>
              {DIAMOND_CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>

          <Field label="Polish" required error={fe.polish}>
            <Select name="polish" defaultValue={dv.polish ?? ''}>
              <option value="">— Select —</option>
              {DIAMOND_FINISHES.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>

          <Field label="Symmetry" required error={fe.symmetry}>
            <Select name="symmetry" defaultValue={dv.symmetry ?? ''}>
              <option value="">— Select —</option>
              {DIAMOND_FINISHES.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>

          <Field label="Fluorescence" required error={fe.fluorescence}>
            <Select name="fluorescence" defaultValue={dv.fluorescence ?? 'None'}>
              {DIAMOND_FLUORESCENCES.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Colour ── */}
      <Fieldset title="Colour">
        <div className="mb-4 flex gap-4">
          {(['standard', 'fancy'] as const).map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
              <input
                type="radio"
                name="colour_category"
                value={cat}
                checked={colourCat === cat}
                onChange={() => setColourCat(cat)}
                className="accent-amber-500"
              />
              {fmt(cat)}
            </label>
          ))}
        </div>

        {colourCat === 'standard' ? (
          <Grid>
            <Field label="Colour grade" required error={fe.colour_grade}>
              <Select name="colour_grade" defaultValue={dv.colour_grade ?? ''}>
                <option value="">— Select —</option>
                {DIAMOND_COLOUR_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
          </Grid>
        ) : (
          <Grid>
            <Field label="Hue" required error={fe.fancy_colour_hue}>
              <Select name="fancy_colour_hue" defaultValue={dv.fancy_colour_hue ?? ''}>
                <option value="">— Select —</option>
                {FANCY_HUES.map((h) => <option key={h} value={h}>{fmt(h)}</option>)}
              </Select>
            </Field>
            <Field label="Intensity" required error={fe.fancy_colour_intensity}>
              <Select name="fancy_colour_intensity" defaultValue={dv.fancy_colour_intensity ?? ''}>
                <option value="">— Select —</option>
                {FANCY_COLOUR_INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
            </Field>
            <Field label="Overtone" error={fe.fancy_colour_overtone}>
              <Input name="fancy_colour_overtone" defaultValue={dv.fancy_colour_overtone ?? ''} placeholder="e.g. Pinkish" />
            </Field>
          </Grid>
        )}
      </Fieldset>

      {/* ── Measurements (optional) ── */}
      <Fieldset title="Measurements (optional)">
        <Grid>
          <Field label="Length mm" error={fe.meas_length_mm}>
            <Input name="meas_length_mm" type="number" step="0.01" defaultValue={dv.meas_length_mm?.toString() ?? ''} />
          </Field>
          <Field label="Width mm" error={fe.meas_width_mm}>
            <Input name="meas_width_mm" type="number" step="0.01" defaultValue={dv.meas_width_mm?.toString() ?? ''} />
          </Field>
          <Field label="Depth mm" error={fe.meas_depth_mm}>
            <Input name="meas_depth_mm" type="number" step="0.01" defaultValue={dv.meas_depth_mm?.toString() ?? ''} />
          </Field>
          <Field label="Table %" error={fe.table_pct}>
            <Input name="table_pct" type="number" step="0.1" defaultValue={dv.table_pct?.toString() ?? ''} />
          </Field>
          <Field label="Depth %" error={fe.depth_pct}>
            <Input name="depth_pct" type="number" step="0.1" defaultValue={dv.depth_pct?.toString() ?? ''} />
          </Field>
          <Field label="Girdle" error={fe.girdle}>
            <Input name="girdle" defaultValue={dv.girdle ?? ''} />
          </Field>
          <Field label="Culet" error={fe.culet}>
            <Input name="culet" defaultValue={dv.culet ?? ''} />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Certificate ── */}
      <Fieldset title="Certificate">
        <Grid>
          <Field label="Lab" error={fe.cert_lab}>
            <Select name="cert_lab" defaultValue={dv.cert_lab ?? ''}>
              <option value="">— None —</option>
              {CERTIFICATE_LABS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Number" error={fe.cert_number}>
            <Input name="cert_number" defaultValue={dv.cert_number ?? ''} />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Pricing ── */}
      <Fieldset title="Pricing">
        <Grid>
          <Field label="Retail price" error={fe.retail_price_amount}>
            <div className="flex gap-2">
              <Input name="retail_price_amount" type="number" step="1" min="1" defaultValue={dv.retail_price_amount?.toString() ?? ''} className="flex-1" />
              <Select name="retail_price_currency" defaultValue={dv.retail_price_currency ?? 'AED'} className="w-24">
                {['AED', 'USD', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </Field>
          <Field label="Supplier cost" error={fe.supplier_cost_amount}>
            <div className="flex gap-2">
              <Input name="supplier_cost_amount" type="number" step="1" min="0" defaultValue={dv.supplier_cost_amount?.toString() ?? ''} className="flex-1" />
              <Select name="supplier_cost_currency" defaultValue={dv.supplier_cost_currency ?? 'USD'} className="w-24">
                {['USD', 'AED', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Notes ── */}
      <Fieldset title="Notes">
        <div className="space-y-4">
          <Field label="Selection note" hint="Visible to sales advisers" error={fe.selection_note}>
            <textarea name="selection_note" rows={2} defaultValue={dv.selection_note ?? ''} className={textareaCls(!!fe.selection_note)} />
          </Field>
          <Field label="Internal notes" hint="Privileged only" error={fe.internal_notes}>
            <textarea name="internal_notes" rows={3} defaultValue={dv.internal_notes ?? ''} className={textareaCls(!!fe.internal_notes)} />
          </Field>
        </div>
      </Fieldset>

      {/* ── Visibility ── */}
      <Fieldset title="Storefront visibility">
        {fe.is_visible && <p className="mb-2 text-xs text-red-400">{fe.is_visible}</p>}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            name="is_visible"
            type="checkbox"
            defaultChecked={dv.is_visible ?? false}
            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-amber-500"
          />
          <span className="text-sm text-neutral-300">Visible on storefront</span>
        </label>
        <p className="mt-1 text-xs text-neutral-600">Requires cert lab, cert number, and a positive retail price.</p>
      </Fieldset>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 border-t border-neutral-800 pt-6">
        <SubmitButton label={submitLabel} />
        <a href={cancelHref} className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
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
      className="rounded bg-amber-700 px-5 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-widest text-neutral-400">{title.toUpperCase()}</p>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function Field({
  label, hint, error, required, children,
}: {
  label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode
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

function Input({ name, type = 'text', defaultValue, placeholder, step, min, className = 'w-full' }: {
  name: string; type?: string; defaultValue?: string; placeholder?: string
  step?: string; min?: string; className?: string
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      step={step}
      min={min}
      className={`${className} rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700/50`}
    />
  )
}

function Select({ name, defaultValue, children, className = 'w-full' }: {
  name: string; defaultValue?: string; children: React.ReactNode; className?: string
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className={`${className} rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700/50`}
    >
      {children}
    </select>
  )
}

function textareaCls(hasError: boolean) {
  return `w-full rounded border ${
    hasError ? 'border-red-700 bg-red-950/20' : 'border-neutral-700 bg-neutral-900'
  } px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700/50 resize-y`
}

function fmt(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
