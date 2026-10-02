import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
import {allocationByDocument,creditAllocationByDocument,documentBalance,isReceivable,isConfirmedPayment} from "../../../../lib/financial/ledger";
import {previousPeriod,validateRange} from "../../../../lib/reporting/periods";

function monthKey(value:string){return value.slice(0,7)}
async function slice(s:any,w:string,r:{from:string;to:string}){
 const [docs,pays,expenses,credits]=await Promise.all([
  s.from("documents").select("id,status,issue_date,due_date,draft_payload").eq("workspace_id",w).eq("type","INVOICE").lte("issue_date",r.to),
  s.from("payments").select("amount_minor,status,payment_date,payment_allocations(document_id,amount_minor)").eq("workspace_id",w).lte("payment_date",r.to),
  s.from("expenses").select("amount_minor,status,expense_date").eq("workspace_id",w).lte("expense_date",r.to),
  s.from("credit_note_applications").select("invoice_id,amount_minor,applied_at").eq("workspace_id",w).lte("applied_at",r.to+"T23:59:59.999Z")
 ]);
 for(const x of [docs,pays,expenses,credits])if(x.error)throw new Error(x.error.message);
 const rows=(docs.data??[]).filter((d:any)=>isReceivable(d.status)&&d.issue_date<=r.to);
 const alloc=allocationByDocument((pays.data??[]).filter((p:any)=>p.payment_date<=r.to) as any);
 const creditAlloc=creditAllocationByDocument((credits.data??[]) as any);
 const value=rows.reduce((n:number,d:any)=>n+Number(d.draft_payload?.totals?.totalMinor??0),0);
 const open=rows.reduce((n:number,d:any)=>n+documentBalance(d,alloc,creditAlloc),0);
 const collections=(pays.data??[]).filter((p:any)=>isConfirmedPayment(p)&&p.payment_date>=r.from&&p.payment_date<=r.to).reduce((n:number,p:any)=>n+Number(p.amount_minor||0),0);
 const spend=(expenses.data??[]).filter((e:any)=>e.status!=="VOID"&&e.expense_date>=r.from&&e.expense_date<=r.to).reduce((n:number,e:any)=>n+Number(e.amount_minor||0),0);
 const asOf=new Date(r.to+"T23:59:59Z").getTime();
 const ageing={current:0,"1_30":0,"31_60":0,"61_90":0,"90_plus":0};
 for(const d of rows){const balance=documentBalance(d,alloc,creditAlloc);if(balance<=0)continue;const due=d.due_date?new Date(d.due_date+"T23:59:59Z").getTime():asOf;const days=Math.max(0,Math.floor((asOf-due)/86400000));if(days===0)ageing.current+=balance;else if(days<=30)ageing["1_30"]+=balance;else if(days<=60)ageing["31_60"]+=balance;else if(days<=90)ageing["61_90"]+=balance;else ageing["90_plus"]+=balance}
 const months=new Map<string,{collectionsMinor:number;expensesMinor:number;netMinor:number}>();
 for(const p of pays.data??[]){if(!isConfirmedPayment(p)||p.payment_date<r.from)continue;const k=monthKey(p.payment_date);const x=months.get(k)??{collectionsMinor:0,expensesMinor:0,netMinor:0};x.collectionsMinor+=Number(p.amount_minor||0);x.netMinor+=Number(p.amount_minor||0);months.set(k,x)}
 for(const e of expenses.data??[]){if(e.status==="VOID"||e.expense_date<r.from)continue;const k=monthKey(e.expense_date);const x=months.get(k)??{collectionsMinor:0,expensesMinor:0,netMinor:0};x.expensesMinor+=Number(e.amount_minor||0);x.netMinor-=Number(e.amount_minor||0);months.set(k,x)}
 return {documents:rows.filter((d:any)=>d.issue_date>=r.from).length,documentValueMinor:value,openMinor:open,collectionsMinor:collections,expensesMinor:spend,netCashMinor:collections-spend,ageingMinor:ageing,cashflow:[...months.entries()].sort().map(([month,data])=>({month,...data}))}
}
export async function GET(request:Request){const s=await createClient();const {data:{user},error:a}=await s.auth.getUser();if(a||!user)return NextResponse.json({error:"Unauthorized"},{status:401});const q=new URL(request.url).searchParams,w=q.get("workspaceId");if(!w)return NextResponse.json({error:"workspaceId is required"},{status:400});try{const current=validateRange({from:q.get("from")||"",to:q.get("to")||""}),previous=previousPeriod(current);return NextResponse.json({period:current,current:await slice(s,w,current),comparison:{period:previous,data:await slice(s,w,previous)}})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid report period"},{status:400})}}
