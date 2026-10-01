"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {ArrowRight,FileText,Package,Search,Users,WalletCards,X} from "lucide-react";
import {useRouter} from "next/navigation";
import styles from "./GlobalSearch.module.css";

type Result={id:string;title:string;meta:string;href:string;kind:"Invoice"|"Client"|"Catalog"|"Payment"};
type Invoice={id:string;document_number:string;status:string;clients?:{name?:string|null}};
type Client={id:string;name:string;email?:string|null;company?:string|null};
type Product={id:string;name:string;unit_price_minor?:number;currency?:string};
type Payment={id:string;amount_minor:number;currency:string;method:string;reference?:string|null;clients?:{name?:string|null}};

const icons={Invoice:FileText,Client:Users,Catalog:Package,Payment:WalletCards};

export default function GlobalSearch(){
 const router=useRouter();
 const [open,setOpen]=useState(false),[q,setQ]=useState(""),[data,setData]=useState<Result[]>([]),[loading,setLoading]=useState(false),[active,setActive]=useState(0);
 const inputRef=useRef<HTMLInputElement>(null);

 useEffect(()=>{
   const onKey=(e:KeyboardEvent)=>{
     if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setOpen(true);requestAnimationFrame(()=>inputRef.current?.focus())}
     if(e.key==="Escape")setOpen(false);
   };
   window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[]);

 useEffect(()=>{
   if(!open)return;
   const query=q.trim().toLowerCase();
   if(query.length<2){setData([]);setLoading(false);return}
   const timer=window.setTimeout(async()=>{
     const w=localStorage.getItem("finbooksos.workspace");if(!w)return;
     setLoading(true);
     try{
       const qs=encodeURIComponent(w);
       const [ir,cr,pr,rr]=await Promise.all([
         fetch("/api/documents?workspaceId="+qs),fetch("/api/clients?workspaceId="+qs),
         fetch("/api/products?workspaceId="+qs),fetch("/api/payments?workspaceId="+qs)
       ]);
       const [i,c,p,r]=await Promise.all([ir.json(),cr.json(),pr.json(),rr.json()]);
       const out:Result[]=[];
       (i.data??[]).forEach((x:Invoice)=>{const text=(x.document_number+" "+(x.clients?.name??"")+" "+x.status).toLowerCase();if(text.includes(query))out.push({id:x.id,title:x.document_number,meta:(x.clients?.name??"Unassigned")+" · "+x.status,href:"/invoices/"+x.id,kind:"Invoice"})});
       (c.data??[]).forEach((x:Client)=>{const text=(x.name+" "+(x.email??"")+" "+(x.company??"")).toLowerCase();if(text.includes(query))out.push({id:x.id,title:x.name,meta:x.email??x.company??"Client",href:"/clients",kind:"Client"})});
       (p.data??[]).forEach((x:Product)=>{if(x.name.toLowerCase().includes(query))out.push({id:x.id,title:x.name,meta:"Catalog item",href:"/catalog",kind:"Catalog"})});
       (r.data??[]).forEach((x:Payment)=>{const text=((x.clients?.name??"")+" "+x.method+" "+(x.reference??"")).toLowerCase();if(text.includes(query))out.push({id:x.id,title:new Intl.NumberFormat("en-IN",{style:"currency",currency:x.currency}).format(Number(x.amount_minor)/100),meta:(x.clients?.name??"Client")+" · "+x.method.replaceAll("_"," "),href:"/receipts/"+x.id,kind:"Payment"})});
       setData(out.slice(0,12));setActive(0);
     }finally{setLoading(false)}
   },180);
   return()=>window.clearTimeout(timer);
 },[q,open]);

 const groups=useMemo(()=>["Invoice","Client","Catalog","Payment"].map(kind=>({kind,rows:data.filter(x=>x.kind===kind)})).filter(x=>x.rows.length),[data]);
 const flat=groups.flatMap(g=>g.rows);
 function go(item:Result){setOpen(false);setQ("");router.push(item.href)}
 return <>
   <button className={styles.trigger} onClick={()=>{setOpen(true);requestAnimationFrame(()=>inputRef.current?.focus())}} aria-label="Open search"><Search size={15}/><span>Search anything…</span><kbd>⌘K</kbd></button>
   {open&&<div className={styles.backdrop} onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}>
     <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="Global search">
       <div className={styles.inputRow}><Search size={16}/><input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setActive(a=>Math.min(a+1,Math.max(flat.length-1,0)))}else if(e.key==="ArrowUp"){e.preventDefault();setActive(a=>Math.max(a-1,0))}else if(e.key==="Enter"&&flat[active])go(flat[active])}} placeholder="Search invoices, clients, catalog, payments…" autoComplete="off"/><button onClick={()=>setOpen(false)}><X size={15}/></button></div>
       <div className={styles.results}>
         {!q.trim()&&<div className={styles.empty}><Search size={18}/><b>Search the workspace</b><span>Invoices, clients, catalog items and recorded payments.</span></div>}
         {q.trim()&&q.trim().length<2&&<div className={styles.empty}><span>Type at least 2 characters.</span></div>}
         {loading&&<div className={styles.empty}><span>Searching workspace…</span></div>}
         {!loading&&q.trim().length>=2&&!flat.length&&<div className={styles.empty}><b>No matches</b><span>Try an invoice number, client name or catalog item.</span></div>}
         {!loading&&groups.map(group=><div className={styles.group} key={group.kind}><span className={styles.groupLabel}>{group.kind}</span>{group.rows.map(item=>{const Icon=icons[item.kind];const index=flat.indexOf(item);return <button key={item.kind+item.id} className={index===active?styles.resultActive:styles.result} onMouseEnter={()=>setActive(index)} onClick={()=>go(item)}><span className={styles.icon}><Icon size={14}/></span><span><b>{item.title}</b><small>{item.meta}</small></span><ArrowRight size={13}/></button>})}</div>)}
       </div>
       <footer><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></footer>
     </section>
   </div>}
 </>
}
