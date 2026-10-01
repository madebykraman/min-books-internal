import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  const {data,error}=await supabase.from("projects").select("id,name,code,description,status,start_date,end_date,client_id,clients(name,company),created_at,updated_at").eq("workspace_id",workspaceId).order("updated_at",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data:data??[]});
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON body"},{status:400})}
  const workspaceId=typeof body.workspaceId==="string"?body.workspaceId.trim():"";
  const name=typeof body.name==="string"?body.name.trim():"";
  if(!workspaceId||!name)return NextResponse.json({error:"Workspace and project name are required"},{status:400});
  if(name.length>160)return NextResponse.json({error:"Project name is too long"},{status:400});
  const status=["ACTIVE","ON_HOLD","COMPLETED","ARCHIVED"].includes(String(body.status))?String(body.status):"ACTIVE";
  const {data,error}=await supabase.from("projects").insert({
    workspace_id:workspaceId,name,code:typeof body.code==="string"&&body.code.trim()?body.code.trim():null,
    description:typeof body.description==="string"&&body.description.trim()?body.description.trim():null,
    client_id:typeof body.clientId==="string"&&body.clientId.trim()?body.clientId.trim():null,
    status,start_date:typeof body.startDate==="string"&&body.startDate?body.startDate:null,
    end_date:typeof body.endDate==="string"&&body.endDate?body.endDate:null,created_by:user.id
  }).select("id,name,code,description,status,start_date,end_date,client_id,clients(name,company),created_at,updated_at").single();
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to create project"},{status:400});
  return NextResponse.json({data},{status:201});
}