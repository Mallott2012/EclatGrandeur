'use client'

import { useFormState as useActionState, useFormStatus } from 'react-dom'
import {
  ALL_GEMSTONE_TYPES, GEMSTONE_TYPE_LABELS,
  ALL_GEM_SHAPES, GEM_SHAPE_LABELS,
  ALL_GEM_COLOURS, ALL_GEM_CLARITIES,
  ALL_GEM_GRADES, ALL_GEM_FLUORESCENCE, GEM_FLUORESCENCE_LABELS,
  ALL_PRODUCT_STATUSES, PRODUCT_STATUS_LABELS,
  type GemstoneType, type GemShape, type GemColour, type GemClarity, type GemGrade,
  type GemFluorescence, type ProductStatus,
} from '@/lib/catalogue/enums'
import {
  BRACELET_STONE_ACTION_INITIAL,
  type BraceletStoneActionResult,
} from '@/app/admin/(console)/bracelet-stones/types'
import { Field, inputCls, FormError, Section } from '@/components/admin/catalogue/FormControls'

interface SettingOption { id: string; name: string }

interface DefaultValues {
  sku:                 string
  bracelet_setting_id: string
  stone_type:          GemstoneType
  shape:               GemShape | ''
  carat:               string
  colour:              GemColour | ''
  colour_description:  string
  clarity:             GemClarity | ''
  clarity_description: string
  cut_grade:           GemGrade | ''
  polish:              GemGrade | ''
  symmetry:            GemGrade | ''
  fluorescence:        GemFluorescence | ''
  gia_report_number:   string
  gia_report_date:     string
  gia_report_url:      string
  price_gbp:           string
  status:              ProductStatus
  is_published:        boolean
  notes:               string
}

const DEFAULT: DefaultValues = {
  sku: '', bracelet_setting_id: '', stone_type: 'diamond', shape: '', carat: '',
  colour: '', colour_description: '', clarity: '', clarity_description: '',
  cut_grade: '', polish: '', symmetry: '', fluorescence: '',
  gia_report_number: '', gia_report_date: '', gia_report_url: '',
  price_gbp: '', status: 'available', is_published: false, notes: '',
}

interface Props {
  action: (state: BraceletStoneActionResult, formData: FormData) => Promise<BraceletStoneActionResult>
  settings: SettingOption[]
  defaultValues?: Partial<DefaultValues>
}

