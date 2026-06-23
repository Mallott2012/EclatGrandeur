import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffUser } from '@/lib/staff-shared'

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeroPlacement =
  | 'homepage'
  | 'engagement-rings'
  | 'earrings'
  | 'necklaces'
  | 'bracelets'

export interface HeroMediaRecord {
  id:           string
  placement:    HeroPlacement
  media_type:   'image' | 'video_360' | 'video' | 'certificate_pdf'
  storage_path: string
  headline:     string | null
  subheadline:  string | null
  cta_label:    string | null
  cta_href:     string | null
  is_published: boolean
  sort_order:   number
  created_by:   string | null
  updated_by:   string | null
  created_at:   string
  updated_at:   string
}

export interface CreateHeroInput {
  placement:    HeroPlacement
  media_type:   'image' | 'video_360' | 'video' | 'certificate_pdf'
  storage_path: string
  headline?:    string | null
  subheadline?: string | null
  cta_label?:   string | null
  cta_href?:    string | null
  is_published?: boolean
  sort_order?:   number
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function listHeroMedia(): Promise<HeroMediaRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('hero_media')
    .select('*')
    .order('placement', { ascending: true })
    .order('sort_order', { ascending: true })
  if (error) throw new Error('Failed to list hero media')
  return (data ?? []) as HeroMediaRecord[]
}

export async function getPublishedHero(placement: HeroPlacement): Promise<HeroMediaRecord | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('hero_media')
    .select('*')
    .eq('placement', placement)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as HeroMediaRecord | null
}

export async function createHeroMedia(
  actor: StaffUser,
  input: CreateHeroInput,
): Promise<HeroMediaRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('hero_media')
    .insert({ ...input, created_by: actor.id, updated_by: actor.id })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create hero media')
  return data as HeroMediaRecord
}

export async function updateHeroMedia(
  actor:  StaffUser,
  id:     string,
  patch:  Partial<CreateHeroInput>,
): Promise<HeroMediaRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('hero_media')
    .update({ ...patch, updated_by: actor.id })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update hero media')
  return data as HeroMediaRecord
}

export async function deleteHeroMedia(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('hero_media').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function publishHero(actor: StaffUser, id: string): Promise<void> {
  // Fetch the placement first, then publish — the DB unique index on
  // (placement WHERE is_published = TRUE) enforces only one published per placement,
  // so we unpublish any existing before publishing the new one.
  const admin = createAdminClient()
  const { data: row } = await admin
    .from('hero_media')
    .select('placement')
    .eq('id', id)
    .maybeSingle()
  if (row?.placement) {
    await admin
      .from('hero_media')
      .update({ is_published: false, updated_by: actor.id })
      .eq('placement', row.placement)
      .eq('is_published', true)
  }
  await admin
    .from('hero_media')
    .update({ is_published: true, updated_by: actor.id })
    .eq('id', id)
}

export async function unpublishHero(actor: StaffUser, id: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('hero_media')
    .update({ is_published: false, updated_by: actor.id })
    .eq('id', id)
}
