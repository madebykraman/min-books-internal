import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
import {allocationByDocument,creditAllocationByDocument,documentBalance,isReceivable,isConfirmedPayment} from "../../../../lib/financial/ledger";
function validDate(v:string|null){return !!v&&/^\d{4}-\d{2}-\d{2}$/.test(v)}
export async function GET(request:Request){
 const s=await createClient();const {data:{user},error:a}=await s.auth.getUser();if(a||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(request.url).searchParams,w=q.get("workspaceId"),from=q.get("from"),to=q.get("to");if(!w||!validDate(from)||!validDate(to))return NextResponse.json({error:"workspaceId, from and to are required YYYY-MM-DD dates"},{status:400});
 const [docs,pays,expenses,credits]=await Promise.all([
  s.from("documents").select("id,document_number,status,issue_date,due_date,currency,draft_payload,client_id").eq("workspace_id",w).eq("type","INVOICE").gte("issue_date",from).lte("issue_date",to),
  s.from("payments").select("id,payment_date,amount_minor,status,client_id").eq("workspace_id",w).gte("payment_date",from).lte("payment_date",to),
  s.from("expenses").select("id,expense_date,amount_minor,tax_minor,status,category").eq("workspace_id",w).gte("expense_date",from).lte("expense_date",to),
  s.from("credit_notes").select("id,amount_minor,status,created_at,credit_note_applications(invoice_id,amount_minor)").eq("workspace_id",w).gte("created_at",from+"T00:00:00Z").lte("created_at",to+"T23:59:59Z")
 ]);
 for(const x of [docs,pays,expenses,credits])if(x.error)return NextResponse.json({error:x.error.message},{status:400});
 const rows=(docs.data??[]).filter((d:any)=>isReceivable(d.status));const allocations=allocationByDocument((pays.data??[]) as any);const creditAlloc=creditAllocationByDocument((credits.data??[]).flatMap((x:any)=>x.credit_note_applications??[]));
 const totals=rows.reduce((a:any,d:any)=>{const total=Number(d.draft_payload?.totals?.totalMinor??0);a.documentValueMinor+=total;a.openMinor+=documentBalance(d,allocations,creditAlloc);return a},{documentValueMinor:0,openMinor:0});
 const collections=(pays.data??[]).filter((p:any)=>isConfirmedPayment(p)).reduce((n:number,p:any)=>n+Number(p.amount_minor||0),0);const spend=(expenses.data??[]).filter((e:any)=>e.status!=="VOID").reduce((n:number,e:any)=>n+Number(e.amount_minor||0),0);
 return NextResponse.json({period:{from,to},documents:rows.length,totals:{...totals,collectionsMinor:collections,expensesMinor:spend,netCashMinor:collections-spend}});
}