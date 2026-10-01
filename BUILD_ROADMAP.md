# FinBooksOS — Master Audit, Checklist & Roadmap

Last audited: 2026-10-01
Governing specification: invoice_product_intelligence_report_final.md
Product doctrine: PRODUCT_DOCTRINE.md

## Hard constraints

- FinBooksOS is the only build target.
- Do not touch minimical.finance.
- Do not modify DealVerify application code.
- Build ahead without waiting for pasted Vercel logs.
- Financial truth stays deterministic and server/domain-owned.
- Issued documents are immutable historical records.
- Separate document, delivery, payment and compliance states.
- Dark-only, dense, premium financial workspace UI.
- No generic AI/SaaS styling, decorative gradients, emoji business UI, giant contextless cards, or purposeless charts.
- Semantic tokens and accessible interaction states remain mandatory.

## Audit status

### Foundation — COMPLETE / HARDENING
- [x] Next.js App Router foundation
- [x] TypeScript build/type blockers previously repaired
- [x] Supabase workspace/member/business foundation
- [x] RLS/workspace isolation
- [x] deterministic bigint invoice calculation engine
- [x] document lifecycle/status model
- [x] immutable document versions and issued snapshots
- [x] audit/event foundation
- [x] authenticated API boundaries
- [ ] production build verification
- [ ] end-to-end auth/session verification against the actual FinBooksOS Vercel project
- [ ] migration application verification on the user's FinBooksOS Supabase project

### Invoice vertical slice — SUBSTANTIALLY COMPLETE
- [x] client selection
- [x] invoice metadata
- [x] line-item CRUD
- [x] centralized calculation
- [x] draft autosave
- [x] live preview
- [x] issue flow
- [x] immutable issue snapshot
- [x] invoice detail/history
- [x] public invoice route
- [x] print/PDF path
- [ ] canonical shared DocumentPreview component
- [ ] strict live-preview/detail/public/PDF parity tests
- [ ] discount support
- [ ] validation/error states for financial edge cases
- [ ] 50+ line stress behavior
- [ ] long client/name/number wrapping
- [ ] zero/negative/partial/tax-rounding test matrix

### Financial operations — ACTIVE
- [x] payment ledger
- [x] payment allocation RPC
- [x] partial-payment state
- [x] receipt route
- [x] expense ledger
- [x] catalog
- [x] settings/business profile
- [x] reminder-rule storage/UI
- [x] reports and CSV export
- [ ] payment reversal/void workflow
- [ ] allocation/reconciliation detail
- [ ] receipt history and reprint parity
- [ ] expense tax/accounting dimensions
- [ ] period filters
- [ ] proper report periods and comparative reporting

### Workspace UX — ACTIVE
- [x] shared AppShell
- [x] screenshot-driven dark dashboard
- [x] dense invoice table
- [x] live client list
- [x] global workspace search / Cmd-K
- [ ] client detail/profile route
- [ ] client-side invoice/payment history
- [ ] command actions, not only search
- [ ] shared DataTable
- [ ] shared StatusBadge/Money/Date primitives
- [ ] shared ActivityTimeline
- [ ] side-panel/sheet primitives
- [ ] mobile navigation and dense-table strategy

## Roadmap

### P0 — Stabilize the financial core
1. Canonical DocumentPreview / renderer.
2. Fix every broken navigation path and incomplete detail route.
3. Add strict invoice validation and edge-case handling.
4. Add calculation/domain tests.
5. Add payment reversal/void + audit behavior.
6. Verify RLS/migrations and production build.

Gate: invoice → issue → public → payment → receipt remains one coherent, historically stable slice.

### P1 — Business OS continuity
1. Client profile + client ledger.
2. Projects and project-linked documents.
3. Quotes.
4. Credit notes.
5. Recurring invoices.
6. Reminder execution architecture.
7. Document delivery states and send workflow.
8. Shared activity timeline.
9. Global command menu actions.

Gate: user can operate an ongoing client relationship without leaving the workspace.

### P2 — India-ready financial operations
1. GST profile and tax rule model.
2. CGST/SGST/IGST handling.
3. Place-of-supply validation.
4. Tax-inclusive/exclusive modes.
5. HSN/SAC.
6. GST reporting foundations.
7. E-invoice/e-way integration architecture only after compliance catalogue is explicit.
8. Compliance warnings and document validation.

Gate: compliance rules are data-driven and never embedded ad hoc in UI.

### P3 — Reporting, automation and portability
1. Period-aware reporting.
2. Receivables ageing.
3. Cashflow view.
4. Exportable operational datasets.
5. Reminder execution engine.
6. Delivery providers.
7. Webhooks/integration events.
8. API surface.
9. Import/export portability.

Gate: financial records remain portable, auditable and operationally useful.

### P4 — AI assistance
1. Natural-language invoice drafting.
2. OCR/document extraction.
3. Smart line-item suggestions.
4. Collection follow-up assistance.
5. Anomaly explanations.
6. AI command layer.

AI must produce structured proposals, assumptions and warnings. It never silently issues, calculates authoritative totals, changes compliance state or mutates historical records.

### P5 — Production hardening / launch
- [ ] accessibility audit
- [ ] keyboard-only audit
- [ ] reduced-motion audit
- [ ] responsive/mobile audit
- [ ] security/RLS audit
- [ ] API validation/rate-limit review
- [ ] observability/error reporting
- [ ] production build + Vercel verification
- [ ] PDF rendering regression suite
- [ ] seeded demo workspace
- [ ] onboarding
- [ ] backup/export recovery drill
- [ ] launch checklist

## Recurring audit loop

Every 2 hours:
1. Inspect current repo state.
2. Compare implementation against this roadmap and PRODUCT_DOCTRINE.md.
3. Fix regressions before adding breadth.
4. Implement the highest-value next incomplete layer.
5. Run available static/type/build checks where accessible.
6. Record meaningful changes and user-only actions.
7. Continue forward without waiting for manual logs.

## Current active layer

P0 stabilization → canonical renderer, navigation integrity, financial edge cases, domain tests, payment reversals, deployment/migration verification.
