'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import { updateEnquiryStatus, updateEnquiryNotes, type EnquiryStatus } from '@/lib/enquiries/service'

export async function setEnquiryStatusAction(id: string, status: EnquiryStatus): Promise<void> {
  const actor = await requireStaffRole(['super_admin', 'sales_adviser'])
  await updateEnquiryStatus(actor, id, status)
  revalidatePath('/admin/enquiries')
  revalidatePath(`/admin/enquiries/${id}`)
}

export async function saveEnquiryNotesAction(
  id:     string,
  _prev:  { success: boolean; message?: string },
  form:   FormData,
): Promise<{ success: boolean; message?: string }> {
  const actor = await requireStaffRole(['super_admin', 'sales_adviser'])
  const notes = (form.get('notes') as string)?.trim() ?? ''
  try {
    await updateEnquiryNotes(actor, id, notes)
    revalidatePath(`/admin/enquiries/${id}`)
    return { success: true }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to save notes.' }
  }
}
