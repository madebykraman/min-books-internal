"use client";
import {useEffect,useMemo,useState} from "react";
import {Plus,Search} from "lucide-react";
import AppShell from "../../components/AppShell";
import styles from "../invoices/page.module.css";

type Row={id:string;document_number:string;status:string;issue_date:string;due_date:string|null;currency:string;draft_payload?:{totals?:{totalMinor?:string}};clients?:{name?:string|null}};
const money=(minor?:string|number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);
const label=(status:string)=>status.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

export default function QuotesPage(){
 const [rows,setRows]=useState<Row[]>([]),[query,setQuery]=useState(""),[tab,setTab]=useState("ALL"),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{const workspaceId=localStorage.getItem("finbooksos.workspace");if(!workspaceId){setLoading(false);return}fetch("/api/documents?workspaceId="+encodeURIComponent(workspaceId)+"&type=QUOTE").then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load quotes");setRows(d.data??[])}).catch(e=>setError(e instanceof Error?e.message:"Unable to load quotes")).finally(()=>setLoading(false))},[]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return rows.filter(r=>(tab==="ALL"||r.status===tab)&&(!q||[r.document_number,r.clients?.name??"",r.status].join(" ").toLowerCase().includes(q)))},[rows,query,tab]);
 const counts=useMemo(()=>Object.fromEntries(["DRAFT","SENT","VIEWED","CANCELLED"].map(s=>[s,rows.filter(r=>r.status===s).length])),[rows]);
 return <AppShell title="Quotes" subtitle="Commercial proposals kept separate from invoice and payment state." action={<a href="/quotes/new" className={styles.primary}><Plus size={14}/> New quote</a>}>
  <section className={styles.stats}><div><span>Total quotes</span><b>{rows.length}</b><small>All quote documents</small></div><div><span>Draft</span><b>{counts.DRAFT??0}</b><small>Still editable</small></div><div><span>Sent</span><b>{counts.SENT??0}</b><small>Awaiting response</small></div><div><span>Viewed</span><b>{counts.VIEWED??0}</b><small>Client has opened</small></div></section>
  <section className={styles.toolbar}><label className={styles.search}><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search quote, client or reference…"/></label></section>
  <nav className={styles.tabs}>{([["ALL","All",rows.length],["DRAFT","Draft",counts.DRAFT??0],["SENT","Sent",counts.SENT??0],["VIEWED","Viewed",counts.VIEWED??0],["CANCELLED","Cancelled",counts.CANCELLED??0]] as const).map(([value,name,count])=><button key={value} className={tab===value?styles.active:""} onClick={()=>setTab(value)}>{name} <b>{count}</b></button>)}</nav>
  {error?<div className={styles.empty}>{error}</div>:loading?<div className={styles.empty}>Loading quotes…</div>:filtered.length===0?<div className={styles.empty}>No quotes match the current view.</div>:<div className={styles.table}><div className={styles.head}><span>Quote</span><span>Client</span><span>Dates</span><span>Amount</span><span>Status</span></div>{filtered.map(row=><a href={"/quotes/"+row.id} className={styles.row} key={row.id}><div><b>{row.document_number}</b><small>Issued {new Date(row.issue_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</small></div><span>{row.clients?.name??"Unassigned client"}</span><div className={styles.dates}><span>{row.due_date?new Date(row.due_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</span><small>valid until</small></div><strong>{money(row.draft_payload?.totals?.totalMinor,row.currency)}</strong><i className={styles["status_"+row.status.toLowerCase()]}>{label(row.status)}</i></a>)}</div>}
 </AppShell>
}
