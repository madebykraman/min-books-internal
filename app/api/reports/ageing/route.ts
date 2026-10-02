import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
import {allocationByDocument,creditAllocationByDocument,documentBalance,isReceivable} from "../../../../lib/financial/ledger";
function daysBetween(a:string,b:string){return Math.floor((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000)}
export async function GET(request:Request){
 const s=await createClient();const {data:{user},error:a}=await s.auth.getUser();if(a||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(request.url).searchParams,w=q.get("workspaceId"),asOf=q.get("asOf")||new Date().toISOString().slice(0,10);if(!w)return NextResponse.json({error:"workspaceId is required"},{status:400});
 const [d,p,c]=await Promise.all([s.from("documents").select("id,document_number,status,due_date,issue_date,currency,draft_payload,client_id,clients(name)").eq("workspace_id",w).eq("type","INVOICE"),s.from("payments").select("amount_minor,status,payment_allocations(document_id,amount_minor)").eq("workspace_id",w),s.from("credit_notes").select("credit_note_applications(invoice_id,amount_minor)").eq("workspace_id",w)]);
 for(const x of [d,p,c])if(x.error)return NextResponse.json({error:x.error.message},{status:400});
 const alloc=allocationByDocument((p.data??[]) as any),credits=creditAllocationByDocument((c.data??[]).flatMap((x:any)=>x.credit_note_applications??[]));const buckets={current:0,"1_30":0,"31_60":0,"61_90":0,"90_plus":0};
 const items=(d.data??[]).filter((x:any)=>isReceivable(x.status)).map((x:any)=>{const balance=documentBalance(x,alloc,credits);const overdue=x.due_date?Math.max(0,daysBetween(x.due_date,asOf)):0;const bucket=overdue===0?"current":overdue<=30?"1_30":overdue<=60?"31_60":overdue<=90?"61_90":"90_plus";buckets[bucket as keyof typeof buckets]+=balance;return{id:x.id,documentNumber:x.document_number,client:x.clients?.name??"",dueDate:x.due_date,balanceMinor:balance,daysOverdue:overdue,bucket}});
 return NextResponse.json({asOf,buckets,items:items.sort((a,b)=>b.daysOverdue-a.daysOverdue)});
}