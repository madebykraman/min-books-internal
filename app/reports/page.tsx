"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowDownRight,ArrowUpRight,BarChart3,Download,WalletCards} from "lucide-react";
import AppShell from "../../components/AppShell";
import styles from "./page.module.css";

type Row={id:string;document_number?:string;status:string;issue_date?:string;draft_payload?:{totals?:{totalMinor?:string}}};
type Payment={amount_minor:number;currency:string;payment_date:string;method:string};
type Expense={amount_minor:number;tax_minor:number;currency:string;expense_date:string;category:string;status:string};

const n=(r:Row)=>Number(r.draft_payload?.totals?.totalMinor??0)/100;
const money=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v);

export default function Reports(){
 const [rows,setRows]=useState<Row[]>([]),[payments,setPayments]=useState<Payment[]>([]),[expenses,setExpenses]=useState<Expense[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{const w=localStorage.getItem("finbooksos.workspace");if(!w){setLoading(false);return}const q=encodeURIComponent(w);Promise.all([fetch("/api/documents?workspaceId="+q),fetch("/api/payments?workspaceId="+q),fetch("/api/expenses?workspaceId="+q)]).then(async rs=>Promise.all(rs.map(r=>r.json()))).then(([d,p,e])=>{setRows(d.data??[]);setPayments(p.data??[]);setExpenses(e.data??[])}).catch(()=>{}).finally(()=>setLoading(false))},[]);
 const total=useMemo(()=>rows.reduce((a,r)=>a+n(r),0),[rows]);
 const paid=useMemo(()=>rows.filter(r=>r.status==="PAID").reduce((a,r)=>a+n(r),0),[rows]);
 const open=useMemo(()=>rows.filter(r=>!["PAID","CANCELLED","VOID","DRAFT"].includes(r.status)).reduce((a,r)=>a+n(r),0),[rows]);
 const collected=useMemo(()=>payments.reduce((a,r)=>a+Number(r.amount_minor)/100,0),[payments]);
 const spent=useMemo(()=>expenses.filter(r=>r.status!=="VOID").reduce((a,r)=>a+Number(r.amount_minor)/100,0),[expenses]);
 const net=collected-spent;
 const overdue=useMemo(()=>rows.filter(r=>r.status==="OVERDUE").reduce((a,r)=>a+n(r),0),[rows]);
 const exportCsv=()=>{
   const lines=[["Metric","Value"],["Document value",total],["Paid-state value",paid],["Open value",open],["Recorded payments",collected],["Recorded expenses",spent],["Net recorded cash",net],["Overdue invoice value",overdue]].map(r=>r.map(v=>"\"" + String(v).replaceAll("\"","\"\"") + "\"").join(","));
   const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="finbooksos-report.csv";a.click();URL.revokeObjectURL(url);
 };
 return <AppShell title="Reports" subtitle="A compact financial view built from your document, payment and expense ledgers." action={<button className={styles.export} onClick={exportCsv} disabled={loading}><Download size={13}/> Export CSV</button>}>
  <section className={styles.stats}>
   <div><span>Document value</span><b>{money(total)}</b><small>Across {rows.length} invoices</small></div>
   <div><span>Recorded collections</span><b>{money(collected)}</b><small><ArrowUpRight size={10}/> Payment ledger</small></div>
   <div><span>Recorded spend</span><b>{money(spent)}</b><small><ArrowDownRight size={10}/> Expense ledger</small></div>
   <div><span>Net recorded cash</span><b className={net>=0?styles.positive:styles.negative}>{money(net)}</b><small><WalletCards size={10}/> Collections minus expenses</small></div>
  </section>
  <div className={styles.grid}>
   <section className={styles.panel}><header><div><span>Receivables</span><h2>Invoice value by state</h2></div><BarChart3 size={15}/></header><div className={styles.bars}>{[["Paid",paid,"green"],["Open",open,"purple"],["Overdue",overdue,"red"]].map(([label,value,tone])=><div key={String(label)}><span>{String(label)}</span><div className={styles.track}><i className={styles[String(tone)]} style={{width:total?Math.max(4,Number(value)/total*100)+"%":"4%"}}/></div><b>{money(Number(value))}</b></div>)}</div></section>
   <section className={styles.panel}><header><div><span>Ledger interpretation</span><h2>What the numbers mean</h2></div></header><div className={styles.notes}><p><b>Document value</b> is the current value of invoice records, not bank balance.</p><p><b>Recorded collections</b> come from payment allocations. They are the operational cash ledger, not a gateway settlement report.</p><p><b>Net recorded cash</b> is recorded collections less recorded expenses. Tax, period locking and reconciliation remain separate layers.</p></div></section>
  </div>
  <section className={styles.panel+" "+styles.activity}><header><div><span>Recent cash activity</span><h2>Payments and expenses</h2></div><span>{loading?"Loading…":payments.length+expenses.length+" entries"}</span></header><div className={styles.cashRows}>
   {[...payments.map(p=>({date:p.payment_date,label:"Payment · "+p.method.replaceAll("_"," "),amount:Number(p.amount_minor)/100,tone:"green"})),...expenses.map(e=>({date:e.expense_date,label:"Expense · "+e.category,amount:-Number(e.amount_minor)/100,tone:"red"}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map((r,i)=><div key={r.date+r.label+i}><span>{r.date}</span><b>{r.label}</b><strong className={r.tone==="green"?styles.positive:styles.negative}>{r.amount>=0?"+":"−"}{money(Math.abs(r.amount))}</strong></div>)}
   {!loading&&!payments.length&&!expenses.length&&<div className={styles.empty}>No cash activity recorded yet.</div>}
  </div></section>
 </AppShell>
}
