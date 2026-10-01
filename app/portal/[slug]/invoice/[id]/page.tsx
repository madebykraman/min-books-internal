"use client";
import {useEffect,useState} from "react";
import {ArrowDownToLine,ArrowLeft,FileText} from "lucide-react";
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n||0);
const date=(s:string)=>s?new Date(s+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
export default function ClientInvoice({params}:{params:Promise<{slug:string;id:string}>}){
 const [p,setP]=useState<{slug:string;id:string}>(),[invoice,setInvoice]=useState<any>(null),[error,setError]=useState("");
 useEffect(()=>{params.then(setP)},[params]);
 useEffect(()=>{if(!p)return;fetch("/api/client-portal/data?slug="+encodeURIComponent(p.slug),{cache:"no-store"}).then(async r=>{if(!r.ok){setError("Your portal session has expired.");return}const d=await r.json();const i=(d.invoices??[]).find((x:any)=>x.id===p.id);if(i)setInvoice({...i,organization:d.organization});else setError("Invoice not found.")}).catch(()=>setError("Unable to load invoice."))},[p]);
 if(error)return <main className="portal-screen"><div className="portal-card"><h1>Invoice unavailable</h1><p>{error}</p><a className="portal-button dark" href={"/portal/"+(p?.slug||"")}>Return to account</a></div></main>;
 if(!p||!invoice)return <main className="portal-screen"><div className="portal-card">Loading invoice…</div></main>;
 return <main className="portal-screen"><div className="portal-shell">
  <header className="portal-header"><div><a className="portal-button" href={"/portal/"+p.slug}><ArrowLeft size={13}/>Account</a><div className="portal-kicker" style={{marginTop:12}}>INVOICE</div><h1>#{invoice.document_number}</h1><p>{date(invoice.issue_date)}{invoice.due_date?" · Due "+date(invoice.due_date):""}</p></div><a className="portal-button dark" href={"/api/client-portal/"+p.slug+"/invoice/"+invoice.id+"/pdf"}><ArrowDownToLine size={14}/>Download PDF</a></header>
  <section className="portal-position"><div><span>AMOUNT DUE</span><strong>{money(invoice.balance)}</strong><small>{invoice.balance>0?(invoice.is_overdue?"Overdue":"Outstanding"):"Paid"}</small></div><div className="portal-position-facts"><span>Total <b>{money(invoice.total)}</b></span><span>Paid <b>{money(invoice.paid)}</b></span><span>Status <b>{invoice.status}</b></span></div><a className="portal-button dark" href={"/api/client-portal/"+p.slug+"/invoice/"+invoice.id+"/pdf"}><FileText size={14}/>PDF</a></section>
  <section className="portal-panel"><div className="portal-panel-head"><div><h2>Invoice details</h2><span>{invoice.contents?.length??0} items</span></div></div><div className="portal-invoice-items">{(invoice.contents??[]).map((item:any,index:number)=><div className="portal-invoice-item" key={item.id}><div><span>{String(index+1).padStart(2,"0")}</span><div><b>{item.description||item.title||"Untitled service"}</b></div></div><strong>{item.rate==null||item.rate===""?"Amount pending":money(Number(item.qty??1)*Number(item.rate??0))}</strong></div>)}</div></section>
  <footer className="portal-footer">Invoice #{invoice.document_number} · {invoice.organization?.name||""}</footer>
 </div></main>
}
