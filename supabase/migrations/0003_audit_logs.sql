-- =============================================================================
-- Éclat Grandeur — Phase 0 migration 0003: audit_logs
-- =============================================================================
-- Append-only audit trail. There are NO insert/select policies for the anon or
-- authenticated roles, so logs can only be written and read through trusted
-- server-side code using the service-role key (which bypasses RLS). RLS is
-- still enabled so that the anon/authenticated keys can never touch the table.
-- =============================================================================

create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users (id) on delete set null,
  action         text not null,
  entity_type    text,
  entity_id      uuid,
  metadata       jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- RLS enabled with NO policies => fully locked for anon & authenticated.
-- Only the service-role key (server-only) can read or insert.
alter table public.audit_logs enable row level security;

-- Defensive: ensure no implicit grants exist for client roles.
revoke all on public.audit_logs from anon, authenticated;
