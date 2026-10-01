-- P1: project continuity layer.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  code text,
  description text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','ON_HOLD','COMPLETED','ARCHIVED')),
  start_date date,
  end_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_workspace_idx on public.projects(workspace_id,updated_at desc);
create index if not exists projects_client_idx on public.projects(client_id);
alter table public.documents add column if not exists project_id uuid references public.projects(id) on delete set null;
create index if not exists documents_project_idx on public.documents(project_id);

alter table public.projects enable row level security;
create policy "members can access projects" on public.projects for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
grant select,insert,update,delete on public.projects to authenticated;
