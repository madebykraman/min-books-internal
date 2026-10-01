create extension if not exists pgcrypto;

create type public.document_type as enum ('QUOTE','INVOICE','CREDIT_NOTE','RECEIPT','PURCHASE_ORDER');
create type public.document_status as enum ('DRAFT','SENT','VIEWED','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED','VOID');
create type public.workspace_role as enum ('OWNER','ADMIN','MEMBER','ACCOUNTANT','VIEWER');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique,
  base_currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  legal_name text not null,
  display_name text,
  email text,
  phone text,
  website text,
  logo_url text,
  gstin text,
  address jsonb not null default '{}'::jsonb,
  invoice_prefix text not null default 'INV',
  next_invoice_number bigint not null default 1,
  default_payment_terms_days integer not null default 15 check (default_payment_terms_days >= 0),
  default_tax_rate numeric(7,4) not null default 18 check (default_tax_rate >= 0 and default_tax_rate <= 100),
  payment_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  billing_address jsonb not null default '{}'::jsonb,
  gstin text,
  place_of_supply text,
  tax_treatment text,
  preferred_currency text not null default 'INR',
  preferred_language text not null default 'en',
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_workspace_idx on public.clients(workspace_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  unit text not null default 'unit',
  currency text not null default 'INR',
  unit_price_minor bigint not null default 0,
  tax_rate numeric(7,4) not null default 18 check (tax_rate >= 0 and tax_rate <= 100),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete restrict,
  type public.document_type not null,
  status public.document_status not null default 'DRAFT',
  document_number text not null,
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'INR',
  draft_payload jsonb not null default '{}'::jsonb,
  current_version integer not null default 1 check (current_version >= 1),
  issued_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,document_number)
);
create index documents_workspace_status_idx on public.documents(workspace_id,status);
create index documents_workspace_updated_idx on public.documents(workspace_id,updated_at desc);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  payload jsonb not null,
  snapshot jsonb not null,
  template_version text not null default 'default-v1',
  layout_version text not null default 'a4-v1',
  immutable boolean not null default false,
  issued_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id,version)
);

create table public.document_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index document_events_document_idx on public.document_events(document_id,created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_workspace_idx on public.audit_events(workspace_id,created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $
begin new.updated_at = now(); return new; end $$;

create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger business_profiles_updated_at before update on public.business_profiles for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security invoker set search_path = public as $
  select exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = (select auth.uid())
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.business_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_events enable row level security;
alter table public.audit_events enable row level security;

create policy "workspace members can read workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "owners can create workspaces" on public.workspaces for insert to authenticated with check (owner_user_id = (select auth.uid()));
create policy "owners can update workspaces" on public.workspaces for update to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()));

create policy "users can read own membership" on public.workspace_members for select to authenticated using (user_id = (select auth.uid()));
create policy "workspace owners can create memberships" on public.workspace_members for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_user_id=(select auth.uid())));
create policy "members can read business profiles" on public.business_profiles for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members can write business profiles" on public.business_profiles for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access clients" on public.clients for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access products" on public.products for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access documents" on public.documents for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can read versions" on public.document_versions for select to authenticated using (exists(select 1 from public.documents d where d.id=document_id and public.is_workspace_member(d.workspace_id)));
create policy "members can create versions" on public.document_versions for insert to authenticated with check (exists(select 1 from public.documents d where d.id=document_id and public.is_workspace_member(d.workspace_id)));
create policy "members can read document events" on public.document_events for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members can create document events" on public.document_events for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "members can read audit events" on public.audit_events for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members can create audit events" on public.audit_events for insert to authenticated with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on all tables in schema public to authenticated;

create or replace function public.issue_document(target_document uuid, issued_payload jsonb, issued_snapshot jsonb)
returns public.documents
language plpgsql
security invoker
set search_path = public
as $$
declare d public.documents;
begin
 select * into d from public.documents where id=target_document for update;
 if d.id is null then raise exception 'Document not found'; end if;
 if not public.is_workspace_member(d.workspace_id) then raise exception 'Forbidden'; end if;
 if d.status <> 'DRAFT' then raise exception 'Only draft documents can be issued'; end if;
 insert into public.document_versions(document_id,version,payload,snapshot,immutable,issued_at,created_by)
 values(d.id,d.current_version,issued_payload,issued_snapshot,true,now(),(select auth.uid()));
 update public.documents
 set status='SENT',issued_at=now()
 where id=d.id
 returning * into d;
 insert into public.document_events(workspace_id,document_id,event_type,actor_user_id,metadata)
 values(d.workspace_id,d.id,'ISSUED',(select auth.uid()),jsonb_build_object('version',d.current_version));
 insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,after_state)
 values(d.workspace_id,(select auth.uid()),'document',d.id,'ISSUED',jsonb_build_object('status','SENT','version',d.current_version));
 return d;
end $$;

alter table public.documents add column if not exists public_token text unique default encode(gen_random_bytes(18),'hex');
create index if not exists documents_public_token_idx on public.documents(public_token);
create policy "public can read published documents by token" on public.documents for select to anon using (public_token is not null and status in ('SENT','VIEWED','PARTIALLY_PAID','PAID','OVERDUE'));
create policy "public can read published document versions" on public.document_versions for select to anon using (exists(select 1 from public.documents d where d.id=document_id and d.public_token is not null and d.status in ('SENT','VIEWED','PARTIALLY_PAID','PAID','OVERDUE')));
