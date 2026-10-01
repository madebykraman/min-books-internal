"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowUpRight,FileText,Mail,Phone,ReceiptText,WalletCards,LockKeyhole} from "lucide-react";
import {allocationByDocument,documentBalance} from "../../../lib/financial/ledger";
import AppShell from "../../../components/AppShell";
import styles from "./page.module.css";

type Client={id:string;name:string;company:string|null;email:string|null;phone:string|null;gstin:string|null;billing_address:any;place_of_supply:string|null;preferred_currency:string|null;portal_enabled?:boolean;portal_slug?:string|null;allow_profile_edit?:boolean;show_projects?:boolean;show_documents?:boolean};
type Invoice={id:string;client_id:string|null;document_number:string;status:string;issue_date:string;due_date:string|null;currency:string;clients?:{name?:string|null};draft_payload?:{totals?:{totalMinor?:string}}};
type Payment={id:string;client_id:string|null;payment_date:string;amount_minor:number;currency:string;method:string;reference:string|null;status:string;payment_allocations?:Array<{document_id:string;amount_minor:number;documents?:{document_number:string}|null}>};

const money=(minor?:string,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);
const addressText=(value:any)=>typeof value==="string"?value:value&&typeof value==="object"?Object.values(value).filter(Boolean).join(", "):"—";

