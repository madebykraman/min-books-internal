import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash} from "node:crypto";
import {createServiceClient} from "@/lib/supabase/service";

export async function GET(request:Request){
  const slug=new URL(request.url).searchParams.get("slug")||"";
  const token=(await cookies()).get("client_portal_session")?.value;
  if(!slug||!token)return NextResponse.json({error:"Portal authentication required."},{status:401});
  try{
    const supabase=createServiceClient();
    const hash=createHash("sha256").update(token).digest("hex");
    const {data:session}=await supabase.from("client_portal_sessions").select("client_id,expires_at").eq("token_hash",hash).gt("expires_at",new Date().toISOString()).maybeSingle();
    if(!session)return NextResponse.json({error:"Portal session expired."},{status:401});
    const {data:client}=await supabase.from("clients").select("*").eq("id",session.client_id).eq("portal_slug",slug).maybeSingle();
    if(!client||!client.portal_enabled)return NextResponse.json({error:"Portal unavailable."},{status:403});
    const [{data:workspace},{data:invoices},{data:payments},{data:allocations}]=await Promise.all([
      supabase.from("workspaces").select("id,organization_id").eq("id",client.workspace_id).maybeSingle(),
      supabase.from("documents").select("id,document_number,status,issue_date,due_date,currency,draft_payload,updated_at,document_versions(immutable,version,payload,snapshot)").eq("workspace_id",client.workspace_id).eq("client_id",client.id).eq("type","INVOICE").order("issue_date",{ascending:false}),
      supabase.from("payments").select("id,payment_date,amount_minor,currency,method,reference,notes").eq("workspace_id",client.workspace_id).eq("client_id",client.id).order("payment_date",{ascending:false}),
      supabase.from("payment_allocations").select("payment_id,document_id,amount_minor")
    ]);
    const {data:organization}=workspace?.organization_id?await supabase.from("organizations").select("*").eq("id",workspace.organization_id).maybeSingle():{data:null};
    const invoiceRows=(invoices??[]).map((i:any)=>{
      const versions=Array.isArray(i.document_versions)?i.document_versions:[];const issued=versions.filter((v:any)=>v?.immutable).sort((a:any,b:any)=>Number(b.version??0)-Number(a.version??0))[0];const payload=issued?.payload??i.draft_payload??{};const total=Number(payload?.totals?.totalMinor??0)/100;
      const paidMinor=(allocations??[]).filter((a:any)=>a.document_id===i.id).reduce((s:number,a:any)=>s+Number(a.amount_minor||0),0);
      const paid=paidMinor/100;
      return {...i,total,paid,balance:Math.max(total-paid,0),is_overdue:Boolean(i.due_date&&new Date(i.due_date)<new Date()&&total-paid>0&&i.status!=="PAID"),project_name:null,contents:(payload?.items??[]).map((x:any,index:number)=>({...x,id:String(index+1)}))};
    });
    const paymentRows=(payments??[]).map((p:any)=>({...p,amount:Number(p.amount_minor||0)/100}));
    return NextResponse.json({organization,client,invoices:invoiceRows,payments:paymentRows,projects:[],documents:[],activity:[]});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to open portal"},{status:500})}
}
