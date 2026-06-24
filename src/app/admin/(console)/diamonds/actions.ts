'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createDiamond } from '@/lib/diamonds/service'
import { CreateDiamondSchema, parseDiamondFormData, zodErrors } from '@/lib/diamonds/schemas'
import type { DiamondActionResult } from './types'

export async function createDiamondAction(
  _state:   DiamondActionResult,
  formData: FormData,
): Promise<DiamondActionResult> {
  const actor  = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const parsed = CreateDiamondSchema.safeParse(parseDiamondFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  let newId: string
  try {
    const diamond = await createDiamond(actor, parsed.data)
    newId = diamond.id
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'An unexpected error occurred', fieldErrors: {} }
  }

  redirect(`/admin/diamonds/${newId}`)
}
