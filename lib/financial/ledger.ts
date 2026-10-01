export type LedgerAllocation = {
  document_id: string;
  amount_minor: number;
};

export type LedgerPayment = {
  amount_minor: number;
  status?: string;
  payment_date?: string;
  payment_allocations?: LedgerAllocation[];
};

export type LedgerDocument = {
  id: string;
  status: string;
  draft_payload?: {totals?: {totalMinor?: string}};
};

export const isConfirmedPayment = (payment: LedgerPayment) =>
  (payment.status ?? "CONFIRMED") === "CONFIRMED";

export function allocationByDocument(payments: LedgerPayment[]) {
  const totals = new Map<string, number>();
  for (const payment of payments) {
    if (!isConfirmedPayment(payment)) continue;
    for (const allocation of payment.payment_allocations ?? []) {
      totals.set(
        allocation.document_id,
        (totals.get(allocation.document_id) ?? 0) + Number(allocation.amount_minor || 0)
      );
    }
  }
  return totals;
}

export const documentTotal = (document: LedgerDocument) =>
  Number(document.draft_payload?.totals?.totalMinor ?? 0);

export function documentBalance(
  document: LedgerDocument,
  allocations: Map<string, number>
) {
  return Math.max(documentTotal(document) - (allocations.get(document.id) ?? 0), 0);
}

export const isReceivable = (status: string) =>
  !["DRAFT", "CANCELLED", "VOID"].includes(status);

export function confirmedPaymentTotal(payments: LedgerPayment[]) {
  return payments.reduce(
    (sum, payment) => sum + (isConfirmedPayment(payment) ? Number(payment.amount_minor || 0) : 0),
    0
  );
}

export type LedgerCreditApplication={invoice_id:string;amount_minor:number};
export function creditAllocationByDocument(applications:LedgerCreditApplication[]){const totals=new Map<string,number>();for(const a of applications)totals.set(a.invoice_id,(totals.get(a.invoice_id)??0)+Number(a.amount_minor||0));return totals;}
