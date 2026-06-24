'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import {
  createStyle,
  updateStyle,
  deleteStyle,
  reorderStyles,
  listAllStyles,
  type StyleCategory,
  type StyleInput,
} from '@/lib/catalog/service'

export { listAllStyles }

const CATEGORY_PATHS: Record<StyleCategory, { public: string; admin: string }> = {
  'engagement-rings': { public: '/engagement-rings', admin: '/admin/rings' },
  necklaces:          { public: '/necklaces',         admin: '/admin/necklaces' },
  earrings:           { public: '/earrings',          admin: '/admin/earrings' },
  bracelets:          { public: '/bracelets',         admin: '/admin/bracelets' },
}

function revalidateCategory(category: StyleCategory) {
  const paths = CATEGORY_PATHS[category]
  if (paths) {
    revalidatePath(paths.public)
    revalidatePath(paths.admin)
  }
}

/** Build a url-safe slug from a label, guaranteeing uniqueness within a category. */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `style-${Date.now()}`
}

export async function saveStyleAction(payload: {
  id?:         string
  category:    StyleCategory
  label:       string
  image_url:   string | null
  is_visible:  boolean
}) {
  const user = await requireStaffRole([])

  const input: StyleInput = {
    category:   payload.category,
    slug:       slugify(payload.label),
    label:      payload.label.trim(),
    image_url:  payload.image_url?.trim() || null,
    is_visible: payload.is_visible,
  }

  const record = payload.id
    ? await updateStyle(user, payload.id, {
        label:      input.label,
        image_url:  input.image_url,
        is_visible: input.is_visible,
      })
    : await createStyle(user, input)

  revalidateCategory(payload.category)
  return record
}

export async function deleteStyleAction(category: StyleCategory, id: string) {
  await requireStaffRole([])
  await deleteStyle(id)
  revalidateCategory(category)
}

export async function reorderStylesAction(category: StyleCategory, orderedIds: string[]) {
  const user = await requireStaffRole([])
  await reorderStyles(user, category, orderedIds)
  revalidateCategory(category)
}
