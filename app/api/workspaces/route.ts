import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

function slugify(v:string){return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"workspace"}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Sign in required"},{status:401});
  const body=await request.json();
  if(!body.name?.trim())return NextResponse.json({error:"Business name is required"},{status:400});
  let slug=slugify(body.name);
  const insert=async()=>supabase.from("workspaces").insert({owner_user_id:user.id,name:body.name.trim(),slug}).select().single();
  let {data:workspace,error}=await insert();
  if(error?.code==="23505"){slug=slug+"-"+crypto.randomUUID().slice(0,6);({data:workspace,error}=await insert())}
  if(error||!workspace)return NextResponse.json({error:error?.message||"Unable to create workspace"},{status:400});

  const org=await supabase.from("organizations").insert({
    owner_user_id:user.id,
    name:body.name.trim(),
    legal_name:body.legalName?.trim()||body.name.trim(),
    email:body.email||null,
    entity_type:body.entityType||"business",
  }).select().single();

  if(org.error||!org.data)return NextResponse.json({error:org.error?.message||"Unable to create organisation"},{status:400});

  const link=await supabase.from("workspaces").update({organization_id:org.data.id}).eq("id",workspace.id);
  if(link.error)return NextResponse.json({error:link.error.message},{status:400});

  const member=await supabase.from("workspace_members").insert({workspace_id:workspace.id,user_id:user.id,role:"OWNER"});
  if(member.error)return NextResponse.json({error:member.error.message},{status:400});

  const profile=await supabase.from("business_profiles").insert({
    workspace_id:workspace.id,
    legal_name:body.legalName?.trim()||workspace.name,
    display_name:body.displayName?.trim()||workspace.name,
    email:body.email||null
  }).select().single();

  if(profile.error)return NextResponse.json({error:profile.error.message},{status:400});
  return NextResponse.json({data:workspace,organization:org.data,profile:profile.data},{status:201});
}
