import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  const {data,error}=await supabase.from("payments").select("id,payment_date,amount_minor,currency,method,reference,notes,status,created_at,clients(name),payment_allocations(document_id,amount_minor,documents(document_number))").eq("workspace_id",workspaceId).order("payment_date",{ascending:false}).order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data:data??[]});
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  if(!body.documentId||!body.amountMinor)return NextResponse.json({error:"Invoice and payment amount are required"},{status:400});
  const amount=Number(body.amountMinor);
  if(!Number.isSafeInteger(amount)||amount<=0)return NextResponse.json({error:"Payment amount must be a positive integer in minor units"},{status:400});
  const {data,error}=await supabase.rpc("record_invoice_payment",{
    target_document:body.documentId,
    payment_amount_minor:amount,
    payment_date_value:body.paymentDate||new Date().toISOString().slice(0,10),
    payment_method_value:body.method||"BANK_TRANSFER",
    payment_reference:body.reference||null,
    payment_notes:body.notes||null
  });
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to record payment"},{status:400});
  return NextResponse.json({data});
}
