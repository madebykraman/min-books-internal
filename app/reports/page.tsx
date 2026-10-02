"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowDownRight,ArrowUpRight,BarChart3,Download,WalletCards} from "lucide-react";
import AppShell from "../../components/AppShell";
import {allocationByDocument,confirmedPaymentTotal,documentBalance,creditAllocationByDocument,isReceivable} from "../../lib/financial/ledger";
import styles from "./page.module.css";

type Row={id:string;document_number?:string;status:string;issue_date?:string;draft_payload?:{totals?:{totalMinor?:string}}};
type Payment={amount_minor:number;status?:string;payment_date:string;method:string;payment_allocations?:Array<{document_id:string;amount_minor:number}>};
type Expense={amount_minor:number;tax_minor:number;currency:string;expense_date:string;category:string;status:string};

const n=(r:Row)=>Number(r.draft_payload?.totals?.totalMinor??0)/100;
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);

export default function Reports(){
 const [rows,setRows]=useState<Row[]>([]),[credits,setCredits]=useState<any[]>([]),[payments,setPayments]=useState<Payment[]>([]),[expenses,setExpenses]=useState<Expense[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{const w=localStorage.getItem("finbooksos.workspace");if(!w){setLoading(false);return}const q=encodeURIComponent(w);Promise.all([fetch("/api/documents?workspaceId="+q+"&type=INVOICE"),fetch("/api/payments?workspaceId="+q),fetch("/api/credit-notes?workspaceId="+q),fetch("/api/expenses?workspaceId="+q)]).then(async rs=>Promise.all(rs.map(r=>r.json()))).then(([d,p,c,e])=>{setRows(d.data??[]);setPayments(p.data??[]);setCredits(c.data??[]);setExpenses(e.data??[])}).catch(()=>{}).finally(()=>setLoading(false))},[]);
 const allocations=useMemo(()=>allocationByDocument(payments),[payments]); const creditAllocations=useMemo(()=>creditAllocationByDocument(credits.flatMap((x:any)=>x.credit_note_applications??[])),[credits]);
 const receivables=useMemo(()=>rows.filter(r=>isReceivable(r.status)),[rows]);
 const total=useMemo(()=>receivables.reduce((a,r)=>a+n(r),0),[receivables]);
 const collectedAgainstReceivables=useMemo(()=>receivables.reduce((a,r)=>a+(allocations.get(r.id)??0)/100,0),[receivables,allocations,creditAllocations]);
 const overdue=useMemo(()=>receivables.filter(r=>r.status==="OVERDUE").reduce((a,r)=>a+documentBalance(r,allocations,creditAllocations)/100,0),[receivables,allocations]);
 const open=useMemo(()=>receivables.filter(r=>r.status!=="OVERDUE").reduce((a,r)=>a+documentBalance(r,allocations,creditAllocations)/100,0),[receivables,allocations]);
 const collected=useMemo(()=>confirmedPaymentTotal(payments)/100,[payments]);
 const spent=useMemo(()=>expenses.filter(r=>r.status!=="VOID").reduce((a,r)=>a+Number(r.amount_minor)/100,0),[expenses]);
 const net=collected-spent;
 const exportCsv=()=>{const lines=[["Metric","Value"],["Receivable document value",total],["Allocated collections against receivables",collectedAgainstReceivables],["Open receivable balance",open],["Recorded confirmed payments",collected],["Recorded expenses",spent],["Net recorded cash",net],["Overdue receivable balance",overdue]].map(r=>r.map(v=>"\""+String(v).replaceAll("\"","\"\"")+"\"").join(","));const blob=new Blob([lines.join("\\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="finbooksos-report.csv";a.click();URL.revokeObjectURL(url)};
 return <AppShell title="Reports" subtitle="A compact financial view built from your document, payment and expense ledgers." action={<button className={styles.export} onClick={exportCsv} disabled={loading}><Download size={13}/> Export CSV</button>}>
  <section className={styles.stats}>
   <div><span>Document value</span><b>{money(total)}</b><small>Across {receivables.length} receivable documents</small></div>
   <div><span>Recorded collections</span><b>{money(collected)}</b><small><ArrowUpRight size={10}/> Confirmed payment ledger</small></div>
   <div><span>Recorded spend</span><b>{money(spent)}</b><small><ArrowDownRight size={10}/> Non-void expense ledger</small></div>
   <div><span>Net recorded cash</span><b className={net>=0?styles.positive:styles.negative}>{money(net)}</b><small><WalletCards size={10}/> Collections minus expenses</small></div>
  </section>
  <div className={styles.grid}>
   <section className={styles.panel}><header><div><span>Receivables</span><h2>Invoice value by balance</h2></div><BarChart3 size={15}/></header><div className={styles.bars}>{[["Collected",collectedAgainstReceivables,"green"],["Open",open,"purple"],["Overdue",overdue,"red"]].map(([label,value,tone])=><div key={String(label)}><span>{String(label)}</span><div className={styles.track}><i className={styles[String(tone)]} style={{width:total?Math.max(4,Number(value)/total*100)+"%":"4%"}}/></div><b>{money(Number(value))}</b></div>)}</div></section>
   <section className={styles.panel}><header><div><span>Ledger interpretation</span><h2>What the numbers mean</h2></div></header><div className={styles.notes}><p><b>Document value</b> is the current value of receivable invoice records, excluding drafts, cancelled and void documents.</p><p><b>Recorded collections</b> come from the confirmed payment ledger. The receivables chart separately reconciles confirmed allocations against invoice balances.</p><p><b>Open and overdue balances</b> are calculated from document value less confirmed allocations; overdue is separated from current open balance.</p><p><b>Net recorded cash</b> is confirmed collections less non-void recorded expenses. Tax, period locking and reconciliation remain separate layers.</p></div></section>
  </div>
  <section className={styles.panel+" "+styles.activity}><header><div><span>Recent cash activity</span><h2>Payments and expenses</h2></div><span>{loading?"Loading…":payments.length+expenses.length+" entries"}</span></header><div className={styles.cashRows}>
   {[...payments.filter(p=>p.status==="CONFIRMED").map(p=>({date:p.payment_date,label:"Payment · "+p.method.replaceAll("_"," "),amount:Number(p.amount_minor)/100,tone:"green"})),...expenses.filter(e=>e.status!=="VOID").map(e=>({date:e.expense_date,label:"Expense · "+e.category,amount:-Number(e.amount_minor)/100,tone:"red"}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map((r,i)=><div key={r.date+r.label+i}><span>{r.date}</span><b>{r.label}</b><strong className={r.tone==="green"?styles.positive:styles.negative}>{r.amount>=0?"+":"−"}{money(Math.abs(r.amount))}</strong></div>)}
   {!loading&&!payments.some(p=>p.status==="CONFIRMED")&&!expenses.some(e=>e.status!=="VOID")&&<div className={styles.empty}>No cash activity recorded yet.</div>}
  </div></section>
 </AppShell>
}