export default function ClientDetail({params}:{params:Promise<{id:string}>}){
 const [client,setClient]=useState<Client|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]),[payments,setPayments]=useState<Payment[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [portalPassword,setPortalPassword]=useState(""),[portalSaving,setPortalSaving]=useState(false),[portalMessage,setPortalMessage]=useState("");
 useEffect(()=>{params.then(async({id})=>{try{const w=localStorage.getItem("finbooksos.workspace");if(!w)throw new Error("Workspace not selected");const [cr,ir,pr]=await Promise.all([fetch("/api/clients?workspaceId="+encodeURIComponent(w)),fetch("/api/documents?workspaceId="+encodeURIComponent(w)),fetch("/api/payments?workspaceId="+encodeURIComponent(w))]);const [c,i,p]=await Promise.all([cr.json(),ir.json(),pr.json()]);const found=(c.data??[]).find((x:Client)=>x.id===id);if(!found)throw new Error("Client not found");setClient(found);setInvoices((i.data??[]).filter((x:Invoice)=>x.client_id===found.id));setPayments((p.data??[]).filter((x:Payment)=>x.client_id===found.id))}catch(e){setError(e instanceof Error?e.message:"Unable to load client")}finally{setLoading(false)}})},[params]);
 const allocations=useMemo(()=>allocationByDocument(payments),[payments]);
 const value=useMemo(()=>invoices.filter(r=>!["DRAFT","CANCELLED","VOID"].includes(r.status)).reduce((a,r)=>a+Number(r.draft_payload?.totals?.totalMinor??0),0),[invoices]);
 const outstanding=useMemo(()=>invoices.filter(r=>!["DRAFT","CANCELLED","VOID"].includes(r.status)).reduce((a,r)=>a+documentBalance(r,allocations),0),[invoices,allocations]);
 async function savePortal(enabled:boolean){
  if(!client)return;setPortalSaving(true);setPortalMessage("");
  try{const r=await fetch("/api/client-portal/config",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({clientId:client.id,enabled,password:portalPassword,allowProfileEdit:false})});
   const d=await r.json();if(!r.ok)throw new Error(d.error);setClient({...client,...d.data});setPortalPassword("");setPortalMessage(enabled?"Portal enabled.":"Portal disabled.");
  }catch(e){setPortalMessage(e instanceof Error?e.message:"Unable to update portal")}finally{setPortalSaving(false)}
 }
 if(loading)return <AppShell title="Client"><div className={styles.empty}>Loading client…</div></AppShell>;
 if(error||!client)return <AppShell title="Client"><div className={styles.error}>{error||"Client not found"}<a href="/clients">Back to clients</a></div></AppShell>;
 return <AppShell title={client.name} subtitle={client.company??client.email??"Client relationship"} action={<a className={styles.primary} href="/invoices/new"><FileText size={13}/> New invoice</a>}>
  <div className={styles.back}><a href="/clients"><ArrowLeft size={13}/> Back to clients</a></div>
  <section className={styles.hero}><div className={styles.identity}><div className={styles.avatar}>{client.name.slice(0,1).toUpperCase()}</div><div><span>CLIENT PROFILE</span><h1>{client.name}</h1><p>{client.company??"Independent client"}{client.email?" · "+client.email:""}</p></div></div><div className={styles.contact}>{client.email&&<a href={"mailto:"+client.email}><Mail size={13}/> Email</a>}{client.phone&&<a href={"tel:"+client.phone}><Phone size={13}/> Call</a>}</div></section>
  <section className={styles.stats}><div><FileText size={15}/><span>Documents</span><b>{invoices.length}</b></div><div><WalletCards size={15}/><span>Document value</span><b>{money(String(value),client.preferred_currency??"INR")}</b></div><div><ReceiptText size={15}/><span>Outstanding</span><b>{money(String(outstanding),client.preferred_currency??"INR")}</b></div></section>
  <div className={styles.grid}><section className={styles.panel}><header><div><span>Relationship ledger</span><h2>Invoices</h2></div></header><div className={styles.table}>{invoices.map(inv=><a className={styles.row} href={"/invoices/"+inv.id} key={inv.id}><span><b>{inv.document_number}</b><small>{inv.issue_date}{inv.due_date?" · Due "+inv.due_date:""}</small></span><i>{inv.status}</i><strong>{money(inv.draft_payload?.totals?.totalMinor,inv.currency)}</strong><ArrowUpRight size={13}/></a>)}{!invoices.length&&<div className={styles.empty}>No invoices are linked to this client yet.</div>}</div></section>
  <aside className={styles.panel}><header><div><span>Billing identity</span><h2>Details</h2></div></header><div className={styles.details}><div><span>Email</span><b>{client.email??"—"}</b></div><div><span>Phone</span><b>{client.phone??"—"}</b></div><div><span>GSTIN</span><b>{client.gstin??"—"}</b></div><div><span>Place of supply</span><b>{client.place_of_supply??"—"}</b></div><div><span>Billing address</span><b>{addressText(client.billing_address)}</b></div></div></aside></div>
  <section className={styles.panel} style={{marginTop:11}}><header><div><span>Collection ledger</span><h2>Payments</h2></div><span>${payments.filter(p=>p.status==="CONFIRMED").length} confirmed</span></header><div className={styles.table}>{payments.map(payment=><div className={styles.row} key={payment.id}><span><b>{payment.payment_date}</b><small>{payment.payment_allocations?.map(a=>a.documents?.document_number).filter(Boolean).join(", ")||"Unallocated"} · {payment.method.replaceAll("_"," ")}</small></span><i>{payment.status}</i><strong>{money(String(payment.amount_minor),payment.currency)}</strong><span>{payment.reference??"—"}</span></div>)}{!payments.length&&<div className={styles.empty}>No payments are recorded for this client.</div>}</div></section>\n  <section className={styles.panel}><header><div><span>Client access</span><h2>Secure portal</h2></div><LockKeyhole size={15}/></header><div className={styles.portalForm}>
   <div><b>{client.portal_enabled?"Portal enabled":"Portal disabled"}</b><small>{client.portal_enabled?"/portal/"+client.portal_slug:"Clients cannot access financial records yet."}</small></div>
   <label>New password<input type="password" value={portalPassword} onChange={e=>setPortalPassword(e.target.value)} placeholder={client.portal_enabled?"Leave blank to keep current password":"Set a portal password"}/></label>
   <div className={styles.portalActions}>{client.portal_enabled&&<a href={"/portal/"+client.portal_slug} target="_blank" rel="noreferrer" className={styles.secondary}>Open portal</a>} {!client.portal_enabled&&<button className={styles.primary} disabled={portalSaving||!portalPassword} onClick={()=>savePortal(true)}>{portalSaving?"Saving…":"Enable portal"}</button>} {client.portal_enabled&&<button className={styles.secondary} disabled={portalSaving} onClick={()=>savePortal(false)}>Disable</button>}</div>
   {portalMessage&&<p className={styles.portalMessage}>{portalMessage}</p>}
  </div></section>
 </AppShell>
}
