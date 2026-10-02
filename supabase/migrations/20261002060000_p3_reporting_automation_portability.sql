-- P3: reporting, automation and portability infrastructure.

alter table public.reminder_runs
  add column if not exists dedupe_key text;

create unique index if not exists reminder_runs_dedupe_idx
  on public.reminder_runs(workspace_id,dedupe_key)
  where dedupe_key is not null;

create table if not exists public.delivery_providers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('EMAIL','WHATSAPP','HTTP')),
  provider_key text not null,
  endpoint_url text,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,name)
);
create index if not exists delivery_providers_workspace_idx on public.delivery_providers(workspace_id,active);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','DELIVERED','FAILED')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists integration_events_queue_idx
  on public.integration_events(workspace_id,status,available_at);
create index if not exists integration_events_entity_idx
  on public.integration_events(entity_type,entity_id);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  endpoint_url text not null,
  secret_hash text,
  subscribed_events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,name)
);
create index if not exists webhook_endpoints_workspace_idx on public.webhook_endpoints(workspace_id,active);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  webhook_endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  integration_event_id uuid not null references public.integration_events(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED')),
  response_status integer,
  response_body text,
  attempt integer not null default 0,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(webhook_endpoint_id,integration_event_id)
);
create index if not exists webhook_deliveries_queue_idx on public.webhook_deliveries(status,created_at);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{"read"}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_workspace_idx on public.api_keys(workspace_id,revoked_at);

alter table public.delivery_providers enable row level security;
alter table public.integration_events enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.api_keys enable row level security;

create policy "members can access delivery providers" on public.delivery_providers for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access integration events" on public.integration_events for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access webhook endpoints" on public.webhook_endpoints for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access webhook deliveries" on public.webhook_deliveries for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access api keys" on public.api_keys for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create trigger delivery_providers_updated_at before update on public.delivery_providers for each row execute function public.set_updated_at();
create trigger webhook_endpoints_updated_at before update on public.webhook_endpoints for each row execute function public.set_updated_at();

grant select,insert,update,delete on public.delivery_providers,public.integration_events,public.webhook_endpoints,public.webhook_deliveries,public.api_keys to authenticated;

create or replace function public.enqueue_integration_event(
  target_workspace uuid,
  target_event_type text,
  target_entity_type text,
  target_entity_id uuid,
  target_payload jsonb
) returns public.integration_events
language plpgsql security invoker set search_path=public as $$
declare e public.integration_events;
begin
  if not public.is_workspace_member(target_workspace) then raise exception 'Forbidden'; end if;
  insert into public.integration_events(workspace_id,event_type,entity_type,entity_id,payload)
  values(target_workspace,target_event_type,target_entity_type,target_entity_id,coalesce(target_payload,'{}'::jsonb))
  returning * into e;
  return e;
end $$;

grant execute on function public.enqueue_integration_event(uuid,text,text,uuid,jsonb) to authenticated;
