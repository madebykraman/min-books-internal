"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,Clock3,ExternalLink,FileCheck2,Send} from "lucide-react";
import AppShell from "../../../components/AppShell";
import styles from "./page.module.css";

type Item={description?:string;title?:string;qty?:string|number;rate?:string|number;tax?:string|number};
type Doc={id:string;document_number:string;type:string;status:string;issue_date:string;due_date:string|null;currency:string;draft_payload?:{items?:Item[];note?:string;totals?:{subtotalMinor?:string;taxMinor?:string;totalMinor?:string}};clients?:{name?:string;email?:string};document_events?:Array<{id:string;event_type:string;created_at:string}>;document_versions?:Array<{version:number;immutable:boolean;payload?:Doc["draft_payload"]}>;public_token?:string|null};
const money=(minor?:string,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);
const label=(v:string)=>v.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

export default function QuoteDetailPage({params}:{params:Promise<{id:string}>}){
 const [doc,setDoc]=useState<Doc|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{params.then(({id})=>fetch("/api/documents/"+encodeURIComponent(id)).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setDoc(d.data)}).catch(e=>setError(e.message||"Unable to load quote")).finally(()=>setLoading(false)))},[params]);
 const issued=doc?.document_versions?.filter(v=>v.immutable).sort((a,b)=>b.version-a.version)[0];
 const payload=issued?.payload??doc?.draft_payload;
 const events=useMemo(()=>[...(doc?.document_events??[])].sort((a,b)=>b.created_at.localeCompare(a.created_at)),[doc]);
 async function convert(){if(!doc)return;setBusy(true);try{const r=await fetch("/api/quotes/"+doc.id+"/convert",{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error);window.location.assign("/invoices/"+d.data.id)}catch(e){setError(e instanceof Error?e.message:"Unable to convert quote")}finally{setBusy(false)}}
 if(loading)return <AppShell title="Quote"><div className={styles.panel}>Loading quote…</div></AppShell>;
 if(error&&!doc)return <AppShell title="Quote"><div className={styles.panel}>{error}<a href="/quotes">Back to quotes</a></div></AppShell>;
 if(!doc)return null;
 return <AppShell title={doc.document_number} subtitle={(doc.clients?.name??"Unassigned client")+" · "+label(doc.status)} action={<div className={styles.actions}><span className={styles.status}>{label(doc.status)}</span>{doc.public_token&&<a href={"/invoice/"+doc.public_token} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Public</a>}<button onClick={convert} disabled={busy||["CANCELLED","VOID","PAID"].includes(doc.status)}><ArrowRight size={13}/>{busy?"Converting…":"Convert to invoice"}</button></div>}>
  <div className={styles.back}><a href="/quotes"><ArrowLeft size={14}/> Back to quotes</a></div>
  {error&&<div className={styles.error}>{error}</div>}
  <div className={styles.grid}>
   <section className={styles.panel}>
    <header><div><span>Commercial document</span><h2>Quote details</h2></div><FileCheck2 size={16}/></header>
    <div className={styles.meta}><div><span>Client</span><b>{doc.clients?.name??"—"}</b><small>{doc.clients?.email??""}</small></div><div><span>Issue date</span><b>{doc.issue_date}</b></div><div><span>Valid until</span><b>{doc.due_date??"—"}</b></div><div><span>Total</span><b>{money(payload?.totals?.totalMinor,doc.currency)}</b></div></div>
    <div className={styles.lines}><div className={styles.head}><span>Description</span><span>Qty</span><span>Rate</span><span>Tax</span></div>{(payload?.items??[]).map((x,i)=><div className={styles.row} key={i}><b>{x.description||x.title||"Untitled service"}</b><span>{x.qty??1}</span><span>{x.rate==null?"TBD":money(String(Math.round(Number(x.rate)*100)),doc.currency)}</span><span>{x.tax??0}%</span></div>)}</div>
    <div className={styles.totals}><div><span>Subtotal</span><b>{money(payload?.totals?.subtotalMinor,doc.currency)}</b></div><div><span>Tax</span><b>{money(payload?.totals?.taxMinor,doc.currency)}</b></div><div><span>Total</span><b>{money(payload?.totals?.totalMinor,doc.currency)}</b></div></div>
    {payload?.note&&<div className={styles.note}><span>TERMS</span><p>{payload.note}</p></div>}
    <div className={styles.callout}><Send size={14}/><div><b>Conversion creates a new invoice draft</b><span>The quote remains unchanged. Client, project, line items and authoritative totals are carried forward.</span></div></div>
   </section>
   <aside className={styles.panel}><header><div><span>Audit trail</span><h2>Activity</h2></div><Clock3 size={16}/></header>{events.length?events.map(e=><div className={styles.event} key={e.id}><b>{label(e.event_type)}</b><small>{new Date(e.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></div>):<div className={styles.empty}>No recorded events.</div>}</aside>
  </div>
 </AppShell>
}
