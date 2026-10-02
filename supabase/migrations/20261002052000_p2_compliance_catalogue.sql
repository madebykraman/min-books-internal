-- P2 compliance catalogue: keep regulatory applicability explicit and versionable.
alter table public.gst_profiles
  add column if not exists annual_turnover_minor bigint check (annual_turnover_minor >= 0),
  add column if not exists e_invoice_applicability text not null default 'REVIEW'
    check (e_invoice_applicability in ('REQUIRED','NOT_REQUIRED','REVIEW')),
  add column if not exists e_way_bill_applicability text not null default 'REVIEW'
    check (e_way_bill_applicability in ('REQUIRED','NOT_REQUIRED','REVIEW'));

create table if not exists public.compliance_catalogue (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  jurisdiction text not null default 'IN-GST',
  title text not null,
  requirement text not null,
  source_url text,
  effective_from date,
  effective_to date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.compliance_catalogue(code,title,requirement,source_url,effective_from)
values
('GST_POS','Place of supply','Seller state and place of supply drive intra-state vs inter-state treatment.','https://tutorial.gst.gov.in/userguide/returns/Creation_of_Outward_Supplies_Return_in_GSTR-1.htm','2026-01-01'),
('GST_HSN','HSN/SAC reporting','Outward supply reporting requires HSN/SAC data; exact digit requirements depend on the applicable reporting phase/profile.','https://tutorial.gst.gov.in/downloads/news/updated_advisory_on_hsn_validation_21.01.25.pdf','2025-02-01'),
('E_INVOICE','E-invoice applicability','Applicability must be evaluated against the current notified taxpayer/category rules and effective reporting timelines.','https://einvoice6.gst.gov.in/content/einvoice-mandate/','2025-04-01'),
('E_WAY_BILL','E-way bill applicability','E-way bill applicability depends on movement, consignment value and applicable exemptions/state rules; provider payload must include required transport data.','https://docs.ewaybillgst.gov.in/html/ewb_qna.html','2026-01-01')
on conflict(code) do update set title=excluded.title,requirement=excluded.requirement,source_url=excluded.source_url,effective_from=excluded.effective_from,updated_at=now();

alter table public.compliance_catalogue enable row level security;
create policy "authenticated users can read compliance catalogue" on public.compliance_catalogue for select to authenticated using (true);
create trigger compliance_catalogue_updated_at before update on public.compliance_catalogue for each row execute function public.set_updated_at();
grant select on public.compliance_catalogue to authenticated;
