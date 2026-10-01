alter table public.clients add column if not exists logo_url text;
alter table public.clients add column if not exists portal_enabled boolean not null default false;
alter table public.clients add column if not exists portal_slug text;
alter table public.clients add column if not exists portal_password_hash text;
alter table public.clients add column if not exists portal_password_set_at timestamptz;
alter table public.clients add column if not exists allow_profile_edit boolean not null default false;
alter table public.clients add column if not exists show_projects boolean not null default true;
alter table public.clients add column if not exists show_documents boolean not null default true;

create unique index if not exists clients_portal_slug_idx on public.clients(portal_slug) where portal_slug is not null;

create table if not exists public.client_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists client_portal_sessions_client_idx on public.client_portal_sessions(client_id);
create index if not exists client_portal_sessions_expiry_idx on public.client_portal_sessions(expires_at);
alter table public.client_portal_sessions enable row level security;
create policy "portal sessions are server managed" on public.client_portal_sessions for all to authenticated using (false) with check (false);
grant select,insert,update,delete on public.client_portal_sessions to service_role;
