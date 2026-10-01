import {NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;
 const {data:quote,error}=await supabase.from("documents").select("*,document_versions(*)").eq("id",id).single();
 if(error||!quote)return NextResponse.json({error:error?.message||"Quote not found"},{status:404});
 if(quote.type!=="QUOTE")return NextResponse.json({error:"Only quotes can be converted to invoices"},{status:400});
 if(["CANCELLED","VOID","PAID"].includes(quote.status))return NextResponse.json({error:"This quote cannot be converted"} ,{status:400});
 const immutable=[...(quote.document_versions??[])].filter((v:any)=>v.immutable).sort((a:any,b:any)=>b.version-a.version)[0];
 const source=(immutable?.payload??quote.draft_payload??{}) as Record<string,unknown>;
 const items=Array.isArray(source.items)?source.items:[];
 if(!items.length)return NextResponse.json({error:"Quote has no line items"} ,{status:400});
 const prefix="INV";
 const documentNumber=prefix+"-"+Date.now().toString(36).toUpperCase();
 const payload={...source,conversion:{sourceDocumentId:quote.id,sourceDocumentNumber:quote.document_number,convertedAt:new Date().toISOString()}};
 const {data:invoice,error:insertError}=await supabase.from("documents").insert({
   workspace_id:quote.workspace_id,client_id:quote.client_id,project_id:quote.project_id??null,type:"INVOICE",status:"DRAFT",
   document_number:documentNumber,issue_date:new Date().toISOString().slice(0,10),due_date:null,currency:quote.currency,
   draft_payload:payload,created_by:user.id
 }).select().single();
 if(insertError||!invoice)return NextResponse.json({error:insertError?.message||"Unable to create invoice draft"},{status:400});
 await supabase.from("document_events").insert([
   {workspace_id:quote.workspace_id,document_id:quote.id,event_type:"CONVERTED_TO_INVOICE",actor_user_id:user.id,metadata:{invoice_id:invoice.id,invoice_number:invoice.document_number}},
   {workspace_id:invoice.workspace_id,document_id:invoice.id,event_type:"CREATED_FROM_QUOTE",actor_user_id:user.id,metadata:{quote_id:quote.id,quote_number:quote.document_number}}
 ]);
 return NextResponse.json({data:invoice});
}
