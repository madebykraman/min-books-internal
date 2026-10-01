-- FinBooksOS deep financial operations layer
-- Payments are immutable financial facts; allocations reconcile them to documents.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete restrict,
  payment_date date not null default current_date,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'INR',
  method text not null default 'BANK_TRANSFER',
  reference text,
  notes text,
  status text not null default 'CONFIRMED' check (status in ('PENDING','CONFIRMED','VOID')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_workspace_date_idx on public.payments(workspace_id,payment_date desc);
create index if not exists payments_client_idx on public.payments(client_id);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  created_at timestamptz not null default now(),
  unique(payment_id,document_id)
);
create index if not exists payment_allocations_document_idx on public.payment_allocations(document_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  expense_date date not null default current_date,
  vendor text,
  category text not null default 'General',
  description text,
  amount_minor bigint not null check (amount_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  currency text not null default 'INR',
  payment_method text,
  reference text,
  notes text,
  status text not null default 'RECORDED' check (status in ('RECORDED','REIMBURSED','VOID')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expenses_workspace_date_idx on public.expenses(workspace_id,expense_date desc);

create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.expenses enable row level security;

create policy "members can access payments" on public.payments for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy "members can access payment allocations" on public.payment_allocations for all to authenticated
using (exists(select 1 from public.payments p where p.id=payment_id and public.is_workspace_member(p.workspace_id)))
with check (exists(select 1 from public.payments p where p.id=payment_id and public.is_workspace_member(p.workspace_id)));

create policy "members can access expenses" on public.expenses for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select,insert,update,delete on public.payments,public.payment_allocations,public.expenses to authenticated;

create or replace function public.record_invoice_payment(
  target_document uuid,
  payment_amount_minor bigint,
  payment_date_value date,
  payment_method_value text,
  payment_reference text default null,
  payment_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  d public.documents;
  p public.payments;
  allocated bigint;
  total_minor bigint;
  next_status public.document_status;
begin
  if payment_amount_minor <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select * into d from public.documents where id=target_document for update;
  if d.id is null then raise exception 'Document not found'; end if;
  if not public.is_workspace_member(d.workspace_id) then raise exception 'Forbidden'; end if;
  if d.type <> 'INVOICE' then raise exception 'Payments can only be recorded against invoices'; end if;
  if d.status in ('DRAFT','CANCELLED','VOID') then raise exception 'Invoice is not collectible in its current state'; end if;

  total_minor := coalesce((d.draft_payload->'totals'->>'totalMinor')::bigint,0);
  select coalesce(sum(pa.amount_minor),0) into allocated
  from public.payment_allocations pa
  where pa.document_id=d.id;

  if payment_amount_minor > greatest(total_minor-allocated,0) then
    raise exception 'Payment exceeds the remaining invoice balance';
  end if;

  insert into public.payments(workspace_id,client_id,payment_date,amount_minor,currency,method,reference,notes,status,created_by)
  values(d.workspace_id,d.client_id,payment_date_value,payment_amount_minor,d.currency,coalesce(nullif(payment_method_value,''),'BANK_TRANSFER'),payment_reference,payment_notes,'CONFIRMED',(select auth.uid()))
  returning * into p;

  insert into public.payment_allocations(payment_id,document_id,amount_minor)
  values(p.id,d.id,payment_amount_minor);

  allocated := allocated + payment_amount_minor;
  next_status := case
    when allocated >= total_minor then 'PAID'::public.document_status
    when allocated > 0 then 'PARTIALLY_PAID'::public.document_status
    else d.status
  end;

  update public.documents set status=next_status where id=d.id;

  insert into public.document_events(workspace_id,document_id,event_type,actor_user_id,metadata)
  values(d.workspace_id,d.id,'PAYMENT_RECORDED',(select auth.uid()),jsonb_build_object('paymentId',p.id,'amountMinor',payment_amount_minor,'status',next_status));

  insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,after_state)
  values(d.workspace_id,(select auth.uid()),'payment',p.id,'RECORDED',jsonb_build_object('documentId',d.id,'amountMinor',payment_amount_minor,'status',next_status));

  return jsonb_build_object('payment',to_jsonb(p),'status',next_status,'allocatedMinor',allocated,'remainingMinor',greatest(total_minor-allocated,0));
end $$;

grant execute on function public.record_invoice_payment(uuid,bigint,date,text,text,text) to authenticated;
