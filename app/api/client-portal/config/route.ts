import {NextResponse} from "next/server";
import {randomBytes,scryptSync} from "node:crypto";
import {createClient} from "../../../../lib/supabase/server";

function hashPassword(password:string){const salt=randomBytes(16);const hash=scryptSync(password,salt,64);return "scrypt$"+salt.toString("hex")+"$"+hash.toString("hex")}
function slugify(v:string){return v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"client"}

export async function PUT(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const body=await request.json();if(!body.clientId)return NextResponse.json({error:"Client is required"},{status:400});
 const {data:client}=await supabase.from("clients").select("id,name,workspace_id,portal_password_hash,portal_slug").eq("id",body.clientId).maybeSingle();
 if(!client)return NextResponse.json({error:"Client not found"},{status:404});
 let slug=String(body.slug||client.portal_slug||slugify(client.name)+"-"+client.id.slice(0,6));
 const patch:any={portal_enabled:Boolean(body.enabled),portal_slug:slug,allow_profile_edit:Boolean(body.allowProfileEdit),show_projects:body.showProjects!==false,show_documents:body.showDocuments!==false};
 if(body.password)patch.portal_password_hash=hashPassword(String(body.password));
 if(body.enabled&&!body.password&&!client.portal_password_hash)return NextResponse.json({error:"Set a portal password before enabling access."},{status:400});
 if(body.password)patch.portal_password_set_at=new Date().toISOString();
 const {data,error}=await supabase.from("clients").update(patch).eq("id",client.id).select("id,name,portal_enabled,portal_slug,allow_profile_edit,show_projects,show_documents").single();
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({data});
}
