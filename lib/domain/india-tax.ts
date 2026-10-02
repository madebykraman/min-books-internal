export const GST_STATE_CODES:Record<string,string>={
"01":"Jammu and Kashmir","02":"Himachal Pradesh","03":"Punjab","04":"Chandigarh","05":"Uttarakhand","06":"Haryana","07":"Delhi","08":"Rajasthan","09":"Uttar Pradesh","10":"Bihar","11":"Sikkim","12":"Arunachal Pradesh","13":"Nagaland","14":"Manipur","15":"Mizoram","16":"Tripura","17":"Meghalaya","18":"Assam","19":"West Bengal","20":"Jharkhand","21":"Odisha","22":"Chhattisgarh","23":"Madhya Pradesh","24":"Gujarat","25":"Daman and Diu","26":"Dadra and Nagar Haveli and Daman and Diu","27":"Maharashtra","28":"Andhra Pradesh","29":"Karnataka","30":"Goa","31":"Lakshadweep","32":"Kerala","33":"Tamil Nadu","34":"Puducherry","35":"Andaman and Nicobar Islands","36":"Telangana","37":"Andhra Pradesh (new)","38":"Ladakh","97":"Other Territory"
};

export type TaxMode="EXCLUSIVE"|"INCLUSIVE";
export type SupplyType="INTRA_STATE"|"INTER_STATE"|"EXPORT"|"SEZ";
export type RegistrationType="REGULAR"|"COMPOSITION"|"UNREGISTERED"|"SEZ";

export interface IndiaTaxLine{
 description:string;
 quantity:number|string;
 unitPriceMinor:number|bigint|string;
 taxRate:number|string;
 hsnSac?:string;
}

export interface IndiaTaxContext{
 sellerStateCode?:string|null;
 placeOfSupplyStateCode?:string|null;
 taxMode:TaxMode;
 registrationType:RegistrationType;
 reverseCharge?:boolean;
}

export interface IndiaTaxLineResult{
 taxableMinor:bigint;
 taxMinor:bigint;
 cgstMinor:bigint;
 sgstMinor:bigint;
 igstMinor:bigint;
 cessMinor:bigint;
}

export interface IndiaInvoiceTotals{
 subtotalMinor:bigint;
 taxableMinor:bigint;
 taxMinor:bigint;
 cgstMinor:bigint;
 sgstMinor:bigint;
 igstMinor:bigint;
 cessMinor:bigint;
 totalMinor:bigint;
 supplyType:SupplyType;
 lines:IndiaTaxLineResult[];
}

const SCALE=1000000n;
function scaled(v:number|string){const s=String(v).trim();if(!/^\+?\d+(?:\.\d+)?$/.test(s))throw new Error("Invalid decimal");const [w,f=""]=s.replace(/^\+/,"").split(".");return BigInt(w)*SCALE+BigInt((f+"000000").slice(0,6))}
function round(n:bigint,d:bigint){const q=n/d,r=n%d;return q+(r*2n>=d?1n:0n)}
function moneyMajorToMinor(v:number|string){return round(scaled(v),10000n)}
function validState(code?:string|null){return !!code&&Object.prototype.hasOwnProperty.call(GST_STATE_CODES,code)}

export function deriveSupplyType(ctx:IndiaTaxContext):SupplyType{
 if(ctx.registrationType==="SEZ")return "SEZ";
 if(!ctx.sellerStateCode||!ctx.placeOfSupplyStateCode)return "INTER_STATE";
 return ctx.sellerStateCode===ctx.placeOfSupplyStateCode?"INTRA_STATE":"INTER_STATE";
}

export function validateGstin(gstin?:string|null){
 if(!gstin)return true;
 return /^\d{2}[A-Z0-9]{13}$/.test(gstin.toUpperCase());
}

export function validateHsnSac(code?:string|null){
 if(!code)return false;
 return /^\d{4,8}$/.test(code);
}

