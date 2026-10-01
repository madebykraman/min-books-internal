-- Controlled payment voiding: preserve the payment fact, void it, and recompute
-- every affected invoice from the remaining confirmed allocations.
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
security definer
set search_path = ''
as $$
declare
  d public.documents;
  p public.payments;
  allocated bigint;
  total_minor bigint;
  next_status public.document_status;
begin
  if (select auth.uid()) is null then raise exception 'Unauthorized'; end if;
  if payment_amount_minor <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select * into d from public.documents where id=target_document for update;
  if d.id is null then raise exception 'Document not found'; end if;
  if not public.is_workspace_member(d.workspace_id) then raise exception 'Forbidden'; end if;
  if d.type <> 'INVOICE' then raise exception 'Payments can only be recorded against invoices'; end if;
  if d.status in ('DRAFT','CANCELLED','VOID') then raise exception 'Invoice is not collectible in its current state'; end if;

  total_minor := coalesce((d.draft_payload->'totals'->>'totalMinor')::bigint,0);
  select coalesce(sum(pa.amount_minor),0) into allocated
  from public.payment_allocations pa
  join public.payments pp on pp.id=pa.payment_id
  where pa.document_id=d.id and pp.status='CONFIRMED';

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
    when d.due_date is not null and d.due_date < current_date then 'OVERDUE'::public.document_status
    else 'SENT'::public.document_status
  end;

  update public.documents set status=next_status where id=d.id;

  insert into public.document_events(workspace_id,document_id,event_type,actor_user_id,metadata)
  values(d.workspace_id,d.id,'PAYMENT_RECORDED',(select auth.uid()),jsonb_build_object('paymentId',p.id,'amountMinor',payment_amount_minor,'status',next_status));

  insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,after_state)
  values(d.workspace_id,(select auth.uid()),'payment',p.id,'RECORDED',jsonb_build_object('documentId',d.id,'amountMinor',payment_amount_minor,'status',next_status));

  return jsonb_build_object('payment',to_jsonb(p),'status',next_status,'allocatedMinor',allocated,'remainingMinor',greatest(total_minor-allocated,0));
end $$;

create or replace function public.void_invoice_payment(
  target_payment uuid,
  void_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments;
  pa record;
  d public.documents;
  allocated bigint;
  total_minor bigint;
  next_status public.document_status;
begin
  if (select auth.uid()) is null then raise exception 'Unauthorized'; end if;

  select * into p from public.payments where id=target_payment for update;
  if p.id is null then raise exception 'Payment not found'; end if;
  if not public.is_workspace_member(p.workspace_id) then raise exception 'Forbidden'; end if;
  if p.status <> 'CONFIRMED' then raise exception 'Only confirmed payments can be voided'; end if;

  update public.payments set status='VOID' where id=p.id;

  for pa in
    select distinct document_id
    from public.payment_allocations
    where payment_id=p.id
  loop
    select * into d from public.documents where id=pa.document_id for update;
    if d.id is null then continue; end if;

    total_minor := coalesce((d.draft_payload->'totals'->>'totalMinor')::bigint,0);
    select coalesce(sum(a.amount_minor),0) into allocated
    from public.payment_allocations a
    join public.payments pp on pp.id=a.payment_id
    where a.document_id=d.id and pp.status='CONFIRMED';

    next_status := case
      when allocated >= total_minor and total_minor > 0 then 'PAID'::public.document_status
      when allocated > 0 then 'PARTIALLY_PAID'::public.document_status
      when d.due_date is not null and d.due_date < current_date then 'OVERDUE'::public.document_status
      else 'SENT'::public.document_status
    end;

    update public.documents set status=next_status where id=d.id;

    insert into public.document_events(workspace_id,document_id,event_type,actor_user_id,metadata)
    values(p.workspace_id,d.id,'PAYMENT_VOIDED',(select auth.uid()),jsonb_build_object('paymentId',p.id,'voidReason',void_reason,'status',next_status,'remainingAllocatedMinor',allocated));

    insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,before_state,after_state,metadata)
    values(p.workspace_id,(select auth.uid()),'payment',p.id,'VOIDED',jsonb_build_object('status','CONFIRMED','documentId',d.id),jsonb_build_object('status','VOID','documentId',d.id),jsonb_build_object('voidReason',void_reason,'recomputedDocumentStatus',next_status));
  end loop;

  if not exists(select 1 from public.payment_allocations where payment_id=p.id) then
    insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,before_state,after_state,metadata)
    values(p.workspace_id,(select auth.uid()),'payment',p.id,'VOIDED',jsonb_build_object('status','CONFIRMED'),jsonb_build_object('status','VOID'),jsonb_build_object('voidReason',void_reason));
  end if;

  return jsonb_build_object('paymentId',p.id,'status','VOID','reason',void_reason);
end $$;

revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.payment_allocations from authenticated;
grant select on public.payments,public.payment_allocations to authenticated;
grant execute on function public.record_invoice_payment(uuid,bigint,date,text,text,text) to authenticated;
grant execute on function public.void_invoice_payment(uuid,text) to authenticated;
