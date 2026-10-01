"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,CheckCircle2,Download,Printer} from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";
type Payment={id:string;payment_date:string;amount_minor:number;currency:string;method:string;reference:string|null;clients?:{name?:string|null;email?:string|null;company?:string|null};payment_allocations?:Array<{amount_minor:number;documents?:{document_number:string;issue_date:string;due_date:string|null;currency:string}}>}
const money=(v:number,c="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency:c}).format(v/100);
export default function Receipt({params}:{params:Promise<{id:string}>}){
 const [payment,setPayment]=useState<Payment|null>(null),[error,setError]=useState("");
 useEffect(()=>{params.then(({id})=>fetch("/api/payments/"+id).then(r=>r.json()).then(d=>d.data?setPayment(d.data):setError(d.error||"Unable to load receipt")).catch(()=>setError("Unable to load receipt")))},[params]);
 if(error)return <main className={styles.state}>{error}</main>;
 if(!payment)return <main className={styles.state}>Loading receipt…</main>;
 const allocation=payment.payment_allocations?.[0],doc=allocation?.documents;
 return <main className={styles.page}><div className={styles.toolbar}><Link href="/payments"><ArrowLeft size={14}/> Payments</Link><div><button onClick={()=>window.print()}><Printer size={14}/> Print</button><button onClick={()=>window.print()}><Download size={14}/> PDF</button></div></div><article className={styles.receipt}><header><div><span className={styles.mark}>F</span><div><b>FinBooksOS</b><small>Payment receipt</small></div></div><span className={styles.paid}><CheckCircle2 size={14}/> PAID</span></header><div className={styles.hero}><span>RECEIPT</span><h1>{money(payment.amount_minor,payment.currency)}</h1><p>Payment received and recorded against {doc?.document_number??"invoice"}.</p></div><div className={styles.grid}><div><small>Received from</small><b>{payment.clients?.name??"Client"}</b><span>{payment.clients?.company??""}</span><span>{payment.clients?.email??""}</span></div><div><small>Payment date</small><b>{payment.payment_date}</b></div><div><small>Method</small><b>{payment.method.replaceAll("_"," ")}</b></div><div><small>Reference</small><b>{payment.reference??"—"}</b></div></div><div className={styles.line}/><div className={styles.allocation}><div><span>Applied to</span><b>{doc?.document_number??"Invoice"}</b></div><strong>{money(allocation?.amount_minor??payment.amount_minor,payment.currency)}</strong></div><footer><span>FinBooksOS · Financial workspace</span><span>Receipt ID {payment.id.slice(0,8).toUpperCase()}</span></footer></article></main>
}