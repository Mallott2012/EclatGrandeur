import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffUser } from '@/lib/staff-shared'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnquiryStatus = 'new' | 'contacted' | 'closed'

export interface EnquiryRecord {
  id:                    string
  enquiry_number:        string
  customer_name:         string
  customer_email:        string
  customer_phone:        string | null
  subject:               string | null
  message:               string
  ring_setting_id:       string | null
  diamond_id:            string | null
  jewellery_product_id:  string | null
  metal:                 string | null
  status:                EnquiryStatus
  assigned_to:           string | null
  notes:                 string | null
  /** Full ConfiguredEngagementRing snapshot stored at enquiry time (Phase 6). */
  configuration:         Record<string, unknown> | null
  created_at:            string
  updated_at:            string
}

export interface CreateEnquiryInput {
  customer_name:         string
  customer_email:        string
  customer_phone?:       string | null
  subject?:              string | null
  message:               string
  ring_setting_id?:      string | null
  diamond_id?:           string | null
  jewellery_product_id?: string | null
  metal?:                string | null
  /** Full ConfiguredEngagementRing snapshot, stored as JSONB (Phase 6). */
  configuration?:        Record<string, unknown> | null
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listEnquiries(status?: EnquiryStatus): Promise<EnquiryRecord[]> {
  const admin = createAdminClient()
  let q = admin
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw new Error('Failed to list enquiries')
  return (data ?? []) as EnquiryRecord[]
}

export async function getEnquiry(id: string): Promise<EnquiryRecord | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('enquiries')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Failed to fetch enquiry')
  return data as EnquiryRecord | null
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createEnquiry(input: CreateEnquiryInput): Promise<EnquiryRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('enquiries')
    .insert({
      customer_name:        input.customer_name,
      customer_email:       input.customer_email,
      customer_phone:       input.customer_phone ?? null,
      subject:              input.subject ?? null,
      message:              input.message,
      ring_setting_id:      input.ring_setting_id ?? null,
      diamond_id:           input.diamond_id ?? null,
      jewellery_product_id: input.jewellery_product_id ?? null,
      metal:                input.metal ?? null,
      configuration:        input.configuration ?? null,
      status:               'new' as EnquiryStatus,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create enquiry')
  return data as EnquiryRecord
}

export async function updateEnquiryStatus(
  actor:  StaffUser,
  id:     string,
  status: EnquiryStatus,
): Promise<EnquiryRecord> {
  void actor // authorisation is checked at the action layer
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('enquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update enquiry')
  return data as EnquiryRecord
}

export async function updateEnquiryNotes(
  actor:  StaffUser,
  id:     string,
  notes:  string,
): Promise<EnquiryRecord> {
  void actor
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('enquiries')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update notes')
  return data as EnquiryRecord
}
