import {createClient} from "../supabase/server";

export async function getDocuments(workspaceId:string){
  const supabase=await createClient();
  const {data,error}=await supabase
    .from("documents")
    .select("id,document_number,type,status,issue_date,due_date,currency,current_version,updated_at,draft_payload,clients(name,email)")
    .eq("workspace_id",workspaceId)
    .order("updated_at",{ascending:false});
  if(error) throw new Error(error.message);
  return data??[];
}

export async function getDocument(id:string){
  const supabase=await createClient();
  const {data,error}=await supabase
    .from("documents")
    .select("*,clients(*),document_events(*),document_versions(*)")
    .eq("id",id)
    .single();
  if(error) throw new Error(error.message);
  return data;
}

export async function saveDraft(input:{id?:string;workspaceId:string;clientId:string|null;documentNumber:string;issueDate:string;dueDate:string|null;currency:string;payload:Record<string,unknown>;actorUserId:string}){
  const supabase=await createClient();
  if(input.id){
    const {data,error}=await supabase
      .from("documents")
      .update({client_id:input.clientId,due_date:input.dueDate,draft_payload:input.payload,currency:input.currency})
      .eq("id",input.id).eq("workspace_id",input.workspaceId).select().single();
    if(error||!data) throw new Error(error?.message||"Unable to update draft");
    await supabase.from("document_events").insert({workspace_id:input.workspaceId,document_id:input.id,event_type:"DRAFT_SAVED",actor_user_id:input.actorUserId,metadata:{source:"editor"}});
    return data;
  }
  const {data,error}=await supabase
    .from("documents")
    .insert({workspace_id:input.workspaceId,client_id:input.clientId,type:"INVOICE",status:"DRAFT",document_number:input.documentNumber,issue_date:input.issueDate,due_date:input.dueDate,currency:input.currency,draft_payload:input.payload,created_by:input.actorUserId})
    .select().single();
  if(error||!data) throw new Error(error?.message||"Unable to create draft");
  await supabase.from("document_events").insert({workspace_id:input.workspaceId,document_id:data.id,event_type:"DRAFT_CREATED",actor_user_id:input.actorUserId,metadata:{source:"editor"}});
  return data;
}
