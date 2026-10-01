"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowUpRight,CalendarDays,FileText,Save,UsersRound} from "lucide-react";
import AppShell from "../../../components/AppShell";
import styles from "./page.module.css";

type Project={id:string;name:string;code:string|null;description:string|null;status:string;start_date:string|null;end_date:string|null;client_id:string|null;clients?:{id:string;name:string;company:string|null;email:string|null}};
type Doc={id:string;document_number:string;type:string;status:string;issue_date:string;due_date:string|null;currency:string;draft_payload?:{totals?:{totalMinor?:string}}};
const money=(v?:string,c="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency:c}).format(Number(v??0)/100);
const label=(s:string)=>s.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export default function ProjectDetail({params}:{params:Promise<{id:string}>}){
 const [data,setData]=useState<{project:Project;documents:Doc[]}|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[status,setStatus]=useState(""),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 useEffect(()=>{params.then(({id})=>fetch("/api/projects/"+id).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setData(d.data);setStatus(d.data.project.status)}).catch(e=>setError(e.message||"Unable to load project")).finally(()=>setLoading(false)))},[params]);
 const value=useMemo(()=>data?.documents.filter(d=>!["DRAFT","CANCELLED","VOID"].includes(d.status)).reduce((s,d)=>s+Number(d.draft_payload?.totals?.totalMinor??0),0)??0,[data]);
 async function save(){if(!data)return;setSaving(true);setMessage("");const r=await fetch("/api/projects/"+data.project.id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status})});const d=await r.json();if(!r.ok){setMessage(d.error||"Unable to update project");setSaving(false);return}setData({...data,project:d.data});setMessage("Project updated");setSaving(false)}
 if(loading)return <AppShell title="Project"><div className={styles.empty}>Loading project…</div></AppShell>;
 if(error||!data)return <AppShell title="Project"><div className={styles.error}>{error||"Project not found"}<a href="/projects">Back to projects</a></div></AppShell>;
 const p=data.project;
 return <AppShell title={p.name} subtitle={p.clients?.name??"Unassigned client"} action={<a className={styles.back} href="/projects"><ArrowLeft size={13}/> Projects</a>}>
  <section className={styles.hero}><div><span>PROJECT</span><h1>{p.name}</h1><p>{p.description||"No project description."}</p></div><div className={styles.meta}><b>{p.code||"No code"}</b><small>{p.start_date||"No start date"}{p.end_date?" → "+p.end_date:""}</small></div></section>
  <section className={styles.stats}><div><FileText size={15}/><span>Documents</span><b>{data.documents.length}</b></div><div><CalendarDays size={15}/><span>Document value</span><b>{money(String(value),data.documents[0]?.currency||"INR")}</b></div><div><UsersRound size={15}/><span>Client</span><b>{p.clients?.name||"Unassigned"}</b></div></section>
  <div className={styles.grid}><section className={styles.panel}><header><div><span>Project documents</span><h2>Financial record</h2></div></header><div className={styles.table}>{data.documents.map(d=><a href={"/invoices/"+d.id} className={styles.row} key={d.id}><span><b>{d.document_number}</b><small>{d.type} · {d.issue_date}</small></span><i>{label(d.status)}</i><strong>{money(d.draft_payload?.totals?.totalMinor,d.currency)}</strong><ArrowUpRight size={13}/></a>)}{!data.documents.length&&<div className={styles.empty}>No documents are linked to this project yet. New document linkage can be added from the document workflow.</div>}</div></section>
  <aside className={styles.panel}><header><div><span>Continuity</span><h2>Project state</h2></div></header><div className={styles.form}><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="ACTIVE">Active</option><option value="ON_HOLD">On hold</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label><button className={styles.primary} disabled={saving} onClick={save}><Save size={13}/>{saving?"Saving…":"Save state"}</button>{message&&<small>{message}</small>}</div><div className={styles.client}><span>Client</span><b>{p.clients?.name||"Unassigned"}</b><small>{p.clients?.email||p.clients?.company||"No contact details"}</small></div></aside></div>
 </AppShell>
}