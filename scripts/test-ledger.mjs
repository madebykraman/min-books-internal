import assert from "node:assert/strict";
import {allocationByDocument,confirmedPaymentTotal,documentBalance,isConfirmedPayment,isReceivable} from "../lib/financial/ledger.ts";

const confirmed={amount_minor:5000,status:"CONFIRMED",payment_allocations:[{document_id:"invoice-a",amount_minor:3000},{document_id:"invoice-b",amount_minor:2000}]};
const second={amount_minor:2500,status:"CONFIRMED",payment_allocations:[{document_id:"invoice-a",amount_minor:2500}]};
const voided={amount_minor:9000,status:"VOID",payment_allocations:[{document_id:"invoice-a",amount_minor:9000}]};

assert.equal(isConfirmedPayment(confirmed),true);
assert.equal(isConfirmedPayment(voided),false);
assert.deepEqual([...allocationByDocument([confirmed,second,voided])],[["invoice-a",5500],["invoice-b",2000]]);
assert.equal(confirmedPaymentTotal([confirmed,second,voided]),7500);

const allocations=allocationByDocument([confirmed,second]);
assert.equal(documentBalance({id:"invoice-a",status:"PARTIALLY_PAID",draft_payload:{totals:{totalMinor:"10000"}}},allocations),4500);
assert.equal(documentBalance({id:"invoice-b",status:"PAID",draft_payload:{totals:{totalMinor:"2000"}}},allocations),0);
assert.equal(documentBalance({id:"invoice-c",status:"SENT",draft_payload:{totals:{totalMinor:"100"}}},allocations),100);
assert.equal(documentBalance({id:"invoice-d",status:"SENT",draft_payload:{totals:{totalMinor:"100"}}},new Map([["invoice-d",150]])),0);

assert.equal(isReceivable("DRAFT"),false);
assert.equal(isReceivable("CANCELLED"),false);
assert.equal(isReceivable("VOID"),false);
assert.equal(isReceivable("SENT"),true);
assert.equal(isReceivable("PARTIALLY_PAID"),true);
assert.equal(isReceivable("PAID"),true);

console.log("ledger invariants: ok");
