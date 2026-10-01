import {NextRequest,NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash} from "node:crypto";
import {PDFDocument,rgb} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {createServiceClient} from "@/lib/supabase/service";

const money=(n:number)=>"₹"+n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const startFor=(period:string,now=new Date())=>{if(period==="month")return new Date(now.getFullYear(),now.getMonth(),1);if(period==="3months")return new Date(now.getFullYear(),now.getMonth()-2,1);if(period==="6months")return new Date(now.getFullYear(),now.getMonth()-5,1);if(period==="fy")return new Date(now.getMonth()>=3?now.getFullYear():now.getFullYear()-1,3,1);return null};

export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const period=new URL(request.url).searchParams.get("period")||"all";const token=(await cookies()).get("client_portal_session")?.value;
 if(!token)return new NextResponse("Unauthorized",{status:401});
 const supabase=createServiceClient();const hash=createHash("sha256").update(token).digest("hex");
 const {data:session}=await supabase.from("client_portal_sessions").select("client_id").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();
 if(!session)return new NextResponse("Session expired",{status:401});
 const {data:client}=await supabase.from("clients").select("*").eq("id",session.client_id).eq("portal_slug",slug).maybeSingle();
 if(!client)return new NextResponse("Portal unavailable",{status:404});
 const [{data:workspace},{data:invoices},{data:payments}]=await Promise.all([
   supabase.from("workspaces").select("organization_id").eq("id",client.workspace_id).maybeSingle(),
   supabase.from("documents").select("id,document_number,issue_date,draft_payload").eq("workspace_id",client.workspace_id).eq("client_id",client.id).eq("type","INVOICE").order("issue_date"),
   supabase.from("payments").select("payment_date,amount_minor,reference").eq("workspace_id",client.workspace_id).eq("client_id",client.id).order("payment_date")
 ]);
 const {data:organization}=workspace?.organization_id?await supabase.from("organizations").select("*").eq("id",workspace.organization_id).maybeSingle():{data:null};
 const start=startFor(period);const rows:any[]=[];
 (invoices??[]).forEach((i:any)=>{const d=new Date(i.issue_date+"T00:00:00");if(!start||d>=start)rows.push({date:i.issue_date,type:"Invoice",ref:i.document_number,debit:Number(i.draft_payload?.totals?.totalMinor??0)/100,credit:0})});
 (payments??[]).forEach((p:any)=>{const d=new Date(p.payment_date+"T00:00:00");if(!start||d>=start)rows.push({date:p.payment_date,type:"Payment",ref:p.reference||"Payment",debit:0,credit:Number(p.amount_minor||0)/100})});
 rows.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const regular=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-Regular.ttf")),{subset:true});
 const semibold=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-SemiBold.ttf")),{subset:true});
 const mono=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","GeistMono-Regular.ttf")),{subset:true});
 let page=pdf.addPage([595.2756,841.8898]);let y=790;const black=rgb(.05,.05,.06),muted=rgb(.42,.42,.45);
 const draw=(v:string,x:number,yy:number,font:any,size:number,color=black)=>page.drawText(v,{x,y:yy,font,size,color});
 draw(String(organization?.name||"Organisation"),48,y,semibold,15);draw("ACCOUNT STATEMENT",48,y-18,semibold,8,muted);draw(String(client.legal_name||client.name),48,y-42,semibold,11);
 y-=86;draw("DATE",48,y,semibold,8,muted);draw("TYPE",130,y,semibold,8,muted);draw("REFERENCE",200,y,semibold,8,muted);draw("DEBIT",410,y,semibold,8,muted);draw("CREDIT",475,y,semibold,8,muted);draw("BALANCE",525,y,semibold,8,muted);y-=12;
 let balance=0;
 for(const row of rows){if(y<60){page=pdf.addPage([595.2756,841.8898]);y=790;draw(String(organization?.name||"Organisation"),48,y,semibold,13);y-=35;draw("DATE",48,y,semibold,8,muted);draw("TYPE",130,y,semibold,8,muted);draw("REFERENCE",200,y,semibold,8,muted);draw("DEBIT",410,y,semibold,8,muted);draw("CREDIT",475,y,semibold,8,muted);draw("BALANCE",525,y,semibold,8,muted);y-=14}balance+=row.debit-row.credit;draw(row.date,48,y,regular,8);draw(row.type,130,y,regular,8);draw(row.ref,200,y,regular,8);draw(row.debit?money(row.debit):"—",410,y,mono,8);draw(row.credit?money(row.credit):"—",475,y,mono,8);draw(money(balance),525,y,mono,8);y-=18}
 if(!rows.length)draw("No transactions in this period.",48,y,regular,9,muted);
 draw("Statement of account · Debits are invoice charges; credits are recorded payments.",48,38,regular,7,muted);
 const bytes=await pdf.save();return new NextResponse(bytes,{headers:{"Content-Type":"application/pdf","Content-Disposition":\`attachment; filename="Statement-\${String(client.name).replace(/[^a-z0-9]+/gi,"-")}.pdf"\`,"Cache-Control":"private, no-store"}});
}
