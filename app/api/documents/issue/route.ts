import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
import {validateInvoiceInput} from "../../../../lib/domain/calculations";
import {calculateIndiaInvoiceTotals,complianceWarnings,validateGstin} from "../../../../lib/domain/india-tax";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json();
 if(!body.documentId)return NextResponse.json({error:"Document is required"},{status:400});
 const doc=await supabase.from("documents").select("*,clients(*)").eq("id",body.documentId).single();
 if(doc.error)return NextResponse.json({error:doc.error.message},{status:404});
 const profile=await supabase.from("business_profiles").select("*").eq("workspace_id",doc.data.workspace_id).single();
 if(profile.error||!profile.data)return NextResponse.json({error:profile.error?.message||"Business profile not found"},{status:400});
 const gst=doc.data.type==="INVOICE"?await supabase.from("gst_profiles").select("*").eq("workspace_id",doc.data.workspace_id).maybeSingle():{data:null,error:null};
 const workspace=await supabase.from("workspaces").select("organization_id").eq("id",doc.data.workspace_id).maybeSingle();
 const organization=workspace.data?.organization_id?await supabase.from("organizations").select("*").eq("id",workspace.data.organization_id).maybeSingle():{data:null};
 const payload=body.payload||doc.data.draft_payload;
 try{validateInvoiceInput(payload?.items)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid invoice lines"},{status:400})}
 let taxSnapshot:any={};
 if(doc.data.type==="INVOICE"){
   const gp=gst.data;
   if(!gp)return NextResponse.json({error:"GST profile is required before issuing an invoice. Set registration type, seller state and place of supply in GST & compliance."},{status:400});
   const context={sellerStateCode:gp.state_code,placeOfSupplyStateCode:payload?.tax?.placeOfSupplyStateCode||gp.default_place_of_supply,taxMode:payload?.tax?.taxMode||"EXCLUSIVE",registrationType:gp.registration_type,reverseCharge:!!(payload?.tax?.reverseCharge??gp.reverse_charge_default)} as const;
   const warnings=complianceWarnings({gstin:gp.gstin,registrationType:gp.registration_type,taxableLines:(payload.items??[]).length,hsnMissing:(payload.items??[]).filter((x:any)=>!/^\d{4,8}$/.test(String(x.hsnSac??""))).length,sellerStateCode:context.sellerStateCode,placeOfSupplyStateCode:context.placeOfSupplyStateCode,invoiceNumber:doc.data.document_number,invoiceDate:doc.data.issue_date});
   if(context.registrationType==="REGULAR"&&!validateGstin(gp.gstin))return NextResponse.json({error:"GSTIN format is invalid."},{status:400});
   try{
     const totals=calculateIndiaInvoiceTotals(payload.items.map((x:any)=>({description:x.description,quantity:x.qty,unitPriceMinor:Math.round(Number(x.rate)*100),taxRate:x.tax,hsnSac:x.hsnSac})),context);
     taxSnapshot={...context,supplyType:totals.supplyType,taxableValueMinor:totals.taxableMinor.toString(),cgstMinor:totals.cgstMinor.toString(),sgstMinor:totals.sgstMinor.toString(),igstMinor:totals.igstMinor.toString(),cessMinor:totals.cessMinor.toString(),taxMinor:totals.taxMinor.toString(),totalMinor:totals.totalMinor.toString(),warnings,lineTax:totals.lines.map((line:any)=>({taxableMinor:line.taxableMinor.toString(),taxMinor:line.taxMinor.toString(),cgstMinor:line.cgstMinor.toString(),sgstMinor:line.sgstMinor.toString(),igstMinor:line.igstMinor.toString(),cessMinor:line.cessMinor.toString()}))};
     const {error}=await supabase.from("document_tax_details").upsert({document_id:doc.data.id,workspace_id:doc.data.workspace_id,seller_state_code:context.sellerStateCode,place_of_supply_state_code:context.placeOfSupplyStateCode,supply_type:totals.supplyType,tax_mode:context.taxMode,reverse_charge:context.reverseCharge,taxable_value_minor:totals.taxableMinor.toString(),cgst_minor:totals.cgstMinor.toString(),sgst_minor:totals.sgstMinor.toString(),igst_minor:totals.igstMinor.toString(),cess_minor:totals.cessMinor.toString(),line_tax:totals.lines.map((line:any)=>({taxableMinor:line.taxableMinor.toString(),taxMinor:line.taxMinor.toString(),cgstMinor:line.cgstMinor.toString(),sgstMinor:line.sgstMinor.toString(),igstMinor:line.igstMinor.toString(),cessMinor:line.cessMinor.toString()})),compliance_status:warnings.length?"WARNING":"VALID",warnings});
     if(error)return NextResponse.json({error:error.message},{status:400});
     if(warnings.length&&context.registrationType==="REGULAR")return NextResponse.json({error:warnings[0],warnings,tax:taxSnapshot},{status:400});
   }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"GST validation failed"},{status:400})}
 }
 const issuer=organization.data||profile.data;
 const snapshot={issuer,recipient:doc.data.clients,lines:payload.items||[],currency:{code:doc.data.currency,scale:2,symbol:doc.data.currency==="INR"?"₹":doc.data.currency},paymentInstructions:profile.data.payment_details,document:{number:doc.data.document_number,issueDate:doc.data.issue_date,dueDate:doc.data.due_date,type:doc.data.type},templateVersion:"default-v1",layoutVersion:"a4-v1",compliance:taxSnapshot};
 const {data,error}=await supabase.rpc("issue_document",{target_document:body.documentId,issued_payload:{...payload,compliance:taxSnapshot},issued_snapshot:snapshot});
 if(error||!data)return NextResponse.json({error:error?.message||"Unable to issue document"},{status:400});
 return NextResponse.json({data,snapshot,publicUrl:`${new URL(request.url).origin}/invoice/${data.public_token}`});
}