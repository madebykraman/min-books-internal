import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

async function auth(){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return {supabase,user:null};
 return {supabase,user};
}
export async function GET(request:Request){
 const {supabase,user}=await auth(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const workspaceId=new URL(request.url).searchParams.get("workspaceId"); if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
 const {data,error}=await supabase.from("business_profiles").select("*").eq("workspace_id",workspaceId).maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});
 return NextResponse.json({data});
}
export async function PUT(request:Request){
 const {supabase,user}=await auth(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json(); if(!body.workspaceId||!body.legalName)return NextResponse.json({error:"Workspace and legal name are required"},{status:400});
 const payload={workspace_id:body.workspaceId,legal_name:body.legalName,display_name:body.displayName||null,email:body.email||null,phone:body.phone||null,website:body.website||null,gstin:body.gstin||null,address:body.address||{},invoice_prefix:body.invoicePrefix||"INV",default_payment_terms_days:Number(body.paymentTermsDays??15),default_tax_rate:Number(body.defaultTaxRate??18),payment_details:body.paymentDetails||{}};
 const {data,error}=await supabase.from("business_profiles").upsert(payload,{onConflict:"workspace_id"}).select().single();
 if(error||!data)return NextResponse.json({error:error?.message||"Unable to save business profile"},{status:400});
 return NextResponse.json({data});
}
