"use client";
import {useEffect,useMemo,useState} from "react";
import {ArrowUpRight,FolderKanban,Plus,Search} from "lucide-react";
import AppShell from "../../components/AppShell";
import styles from "./page.module.css";

type Project={id:string;name:string;code:string|null;description:string|null;status:string;start_date:string|null;end_date:string|null;client_id:string|null;clients?:{name?:string|null;company?:string|null}};
const label=(s:string)=>s.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export default function Projects(){
 const [rows,setRows]=useState<Project[]>([]),[clients,setClients]=useState<{id:string;name:string;company:string|null}[]>([]),[q,setQ]=useState(""),[open,setOpen]=useState(false),[name,setName]=useState(""),[clientId,setClientId]=useState(""),[description,setDescription]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const workspace=()=>localStorage.getItem("finbooksos.workspace");
 async function load(){const w=workspace();if(!w)return;const q=encodeURIComponent(w);const [pr,cr]=await Promise.all([fetch("/api/projects?workspaceId="+q),fetch("/api/clients?workspaceId="+q)]);const [p,c]=await Promise.all([pr.json(),cr.json()]);if(!pr.ok)throw new Error(p.error||"Unable to load projects");setRows(p.data??[]);setClients(c.data??[])}
 useEffect(()=>{load().catch(e=>setError(e.message||"Unable to load projects"))},[]);
 const filtered=useMemo(()=>{const s=q.trim().toLowerCase();return !s?rows:rows.filter(r=>(r.name+" "+(r.code??"")+" "+(r.clients?.name??"")+" "+r.status).toLowerCase().includes(s))},[rows,q]);
 async function create(){if(!name.trim())return;setSaving(true);setError("");const r=await fetch("/api/projects",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId:workspace(),name,clientId:clientId||null,description})});const d=await r.json();if(!r.ok){setError(d.error||"Unable to create project");setSaving(false);return}setOpen(false);setName("");setClientId("");setDescription("");await load();setSaving(false)}
 return <AppShell title="Projects" subtitle="Keep ongoing client work connected to the documents and receivables it produces." action={<button className={styles.primary} onClick={()=>setOpen(true)}><Plus size={14}/> New project</button>}>
  <section className={styles.stats}><div><FolderKanban size={16}/><span>Active projects</span><b>{rows.filter(r=>r.status==="ACTIVE").length}</b></div><div><span>On hold</span><b>{rows.filter(r=>r.status==="ON_HOLD").length}</b></div><div><span>Completed</span><b>{rows.filter(r=>r.status==="COMPLETED").length}</b></div></section>
  <section className={styles.toolbar}><div className={styles.search}><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects or clients…"/></div><span>{filtered.length} projects</span></section>
  {error&&<div className={styles.error}>{error}</div>}
  <div className={styles.table}><div className={styles.head}><span>Project</span><span>Client</span><span>Dates</span><span>Status</span></div>{filtered.map(r=><a className={styles.row} href={"/projects/"+r.id} key={r.id}><div><b>{r.name}</b><small>{r.code??"No project code"}{r.description?" · "+r.description:""}</small></div><span>{r.clients?.name??r.clients?.company??"Unassigned"}</span><span>{r.start_date??"—"}{r.end_date?" → "+r.end_date:""}</span><i>{label(r.status)}</i><ArrowUpRight size={13}/></a>)}{!filtered.length&&<div className={styles.empty}>No projects yet. Create the first ongoing client workstream.</div>}</div>
  {open&&<div className={styles.overlay} onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><div className={styles.modal}><span className={styles.kicker}>Projects / New</span><h2>Start a project</h2><label>Project name<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Brand identity / Wedding film / Retainer"/></label><label>Client<select value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">Unassigned</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.company?" — "+c.company:""}</option>)}</select></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What ongoing work does this project contain?"/></label><div className={styles.actions}><button onClick={()=>setOpen(false)}>Cancel</button><button className={styles.primary} disabled={saving||!name.trim()} onClick={create}>{saving?"Creating…":"Create project"}</button></div></div></div>}
 </AppShell>
}