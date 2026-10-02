-- P2: India-ready GST/compliance foundation.
-- Compliance data is explicit and provider-neutral. Eligibility thresholds are intentionally not hard-coded.

create table if not exists public.gst_state_codes (
  code text primary key,
  name text not null,
  active boolean not null default true
);

insert into public.gst_state_codes(code,name) values
('01','Jammu and Kashmir'),('02','Himachal Pradesh'),('03','Punjab'),('04','Chandigarh'),
('05','Uttarakhand'),('06','Haryana'),('07','Delhi'),('08','Rajasthan'),
('09','Uttar Pradesh'),('10','Bihar'),('11','Sikkim'),('12','Arunachal Pradesh'),
('13','Nagaland'),('14','Manipur'),('15','Mizoram'),('16','Tripura'),
('17','Meghalaya'),('18','Assam'),('19','West Bengal'),('20','Jharkhand'),
('21','Odisha'),('22','Chhattisgarh'),('23','Madhya Pradesh'),('24','Gujarat'),
('25','Daman and Diu'),('26','Dadra and Nagar Haveli and Daman and Diu'),('27','Maharashtra'),
('28','Andhra Pradesh'),('29','Karnataka'),('30','Goa'),('31','Lakshadweep'),
('32','Kerala'),('33','Tamil Nadu'),('34','Puducherry'),('35','Andaman and Nicobar Islands'),
('36','Telangana'),('37','Andhra Pradesh (new)'),('38','Ladakh'),('97','Other Territory')
on conflict(code) do update set name=excluded.name;

create table if not exists public.gst_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  registration_type text not null default 'REGULAR'
    check (registration_type in ('REGULAR','COMPOSITION','UNREGISTERED','SEZ')),
  gstin text,
  legal_name text,
  state_code text references public.gst_state_codes(code),
  state_name text,
  default_place_of_supply text references public.gst_state_codes(code),
  tax_inclusive_default boolean not null default false,
  reverse_charge_default boolean not null default false,
  e_invoice_enabled boolean not null default false,
  e_way_bill_enabled boolean not null default false,
  e_invoice_provider text,
  e_way_bill_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gst_tax_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  code text not null,
  hsn_sac text,
  description text,
  tax_rate numeric(7,4) not null check (tax_rate >= 0 and tax_rate <= 100),
  active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,code)
);

create table if not exists public.document_tax_details (
  document_id uuid primary key references public.documents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  seller_state_code text references public.gst_state_codes(code),
  place_of_supply_state_code text references public.gst_state_codes(code),
  supply_type text not null default 'INTRA_STATE'
    check (supply_type in ('INTRA_STATE','INTER_STATE','EXPORT','SEZ')),
  tax_mode text not null default 'EXCLUSIVE'
    check (tax_mode in ('EXCLUSIVE','INCLUSIVE')),
  reverse_charge boolean not null default false,
  taxable_value_minor bigint not null default 0,
  cgst_minor bigint not null default 0,
  sgst_minor bigint not null default 0,
  igst_minor bigint not null default 0,
  cess_minor bigint not null default 0,
  compliance_status text not null default 'PENDING'
    check (compliance_status in ('PENDING','VALID','WARNING','FAILED','NOT_APPLICABLE')),
  warnings jsonb not null default '[]'::jsonb,
  validation_version text not null default 'gst-p2-v1',
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  provider text,
  document_type text not null check (document_type in ('E_INVOICE','E_WAY_BILL')),
  status text not null default 'NOT_SUBMITTED'
    check (status in ('NOT_SUBMITTED','QUEUED','SUBMITTED','ACCEPTED','REJECTED','CANCELLED')),
  external_id text,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gst_tax_rules_workspace_idx on public.gst_tax_rules(workspace_id,active,code);
create index if not exists document_tax_details_workspace_idx on public.document_tax_details(workspace_id,compliance_status);
create index if not exists compliance_submissions_document_idx on public.compliance_submissions(document_id,created_at desc);

alter table public.gst_profiles enable row level security;
alter table public.gst_tax_rules enable row level security;
alter table public.document_tax_details enable row level security;
alter table public.compliance_submissions enable row level security;
alter table public.gst_state_codes enable row level security;

create policy "members can read GST state codes" on public.gst_state_codes for select to authenticated using (true);
create policy "members can access GST profiles" on public.gst_profiles for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access GST tax rules" on public.gst_tax_rules for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access document tax details" on public.document_tax_details for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access compliance submissions" on public.compliance_submissions for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create trigger gst_profiles_updated_at before update on public.gst_profiles for each row execute function public.set_updated_at();
create trigger gst_tax_rules_updated_at before update on public.gst_tax_rules for each row execute function public.set_updated_at();
create trigger document_tax_details_updated_at before update on public.document_tax_details for each row execute function public.set_updated_at();

grant select on public.gst_state_codes to authenticated;
grant select,insert,update,delete on public.gst_profiles to authenticated;
grant select,insert,update,delete on public.gst_tax_rules to authenticated;
grant select,insert,update,delete on public.document_tax_details to authenticated;
grant select,insert,update,delete on public.compliance_submissions to authenticated;
