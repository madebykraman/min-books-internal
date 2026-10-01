import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  const {data:project,error}=await supabase.from("projects").select("id,name,code,description,status,start_date,end_date,client_id,clients(id,name,company,email),created_at,updated_at").eq("id",id).maybeSingle();
  if(error||!project)return NextResponse.json({error:error?.message||"Project not found"},{status:404});
  const {data:documents,error:documentsError}=await supabase.from("documents").select("id,project_id,client_id,document_number,type,status,issue_date,due_date,currency,draft_payload,updated_at").eq("project_id",id).order("updated_at",{ascending:false});
  if(documentsError)return NextResponse.json({error:documentsError.message},{status:400});
  return NextResponse.json({data:{project,documents:documents??[]}});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await params;
  let body:Record<string,unknown>;try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON body"},{status:400})}
  const updates:Record<string,unknown>={};
  for(const key of ["name","code","description","client_id","start_date","end_date","status"]){
    if(key in body)updates[key]=body[key]===null?"":body[key];
  }
  if(typeof updates.name==="string"){updates.name=updates.name.trim();if(!updates.name)return NextResponse.json({error:"Project name is required"},{status:400})}
  if(typeof updates.status==="string"&&!["ACTIVE","ON_HOLD","COMPLETED","ARCHIVED"].includes(updates.status))return NextResponse.json({error:"Invalid project status"},{status:400});
  const {data,error}=await supabase.from("projects").update(updates).eq("id",id).select("id,name,code,description,status,start_date,end_date,client_id,clients(id,name,company,email),created_at,updated_at").single();
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to update project"},{status:400});
  return NextResponse.json({data});
}