export function BraceletStoneForm({ action, settings, defaultValues }: Props) {
  const [state, formAction] = useActionState(action, BRACELET_STONE_ACTION_INITIAL)
  const v = { ...DEFAULT, ...defaultValues }
  const fe = state.success ? {} : state.fieldErrors

  return (
    <form action={formAction} className="space-y-6">
      <FormError show={!state.success && !!state.message} message={state.success ? '' : state.message} />

      <Section title="Identity">
        {v.sku && (
          <Field label="SKU">
            <input type="text" value={v.sku} readOnly className={`${inputCls(false)} font-mono text-neutral-400`} />
          </Field>
        )}
        <Field label="Linked bracelet setting" error={fe['bracelet_setting_id']}>
          <select name="bracelet_setting_id" defaultValue={v.bracelet_setting_id} className={inputCls(false)}>
            <option value="">— Not linked —</option>
            {settings.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Stone type" error={fe['stone_type']} required>
          <select name="stone_type" defaultValue={v.stone_type} className={inputCls(false)}>
            {ALL_GEMSTONE_TYPES.map((t) => <option key={t} value={t}>{GEMSTONE_TYPE_LABELS[t]}</option>)}
          </select>
          <p className="mt-1 text-xs text-neutral-600">Diamonds use the graded 4Cs dropdowns; coloured stones use the free-text colour/clarity fields.</p>
        </Field>
      </Section>

      <Section title="The 4Cs">
        <Field label="Shape (cut)" error={fe['shape']}>
          <select name="shape" defaultValue={v.shape} className={inputCls(false)}>
            <option value="">—</option>
            {ALL_GEM_SHAPES.map((s) => <option key={s} value={s}>{GEM_SHAPE_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Carat" error={fe['carat']}>
          <input type="number" name="carat" defaultValue={v.carat} step="0.001" min="0"
            className={inputCls(!!fe['carat'])} placeholder="e.g. 1.250" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Colour (diamond)" error={fe['colour']}>
            <select name="colour" defaultValue={v.colour} className={inputCls(false)}>
              <option value="">—</option>
              {ALL_GEM_COLOURS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Colour description" error={fe['colour_description']}>
            <input type="text" name="colour_description" defaultValue={v.colour_description}
              className={inputCls(false)} placeholder='e.g. "Pigeon Blood Red"' />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Clarity (diamond)" error={fe['clarity']}>
            <select name="clarity" defaultValue={v.clarity} className={inputCls(false)}>
              <option value="">—</option>
              {ALL_GEM_CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Clarity description" error={fe['clarity_description']}>
            <input type="text" name="clarity_description" defaultValue={v.clarity_description}
              className={inputCls(false)} placeholder="e.g. Eye-clean" />
          </Field>
        </div>
      </Section>

      <Section title="Cut quality grades">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Cut grade" error={fe['cut_grade']}>
            <GradeSelect name="cut_grade" value={v.cut_grade} />
          </Field>
          <Field label="Polish" error={fe['polish']}>
            <GradeSelect name="polish" value={v.polish} />
          </Field>
          <Field label="Symmetry" error={fe['symmetry']}>
            <GradeSelect name="symmetry" value={v.symmetry} />
          </Field>
        </div>
        <Field label="Fluorescence" error={fe['fluorescence']}>
          <select name="fluorescence" defaultValue={v.fluorescence} className={inputCls(false)}>
            <option value="">—</option>
            {ALL_GEM_FLUORESCENCE.map((f) => <option key={f} value={f}>{GEM_FLUORESCENCE_LABELS[f]}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="GIA certification">
        <div className="grid grid-cols-2 gap-4">
          <Field label="GIA report number" error={fe['gia_report_number']}>
            <input type="text" name="gia_report_number" defaultValue={v.gia_report_number} className={inputCls(false)} />
          </Field>
          <Field label="Report date" error={fe['gia_report_date']}>
            <input type="date" name="gia_report_date" defaultValue={v.gia_report_date} className={inputCls(!!fe['gia_report_date'])} />
          </Field>
        </div>
        <Field label="Report URL" error={fe['gia_report_url']}>
          <input type="url" name="gia_report_url" defaultValue={v.gia_report_url} className={inputCls(false)} placeholder="https://..." />
        </Field>
      </Section>

      <Section title="Pricing & visibility">
        <Field label="Price (GBP)" error={fe['price_gbp']}>
          <div className="flex items-center gap-1">
            <span className="text-neutral-400">£</span>
            <input type="number" name="price_gbp" defaultValue={v.price_gbp} step="0.01" min="0"
              className={inputCls(false)} placeholder="e.g. 5400" />
          </div>
        </Field>
        <Field label="Internal notes" error={fe['notes']}>
          <textarea name="notes" defaultValue={v.notes} rows={3} className={inputCls(false) + ' resize-y'}
            placeholder="Never shown publicly." />
        </Field>
        <Field label="Status" error={fe['status']}>
          <select name="status" defaultValue={v.status} className={inputCls(false)}>
            {ALL_PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>)}
          </select>
        </Field>
        <Field label="Visibility">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="hidden" name="is_published" value="false" />
            <input type="checkbox" name="is_published" value="true" defaultChecked={v.is_published} className="accent-amber-600" />
            <span className="text-sm text-neutral-300">Publish to storefront</span>
          </label>
        </Field>
      </Section>

      <div className="pt-2"><SubmitButton /></div>
    </form>
  )
}

function GradeSelect({ name, value }: { name: string; value: string }) {
  return (
    <select name={name} defaultValue={value} className={inputCls(false)}>
      <option value="">—</option>
      {ALL_GEM_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
    </select>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="rounded bg-amber-700 px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-amber-600 disabled:opacity-50">
      {pending ? 'Saving…' : 'Save bracelet stone'}
    </button>
  )
}
