const SCALE=1000000n;

export interface CalculationLine{quantity:number|string;unitPriceMinor:number|bigint|string;taxRate:number|string}
export interface InvoiceTotals{subtotalMinor:bigint;taxMinor:bigint;totalMinor:bigint}

function decimalToScaled(value:number|string,scale=SCALE){
 const s=String(value).trim();
 if(!/^\+?\d+(?:\.\d+)?$/.test(s))throw new Error("Invalid decimal");
 const clean=s.replace(/^\+/,"");
 const [whole,fraction=""]=clean.split(".");
 const frac=(fraction+"000000").slice(0,6);
 return BigInt(whole)*scale+BigInt(frac);
}

function divRound(n:bigint,d:bigint){
 const sign=n<0n?-1n:1n;const a=n<0n?-n:n;const q=a/d;const r=a%d;
 return sign*(q+(r*2n>=d?1n:0n));
}

export function validateCalculationLine(line:CalculationLine,index=0){
 const quantity=decimalToScaled(line.quantity);
 const unit=BigInt(line.unitPriceMinor);
 const rate=decimalToScaled(line.taxRate);
 if(quantity<=0n)throw new Error(`Line ${index+1}: quantity must be greater than zero`);
 if(unit<0n)throw new Error(`Line ${index+1}: unit price cannot be negative`);
 if(rate<0n||rate>100n*SCALE)throw new Error(`Line ${index+1}: tax rate must be between 0% and 100%`);
 return true;
}

export function validateInvoiceInput(items:unknown){
 if(!Array.isArray(items)||items.length===0)throw new Error("Invoice must contain at least one line item");
 if(items.length>500)throw new Error("Invoice cannot contain more than 500 line items");
 items.forEach((item:any,index)=>{
  const quantity=String(item?.qty??item?.quantity??"").trim();
  const rate=String(item?.rate??item?.unitPrice??"").trim();
  const tax=String(item?.tax??item?.taxRate??"").trim();
  if(!quantity||!/^\+?\d+(?:\.\d+)?$/.test(quantity)||Number(quantity)<=0)throw new Error(`Line ${index+1}: quantity must be greater than zero`);
  if(!rate||!/^\+?\d+(?:\.\d+)?$/.test(rate)||Number(rate)<0)throw new Error(`Line ${index+1}: rate cannot be negative or invalid`);
  if(!tax||!/^\+?\d+(?:\.\d+)?$/.test(tax)||Number(tax)<0||Number(tax)>100)throw new Error(`Line ${index+1}: tax rate must be between 0% and 100%`);
  const description=String(item?.description??item?.title??"").trim();
  if(!description)throw new Error(`Line ${index+1}: description is required`);
  if(description.length>1000)throw new Error(`Line ${index+1}: description is too long`);
 });
 return true;
}

export function calculateInvoiceTotals(lines:CalculationLine[]):InvoiceTotals{
 if(!Array.isArray(lines)||lines.length===0)throw new Error("Invoice must contain at least one line item");
 let subtotal=0n,tax=0n;
 for(const [index,line] of lines.entries()){
  validateCalculationLine(line,index);
  const quantity=decimalToScaled(line.quantity);
  const unit=BigInt(line.unitPriceMinor);
  const base=divRound(quantity*unit,SCALE);
  subtotal+=base;
  const rate=decimalToScaled(line.taxRate);
  tax+=divRound(base*rate,100n*SCALE);
 }
 return {subtotalMinor:subtotal,taxMinor:tax,totalMinor:subtotal+tax};
}

export function minorToMajorString(minor:bigint,scale=2){
 const neg=minor<0n;const value=neg?-minor:minor;const base=10n**BigInt(scale);
 const whole=value/base;const fraction=value%base;
 return (neg?"-":"")+whole+"."+fraction.toString().padStart(scale,"0");
}
