import {notFound} from "next/navigation";
import {createClient} from "../../../lib/supabase/server";
import styles from "./page.module.css";

type InvoiceItem={description?:string;title?:string;qty?:string|number;rate?:string|number;tax?:string|number};
type InvoicePayload={items?:InvoiceItem[];note?:string;totals?:{subtotalMinor?:string;taxMinor?:string;totalMinor?:string}};

const money=(minor?:string|number,currency="INR")=>new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(minor??0)/100);

export default async function PublicInvoice({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const supabase=await createClient();
  const {data:doc}=await supabase
    .from("documents")
    .select("id,document_number,status,issue_date,due_date,currency,public_token")
    .eq("public_token",token)
    .maybeSingle();
  if(!doc)return notFound();

  const {data:version}=await supabase
    .from("document_versions")
    .select("snapshot,payload,version")
    .eq("document_id",doc.id)
    .eq("immutable",true)
    .order("version",{ascending:false})
    .limit(1)
    .maybeSingle();
  if(!version)return notFound();

  const snap=(version.snapshot??{}) as {issuer?:Record<string,unknown>;recipient?:Record<string,unknown>};
  const payload=(version.payload??{}) as InvoicePayload;
  const lines=Array.isArray(payload.items)?payload.items:[];
  const issuer=snap.issuer??{};
  const recipient=snap.recipient??{};
  const total=payload.totals?.totalMinor??"0";
  return <main className={styles.page}>
    <article className={styles.paper}>
      <header className={styles.paperHeader}>
        <div><strong>{String(issuer.display_name||issuer.legal_name||issuer.name||"Organisation")}</strong><small>{String(issuer.email||"")}</small></div>
        <div className={styles.invoice}><span>INVOICE</span><b>{doc.document_number}</b><small>{doc.issue_date}</small></div>
      </header>
      <div className={styles.rule}/>
      <section className={styles.paperMeta}>
        <div><small>BILLED TO</small><strong>{String(recipient.company||recipient.legal_name||recipient.name||"Client")}</strong><span>{String(recipient.email||"")}</span></div>
        <div><small>STATUS</small><strong>{doc.status}</strong><span>Due {doc.due_date||"on receipt"}</span></div>
      </section>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>{lines.map((line,i)=><tr key={i}>
          <td>{line.description||line.title||"Untitled service"}</td>
          <td>{line.qty??1}</td>
          <td>{line.rate==null||line.rate===""?"TBD":money(String(Math.round(Number(line.rate)*100)),doc.currency)}</td>
          <td>{line.rate==null||line.rate===""?"TBD":money(String(Math.round(Number(line.qty??1)*Number(line.rate)*100)),doc.currency)}</td>
        </tr>)}</tbody>
      </table>
      <section className={styles.totals}>
        <div><span>Subtotal</span><b>{money(payload.totals?.subtotalMinor,doc.currency)}</b></div>
        <div><span>Tax</span><b>{money(payload.totals?.taxMinor,doc.currency)}</b></div>
        <div><span>Total</span><b>{money(total,doc.currency)}</b></div>
      </section>
      {payload.note&&<div><small>PAYMENT TERMS</small><p>{payload.note}</p></div>}
      <footer className={styles.paperFooter}><span>Immutable document version {version.version}</span></footer>
    </article>
  </main>;
}
