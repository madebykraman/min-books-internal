export type DateRange={from:string;to:string};
export function parseDate(v:string){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);if(!m)throw new Error("Invalid date");const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[3])throw new Error("Invalid date");return d}
export function periodDays(r:DateRange){return Math.floor((parseDate(r.to).getTime()-parseDate(r.from).getTime())/86400000)+1}
export function previousPeriod(r:DateRange):DateRange{const days=periodDays(r);const end=new Date(parseDate(r.from));end.setUTCDate(end.getUTCDate()-1);const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)}}
export function validateRange(r:DateRange){parseDate(r.from);parseDate(r.to);if(r.from>r.to)throw new Error("From date must not be after to date");return r}