export function validateIndiaTaxContext(ctx:IndiaTaxContext){
 const warnings:string[]=[];
 if(ctx.registrationType==="REGULAR"||ctx.registrationType==="SEZ"){
   if(!validState(ctx.sellerStateCode))warnings.push("Seller GST state is required.");
   if(!validState(ctx.placeOfSupplyStateCode))warnings.push("Place of supply state is required.");
 }
 if(ctx.registrationType==="COMPOSITION" && ctx.reverseCharge)warnings.push("Composition taxpayers require a compliance review before reverse-charge treatment.");
 if(ctx.taxMode!=="EXCLUSIVE"&&ctx.taxMode!=="INCLUSIVE")warnings.push("Tax mode is invalid.");
 return warnings;
}

function inclusiveBase(gross:bigint,rate:number|string){
 const r=scaled(rate);
 if(r===0n)return gross;
 return round(gross*SCALE,SCALE+r);
}

export function calculateIndiaInvoiceTotals(lines:IndiaTaxLine[],ctx:IndiaTaxContext):IndiaInvoiceTotals{
 if(!lines.length)throw new Error("Invoice must contain at least one line item");
 const warnings=validateIndiaTaxContext(ctx);if(warnings.length)throw new Error(warnings[0]);
 const supplyType=deriveSupplyType(ctx);
 let subtotal=0n,taxable=0n,cgst=0n,sgst=0n,igst=0n,cess=0n;
 const results:IndiaTaxLineResult[]=[];
 for(const [i,line] of lines.entries()){
   const qty=scaled(line.quantity),price=BigInt(line.unitPriceMinor),rate=scaled(line.taxRate);
   if(qty<=0n)throw new Error(`Line ${i+1}: quantity must be greater than zero`);
   if(price<0n)throw new Error(`Line ${i+1}: rate cannot be negative`);
   if(rate<0n||rate>100n*SCALE)throw new Error(`Line ${i+1}: tax rate must be between 0% and 100%`);
   if(!validateHsnSac(line.hsnSac))throw new Error(`Line ${i+1}: HSN/SAC must contain 4 to 8 digits`);
   const gross=round(qty*price,SCALE);
   const taxRateMinor=rate;
   const base=ctx.taxMode==="INCLUSIVE"?inclusiveBase(gross,line.taxRate):gross;
   const tax=ctx.taxMode==="INCLUSIVE"?gross-base:round(base*taxRateMinor,100n*SCALE);
   const local=supplyType==="INTRA_STATE"||supplyType==="SEZ";
   const lineCgst=local&&!ctx.reverseCharge?round(tax,2n):0n;
   const lineSgst=local&&!ctx.reverseCharge?tax-lineCgst:0n;
   const lineIgst=!local||ctx.reverseCharge?tax:0n;
   subtotal+=gross;taxable+=base;cgst+=lineCgst;sgst+=lineSgst;igst+=lineIgst;
   results.push({taxableMinor:base,taxMinor:tax,cgstMinor:lineCgst,sgstMinor:lineSgst,igstMinor:lineIgst,cessMinor:0n});
 }
 return {subtotalMinor:subtotal,taxableMinor:taxable,taxMinor:cgst+sgst+igst,cgstMinor:cgst,sgstMinor:sgst,igstMinor:igst,cessMinor:cess,totalMinor:ctx.taxMode==="INCLUSIVE"?subtotal:taxable+cgst+sgst+igst+cess, supplyType,lines:results};
}

export function complianceWarnings(input:{gstin?:string|null;registrationType:RegistrationType;taxableLines:number;hsnMissing:number;sellerStateCode?:string|null;placeOfSupplyStateCode?:string|null;invoiceNumber?:string|null;invoiceDate?:string|null}){
 const warnings:string[]=[];
 if(input.registrationType==="REGULAR"&&!validateGstin(input.gstin))warnings.push("GSTIN format is invalid.");
 if(input.registrationType==="REGULAR"&&!input.gstin)warnings.push("GST registration is marked regular but GSTIN is missing.");
 if(input.hsnMissing>0)warnings.push(`${input.hsnMissing} taxable line(s) are missing HSN/SAC.`);
 if(!validState(input.sellerStateCode))warnings.push("Seller GST state is missing.");
 if(!validState(input.placeOfSupplyStateCode))warnings.push("Place of supply is missing.");
 if(!input.invoiceNumber)warnings.push("Invoice number is missing.");
 if(!input.invoiceDate)warnings.push("Invoice date is missing.");
 return warnings;
}
