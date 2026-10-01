export const invoiceStatuses=["DRAFT","SENT","VIEWED","PARTIALLY_PAID","PAID","OVERDUE","CANCELLED","VOID"] as const;
export type InvoiceStatus=typeof invoiceStatuses[number];
const transitions:Record<InvoiceStatus,readonly InvoiceStatus[]>={
DRAFT:["SENT"],SENT:["VIEWED","PARTIALLY_PAID","PAID","OVERDUE","CANCELLED"],VIEWED:["PARTIALLY_PAID","PAID","OVERDUE","CANCELLED"],PARTIALLY_PAID:["PAID","OVERDUE"],OVERDUE:["PARTIALLY_PAID","PAID","CANCELLED"],PAID:[],CANCELLED:[],VOID:[]
};
export function canTransition(from:InvoiceStatus,to:InvoiceStatus){return transitions[from].includes(to)}
export function transitionInvoice(from:InvoiceStatus,to:InvoiceStatus):InvoiceStatus{if(!canTransition(from,to))throw new Error("Invalid invoice state transition: "+from+" → "+to);return to}
export type DeliveryState="NOT_SENT"|"SENT"|"VIEWED";
export type PaymentState="UNPAID"|"PARTIALLY_PAID"|"PAID"|"REFUNDED";
export type ComplianceState="NOT_APPLICABLE"|"PENDING"|"VALID"|"FAILED"|"CANCELLED";
export interface InvoiceSnapshot{issuer:unknown;recipient:unknown;lines:unknown[];currency:string;paymentInstructions:unknown;templateVersion:string;compliance:unknown}