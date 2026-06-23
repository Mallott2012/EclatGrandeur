'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import {
  createHeroMedia,
  updateHeroMedia,
  deleteHeroMedia,
  publishHero,
  unpublishHero,
  type CreateHeroInput,
  type HeroPlacement,
} from '@/lib/hero/service'

export type HeroActionResult =
  | { success: false; message: string }
  | { success: true }

export async function createHeroAction(
  _state: HeroActionResult,
  formData: FormData,
): Promise<HeroActionResult> {
  const actor = await requireStaffRole(['super_admin', 'content_editor'])

  const placement    = formData.get('placement')    as HeroPlacement
  const media_type   = formData.get('media_type')   as CreateHeroInput['media_type']
  const storage_path = (formData.get('storage_path') as string)?.trim()
  const headline     = (formData.get('headline')    as string)?.trim() || null
  const subheadline  = (formData.get('subheadline') as string)?.trim() || null
  const cta_label    = (formData.get('cta_label')   as string)?.trim() || null
  const cta_href     = (formData.get('cta_href')    as string)?.trim() || null
  const sort_order   = parseInt(formData.get('sort_order') as string, 10) || 0

  if (!placement || !media_type || !storage_path) {
    return { success: false, message: 'Placement, media type and storage path are required.' }
  }

  try {
    await createHeroMedia(actor, {
      placement, media_type, storage_path,
      headline, subheadline, cta_label, cta_href,
      is_published: false, sort_order,
    })
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to create hero media.' }
  }

  redirect('/admin/hero')
}

export async function updateHeroAction(
  id:       string,
  _state:   HeroActionResult,
  formData: FormData,
): Promise<HeroActionResult> {
  const actor = await requireStaffRole(['super_admin', 'content_editor'])
  const patch: Partial<CreateHeroInput> = {
    headline:     (formData.get('headline')    as string)?.trim() || null,
    subheadline:  (formData.get('subheadline') as string)?.trim() || null,
    cta_label:    (formData.get('cta_label')   as string)?.trim() || null,
    cta_href:     (formData.get('cta_href')    as string)?.trim() || null,
    storage_path: (formData.get('storage_path') as string)?.trim(),
    sort_order:   parseInt(formData.get('sort_order') as string, 10) || 0,
  }
  try {
    await updateHeroMedia(actor, id, patch)
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to update.' }
  }
  revalidatePath('/admin/hero')
  return { success: true }
}

export async function publishHeroAction(id: string): Promise<void> {
  const actor = await requireStaffRole(['super_admin', 'content_editor'])
  await publishHero(actor, id)
  revalidatePath('/admin/hero')
  revalidatePath('/')
  revalidatePath('/earrings')
  revalidatePath('/necklaces')
  revalidatePath('/bracelets')
  revalidatePath('/engagement-rings')
}

export async function unpublishHeroAction(id: string): Promise<void> {
  const actor = await requireStaffRole(['super_admin', 'content_editor'])
  await unpublishHero(actor, id)
  revalidatePath('/admin/hero')
}

export async function deleteHeroAction(id: string): Promise<void> {
  await requireStaffRole(['super_admin', 'content_editor'])
  await deleteHeroMedia(id)
  revalidatePath('/admin/hero')
}
