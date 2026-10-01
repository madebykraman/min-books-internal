"use client";

import {useEffect,useMemo,useState} from "react";
import {calculateInvoiceTotals} from "../../../lib/domain/calculations";
import {ArrowLeft,Check,ChevronDown,Download,Eye,MoreHorizontal,Plus,Send,Trash2} from "lucide-react";
import styles from "./page.module.css";

type Item={id:number;description:string;qty:string;rate:string;tax:string};
const fallbackClients=[{id:"demo-acme",name:"Acme Studio",email:"accounts@acmestudio.co",address:"14 Residency Road, Bengaluru",gstin:"29AAACA1234A1Z5"},{id:"demo-northstar",name:"Northstar Media",email:"finance@northstar.media",address:"Mumbai, Maharashtra",gstin:"27AAACN8821D1Z2"}];

const money=(minor:bigint)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(minor)/100);
const uid=()=>Date.now()+Math.floor(Math.random()*1000);

export default function NewInvoicePage(){
 const [clients,setClients]=useState(fallbackClients); const [client,setClient]=useState(fallbackClients[0]); const [documentId,setDocumentId]=useState<string>(); const [syncError,setSyncError]=useState("");
 const [items,setItems]=useState<Item[]>([
   {id:1,description:"Brand strategy & creative direction — March retainer",qty:"1",rate:"45000",tax:"18"},
   {id:2,description:"Motion design support",qty:"2",rate:"7500",tax:"18"}
 ]);
 const [note,setNote]=useState("Payment due within 15 days of invoice date.");
 const [saved,setSaved]=useState(true);
 const totals=useMemo(()=>calculateInvoiceTotals(items.map(i=>({quantity:i.qty,unitPriceMinor:Math.round(Number(i.rate)*100),taxRate:i.tax}))),[items]);
 useEffect(()=>{const workspaceId=localStorage.getItem("finbooksos.workspace");if(!workspaceId)return;fetch("/api/clients?workspaceId="+encodeURIComponent(workspaceId)).then(r=>r.ok?r.json():null).then(d=>{if(d?.data?.length){setClients(d.data);setClient(d.data[0])}}).catch(()=>{});},[]);
 useEffect(()=>{const workspaceId=localStorage.getItem("finbooksos.workspace");if(!workspaceId)return;const timer=window.setTimeout(async()=>{setSaved(false);try{const r=await fetch("/api/documents/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:documentId,workspaceId,clientId:client.id.startsWith("demo-")?null:client.id,documentNumber:"INV-1043",issueDate:"2026-10-01",dueDate:"2026-10-16",currency:"INR",payload:{client,items,note,totals:{subtotalMinor:totals.subtotalMinor.toString(),taxMinor:totals.taxMinor.toString(),totalMinor:totals.totalMinor.toString()}}})});const d=await r.json();if(!r.ok)throw new Error(d.error);if(d.data?.id)setDocumentId(d.data.id);setSaved(true);setSyncError("")}catch(e){setSaved(false);setSyncError(e instanceof Error?e.message:"Sync failed")}},650);return()=>window.clearTimeout(timer)},[client,items,note,totals,documentId]);

 async function issue(){if(!documentId)return;setSaved(false);try{const r=await fetch("/api/documents/issue",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({documentId,payload:{client,items,note,totals:{subtotalMinor:totals.subtotalMinor.toString(),taxMinor:totals.taxMinor.toString(),totalMinor:totals.totalMinor.toString()}}})});const d=await r.json();if(!r.ok)throw new Error(d.error);setSaved(true);setSyncError("Issued");window.location.assign("/invoices/"+d.data.id);}catch(e){setSyncError(e instanceof Error?e.message:"Unable to issue");setSaved(false)}}
 function update(id:number,key:keyof Item,value:string|number){
   setSaved(false);
   setItems(items.map(i=>i.id===id?{...i,[key]:String(value)}:i));
   window.setTimeout(()=>setSaved(true),700);
 }
 function add(){setItems([...items,{id:uid(),description:"New service",qty:"1",rate:"0",tax:"18"}]);setSaved(false)}
 function remove(id:number){setItems(items.filter(i=>i.id!==id));setSaved(false)}

 return <main className={styles.page}>
   <header className={styles.topbar}>
     <div className={styles.topLeft}><a href="/" className={styles.back} aria-label="Back to overview"><ArrowLeft size={16}/></a><div><div className={styles.kicker}>Invoices / New</div><h1>New invoice</h1></div></div>
     <div className={styles.topActions}><span className={saved?styles.saved:styles.saving}>{saved?<><Check size={13}/> Saved</>:<>{syncError||"Saving…"}</>}</span><button className={styles.ghost}><MoreHorizontal size={17}/></button><button className={styles.secondary} onClick={()=>window.print()}><Download size={15}/> PDF</button><button className={styles.primary} disabled={!documentId} onClick={issue}><Send size={15}/> Issue invoice</button></div>
   </header>

   <div className={styles.workspace}>
    <section className={styles.editor}>
      <div className={styles.section}>
       <div className={styles.sectionHeader}><div><span className={styles.overline}>01</span><div><h2>Bill to</h2><p>Choose an existing client or create one.</p></div></div></div>
       <div className={styles.clientGrid}>
        {clients.map(c=><button key={c.name} onClick={()=>setClient(c)} className={client.name===c.name?styles.clientActive:styles.clientCard}><span className={styles.clientAvatar}>{c.name[0]}</span><span><strong>{c.name}</strong><small>{c.email}</small></span>{client.name===c.name&&<Check size={15}/>}</button>)}
        <button className={styles.addClient}><Plus size={16}/><span><strong>Add client</strong><small>Create a new billing contact</small></span></button>
       </div>
      </div>

      <div className={styles.section}>
       <div className={styles.fieldGrid}>
        <label><span>Invoice number</span><input value="INV-1043" readOnly/></label>
        <label><span>Issue date</span><input type="date" defaultValue="2026-10-01"/></label>
        <label><span>Due date</span><input type="date" defaultValue="2026-10-16"/></label>
        <label><span>Currency</span><button className={styles.select}>INR — Indian Rupee <ChevronDown size={14}/></button></label>
       </div>
      </div>

      <div className={styles.section}>
       <div className={styles.sectionTitleRow}><div><span className={styles.overline}>02</span><div><h2>Line items</h2><p>Amounts are calculated centrally; the editor only collects inputs.</p></div></div><button className={styles.textButton} onClick={add}><Plus size={14}/> Add item</button></div>
       <div className={styles.lineItems}>
        <div className={styles.lineHead}><span>Description</span><span>Qty</span><span>Rate</span><span>Tax</span><span>Total</span><span/></div>
        {items.map(item=><div className={styles.lineRow} key={item.id}>
          <input className={styles.description} value={item.description} onChange={e=>update(item.id,"description",e.target.value)}/>
          <input type="number" min="0" step="1" value={item.qty} onChange={e=>update(item.id,"qty",e.target.value)}/>
          <div className={styles.moneyInput}><span>₹</span><input type="number" min="0" value={item.rate} onChange={e=>update(item.id,"rate",e.target.value)}/></div>
          <select value={item.tax} onChange={e=>update(item.id,"tax",e.target.value)}><option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option></select>
          <strong>{money(BigInt(Math.round(Number(item.qty)*Number(item.rate)*100)))}</strong>
          <button className={styles.iconButton} onClick={()=>remove(item.id)} aria-label="Remove item"><Trash2 size={14}/></button>
        </div>)}
       </div>
      </div>

      <div className={styles.section}>
       <div className={styles.sectionTitleRow}><div><span className={styles.overline}>03</span><div><h2>Notes & terms</h2><p>Shown on the client-facing document.</p></div></div></div>
       <textarea value={note} onChange={e=>setNote(e.target.value)} />
      </div>
    </section>

    <aside className={styles.previewPane}>
      <div className={styles.previewHeader}><div><span>Live document</span><strong>Preview</strong></div><div className={styles.previewControls}><button className={styles.previewActive}><Eye size={14}/> Preview</button></div></div>
      <div className={styles.paperWrap}>
       <article className={styles.paper}>
        <div className={styles.paperTop}><div><div className={styles.logo}>M</div><strong>FinBooksOS</strong><small>Independent studio</small></div><div className={styles.invoiceLabel}><span>INVOICE</span><b>INV-1043</b><small>01 OCT 2026</small></div></div>
        <div className={styles.paperRule}/>
        <div className={styles.billRow}><div><small>BILLED TO</small><strong>{client.name}</strong><span>{client.address}</span><span>{client.email}</span></div><div><small>DUE</small><strong>16 OCT 2026</strong><span>15 days</span></div></div>
        <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td>{i.description}</td><td>{i.qty}</td><td>{money(BigInt(Math.round(Number(i.rate)*100)))}</td><td>{money(BigInt(Math.round(Number(i.qty)*Number(i.rate)*100)))}</td></tr>)}</tbody></table>
        <div className={styles.paperBottom}><div className={styles.paymentNote}><small>PAYMENT TERMS</small><p>{note}</p></div><div className={styles.totalBox}><div><span>Subtotal</span><b>{money(totals.subtotalMinor)}</b></div><div><span>GST</span><b>{money(totals.taxMinor)}</b></div><div className={styles.grand}><span>Total</span><b>{money(totals.totalMinor)}</b></div></div></div>
        <div className={styles.paperFooter}><span>Thank you for your business.</span><span>FinBooksOS</span></div>
       </article>
      </div>
    </aside>
   </div>
 </main>
}