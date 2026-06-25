'use client'

import { useState } from 'react'
import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import {
  DIAMOND_CUTS,
  DIAMOND_COLOURS,
  DIAMOND_CLARITIES,
  DIAMOND_GRADES,
  DIAMOND_FLUORESCENCES,
  COLOUR_FAMILIES,
  COLOUR_INTENSITIES,
  RING_METALS,
} from '@/lib/diamonds/schemas'
import {
  CUT_LABELS,
  GRADE_LABELS,
  FLUORESCENCE_LABELS,
  COLOUR_FAMILY_LABELS,
  COLOUR_INTENSITY_LABELS,
  METAL_LABELS,
  type DiamondCut,
  type DiamondColour,
  type DiamondClarity,
  type DiamondGrade,
  type DiamondFluorescence,
  type DiamondCategory,
  type ColourFamily,
  type ColourIntensity,
} from '@/lib/diamonds/types'
import { isEclatEligible } from '@/lib/diamonds/eligibility'
import type { DiamondActionResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_ACTION_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface DefaultValues {
  ring_setting_id?:    string | null
  diamond_category?:   DiamondCategory | null
  cut?:                DiamondCut | null
  carat?:              number | null
  colour?:             DiamondColour | null
  clarity?:            DiamondClarity | null
  colour_family?:      ColourFamily | null
  colour_intensity?:   ColourIntensity | null
  colour_description?: string | null
  cut_grade?:          DiamondGrade | null
  polish?:             DiamondGrade | null
  symmetry?:           DiamondGrade | null
  fluorescence?:       DiamondFluorescence | null
  gia_report_number?:  string | null
  gia_report_date?:    string | null
  gia_report_url?:     string | null
  measurement_length?: number | null
  measurement_width?:  number | null
  measurement_depth?:  number | null
  depth_pct?:          number | null
  table_pct?:          number | null
  price_gbp?:          number | null
  is_published?:       boolean
  eclat_approved?:     boolean
  notes?:              string | null
}

interface Props {
  action:         (state: DiamondActionResult, formData: FormData) => Promise<DiamondActionResult>
  defaultValues?: DefaultValues
  submitLabel:    string
  cancelHref:     string
}

// Fancy shapes — no GIA cut grade, require eclat_approved for eligibility
const FANCY_SHAPES: DiamondCut[] = ['oval','cushion','emerald','pear','radiant','princess','marquise','asscher','heart']

export function DiamondForm({ action, defaultValues: dv = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, DIAMOND_ACTION_INITIAL)
  const fe = state.success ? {} : (state.fieldErrors ?? {})

  const [category, setCategory]   = useState<DiamondCategory>(dv.diamond_category ?? 'white')
  const [cut, setCut]             = useState<DiamondCut | ''>(dv.cut ?? '')
  const [polish, setPolish]       = useState<DiamondGrade | ''>(dv.polish ?? '')
  const [symmetry, setSymmetry]   = useState<DiamondGrade | ''>(dv.symmetry ?? '')
  const [fluorescence, setFluo]   = useState<DiamondFluorescence>(dv.fluorescence ?? 'none')
  const [cutGrade, setCutGrade]   = useState<DiamondGrade | ''>(dv.cut_grade ?? '')
  const [eclatApproved]           = useState<boolean>(dv.eclat_approved ?? false)

  const isFancy  = cut !== '' && FANCY_SHAPES.includes(cut as DiamondCut)
  const isRound  = cut === 'round'
  const eligible = cut !== '' ? isEclatEligible({
    cut:            cut as DiamondCut,
    cut_grade:      cutGrade  || null,
    polish:         polish    || null,
    symmetry:       symmetry  || null,
    fluorescence:   fluorescence,
    eclat_approved: eclatApproved,
  }) : null

  return (
    <form action={formAction} className="space-y-8">
      {!state.success && state.message && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* ── Diamond category ── */}
      <Fieldset title="Diamond type">
        <input type="hidden" name="diamond_category" value={category} />
        <div className="flex gap-0">
          {(['white', 'coloured'] as DiamondCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 text-xs font-medium tracking-widest uppercase border transition-colors ${
                category === cat
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:border-stone-500'
              }`}
            >
              {cat === 'white' ? 'White Diamond' : 'Coloured Diamond'}
            </button>
          ))}
        </div>
        {fe.diamond_category && <p className="mt-1 text-xs text-red-600">{fe.diamond_category}</p>}
      </Fieldset>

      {/* ── 4Cs (core) ── */}
      <Fieldset title="4Cs">
        <Grid>
          <Field label="Cut (shape)" required error={fe.cut}>
            <Select name="cut" value={cut} onChange={(e) => setCut(e.target.value as DiamondCut | '')} required>
              <option value="">— Select cut —</option>
              {DIAMOND_CUTS.map((c) => (
                <option key={c} value={c}>{CUT_LABELS[c]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Carat" required error={fe.carat}>
            <Input name="carat" type="number" step="0.001" min="0.001"
              defaultValue={dv.carat != null ? String(dv.carat) : ''}
              placeholder="e.g. 1.020" required />
          </Field>

          {/* White diamonds: D–I colour scale */}
          {category === 'white' && (
            <Field label="Colour" required error={fe.colour}>
              <Select name="colour" defaultValue={dv.colour ?? ''} required>
                <option value="">— Select colour —</option>
                {DIAMOND_COLOURS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          )}

          {/* Coloured diamonds: colour_family (Yellow / Pink only) */}
          {category === 'coloured' && (
            <>
              <input type="hidden" name="colour" value={dv.colour ?? 'D'} />
              <Field label="Colour family" required error={fe.colour_family}>
                <Select name="colour_family" defaultValue={dv.colour_family ?? ''} required>
                  <option value="">— Yellow or Pink —</option>
                  {COLOUR_FAMILIES.map((f) => (
                    <option key={f} value={f}>{COLOUR_FAMILY_LABELS[f]}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Intensity" error={fe.colour_intensity}>
                <Select name="colour_intensity" defaultValue={dv.colour_intensity ?? ''}>
                  <option value="">— Optional —</option>
                  {COLOUR_INTENSITIES.map((i) => (
                    <option key={i} value={i}>{COLOUR_INTENSITY_LABELS[i]}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Full colour description" error={fe.colour_description} colSpan2>
                <Input name="colour_description"
                  defaultValue={dv.colour_description ?? ''}
                  placeholder="e.g. Fancy Intense Yellow" />
              </Field>
            </>
          )}

          <Field label="Clarity" required error={fe.clarity}>
            <Select name="clarity" defaultValue={dv.clarity ?? ''} required>
              <option value="">— Select clarity —</option>
              {DIAMOND_CLARITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Cut grades ── */}
      <Fieldset title="Cut grades">
        <Grid>
          {/* Cut grade only shown for round brilliants */}
          {(isRound || cut === '') && (
            <Field label="Cut grade" error={fe.cut_grade}
              hint={isFancy ? undefined : 'GIA cut grade — Round Brilliant only'}>
              <Select name="cut_grade" value={cutGrade}
                onChange={(e) => setCutGrade(e.target.value as DiamondGrade | '')}>
                <option value="">— Optional —</option>
                {DIAMOND_GRADES.map((g) => (
                  <option key={g} value={g}>{GRADE_LABELS[g]}</option>
                ))}
              </Select>
            </Field>
          )}
          {isFancy && (
            <input type="hidden" name="cut_grade" value="" />
          )}

          <Field label="Polish" error={fe.polish}>
            <Select name="polish" value={polish}
              onChange={(e) => setPolish(e.target.value as DiamondGrade | '')}>
              <option value="">— Optional —</option>
              {DIAMOND_GRADES.map((g) => (
                <option key={g} value={g}>{GRADE_LABELS[g]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Symmetry" error={fe.symmetry}>
            <Select name="symmetry" value={symmetry}
              onChange={(e) => setSymmetry(e.target.value as DiamondGrade | '')}>
              <option value="">— Optional —</option>
              {DIAMOND_GRADES.map((g) => (
                <option key={g} value={g}>{GRADE_LABELS[g]}</option>
              ))}
            </Select>
          </Field>

          <Field label="Fluorescence" error={fe.fluorescence}>
            <Select name="fluorescence" value={fluorescence}
              onChange={(e) => setFluo(e.target.value as DiamondFluorescence)}>
              {DIAMOND_FLUORESCENCES.map((f) => (
                <option key={f} value={f}>{FLUORESCENCE_LABELS[f]}</option>
              ))}
            </Select>
          </Field>
        </Grid>

        {/* Eligibility banner */}
        {eligible !== null && (
          <div className={`mt-4 rounded border px-4 py-3 text-xs ${
            eligible
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {eligible
              ? '✓ Meets Éclat Standard — eligible for publication'
              : isFancy
                ? '✗ Fancy shape — Éclat approval required before publication (set grades, save, then approve from the detail page)'
                : '✗ Does not meet Éclat Standard — cannot be published (requires Excellent Polish, Symmetry, Fluorescence None' + (isRound ? ', and Excellent Cut grade)' : ')')
            }
          </div>
        )}
      </Fieldset>

      {/* ── GIA certification ── */}
      <Fieldset title="GIA certification">
        <Grid>
          <Field label="Report number" error={fe.gia_report_number}>
            <Input name="gia_report_number"
              defaultValue={dv.gia_report_number ?? ''}
              placeholder="e.g. 2141438276" />
          </Field>
          <Field label="Report date" error={fe.gia_report_date}>
            <Input name="gia_report_date" type="date" defaultValue={dv.gia_report_date ?? ''} />
          </Field>
          <Field label="Report URL" error={fe.gia_report_url} colSpan2>
            <Input name="gia_report_url" type="url"
              defaultValue={dv.gia_report_url ?? ''}
              placeholder="https://www.gia.edu/report-check/..." />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Measurements ── */}
      <Fieldset title="Measurements (mm)">
        <Grid>
          <Field label="Length" error={fe.measurement_length}>
            <Input name="measurement_length" type="number" step="0.01" min="0"
              defaultValue={dv.measurement_length != null ? String(dv.measurement_length) : ''} />
          </Field>
          <Field label="Width" error={fe.measurement_width}>
            <Input name="measurement_width" type="number" step="0.01" min="0"
              defaultValue={dv.measurement_width != null ? String(dv.measurement_width) : ''} />
          </Field>
          <Field label="Depth" error={fe.measurement_depth}>
            <Input name="measurement_depth" type="number" step="0.01" min="0"
              defaultValue={dv.measurement_depth != null ? String(dv.measurement_depth) : ''} />
          </Field>
          <Field label="Table %" error={fe.table_pct}>
            <Input name="table_pct" type="number" step="0.1" min="0" max="100"
              defaultValue={dv.table_pct != null ? String(dv.table_pct) : ''} />
          </Field>
          <Field label="Depth %" error={fe.depth_pct}>
            <Input name="depth_pct" type="number" step="0.1" min="0" max="100"
              defaultValue={dv.depth_pct != null ? String(dv.depth_pct) : ''} />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Ring setting ── */}
      <Fieldset title="Ring setting (optional)">
        <Field label="Ring setting ID" error={fe.ring_setting_id}
          hint="UUID of an existing ring setting">
          <Input name="ring_setting_id"
            defaultValue={dv.ring_setting_id ?? ''}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </Field>
      </Fieldset>

      {/* ── Pricing ── */}
      <Fieldset title="Pricing">
        <Grid>
          <Field label="Price (GBP)" required error={fe.price_gbp}>
            <Input name="price_gbp" type="number" step="0.01" min="0"
              defaultValue={dv.price_gbp != null ? String(dv.price_gbp) : ''}
              placeholder="e.g. 4500.00" required />
          </Field>
        </Grid>
      </Fieldset>

      {/* ── Notes & visibility ── */}
      <Fieldset title="Notes & visibility">
        <Field label="Internal notes" error={fe.notes}>
          <textarea
            name="notes"
            rows={3}
            defaultValue={dv.notes ?? ''}
            className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none resize-y"
          />
        </Field>

        <label className="mt-4 flex cursor-pointer items-center gap-2">
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
        <a
          href={cancelHref}
          className="text-sm text-stone-400 transition-colors hover:text-stone-700"
        >
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
  label,
  required,
  error,
  hint,
  children,
  colSpan2,
}: {
  label:     string
  required?: boolean
  error?:    string
  hint?:     string
  children:  React.ReactNode
  colSpan2?: boolean
}) {
  return (
    <div className={colSpan2 ? 'sm:col-span-2' : undefined}>
      <label className="mb-1 block text-xs font-medium tracking-widest text-stone-500">
        {label.toUpperCase()}{required && <span className="ml-0.5 text-stone-900">*</span>}
      </label>
      {hint && <p className="mb-1 text-xs text-stone-400">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none ${className ?? ''}`}
    />
  )
}

function Select({
  children,
  className,
  ...props
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

// Suppress unused import warning — METAL_LABELS and RING_METALS exported for
// future ring-setting form use from this module.
export { METAL_LABELS, RING_METALS }
