alter table public.reminder_runs
  add column if not exists provider_message_id text,
  add column if not exists error_message text;

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('CLIENTS','PRODUCTS')),
  status text not null default 'PREVIEW' check (status in ('PREVIEW','IMPORTED','FAILED')),
  source_name text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.import_batches enable row level security;
create policy "members can access import batches" on public.import_batches for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
grant select,insert,update,delete on public.import_batches to authenticated;
