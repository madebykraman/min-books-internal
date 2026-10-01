create table if not exists public.reminder_rules (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null,
 trigger_type text not null default 'BEFORE_DUE',
 days_offset integer not null default 3,
 channel text not null default 'EMAIL',
 enabled boolean not null default true,
 template text not null default 'Payment reminder for {{invoice_number}} — {{amount_due}} is due on {{due_date}}.',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists reminder_rules_workspace_idx on public.reminder_rules(workspace_id);
create trigger reminder_rules_updated_at before update on public.reminder_rules for each row execute function public.set_updated_at();
alter table public.reminder_rules enable row level security;
create policy "members can access reminder rules" on public.reminder_rules for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
grant select,insert,update,delete on public.reminder_rules to authenticated;
