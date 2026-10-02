-- P2 hardening: seed a workspace tax-rule catalogue and enforce workspace/document consistency.
create or replace function public.seed_default_gst_rules()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.gst_tax_rules(workspace_id,name,code,tax_rate,active)
  values
    (new.workspace_id,'Zero rate','GST0',0,true),
    (new.workspace_id,'GST 5%','GST5',5,true),
    (new.workspace_id,'GST 12%','GST12',12,true),
    (new.workspace_id,'GST 18%','GST18',18,true),
    (new.workspace_id,'GST 28%','GST28',28,true)
  on conflict(workspace_id,code) do nothing;
  return new;
end $$;

drop trigger if exists seed_default_gst_rules on public.gst_profiles;
create trigger seed_default_gst_rules after insert on public.gst_profiles
for each row execute function public.seed_default_gst_rules();

drop policy if exists "members can access document tax details" on public.document_tax_details;
create policy "members can access document tax details" on public.document_tax_details
for all to authenticated
using (public.is_workspace_member(workspace_id) and exists(select 1 from public.documents d where d.id=document_id and d.workspace_id=workspace_id))
with check (public.is_workspace_member(workspace_id) and exists(select 1 from public.documents d where d.id=document_id and d.workspace_id=workspace_id));

drop policy if exists "members can access compliance submissions" on public.compliance_submissions;
create policy "members can access compliance submissions" on public.compliance_submissions
for all to authenticated
using (public.is_workspace_member(workspace_id) and exists(select 1 from public.documents d where d.id=document_id and d.workspace_id=workspace_id))
with check (public.is_workspace_member(workspace_id) and exists(select 1 from public.documents d where d.id=document_id and d.workspace_id=workspace_id));
