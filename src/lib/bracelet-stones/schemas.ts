import { z } from 'zod'
import {
  ALL_GEMSTONE_TYPES, ALL_GEM_SHAPES, ALL_GEM_COLOURS, ALL_GEM_CLARITIES,
  ALL_GEM_GRADES, ALL_GEM_FLUORESCENCE, ALL_PRODUCT_STATUSES,
} from '@/lib/catalogue/enums'

const e = (vals: readonly string[]) => z.enum(vals as [string, ...string[]])

// Empty string → null for optional enum/text fields coming from <select>/<input>.
const optEnum = (vals: readonly string[]) =>
  z.preprocess((v) => (v === '' || v == null ? null : v), e(vals).nullable())
const optText = z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable())
const optNum = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === '' || v == null ? null : Number(v)), schema.nullable())
const optDate = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').nullable(),
)

export const CreateBraceletStoneSchema = z.object({
  bracelet_setting_id: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().uuid().nullable()),
  stone_type:          e(ALL_GEMSTONE_TYPES).default('diamond'),
  shape:               optEnum(ALL_GEM_SHAPES),
  carat:               optNum(z.number().positive()),
  colour:              optEnum(ALL_GEM_COLOURS),
  colour_description:  optText,
  clarity:             optEnum(ALL_GEM_CLARITIES),
  clarity_description: optText,
  cut_grade:           optEnum(ALL_GEM_GRADES),
  polish:              optEnum(ALL_GEM_GRADES),
  symmetry:            optEnum(ALL_GEM_GRADES),
  fluorescence:        optEnum(ALL_GEM_FLUORESCENCE),
  gia_report_number:   optText,
  gia_report_date:     optDate,
  gia_report_url:      optText,
  price_gbp:           optNum(z.number().nonnegative()),
  status:              e(ALL_PRODUCT_STATUSES).default('available'),
  is_published:        z.boolean().default(false),
  notes:               optText,
})

export const UpdateBraceletStoneSchema = CreateBraceletStoneSchema.partial()

export type CreateBraceletStoneInput = z.infer<typeof CreateBraceletStoneSchema>
export type UpdateBraceletStoneInput = z.infer<typeof UpdateBraceletStoneSchema>
