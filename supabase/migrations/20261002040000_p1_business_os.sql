-- P1: business OS continuity — credit notes, recurring schedules, reminders, delivery state and auditable applications.

alter table public.documents
  add column if not exists delivery_status text not null default 'NOT_SENT'
    check (delivery_status in ('NOT_SENT','QUEUED','SENT','FAILED')),
  add column if not exists delivery_sent_at timestamptz,
  add column if not exists delivery_channel text;

create index if not exists documents_delivery_idx on public.documents(workspace_id,delivery_status);

create table if not exists public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid not null references public.documents(id) on delete restrict,
  note_number text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','ISSUED','VOID')),
  currency text not null default 'INR',
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  reason text,
  payload jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,note_number)
);
create index if not exists credit_notes_workspace_idx on public.credit_notes(workspace_id,created_at desc);
create index if not exists credit_notes_invoice_idx on public.credit_notes(invoice_id);

create table if not exists public.credit_note_applications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  credit_note_id uuid not null references public.credit_notes(id) on delete cascade,
  invoice_id uuid not null references public.documents(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  applied_by uuid references auth.users(id) on delete set null,
  applied_at timestamptz not null default now()
);
create index if not exists credit_note_applications_invoice_idx on public.credit_note_applications(invoice_id);
create index if not exists credit_note_applications_note_idx on public.credit_note_applications(credit_note_id);

create table if not exists public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  frequency text not null default 'MONTHLY' check (frequency in ('WEEKLY','MONTHLY','QUARTERLY','YEARLY')),
  next_run_on date not null,
  enabled boolean not null default true,
  currency text not null default 'INR',
  due_days integer not null default 15 check (due_days between 0 and 365),
  template_payload jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recurring_invoices_workspace_idx on public.recurring_invoices(workspace_id,enabled,next_run_on);

create table if not exists public.reminder_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reminder_rule_id uuid references public.reminder_rules(id) on delete set null,
  document_id uuid not null references public.documents(id) on delete cascade,
  channel text not null,
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED','SKIPPED')),
  scheduled_for timestamptz not null default now(),
  executed_at timestamptz,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists reminder_runs_workspace_idx on public.reminder_runs(workspace_id,scheduled_for desc);
create index if not exists reminder_runs_document_idx on public.reminder_runs(document_id);

create table if not exists public.document_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  channel text not null,
  status text not null check (status in ('QUEUED','SENT','FAILED')),
  recipient text,
  provider_message_id text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists document_deliveries_document_idx on public.document_deliveries(document_id,created_at desc);

alter table public.credit_notes enable row level security;
alter table public.credit_note_applications enable row level security;
alter table public.recurring_invoices enable row level security;
alter table public.reminder_runs enable row level security;
alter table public.document_deliveries enable row level security;

create policy "members can access credit notes" on public.credit_notes for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access credit note applications" on public.credit_note_applications for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access recurring invoices" on public.recurring_invoices for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access reminder runs" on public.reminder_runs for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can access document deliveries" on public.document_deliveries for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create trigger credit_notes_updated_at before update on public.credit_notes for each row execute function public.set_updated_at();
create trigger recurring_invoices_updated_at before update on public.recurring_invoices for each row execute function public.set_updated_at();

grant select,insert,update,delete on public.credit_notes to authenticated;
grant select,insert,update,delete on public.credit_note_applications to authenticated;
grant select,insert,update,delete on public.recurring_invoices to authenticated;
grant select,insert,update,delete on public.reminder_runs to authenticated;
grant select,insert,update,delete on public.document_deliveries to authenticated;
