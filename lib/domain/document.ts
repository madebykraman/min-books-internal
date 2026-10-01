export type DocumentType="QUOTE"|"INVOICE"|"CREDIT_NOTE"|"RECEIPT"|"PURCHASE_ORDER";
export type DocumentBlockType="HEADER"|"PARTIES"|"LINE_ITEMS"|"TOTALS"|"TAX_SUMMARY"|"PAYMENT"|"NOTES"|"TERMS"|"SIGNATURE"|"QR"|"FOOTER";
export interface DocumentBlock{type:DocumentBlockType;visible:boolean;order:number;spacing:number;alignment:"left"|"center"|"right";dataBinding?:string;conditions?:Record<string,unknown>}
export interface DocumentLayout{pageSize:"A4"|"LETTER";blocks:DocumentBlock[];styleProfileId:string}
export interface DocumentVersion{documentId:string;version:number;issuedAt:string|null;immutable:boolean;layout:DocumentLayout;payload:unknown}