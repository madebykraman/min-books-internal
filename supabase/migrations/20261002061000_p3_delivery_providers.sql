create table if not exists public.delivery_providers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  channel text not null default 'EMAIL',
  provider_key text not null,
  endpoint_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists delivery_providers_workspace_idx on public.delivery_providers(workspace_id,active);
alter table public.delivery_providers enable row level security;
create policy "members can access delivery providers" on public.delivery_providers for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
grant select,insert,update,delete on public.delivery_providers to authenticated;
