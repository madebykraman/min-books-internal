"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowUpRight,FileText,Mail,Phone,ReceiptText,WalletCards} from "lucide-react";
import AppShell from "../../../components/AppShell";
import styles from "./page.module.css";

type Client={id:string;name:string;company:string|null;email:string|null;phone:string|null;gstin:string|null;billing_address:string|null;place_of_supply:string|null;preferred_currency:string|null};
type Invoice={id:string;document_number:string;status:string;issue_date:string;due_date:string|null;currency:string;clients?:{name?:string|null};draft_payload?:{totals?:{totalMinor?:string}}};

const money=(minor?:string,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);

export default function ClientDetail({params}:{params:Promise<{id:string}>}){
 const [client,setClient]=useState<Client|null>(null),[invoices,setInvoices]=useState<Invoice[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{params.then(async({id})=>{try{const w=localStorage.getItem("finbooksos.workspace");if(!w)throw new Error("Workspace not selected");const [cr,ir]=await Promise.all([fetch("/api/clients?workspaceId="+encodeURIComponent(w)),fetch("/api/documents?workspaceId="+encodeURIComponent(w))]);const [c,i]=await Promise.all([cr.json(),ir.json()]);const found=(c.data??[]).find((x:Client)=>x.id===id);if(!found)throw new Error("Client not found");setClient(found);setInvoices((i.data??[]).filter((x:Invoice)=>x.clients?.name===found.name))}catch(e){setError(e instanceof Error?e.message:"Unable to load client")}finally{setLoading(false)}})},[params]);
 const value=useMemo(()=>invoices.reduce((a,r)=>a+Number(r.draft_payload?.totals?.totalMinor??0)/100,0),[invoices]);
 if(loading)return <AppShell title="Client"><div className={styles.empty}>Loading client…</div></AppShell>;
 if(error||!client)return <AppShell title="Client"><div className={styles.error}>{error||"Client not found"}<a href="/clients">Back to clients</a></div></AppShell>;
 return <AppShell title={client.name} subtitle={client.company??client.email??"Client relationship"} action={<a className={styles.primary} href="/invoices/new"><FileText size={13}/> New invoice</a>}>
  <div className={styles.back}><a href="/clients"><ArrowLeft size={13}/> Back to clients</a></div>
  <section className={styles.hero}><div className={styles.identity}><div className={styles.avatar}>{client.name.slice(0,1).toUpperCase()}</div><div><span>CLIENT PROFILE</span><h1>{client.name}</h1><p>{client.company??"Independent client"}{client.email?" · "+client.email:""}</p></div></div><div className={styles.contact}>{client.email&&<a href={"mailto:"+client.email}><Mail size={13}/> Email</a>}{client.phone&&<a href={"tel:"+client.phone}><Phone size={13}/> Call</a>}</div></section>
  <section className={styles.stats}><div><FileText size={15}/><span>Documents</span><b>{invoices.length}</b></div><div><WalletCards size={15}/><span>Document value</span><b>{money(String(Math.round(value*100)),client.preferred_currency??"INR")}</b></div><div><ReceiptText size={15}/><span>GSTIN</span><b>{client.gstin??"—"}</b></div></section>
  <div className={styles.grid}><section className={styles.panel}><header><div><span>Relationship ledger</span><h2>Invoices</h2></div></header><div className={styles.table}>{invoices.map(inv=><a className={styles.row} href={"/invoices/"+inv.id} key={inv.id}><span><b>{inv.document_number}</b><small>{inv.issue_date}{inv.due_date?" · Due "+inv.due_date:""}</small></span><i>{inv.status}</i><strong>{money(inv.draft_payload?.totals?.totalMinor,inv.currency)}</strong><ArrowUpRight size={13}/></a>)}{!invoices.length&&<div className={styles.empty}>No invoices are linked to this client yet.</div>}</div></section>
  <aside className={styles.panel}><header><div><span>Billing identity</span><h2>Details</h2></div></header><div className={styles.details}><div><span>Email</span><b>{client.email??"—"}</b></div><div><span>Phone</span><b>{client.phone??"—"}</b></div><div><span>GSTIN</span><b>{client.gstin??"—"}</b></div><div><span>Place of supply</span><b>{client.place_of_supply??"—"}</b></div><div><span>Billing address</span><b>{client.billing_address??"—"}</b></div></div></aside></div>
 </AppShell>
}
