// Plain helpers shared by the earring-stone server actions.
// NOT a 'use server' module — those may only export async functions.

import type { z } from 'zod'

export function parseEarringStoneFormData(formData: FormData) {
  return {
    earring_setting_id: formData.get('earring_setting_id') || null,
    stone_type:          formData.get('stone_type') ?? 'diamond',
    shape:               formData.get('shape') || null,
    carat:               formData.get('carat') || null,
    colour:              formData.get('colour') || null,
    colour_description:  formData.get('colour_description') || null,
    clarity:             formData.get('clarity') || null,
    clarity_description: formData.get('clarity_description') || null,
    cut_grade:           formData.get('cut_grade') || null,
    polish:              formData.get('polish') || null,
    symmetry:            formData.get('symmetry') || null,
    fluorescence:        formData.get('fluorescence') || null,
    gia_report_number:   formData.get('gia_report_number') || null,
    gia_report_date:     formData.get('gia_report_date') || null,
    gia_report_url:      formData.get('gia_report_url') || null,
    price_gbp:           formData.get('price_gbp') || null,
    status:              formData.get('status') ?? 'available',
    is_published:        formData.getAll('is_published').includes('true'),
    notes:               formData.get('notes') || null,
  }
}

export function zodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  error.errors.forEach((e) => { fieldErrors[e.path.join('.')] = e.message })
  return fieldErrors
}
