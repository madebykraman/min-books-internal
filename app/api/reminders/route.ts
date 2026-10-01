import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "Workspace is required" }, { status: 400 });
  const { data, error } = await supabase.from("reminder_rules").select("*").eq("workspace_id", workspaceId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.workspaceId || !body.name) return NextResponse.json({ error: "Workspace and name are required" }, { status: 400 });
  const { data, error } = await supabase.from("reminder_rules").insert({
    workspace_id: body.workspaceId,
    name: body.name,
    trigger_type: body.triggerType || "BEFORE_DUE",
    days_offset: Number(body.daysOffset ?? 3),
    channel: body.channel || "EMAIL",
    enabled: body.enabled !== false,
    template: body.template || "Payment reminder for {{invoice_number}} — {{amount_due}} is due on {{due_date}}."
  }).select().single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Unable to create reminder rule" }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}