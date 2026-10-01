"use client";

import {Bell,ChevronDown,FileBarChart2,LayoutDashboard,ReceiptText,Settings2,Users,WalletCards,CircleDollarSign,PackageOpen,Workflow,Check,FileCheck2,FolderKanban} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useMemo,useState} from "react";
import styles from "./AppShell.module.css";
import GlobalSearch from "./GlobalSearch";

const nav=[
  ["Overview","/",LayoutDashboard],
  ["Invoices","/invoices",ReceiptText],
  ["Quotes","/quotes",FileCheck2],
  ["Clients","/clients",Users],\n  ["Projects","/projects",FolderKanban],
  ["Payments","/payments",WalletCards],
  ["Expenses","/expenses",CircleDollarSign],
  ["Catalog","/catalog",PackageOpen],
  ["Automations","/automations",Workflow],
  ["Reports","/reports",FileBarChart2],
] as const;

type Org={id:string;name:string;legal_name?:string|null;logo_url?:string|null;accent_hex?:string|null;workspaces?:{id:string}[]};

export default function AppShell({children,title="Overview",subtitle,action}:{children:React.ReactNode;title?:string;subtitle?:string;action?:React.ReactNode}){
  const pathname=usePathname();
  const [orgs,setOrgs]=useState<Org[]>([]);
  const [orgId,setOrgId]=useState<string|null>(null);
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    fetch("/api/organizations",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
      const rows=(d?.data??[]) as Org[];
      setOrgs(rows);
      const stored=window.localStorage.getItem("finbooksos.organization");
      const selected=rows.find(o=>o.id===stored)??rows[0];
      if(selected){
        setOrgId(selected.id);
        const workspace=selected.workspaces?.[0]?.id;
        if(workspace) window.localStorage.setItem("finbooksos.workspace",workspace);
        window.localStorage.setItem("finbooksos.organization",selected.id);
      }
    }).catch(()=>{});
  },[]);

  const active=useMemo(()=>orgs.find(o=>o.id===orgId)??null,[orgs,orgId]);

  function selectOrg(next:Org){
    setOrgId(next.id);
    window.localStorage.setItem("finbooksos.organization",next.id);
    const workspace=next.workspaces?.[0]?.id;
    if(workspace) window.localStorage.setItem("finbooksos.workspace",workspace);
    setOpen(false);
    window.location.reload();
  }

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.orgWrap}>
        <button className={styles.orgTrigger} onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
          <span className={styles.orgMark}>{active?.logo_url?<img src={active.logo_url} alt=""/>:active?.name?.slice(0,1).toUpperCase()||"—"}</span>
          <span className={styles.orgCopy}><b>{active?.name||"Select organisation"}</b><small>{active?.legal_name||"Billing workspace"}</small></span>
          <ChevronDown size={14}/>
        </button>
        {open&&<div className={styles.orgMenu}>
          {orgs.map(o=><button key={o.id} className={o.id===active?.id?styles.orgSelected:undefined} onClick={()=>selectOrg(o)}>
            <span className={styles.orgMenuMark}>{o.logo_url?<img src={o.logo_url} alt=""/>:o.name.slice(0,1).toUpperCase()}</span>
            <span><b>{o.name}</b><small>{o.legal_name||"Organisation"}</small></span>
            {o.id===active?.id&&<Check size={14}/>}
          </button>)}
          {!orgs.length&&<div className={styles.orgEmpty}>No organisations available.</div>}
        </div>}
      </div>
      <div className={styles.groupLabel}>Main menu</div>
      <nav className={styles.nav}>{nav.map(([label,href,Icon])=>{
        const activeRoute=href==="/" ? pathname==="/" : pathname.startsWith(href);
        return <Link href={href} key={label} className={activeRoute?styles.active:styles.item}><Icon size={16}/><span>{label}</span></Link>
      })}</nav>
      <div className={styles.groupLabel}>Other</div>
      <nav className={styles.nav}><Link href="/settings" className={pathname.startsWith("/settings")?styles.active:styles.item}><Settings2 size={16}/><span>Settings</span></Link></nav>
      <div className={styles.sidebarBottom}><span className={styles.avatar}>{active?.name?.slice(0,1).toUpperCase()||"—"}</span><span><b>{active?.name||"Organisation"}</b><small>{active?.legal_name||"Current workspace"}</small></span></div>
    </aside>

    <section className={styles.content}>
      <header className={styles.topbar}>
        <div className={styles.mobileTitle}><span className={styles.mobileMark}>{active?.name?.slice(0,1).toUpperCase()||"—"}</span><b>{active?.name||"Organisation"}</b></div>
        <GlobalSearch />
        <div className={styles.topActions}><button className={styles.icon} aria-label="Notifications"><Bell size={16}/><i/></button><button className={styles.profile}><span>{active?.name?.slice(0,1).toUpperCase()||"—"}</span><b>{active?.name||"Organisation"}</b><ChevronDown size={13}/></button></div>
      </header>
      <div className={styles.inner}>
        <header className={styles.pageHead}><div><span className={styles.kicker}>Financial workspace</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>
        {children}
      </div>
    </section>
  </main>
}
