import {NextRequest,NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash} from "node:crypto";
import {PDFDocument,rgb} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {createServiceClient} from "@/lib/supabase/service";

export async function GET(_request:NextRequest,{params}:{params:Promise<{slug:string;id:string}>}){
 const {slug,id}=await params;const token=(await cookies()).get("client_portal_session")?.value;if(!token)return new NextResponse("Unauthorized",{status:401});
 const supabase=createServiceClient();const hash=createHash("sha256").update(token).digest("hex");const {data:session}=await supabase.from("client_portal_sessions").select("client_id").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();if(!session)return new NextResponse("Session expired",{status:401});
 const {data:client}=await supabase.from("clients").select("*").eq("id",session.client_id).eq("portal_slug",slug).maybeSingle();if(!client)return new NextResponse("Portal unavailable",{status:404});
 const {data:p}=await supabase.from("payments").select("*,payment_allocations(document_id,amount_minor)").eq("id",id).eq("client_id",client.id).maybeSingle();if(!p)return new NextResponse("Receipt not found",{status:404});
 const {data:workspace}=await supabase.from("workspaces").select("organization_id").eq("id",client.workspace_id).maybeSingle();const {data:org}=workspace?.organization_id?await supabase.from("organizations").select("*").eq("id",workspace.organization_id).maybeSingle():{data:null};
 const invoiceId=p.payment_allocations?.[0]?.document_id;let invoice:any=null;if(invoiceId){const r=await supabase.from("documents").select("document_number").eq("id",invoiceId).maybeSingle();invoice=r.data}
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const regular=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-Regular.ttf")),{subset:true});const semibold=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-SemiBold.ttf")),{subset:true});const mono=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","GeistMono-Regular.ttf")),{subset:true});
 const page=pdf.addPage([595.2756,841.8898]);const black=rgb(.05,.05,.06),muted=rgb(.42,.42,.45);const money=(n:number)=>"₹"+(n/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});const text=(v:string,x:number,y:number,font:any,size:number,color=black)=>page.drawText(String(v??""),{x,y,font,size,color});
 text(String(org?.name||"Organisation"),48,785,semibold,15);text("PAYMENT RECEIPT",48,765,semibold,8,muted);text("Receipt",48,715,semibold,9,muted);text(String(p.receipt_number||p.id.slice(0,8).toUpperCase()),48,694,mono,13);text("Amount received",48,635,semibold,9,muted);text(money(Number(p.amount_minor||0)),48,602,mono,24);text("Received from",48,545,semibold,8,muted);text(String(client.legal_name||client.name),48,526,semibold,11);text(String(client.email||""),48,510,regular,9,muted);text("Payment date",330,545,semibold,8,muted);text(String(p.payment_date||"—"),330,526,regular,9);text("Method",330,494,semibold,8,muted);text(String(p.method||"—").replaceAll("_"," "),330,475,regular,9);text("Reference",330,443,semibold,8,muted);text(String(p.reference||"—"),330,424,regular,9);text("Invoice",48,457,semibold,8,muted);text(String(invoice?.document_number||"Unallocated"),48,438,mono,9);text("This receipt confirms a recorded payment in the client financial ledger.",48,320,regular,8,muted);
 const bytes=await pdf.save();return new NextResponse(bytes,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="Receipt-${String(p.receipt_number||p.id.slice(0,8))}.pdf"`,"Cache-Control":"private, no-store"}});
}
