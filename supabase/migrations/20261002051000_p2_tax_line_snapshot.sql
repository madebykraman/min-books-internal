-- P2 hardening: preserve line-level GST arithmetic for period reporting.
alter table public.document_tax_details
  add column if not exists line_tax jsonb not null default '[]'::jsonb;
