"use client";
import {useEffect,useMemo,useState} from "react";
import {Download,Plus,Search} from "lucide-react";
import AppShell from "../../components/AppShell";
import {allocationByDocument,confirmedPaymentTotal,documentBalance,isConfirmedPayment} from "../../lib/financial/ledger";
import styles from "./page.module.css";

type Row={id:string;document_number:string;status:string;issue_date:string;due_date:string|null;currency:string;draft_payload?:{totals?:{totalMinor?:string}};clients?:{name?:string|null}};
type Payment={amount_minor:number;status?:string;payment_date:string;payment_allocations?:Array<{document_id:string;amount_minor:number}>};

const money=(minor?:string|number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);
const label=(status:string)=>status.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

export default function InvoicesPage(){
 const [rows,setRows]=useState<Row[]>([]);
 const [payments,setPayments]=useState<Payment[]>([]);
 const [query,setQuery]=useState("");
 const [tab,setTab]=useState("ALL");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);

 useEffect(()=>{
  const workspaceId=localStorage.getItem("finbooksos.workspace");
  if(!workspaceId){setLoading(false);return}
  const q=encodeURIComponent(workspaceId);
  Promise.all([fetch("/api/documents?workspaceId="+q+"&type=INVOICE"),fetch("/api/payments?workspaceId="+q)])
   .then(async([ir,pr])=>{
    const [id,pd]=await Promise.all([ir.json(),pr.json()]);
    if(!ir.ok)throw new Error(id.error||"Unable to load invoices");
    if(!pr.ok)throw new Error(pd.error||"Unable to load payment ledger");
    setRows(id.data??[]);
    setPayments(pd.data??[]);
   })
   .catch(e=>setError(e instanceof Error?e.message:"Unable to load invoices"))
   .finally(()=>setLoading(false));
 },[]);

 const allocations=useMemo(()=>allocationByDocument(payments),[payments]);
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase();
  return rows.filter(r=>{
   const matchesTab=tab==="ALL"||r.status===tab;
   const matchesQuery=!q||[r.document_number,r.clients?.name??"",r.status].join(" ").toLowerCase().includes(q);
   return matchesTab&&matchesQuery;
  });
 },[rows,query,tab]);
 const counts=useMemo(()=>Object.fromEntries(["DRAFT","SENT","OVERDUE","PAID"].map(s=>[s,rows.filter(r=>r.status===s).length])),[rows]);
 const outstanding=useMemo(()=>rows.filter(r=>!["DRAFT","CANCELLED","VOID"].includes(r.status)).reduce((sum,r)=>sum+documentBalance(r,allocations),0),[rows,allocations]);
 const monthStart=useMemo(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1)},[]);
 const paidThisMonth=useMemo(()=>payments.filter(p=>isConfirmedPayment(p)&&p.payment_date&&new Date(p.payment_date+"T00:00:00")>=monthStart).reduce((sum,p)=>sum+Number(p.amount_minor||0),0),[payments,monthStart]);
 const confirmedCount=useMemo(()=>payments.filter(isConfirmedPayment).length,[payments]);
 const overdue=useMemo(()=>rows.filter(r=>r.status==="OVERDUE").reduce((sum,r)=>sum+documentBalance(r,allocations),0),[rows,allocations]);

 const exportCsv=()=>{
  const lines=[["Invoice","Client","Status","Issue date","Due date","Amount minor","Allocated minor","Balance minor"],...filtered.map(r=>[r.document_number,r.clients?.name??"",r.status,r.issue_date,r.due_date??"",r.draft_payload?.totals?.totalMinor??"0",String(allocations.get(r.id)??0),String(documentBalance(r,allocations))])]
   .map(row=>row.map(v=>"\""+String(v).replaceAll("\"","\"\"")+"\"").join(","));
  const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="finbooksos-invoices.csv";a.click();URL.revokeObjectURL(url);
 };

 return <AppShell title="Invoices" subtitle="A complete document ledger for issued, pending and paid work." action={<a href="/invoices/new" className={styles.primary}><Plus size={14}/> New invoice</a>}>
  <section className={styles.stats}>
   <div><span>Total invoices</span><b>{rows.length}</b><small>All documents</small></div>
   <div><span>Outstanding</span><b>{money(outstanding)}</b><small>Open receivable balance</small></div>
   <div><span>Paid this month</span><b>{money(paidThisMonth)}</b><small>{confirmedCount} confirmed payments</small></div>
   <div><span>Overdue</span><b>{money(overdue)}</b><small>{rows.filter(r=>r.status==="OVERDUE").length} overdue invoices</small></div>
  </section>
  <section className={styles.toolbar}>
   <label className={styles.search}><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search invoice, client or reference…"/></label>
   <div className={styles.tools}><button onClick={exportCsv} disabled={loading}><Download size={13}/> Export</button></div>
  </section>
  <nav className={styles.tabs}>
   {([["ALL","All",rows.length],["DRAFT","Draft",counts.DRAFT??0],["SENT","Sent",counts.SENT??0],["OVERDUE","Overdue",counts.OVERDUE??0],["PAID","Paid",counts.PAID??0]] as const).map(([value,name,count])=><button key={value} className={tab===value?styles.active:""} onClick={()=>setTab(value)}>{name} <b>{count}</b></button>)}
  </nav>
  {error?<div className={styles.empty}>{error}</div>:loading?<div className={styles.empty}>Loading invoices…</div>:filtered.length===0?<div className={styles.empty}>No invoices match the current view.</div>:<div className={styles.table}><div className={styles.head}><span>Document</span><span>Client</span><span>Dates</span><span>Amount</span><span>Status</span></div>{filtered.map(row=><a href={"/invoices/"+row.id} className={styles.row} key={row.id}><div><b>{row.document_number}</b><small>Issued {new Date(row.issue_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</small></div><span>{row.clients?.name??"Unassigned client"}</span><div className={styles.dates}><span>{row.due_date?new Date(row.due_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</span><small>due date</small></div><strong>{money(row.draft_payload?.totals?.totalMinor,row.currency)}</strong><i className={styles["status_"+row.status.toLowerCase()]}>{label(row.status)}</i></a>)}</div>}
 </AppShell>
}
