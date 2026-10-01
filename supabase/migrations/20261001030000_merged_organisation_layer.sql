-- Unified organisation layer for the merged finance workspace.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  legal_name text,
  entity_type text not null default 'business',
  status text not null default 'active',
  email text,
  phone text,
  address jsonb not null default '{}'::jsonb,
  pan text,
  gstin text,
  logo_url text,
  accent_hex text not null default '#8b5cf6',
  bank_name text,
  account_number text,
  branch_name text,
  branch_code text,
  ifsc_code text,
  payee_name text,
  invoice_prefix text not null default 'INV',
  next_invoice_number bigint not null default 1,
  invoice_template_key text not null default 'legacy-a4',
  invoice_footer_line_1 text,
  invoice_footer_line_2 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces add column if not exists organization_id uuid;

insert into public.organizations (owner_user_id,name,legal_name,email)
select w.owner_user_id,w.name,w.name,b.email
from public.workspaces w
left join public.business_profiles b on b.workspace_id=w.id
where not exists (select 1 from public.organizations o where o.owner_user_id=w.owner_user_id and o.name=w.name);

update public.workspaces w
set organization_id=o.id
from public.organizations o
where w.organization_id is null
  and o.owner_user_id=w.owner_user_id
  and o.name=w.name;

create index if not exists workspaces_organization_idx on public.workspaces(organization_id);

alter table public.organizations enable row level security;

create policy "organization members can read organizations"
on public.organizations for select to authenticated
using (
  owner_user_id = (select auth.uid())
  or exists (
    select 1
    from public.workspaces w
    join public.workspace_members wm on wm.workspace_id=w.id
    where w.organization_id=organizations.id
      and wm.user_id=(select auth.uid())
  )
);

create policy "organization owners can manage organizations"
on public.organizations for all to authenticated
using (owner_user_id=(select auth.uid()))
with check (owner_user_id=(select auth.uid()));

grant select,insert,update,delete on public.organizations to authenticated;

create or replace function public.set_organization_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations
for each row execute function public.set_organization_updated_at();

-- Backfill business identity into the organisation record without mutating invoice history.
update public.organizations o
set logo_url=coalesce(o.logo_url,b.logo_url),
    gstin=coalesce(o.gstin,b.gstin),
    email=coalesce(o.email,b.email),
    phone=coalesce(o.phone,b.phone),
    invoice_prefix=coalesce(nullif(b.invoice_prefix,''),o.invoice_prefix),
    updated_at=now()
from public.workspaces w
join public.business_profiles b on b.workspace_id=w.id
where w.organization_id=o.id;
