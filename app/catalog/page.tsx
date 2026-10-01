"use client";
import {useEffect,useMemo,useState} from "react";
import {Box,Plus,Search,Tag} from "lucide-react";
import AppShell from "../../components/AppShell";
import styles from "./page.module.css";
type Product={id:string;name:string;description:string|null;unit:string;currency:string;unit_price_minor:number;tax_rate:number};
const money=(v:number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency}).format(v/100);
export default function Catalog(){
 const [rows,setRows]=useState<Product[]>([]),[q,setQ]=useState(""),[open,setOpen]=useState(false),[name,setName]=useState(""),[price,setPrice]=useState(""),[tax,setTax]=useState("18"),[error,setError]=useState("");
 async function load(){const w=localStorage.getItem("finbooksos.workspace");if(!w)return;const r=await fetch("/api/products?workspaceId="+encodeURIComponent(w));const d=await r.json();if(r.ok)setRows(d.data??[]);else setError(d.error||"Unable to load catalog")}
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>rows.filter(r=>(r.name+" "+(r.description??"")).toLowerCase().includes(q.toLowerCase())),[rows,q]);
 async function add(){const w=localStorage.getItem("finbooksos.workspace");if(!w||!name)return;const r=await fetch("/api/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId:w,name,unitPriceMinor:Math.round(Number(price||0)*100),taxRate:Number(tax)})});const d=await r.json();if(!r.ok){setError(d.error||"Unable to save");return}setRows([d.data,...rows]);setName("");setPrice("");setTax("18");setOpen(false)}
 return <AppShell title="Catalog" subtitle="Reusable services, products and tax defaults." action={<button className={styles.primary} onClick={()=>setOpen(true)}><Plus size={14}/> Add item</button>}>
  <div className={styles.toolbar}><div className={styles.search}><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search catalog…"/></div><span>{rows.length} items</span></div>
  {error&&<div className={styles.error}>{error}</div>}
  <div className={styles.grid}>{filtered.map(p=><article className={styles.card} key={p.id}><div className={styles.icon}><Box size={16}/></div><div className={styles.main}><div><b>{p.name}</b><small>{p.description||"Reusable invoice line item"}</small></div><strong>{money(p.unit_price_minor,p.currency)}</strong></div><div className={styles.meta}><span>{p.unit}</span><span><Tag size={11}/> {p.tax_rate}% GST</span></div></article>)}</div>
  {!filtered.length&&!error&&<div className={styles.empty}><Box size={18}/><b>{rows.length?"No matches":"Catalog is empty"}</b><span>Add your recurring services once; invoice creation can reuse them.</span></div>}
  {open&&<div className={styles.overlay} onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><div className={styles.modal}><div><span className={styles.kicker}>Catalog / New</span><h2>Add catalog item</h2></div><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Brand strategy"/></label><div className={styles.formGrid}><label>Price<input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="45000"/></label><label>GST<input type="number" value={tax} onChange={e=>setTax(e.target.value)} /></label></div><div className={styles.modalActions}><button onClick={()=>setOpen(false)}>Cancel</button><button className={styles.primary} onClick={add}>Save item</button></div></div></div>}
 </AppShell>
}
