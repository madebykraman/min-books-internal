"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowUpRight,Mail,Phone,Plus,Search,UsersRound} from "lucide-react";
import AppShell from "../../components/AppShell";
import styles from "./page.module.css";

type Client={id:string;name:string;email:string|null;phone:string|null;gstin:string|null;company:string|null};

export default function ClientsPage(){
 const [rows,setRows]=useState<Client[]>([]),[q,setQ]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{const w=localStorage.getItem("finbooksos.workspace");if(!w){setLoading(false);return}fetch("/api/clients?workspaceId="+encodeURIComponent(w)).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load clients");setRows(d.data??[])}).catch(e=>setError(e.message||"Unable to load clients")).finally(()=>setLoading(false))},[]);
 const filtered=useMemo(()=>{const s=q.trim().toLowerCase();return !s?rows:rows.filter(r=>(r.name+" "+(r.company??"")+" "+(r.email??"")+" "+(r.gstin??"")).toLowerCase().includes(s))},[rows,q]);
 return <AppShell title="Clients" subtitle="Your billing relationships, contacts and receivables in one place." action={<a href="/clients/new" className={styles.primary}><Plus size={14}/> New client</a>}>
  <section className={styles.stats}><div><UsersRound size={16}/><span>Active clients</span><b>{rows.length}</b></div><div><ArrowUpRight size={16}/><span>Billing contacts</span><b>{rows.filter(r=>r.email||r.phone).length}</b></div><div><Mail size={16}/><span>GST-registered</span><b>{rows.filter(r=>r.gstin).length}</b></div></section>
  <section className={styles.toolbar}><div className={styles.search}><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search clients…"/></div><span>{filtered.length} of {rows.length}</span></section>
  {error&&<div className={styles.error}>{error}</div>}
  {loading?<div className={styles.empty}>Loading clients…</div>:<div className={styles.table}><div className={styles.head}><span>Client</span><span>GSTIN</span><span>Contact</span><span>Billing</span></div>{filtered.map(r=><a href={"/clients/"+r.id} className={styles.row} key={r.id}><div className={styles.client}><b>{r.name}</b><small>{r.company??r.email??"No company or email"}</small></div><span className={styles.mono}>{r.gstin??"—"}</span><span className={styles.contact}>{r.email?<Mail size={13}/>:null}{r.phone?<Phone size={13}/>:null}<small>{r.email??r.phone??"—"}</small></span><strong>Open profile <ArrowUpRight size={12}/></strong></a>)}{!filtered.length&&<div className={styles.empty}>{rows.length?"No clients match your search.":"No clients yet. Add your first billing contact."}</div>}</div>}
 </AppShell>
}
