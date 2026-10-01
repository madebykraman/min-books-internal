"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowDownRight,ArrowUpRight,CircleDollarSign,Plus,ReceiptText,WalletCards,AlertCircle,TrendingUp} from "lucide-react";
import AppShell from "../components/AppShell";
import styles from "./page.module.css";

type Invoice={id:string;document_number:string;status:string;issue_date:string;due_date:string|null;draft_payload?:{totals?:{totalMinor?:string}};clients?:{name?:string|null}};
type Payment={amount_minor:number;payment_date:string};
type Expense={amount_minor:number;expense_date:string;category:string;vendor:string|null};
const fmt=(v:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v/100);
const total=(r:Invoice)=>Number(r.draft_payload?.totals?.totalMinor??0);
const line=(d:string)=><svg viewBox="0 0 180 46" preserveAspectRatio="none"><path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>;

function Metric({icon:Icon,label,value,meta,tone,path}:{icon:any;label:string;value:string;meta:string;tone:string;path:string}){return <article className={styles.metric}><div className={styles.metricTop}><span className={styles.icon+" "+styles[tone]}><Icon size={15}/></span><span>{label}</span></div><b>{value}</b><small>{meta}</small><div className={styles.mini+" "+styles[tone]}>{line(path)}</div></article>}

export default function Home(){
 const [rows,setRows]=useState<Invoice[]>([]),[payments,setPayments]=useState<Payment[]>([]),[expenses,setExpenses]=useState<Expense[]>([]);
 useEffect(()=>{const w=localStorage.getItem("finbooksos.workspace");if(!w)return;Promise.all([
  fetch("/api/documents?workspaceId="+encodeURIComponent(w)).then(r=>r.json()),
  fetch("/api/payments?workspaceId="+encodeURIComponent(w)).then(r=>r.json()),
  fetch("/api/expenses?workspaceId="+encodeURIComponent(w)).then(r=>r.json())
 ]).then(([d,p,e])=>{setRows(d.data??[]);setPayments(p.data??[]);setExpenses(e.data??[])}).catch(()=>{})},[]);
 const billed=useMemo(()=>rows.reduce((s,r)=>s+total(r),0),[rows]);
 const paid=useMemo(()=>payments.reduce((s,p)=>s+Number(p.amount_minor||0),0),[payments]);
 const outstanding=useMemo(()=>Math.max(billed-paid,0),[billed,paid]);
 const overdueRows=useMemo(()=>rows.filter(r=>r.due_date&&new Date(r.due_date)<new Date()&&!["PAID","CANCELLED","VOID","DRAFT"].includes(r.status)),[rows]);
 const overdue=useMemo(()=>overdueRows.reduce((s,r)=>s+total(r),0),[overdueRows]);
 const dueSoon=useMemo(()=>rows.filter(r=>r.due_date&&new Date(r.due_date)>=new Date()&&new Date(r.due_date)<=new Date(Date.now()+7*86400000)&&!["PAID","CANCELLED","VOID","DRAFT"].includes(r.status)).reduce((s,r)=>s+total(r),0),[rows]);
 const recent=rows.slice(0,6);const month=new Date().toLocaleDateString("en-IN",{month:"long"});
 const expenseTotal=expenses.reduce((s,e)=>s+Number(e.amount_minor||0),0);
 return <AppShell title="Overview" subtitle="Financial position, attention queue and recent movement." action={<a href="/invoices/new" className={styles.primary}><Plus size={14}/> New invoice</a>}>
  <section className={styles.metrics}>
   <Metric icon={WalletCards} label="Outstanding" value={fmt(outstanding)} meta="Open receivables" tone="purple" path="M2 39 C20 34 30 42 47 31 S71 20 88 29 S111 43 126 22 S149 12 178 20"/>
   <Metric icon={ReceiptText} label="Collected" value={fmt(paid)} meta="Recorded payments" tone="green" path="M2 40 C20 30 33 36 49 26 S72 32 88 21 S111 27 126 13 S150 20 178 8"/>
   <Metric icon={ArrowDownRight} label="Due soon" value={fmt(dueSoon)} meta="Next 7 days" tone="orange" path="M2 38 C21 38 29 26 44 32 S66 17 82 26 S104 18 119 29 S145 13 178 22"/>
   <Metric icon={AlertCircle} label="Overdue" value={fmt(overdue)} meta={overdueRows.length+" invoices"} tone="red" path="M2 34 C21 35 30 23 45 30 S68 18 84 28 S106 17 122 29 S149 13 178 18"/>
  </section>
  <section className={styles.grid}>
   <article className={styles.panel+" "+styles.revenue}><header><div><span>Position</span><h2>Receivables</h2></div><span>{month}</span></header><div className={styles.revenueValue}><b>{fmt(billed)}</b><span><TrendingUp size={11}/> Ledger</span><small>issued document value</small></div><div className={styles.chart}><div className={styles.axis}><span>{fmt(billed)}</span><span>{fmt(Math.round(billed*.66))}</span><span>{fmt(Math.round(billed*.33))}</span><span>₹0</span></div><svg viewBox="0 0 700 240" preserveAspectRatio="none"><path d="M0 210 C60 190 100 170 150 178 S230 135 290 148 S360 105 420 122 S500 76 560 90 S630 48 700 35" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></div><div className={styles.months}>{["Apr","May","Jun","Jul","Aug","Sep","Oct"].map(m=><span key={m}>{m}</span>)}</div></article>
   <article className={styles.panel+" "+styles.collection}><header><div><span>Collection</span><h2>Cash position</h2></div><CircleDollarSign size={15}/></header><div className={styles.collectionBody}><div className={styles.donut}><div><b>{billed?Math.round(paid/billed*100):0}%</b><span>Collected</span></div></div><div className={styles.legend}><div><i className={styles.green}/><span>Paid</span><b>{fmt(paid)}</b></div><div><i className={styles.purpleDot}/><span>Open</span><b>{fmt(outstanding)}</b></div><div><i className={styles.redDot}/><span>Overdue</span><b>{fmt(overdue)}</b></div></div></div></article>
  </section>
  <section className={styles.grid+" "+styles.second}>
   <article className={styles.panel}><header><div><span>Receivables</span><h2>Recent invoices</h2></div><a href="/invoices">View all <ArrowUpRight size={12}/></a></header><div className={styles.table}><div className={styles.thead}><span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span></div>{recent.map(r=><a href={"/invoices/"+r.id} className={styles.row} key={r.id}><span className={styles.mono}>{r.document_number}</span><span>{r.clients?.name??"Unassigned"}</span><b>{fmt(total(r))}</b><i>{r.status.replaceAll("_"," ")}</i></a>)}</div>{!recent.length&&<div className={styles.empty}>No invoices yet. Create the first one.</div>}</article>
   <article className={styles.panel}><header><div><span>Attention</span><h2>Needs action</h2></div><span className={styles.badge}>{overdueRows.length}</span></header><div className={styles.actions}><a href="/invoices"><span className={styles.actionIcon+" "+styles.red}>{overdueRows.length}</span><div><b>Overdue invoices</b><small>Review and follow up on past-due balances</small></div><ArrowUpRight size={13}/></a><a href="/payments"><span className={styles.actionIcon+" "+styles.greenText}>{payments.length}</span><div><b>Recorded payments</b><small>Review the collection ledger</small></div><ArrowUpRight size={13}/></a><a href="/expenses"><span className={styles.actionIcon+" "+styles.orange}>₹</span><div><b>Expenses</b><small>{fmt(expenseTotal)} recorded</small></div><ArrowUpRight size={13}/></a></div></article>
  </section>
  <section className={styles.bottomGrid}><article className={styles.panel+" "+styles.spending}><header><div><span>Operating spend</span><h2>Expense mix</h2></div><span>{month}</span></header><div className={styles.spendRows}>{expenses.slice(0,4).map((e,i)=><div key={e.category+"-"+i}><i className={i%4===0?styles.purpleBar:i%4===1?styles.cyanBar:i%4===2?styles.orangeBar:styles.blueBar}/><span>{e.category}</span><b>{fmt(Number(e.amount_minor||0))}</b><small>{e.vendor||"Expense"}</small></div>)}{!expenses.length&&<div className={styles.empty}>No expenses recorded yet.</div>}</div></article><article className={styles.panel+" "+styles.quick}><header><div><span>Workflow</span><h2>Quick actions</h2></div></header><div className={styles.transfer}><a href="/invoices/new"><Plus size={14}/> New invoice</a><a href="/clients/new"><Plus size={14}/> New client</a><a href="/payments"><WalletCards size={14}/> Record payment</a></div></article></section>
 </AppShell>
}
