import assert from "node:assert/strict";
import {calculateInvoiceTotals,minorToMajorString,validateCalculationLine,validateInvoiceInput} from "../lib/domain/calculations.ts";

assert.deepEqual(calculateInvoiceTotals([{quantity:"2",unitPriceMinor:12500,taxRate:"18"}]),{subtotalMinor:25000n,taxMinor:4500n,totalMinor:29500n});
assert.deepEqual(calculateInvoiceTotals([{quantity:"0.333333",unitPriceMinor:10000,taxRate:"0"}]),{subtotalMinor:3333n,taxMinor:0n,totalMinor:3333n});
assert.deepEqual(calculateInvoiceTotals([{quantity:"1",unitPriceMinor:10001,taxRate:"2.5"}]),{subtotalMinor:10001n,taxMinor:250n,totalMinor:10251n});
assert.equal(minorToMajorString(29500n),"295.00");
assert.equal(minorToMajorString(-125n),"-1.25");

assert.throws(()=>validateCalculationLine({quantity:"0",unitPriceMinor:100,taxRate:"0"}),/quantity must be greater/);
assert.throws(()=>validateCalculationLine({quantity:"1",unitPriceMinor:-1,taxRate:"0"}),/unit price cannot be negative/);
assert.throws(()=>validateCalculationLine({quantity:"1",unitPriceMinor:100,taxRate:"100.01"}),/tax rate must be between/);
assert.throws(()=>validateCalculationLine({quantity:"1.0000001",unitPriceMinor:100,taxRate:"0"}),/Invalid decimal/);

assert.doesNotThrow(()=>validateInvoiceInput([{description:"Design",qty:"1.5",rate:"2500",tax:"18"}]));
assert.throws(()=>validateInvoiceInput([]),/at least one line/);
assert.throws(()=>validateInvoiceInput([{description:"",qty:"1",rate:"10",tax:"0"}]),/description is required/);
assert.throws(()=>validateInvoiceInput([{description:"Design",qty:"1",rate:"10",tax:"100.1"}]),/tax rate/);
assert.throws(()=>validateInvoiceInput(Array.from({length:501},()=>({description:"Design",qty:"1",rate:"10",tax:"0"}))),/more than 500/);

console.log("calculation invariants: ok");
