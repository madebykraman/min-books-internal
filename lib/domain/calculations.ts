const SCALE=1000000n;
export interface CalculationLine{quantity:number|string;unitPriceMinor:number|bigint|string;taxRate:number|string}
export interface InvoiceTotals{subtotalMinor:bigint;taxMinor:bigint;totalMinor:bigint}
function decimalToScaled(value:number|string,scale=SCALE){const s=String(value).trim();if(!/^[-+]?\d+(?:\.\d+)?$/.test(s))throw new Error("Invalid decimal");const neg=s.startsWith("-");const clean=s.replace(/^[-+]/,"");const [whole,fraction=""]=clean.split(".");const frac=(fraction+"000000").slice(0,6);const out=BigInt(whole)*scale+BigInt(frac);return neg?-out:out}
function divRound(n:bigint,d:bigint){const sign=n<0n?-1n:1n;const a=n<0n?-n:n;const q=a/d;const r=a%d;return sign*(q+(r*2n>=d?1n:0n))}
export function calculateInvoiceTotals(lines:CalculationLine[]):InvoiceTotals{
 let subtotal=0n,tax=0n;
 for(const line of lines){const quantity=decimalToScaled(line.quantity);const unit=BigInt(line.unitPriceMinor);const base=divRound(quantity*unit,SCALE);subtotal+=base;const rate=decimalToScaled(line.taxRate);tax+=divRound(base*rate,100n*SCALE)}
 return {subtotalMinor:subtotal,taxMinor:tax,totalMinor:subtotal+tax};
}
export function minorToMajorString(minor:bigint,scale=2){const neg=minor<0n;const value=neg?-minor:minor;const base=10n**BigInt(scale);const whole=value/base;const fraction=value%base;return (neg?"-":"")+whole+"."+fraction.toString().padStart(scale,"0")}