"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,Download,ExternalLink,Clock3,CircleDollarSign,ReceiptText} from "lucide-react";
import AppShell from "../../../components/AppShell";\nimport {calculateInvoiceTotals,majorToMinor} from "../../../lib/domain/calculations";
import styles from "./page.module.css";

type DocumentData={id:string;document_number:string;status:string;issue_date:string;due_date:string|null;currency:string;draft_payload?:{items?:Array<{description?:string;title?:string;qty?:string|number;rate?:string|number;tax?:string|number}>;note?:string;totals?:{subtotalMinor?:string;taxMinor?:string;totalMinor?:string}};clients?:{name?:string;email?:string;address?:string;gstin?:string};document_events?:Array<{id:string;event_type:string;created_at:string}>;document_versions?:Array<{id:string;version:number;created_at:string;immutable:boolean;payload?:{items?:Array<{description?:string;title?:string;qty?:string|number;rate?:string|number;tax?:string|number}>;note?:string;totals?:{subtotalMinor?:string;taxMinor?:string;totalMinor?:string}}}>;public_token?:string|null};
const money=(minor?:string,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);
const label=(value:string)=>value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export default function InvoiceDetailPage({params}:{params:Promise<{id:string}>}){
 const [doc,setDoc]=useState<DocumentData|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{params.then(({id})=>fetch("/api/documents/"+encodeURIComponent(id)).then(r=>r.json().then(d=>{if(!r.ok)throw new Error(d.error);setDoc(d.data)})).catch(e=>setError(e.message||"Unable to load invoice")).finally(()=>setLoading(false)))},[params]);
 const issuedVersion=doc?.document_versions?.filter(v=>v.immutable).sort((a,b)=>b.version-a.version)[0];const payload=issuedVersion?.payload??doc?.draft_payload;const items=payload?.items??[];const events=useMemo(()=>[...(doc?.document_events??[])].sort((a,b)=>b.created_at.localeCompare(a.created_at)),[doc]);
 if(loading)return <AppShell title="Invoice"><div className={styles.loading}>Loading invoice…</div></AppShell>;
 if(error||!doc)return <AppShell title="Invoice"><div className={styles.error}>{error||"Invoice not found"}<a href="/invoices">Back to invoices</a></div></AppShell>;
 return <AppShell title={doc.document_number} subtitle={(doc.clients?.name??"Unassigned client")+" · Issued "+doc.issue_date} action={<div className={styles.actions}><span className={styles.status}>{label(doc.status)}</span><a href={"/api/invoices/"+doc.id+"/pdf"} className={styles.pdf}><Download size={13}/> PDF</a></div>}>
  <div className={styles.backRow}><a href="/invoices"><ArrowLeft size={14}/> Back to invoices</a></div>
  <div className={styles.grid}>
   <section className={styles.documentPanel}>
    <div className={styles.sectionHead}><div><span>Issued document</span><h2>Invoice details</h2></div><ReceiptText size={16}/></div>
    <div className={styles.metaGrid}><div><span>Client</span><b>{doc.clients?.name??"—"}</b><small>{doc.clients?.email??""}</small></div><div><span>Issue date</span><b>{doc.issue_date}</b></div><div><span>Due date</span><b>{doc.due_date??"—"}</b></div><div><span>Total</span><b>{money(payload?.totals?.totalMinor,doc.currency)}</b></div></div>
    <div className={styles.lineTable}><div className={styles.lineHead}><span>Description</span><span>Qty</span><span>Rate</span><span>Tax</span><span>Amount</span></div>{items.map((item,i)=>{const amount=item.rate==null||item.rate===""?null:calculateInvoiceTotals([{quantity:item.qty??1,unitPriceMinor:majorToMinor(String(item.rate)),taxRate:item.tax??0}]).subtotalMinor;return <div className={styles.lineRow} key={i}><div><b>{item.description||item.title||"Untitled service"}</b></div><span>{item.qty??1}</span><span>{item.rate==null||item.rate===""?"TBD":money(String(majorToMinor(String(item.rate))),doc.currency)}</span><span>{item.tax??0}%</span><strong>{amount==null?"TBD":money(String(amount),doc.currency)}</strong></div>})}{!items.length&&<div className={styles.empty}>No line items recorded.</div>}</div>
    <div className={styles.totals}><div><span>Subtotal</span><b>{money(payload?.totals?.subtotalMinor,doc.currency)}</b></div><div><span>Tax</span><b>{money(payload?.totals?.taxMinor,doc.currency)}</b></div><div className={styles.grand}><span>Total</span><b>{money(payload?.totals?.totalMinor,doc.currency)}</b></div></div>
    {payload?.note&&<div className={styles.note}><span>PAYMENT TERMS</span><p>{payload.note}</p></div>}
    <div className={styles.documentActions}><a href={"/api/invoices/"+doc.id+"/pdf"} className={styles.pdf}><Download size={13}/> Download canonical PDF</a>{doc.public_token&&<a href={"/invoice/"+doc.public_token} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Public document</a>}</div>
   </section>
   <aside className={styles.side}><section className={styles.card}><div className={styles.cardTitle}><Clock3 size={15}/><h2>Activity</h2></div>{events.length?<div className={styles.timeline}>{events.map(e=><div className={styles.event} key={e.id}><span className={styles.dot}/><div><strong>{label(e.event_type)}</strong><small>{new Date(e.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></div></div>)}</div>:<p className={styles.empty}>No recorded events yet.</p>}</section>
   <section className={styles.card}><div className={styles.cardTitle}><CircleDollarSign size={15}/><h2>Settlement</h2></div><div className={styles.paymentState}><strong>{doc.status==="PAID"?"Paid":doc.status==="PARTIALLY_PAID"?"Partially paid":"Open balance"}</strong><span>Payment state is reconciled from the financial ledger, not edited in the document view.</span></div></section>
  </aside></div>
 </AppShell>
}
