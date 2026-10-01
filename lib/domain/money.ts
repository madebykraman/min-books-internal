export type CurrencyCode=string;
export type RoundingMode="HALF_UP"|"HALF_EVEN"|"DOWN"|"UP";
export interface Money{amountMinor:bigint;currency:CurrencyCode;scale:number}
export function assertSameCurrency(a:Money,b:Money){if(a.currency!==b.currency)throw new Error("Currency mismatch")}
export function addMoney(a:Money,b:Money):Money{assertSameCurrency(a,b);return {...a,amountMinor:a.amountMinor+b.amountMinor}}
export function subtractMoney(a:Money,b:Money):Money{assertSameCurrency(a,b);return {...a,amountMinor:a.amountMinor-b.amountMinor}}
export function multiplyMinor(amountMinor:bigint,multiplier:number):bigint{if(!Number.isFinite(multiplier))throw new Error("Invalid multiplier");return BigInt(Math.round(Number(amountMinor)*multiplier))}
export function formatMoney(m:Money,locale="en-IN"){return new Intl.NumberFormat(locale,{style:"currency",currency:m.currency,minimumFractionDigits:m.scale,maximumFractionDigits:m.scale}).format(Number(m.amountMinor)/(10**m.scale))}