import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  const {data,error}=await supabase.from("expenses").select("*").eq("workspace_id",workspaceId).order("expense_date",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data:data??[]});
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  if(!body.workspaceId||!body.amountMinor)return NextResponse.json({error:"Workspace and amount are required"},{status:400});
  const {data,error}=await supabase.from("expenses").insert({
    workspace_id:body.workspaceId,expense_date:body.expenseDate||new Date().toISOString().slice(0,10),
    vendor:body.vendor||null,category:body.category||"General",description:body.description||null,
    amount_minor:Number(body.amountMinor),tax_minor:Number(body.taxMinor||0),currency:body.currency||"INR",
    payment_method:body.paymentMethod||null,reference:body.reference||null,notes:body.notes||null,created_by:user.id
  }).select().single();
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to record expense"},{status:400});
  return NextResponse.json({data},{status:201});
}
