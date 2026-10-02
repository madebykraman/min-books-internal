import {NextResponse} from "next/server";
import {queueIntegrationEvent} from "../../../lib/integrations/events";import {createClient} from "../../../lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  const {data,error}=await supabase.from("payments").select("id,client_id,payment_date,amount_minor,currency,method,reference,notes,status,created_at,clients(name),payment_allocations(document_id,amount_minor,documents(document_number))").eq("workspace_id",workspaceId).order("payment_date",{ascending:false}).order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data:data??[]});
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON body"},{status:400})}
  if(typeof body.documentId!=="string"||!body.documentId.trim()||body.amountMinor===undefined||body.amountMinor===null){
    return NextResponse.json({error:"Invoice and payment amount are required"},{status:400});
  }
  const amount=Number(body.amountMinor);
  if(!Number.isSafeInteger(amount)||amount<=0)return NextResponse.json({error:"Payment amount must be a positive integer in minor units"},{status:400});
  const paymentDate=typeof body.paymentDate==="string"&&body.paymentDate.trim()?body.paymentDate.trim():new Date().toISOString().slice(0,10);
  const dateMatch=/^(\d{4})-(\d{2})-(\d{2})$/.exec(paymentDate);
  const parsedDate=dateMatch?new Date(Date.UTC(Number(dateMatch[1]),Number(dateMatch[2])-1,Number(dateMatch[3]))):null;
  const validPaymentDate=!!dateMatch&&!!parsedDate&&parsedDate.getUTCFullYear()===Number(dateMatch[1])&&parsedDate.getUTCMonth()===Number(dateMatch[2])-1&&parsedDate.getUTCDate()===Number(dateMatch[3]);
  if(!validPaymentDate){
    return NextResponse.json({error:"Payment date must be a valid YYYY-MM-DD date"},{status:400});
  }
  const methods=new Set(["BANK_TRANSFER","UPI","CARD","CASH","CHEQUE"]);
  const method=typeof body.method==="string"&&body.method.trim()?body.method.trim():"BANK_TRANSFER";
  if(!methods.has(method))return NextResponse.json({error:"Unsupported payment method"},{status:400});
  const reference=typeof body.reference==="string"?body.reference.trim():null;
  const notes=typeof body.notes==="string"?body.notes.trim():null;
  if(reference&&reference.length>200)return NextResponse.json({error:"Payment reference is too long"},{status:400});
  if(notes&&notes.length>1000)return NextResponse.json({error:"Payment notes are too long"},{status:400});
  const {data,error}=await supabase.rpc("record_invoice_payment",{
    target_document:body.documentId.trim(),
    payment_amount_minor:amount,
    payment_date_value:paymentDate,
    payment_method_value:method,
    payment_reference:reference,
    payment_notes:notes
  });
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to record payment"},{status:400});
  await queueIntegrationEvent(supabase,{workspaceId:String(data.workspace_id??""),eventType:"PAYMENT_RECORDED",aggregateType:"payment",aggregateId:data.id,payload:{amountMinor:amount,paymentDate}}).catch(()=>{});return NextResponse.json({data});
}
