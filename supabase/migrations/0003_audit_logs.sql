-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_audit_logs.sql
-- Append-only audit trail. Written exclusively by server-side service-role
-- operations — no browser client or authenticated user can write directly.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id              uuid        primary key default gen_random_uuid(),
  actor_user_id   uuid        references auth.users(id) on delete set null,
  action          text        not null,
  entity_type     text,
  entity_id       uuid,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only audit trail. Written only by the service-role server client. '
  'No RLS read or write policy is granted to authenticated users or anon.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_audit_logs_actor      on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_entity     on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- RLS is enabled but NO policies are granted to authenticated users or anon.
-- All reads and writes must go through the service-role admin client
-- (src/lib/supabase/admin.ts), which bypasses RLS entirely.

alter table public.audit_logs enable row level security;

-- Intentionally no SELECT, INSERT, UPDATE, or DELETE policies for authenticated
-- or anon roles. Only the service-role key (used server-side only) can access
-- this table.
