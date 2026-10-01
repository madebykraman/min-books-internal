import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  const {data,error}=await supabase.from("products").select("*").eq("workspace_id",workspaceId).is("archived_at",null).order("name");
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data:data??[]});
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  if(!body.workspaceId||!body.name)return NextResponse.json({error:"Workspace and product name are required"},{status:400});
  const {data,error}=await supabase.from("products").insert({
    workspace_id:body.workspaceId,name:body.name,description:body.description||null,unit:body.unit||"unit",
    currency:body.currency||"INR",unit_price_minor:Number(body.unitPriceMinor||0),tax_rate:Number(body.taxRate??18)
  }).select().single();
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to create product"},{status:400});
  return NextResponse.json({data},{status:201});
}
