"use client";

import {
  Bell, ChevronDown, CircleDollarSign, FileBarChart2, LayoutDashboard,
  ReceiptText, Search, Settings2, Users, WalletCards, X, PackageOpen, Workflow
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";
import GlobalSearch from "./GlobalSearch";

const nav=[
  ["Overview","/",LayoutDashboard],
  ["Invoices","/invoices",ReceiptText],
  ["Clients","/clients",Users],
  ["Payments","/payments",WalletCards],
  ["Expenses","/expenses",CircleDollarSign],
  ["Catalog","/catalog",PackageOpen],
  ["Automations","/automations",Workflow],
  ["Reports","/reports",FileBarChart2],
] as const;

export default function AppShell({children,title="Overview",subtitle,action}:{children:React.ReactNode;title?:string;subtitle?:string;action?:React.ReactNode}){
 const pathname=usePathname();
 return <main className={styles.shell}>
  <aside className={styles.sidebar}>
   <Link href="/" className={styles.brand}><span className={styles.brandMark}>F</span><span><b>FinBooksOS</b><small>Commercia Route</small></span></Link>
   <div className={styles.groupLabel}>Main menu</div>
   <nav className={styles.nav}>{nav.map(([label,href,Icon])=>{
    const active=href==="/" ? pathname==="/" : href !== "#" && pathname.startsWith(href);
    return <Link href={href} key={label} className={active?styles.active:styles.item}><Icon size={16}/><span>{label}</span>{label==="Invoices"&&<em>4</em>}</Link>
   })}</nav>
   <div className={styles.groupLabel}>Other</div>
   <nav className={styles.nav}><Link href="/settings" className={styles.item}><Settings2 size={16}/><span>Settings</span></Link></nav>
   <div className={styles.sidebarBottom}><span className={styles.avatar}>A</span><span><b>Workspace</b><small>Independent</small></span><ChevronDown size={14}/></div>
  </aside>
  <section className={styles.content}>
   <header className={styles.topbar}>
    <div className={styles.mobileTitle}><span className={styles.mobileMark}>F</span><b>FinBooksOS</b></div>
    <GlobalSearch />
    <div className={styles.topActions}><button className={styles.icon} aria-label="Notifications"><Bell size={16}/><i/></button><button className={styles.profile}><span>A</span><b>Workspace</b><ChevronDown size={13}/></button></div>
   </header>
   <div className={styles.inner}>
    <header className={styles.pageHead}><div><span className={styles.kicker}>Financial workspace</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>
    {children}
   </div>
  </section>
 </main>
}