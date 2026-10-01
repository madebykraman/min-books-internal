import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import {calculateInvoiceTotals,majorToMinor} from "@/lib/domain/calculations";

const PAGE = { width: 595.2756, height: 841.8898 };
const BLACK = rgb(0.05,0.05,0.06), MUTED = rgb(0.40,0.40,0.44), LINE = rgb(0.78,0.78,0.80);
const safe=(v:unknown)=>String(v??"").replace(/[\r
\t]+/g, " ");
const money=(minor:number)=>"₹"+(minor/100).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const date=(v:string|null|undefined)=>v?new Date(v+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):"—";
function wrap(text:string,font:any,size:number,width:number){const words=safe(text).split(/\s+/).filter(Boolean);const out:string[]=[];let line="";for(const word of words){const next=line?line+" "+word:word;if(!line||font.widthOfTextAtSize(next,size)<=width)line=next;else{out.push(line);line=word}}if(line)out.push(line);return out}
function text(page:any,value:string,x:number,y:number,font:any,size:number,color=BLACK){page.drawText(safe(value),{x,y,font,size,color})}
function right(page:any,value:string,rightX:number,y:number,font:any,size:number,color=BLACK){const s=safe(value);text(page,s,rightX-font.widthOfTextAtSize(s,size),y,font,size,color)}
async function imageFromUrl(pdf:any,url:string|null|undefined){if(!url)return null;try{const res=await fetch(url);if(!res.ok)return null;const bytes=await res.arrayBuffer();const type=(res.headers.get("content-type")||"").toLowerCase();return type.includes("png")?pdf.embedPng(bytes):pdf.embedJpg(bytes)}catch{return null}}

