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
  end loop;

  insert into public.audit_events(workspace_id,actor_user_id,entity_type,entity_id,action,before_state,after_state,metadata)
  values(
    p.workspace_id,
    (select auth.uid()),
    'payment',
    p.id,
    'VOIDED',
    jsonb_build_object('status','CONFIRMED','amountMinor',p.amount_minor),
    jsonb_build_object('status','VOID','amountMinor',p.amount_minor),
    jsonb_build_object('voidReason',void_reason)
  );

  return jsonb_build_object('paymentId',p.id,'status','VOID','reason',void_reason);
end $$;

grant execute on function public.void_invoice_payment(uuid,text) to authenticated;
