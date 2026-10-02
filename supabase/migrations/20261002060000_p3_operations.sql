-- P3: reporting, automation, delivery, integration and portability primitives.

alter table public.reminder_runs
  add column if not exists dedupe_key text,
  add column if not exists provider_message_id text,
  add column if not exists error_message text;

create unique index if not exists reminder_runs_dedupe_idx
  on public.reminder_runs(workspace_id,dedupe_key) where dedupe_key is not null;

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'QUEUED' check (status in ('QUEUED','DELIVERED','FAILED')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists integration_events_queue_idx on public.integration_events(workspace_id,status,created_at);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  endpoint_url text not null,
  enabled boolean not null default true,
  event_types text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_workspace_idx on public.webhook_endpoints(workspace_id,enabled);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists api_keys_workspace_idx on public.api_keys(workspace_id,enabled);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('CLIENTS','EXPENSES')),
  status text not null default 'PREVIEW' check (status in ('PREVIEW','IMPORTED','FAILED')),
  source_name text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.integration_events enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.api_keys enable row level security;
alter table public.import_batches enable row level security;

create policy "members can access integration events" on public.integration_events for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access webhook endpoints" on public.webhook_endpoints for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access api keys" on public.api_keys for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access import batches" on public.import_batches for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

grant select,insert,update,delete on public.integration_events to authenticated;
grant select,insert,update,delete on public.webhook_endpoints to authenticated;
grant select,insert,update,delete on public.api_keys to authenticated;
grant select,insert,update,delete on public.import_batches to authenticated;