export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return new NextResponse("Unauthorized",{status:401});

  const {data:doc,error}=await supabase.from("documents").select("*,clients(*),document_versions(*)").eq("id",id).maybeSingle();
  if(error||!doc)return new NextResponse("Invoice not found",{status:404});
  const {data:profile}=await supabase.from("business_profiles").select("*").eq("workspace_id",doc.workspace_id).maybeSingle();
  const {data:workspace}=await supabase.from("workspaces").select("organization_id").eq("id",doc.workspace_id).maybeSingle();
  const {data:org}=workspace?.organization_id?await supabase.from("organizations").select("*").eq("id",workspace.organization_id).maybeSingle():{data:null};
  const versions:any[]=Array.isArray(doc.document_versions)?doc.document_versions:[];
  const immutableVersion=versions.filter(v=>v?.immutable).sort((a,b)=>Number(b.version??0)-Number(a.version??0))[0];
  const snapshot:any=immutableVersion?.snapshot??{};
  const issuer:any=snapshot.issuer??org??profile??{};
  const payload:any=immutableVersion?.payload??doc.draft_payload??{};
  const items=Array.isArray(payload.items)?payload.items:(Array.isArray(snapshot.lines)?snapshot.lines:[]);
  const totals=payload.totals??{};

  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const regular=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-Regular.ttf")),{subset:true});
  const semibold=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","Geist-SemiBold.ttf")),{subset:true});
  const mono=await pdf.embedFont(await readFile(join(process.cwd(),"public","fonts","GeistMono-Regular.ttf")),{subset:true});

  let page=pdf.addPage([PAGE.width,PAGE.height]);let y=PAGE.height-54;
  const orgLogo=await imageFromUrl(pdf,issuer.logo_url??null);
  if(orgLogo){const d=orgLogo.scale(Math.min(40/orgLogo.width,40/orgLogo.height));page.drawImage(orgLogo,{x:48,y:y-d.height+7,width:d.width,height:d.height})}
  text(page,safe(issuer.display_name||issuer.name||issuer.legal_name||""),48+(orgLogo?50:0),y,semibold,15);
  right(page,doc.type==="QUOTE"?"QUOTE":"INVOICE",547,y,semibold,9,MUTED);right(page,safe(doc.document_number),547,y-18,mono,12);right(page,date(doc.issue_date),547,y-36,regular,9,MUTED);
  y-=70;page.drawLine({start:{x:48,y},end:{x:547,y},thickness:.6,color:LINE});y-=26;
  text(page,"BILLED TO",48,y,semibold,8,MUTED);text(page,"PAY TO",320,y,semibold,8,MUTED);y-=17;
  const client:any=snapshot.recipient??doc.clients??{};const clientLines=[client.legal_name||client.name||"Client",client.email||"",client.phone||"",client.gstin?"GSTIN: "+client.gstin:"",client.pan?"PAN: "+client.pan:""].filter(Boolean);
  clientLines.slice(0,6).forEach((v:string,i:number)=>text(page,v,48,y-i*13,i===0?semibold:regular,9));
  const payLines=[issuer.payee_name||issuer.legal_name||issuer.display_name||"",issuer.account_number?"A/C "+issuer.account_number:"",issuer.bank_name?"Bank "+issuer.bank_name:"",issuer.branch_name?"Branch "+issuer.branch_name:"",issuer.ifsc_code?"IFSC "+issuer.ifsc_code:"",issuer.pan?"PAN "+issuer.pan:""].filter(Boolean);
  payLines.slice(0,6).forEach((v:string,i:number)=>text(page,v,320,y-i*13,i===0?semibold:regular,9));
  y-=92;
  text(page,"DESCRIPTION",48,y,semibold,8,MUTED);right(page,"QTY",425,y,semibold,8,MUTED);right(page,"RATE",490,y,semibold,8,MUTED);right(page,"AMOUNT",547,y,semibold,8,MUTED);y-=9;
  page.drawLine({start:{x:48,y},end:{x:547,y},thickness:.7,color:BLACK});y-=19;

  const drawFooter=()=>{text(page,safe(issuer.invoice_footer_line_1||"Please contact the issuing organisation in case of any queries."),48,45,regular,7.5,MUTED);text(page,safe(issuer.invoice_footer_line_2||"Thank you for your time."),48,33,regular,7.5,MUTED)};
  for(let i=0;i<items.length;i++){
    const item:any=items[i]||{};const descLines=wrap(item.description||item.title||"Untitled service",regular,8.5,330);const lineH=Math.max(20,descLines.length*11);
    if(y-lineH<115){drawFooter();page=pdf.addPage([PAGE.width,PAGE.height]);y=PAGE.height-54;text(page,safe(issuer.display_name||issuer.name||""),48,y,semibold,13);right(page,safe(doc.document_number),547,y,mono,10);y-=35;text(page,"DESCRIPTION",48,y,semibold,8,MUTED);right(page,"QTY",425,y,semibold,8,MUTED);right(page,"RATE",490,y,semibold,8,MUTED);right(page,"AMOUNT",547,y,semibold,8,MUTED);y-=10;page.drawLine({start:{x:48,y},end:{x:547,y},thickness:.7,color:BLACK});y-=19}
    descLines.forEach((v:string,j:number)=>text(page,v,48,y-j*11,regular,8.5));
    right(page,String(item.qty??1),425,y,mono,8.5);
    right(page,item.rate==null||item.rate===""?"TBD":money(Number(majorToMinor(String(item.rate)))),490,y,mono,8.5);
    right(page,item.rate==null||item.rate===""?"TBD":money(Number(calculateInvoiceTotals([{quantity:item.qty??1,unitPriceMinor:majorToMinor(String(item.rate)),taxRate:item.tax??0}]).subtotalMinor)),547,y,mono,8.5);
    y-=lineH;page.drawLine({start:{x:48,y:y+7},end:{x:547,y:y+7},thickness:.25,color:LINE});
  }
  if(y<170){drawFooter();page=pdf.addPage([PAGE.width,PAGE.height]);y=PAGE.height-70}
  page.drawLine({start:{x:48,y:y+8},end:{x:547,y:y+8},thickness:.7,color:BLACK});y-=12;
  right(page,"SUBTOTAL",450,y,semibold,8,MUTED);right(page,money(Number(totals.subtotalMinor??0)),547,y,mono,9);y-=16;
  right(page,"TAX",450,y,semibold,8,MUTED);right(page,money(Number(totals.taxMinor??0)),547,y,mono,9);y-=20;
  right(page,"TOTAL",450,y,semibold,9);right(page,money(Number(totals.totalMinor??0)),547,y,mono,11);y-=32;
  if(payload.note){text(page,"PAYMENT TERMS",48,y,semibold,8,MUTED);wrap(payload.note,regular,8.5,330).slice(0,3).forEach((v:string,i:number)=>text(page,v,48,y-14-i*11,regular,8.5))}
  drawFooter();

  const bytes=await pdf.save();
  return new NextResponse(bytes,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${doc.type==="QUOTE"?"Quote":"Invoice"}-${safe(doc.document_number)}.pdf"`,"Cache-Control":"private, no-store"}});
}
