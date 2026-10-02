-- Turn existing audit-worthy document events into the P3 integration outbox.
create or replace function public.capture_document_integration_event()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.integration_events(workspace_id,event_type,entity_type,entity_id,payload)
  values(new.workspace_id,new.event_type,'document',new.document_id,jsonb_build_object(
    'eventId',new.id,'documentId',new.document_id,'actorUserId',new.actor_user_id,'metadata',new.metadata,'createdAt',new.created_at
  ));
  return new;
end $$;

drop trigger if exists document_events_to_integration on public.document_events;
create trigger document_events_to_integration
after insert on public.document_events
for each row execute function public.capture_document_integration_event();

create or replace function public.capture_payment_integration_event()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.integration_events(workspace_id,event_type,entity_type,entity_id,payload)
  values(new.workspace_id,'PAYMENT_RECORDED','payment',new.id,jsonb_build_object(
    'paymentId',new.id,'clientId',new.client_id,'amountMinor',new.amount_minor,'currency',new.currency,'status',new.status,'paymentDate',new.payment_date
  ));
  return new;
end $$;

drop trigger if exists payments_to_integration on public.payments;
create trigger payments_to_integration
after insert on public.payments
for each row execute function public.capture_payment_integration_event();
