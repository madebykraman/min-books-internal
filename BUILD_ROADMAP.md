# Min Books Internal — Master Audit, Checklist & Roadmap

Last audited: 2026-10-02
Governing specification: invoice_product_intelligence_report_final.md
Product doctrine: PRODUCT_DOCTRINE.md

## Hard constraints

- `min-books-internal` is the integration target; source repositories remain untouched.
- Do not touch minimical.finance.
- Do not modify DealVerify application code.
- Build only against explicit user-directed integration/QA work.
- Financial truth stays deterministic and server/domain-owned.
- Issued documents are immutable historical records.
- Separate document, delivery, payment and compliance states.
- Dark-only, dense, premium financial workspace UI.
- No generic AI/SaaS styling, decorative gradients, emoji business UI, giant contextless cards, or purposeless charts.
- Semantic tokens and accessible interaction states remain mandatory.
- Work directly on `main`; no additional development branches.

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
- [x] production build verified by GitHub CI on the pre-P0-hardening baseline; current hardening commits are queued for the same CI gate
- [ ] end-to-end auth/session verification against the actual FinBooksOS Vercel project — blocked by Vercel connector scope authorization
- [ ] migration application verification on the user's FinBooksOS Supabase project — no FinBooksOS Supabase project is connected to the available account

### Invoice vertical slice — SUBSTANTIALLY COMPLETE
- [x] client selection
- [x] invoice metadata
- [x] line-item CRUD
- [x] centralized calculation
- [x] draft autosave
- [x] live preview removal
- [x] issue flow
- [x] immutable issue snapshot
- [x] invoice detail/history
- [x] public invoice route
- [x] print/PDF path
- [x] live preview removed from invoice creation
- [x] issued-detail/public/PDF paths consume the immutable issued payload and deterministic line arithmetic
- [ ] discount support
- [x] validation/error states for core financial edge cases
- [x] 50+ line stress boundary enforced at issue validation (500-line hard cap)
- [x] long client/name/number wrapping in canonical PDF renderer
- [x] zero/negative/partial/tax-rounding invariant coverage

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
- [x] payment reversal/void workflow + audit behavior
- [x] allocation-aware invoice/dashboard/report balances
- [x] allocation/reconciliation correctness across dashboard, invoices, payments and reports
- [x] receipt route and payment void workflow use the same ledger state
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
1. Canonical issued-document renderer and PDF parity.
2. Fix every broken navigation path and incomplete detail route.
3. Add strict invoice validation and edge-case handling.
4. Add calculation/domain tests.
5. Add payment reversal/void + audit behavior.
6. Verify RLS/migrations and production build.

Gate: invoice → issue → public → payment → receipt remains one coherent, historically stable slice.

### P1 — Business OS continuity
1. [x] Client profile + client ledger.
2. [x] Projects and project-linked documents.
3. Quotes.
4. Credit notes.
5. Recurring invoices.
6. Reminder execution architecture.
7. Document delivery states and send workflow.
8. Shared activity timeline.
9. Global command menu actions.

Gate: user can operate an ongoing client relationship without leaving the workspace. P1 Business OS continuity is implemented on main; remaining production gates are verification/hardening rather than missing P1 breadth.

### P2 — India-ready financial operations — COMPLETE ON MAIN
1. [x] GST profile and tax rule model.
2. [x] CGST/SGST/IGST handling.
3. [x] Place-of-supply validation.
4. [x] Tax-inclusive/exclusive modes.
5. [x] HSN/SAC capture and validation.
6. [x] GST reporting foundation with B2B/B2C and HSN summaries.
7. [x] Provider-neutral e-invoice/e-way submission architecture after explicit compliance catalogue.
8. [x] Compliance warnings, immutable tax snapshots and document validation.
9. [x] Versioned compliance catalogue with source/effective-date metadata.
10. [x] Workspace tax rules consumed by invoice authoring rather than hard-coded rate lists.

Gate: compliance rules are data-driven and never embedded ad hoc in UI. P2 implementation is complete; live Supabase migration/provider verification remains an environment gate.

### P3 — Reporting, automation and portability — COMPLETE ON MAIN
1. [x] Period-aware reporting with previous-period comparison.
2. [x] Receivables ageing with reproducible as-of dates and credit/payment reconciliation.
3. [x] Cashflow view by actual transaction date.
4. [x] Versioned exportable operational datasets, including integration/automation records.
5. [x] Reminder execution and provider dispatch.
6. [x] Document delivery provider dispatch and delivery state reconciliation.
7. [x] Webhook integration-event outbox and signed dispatch.
8. [x] Scoped REST-shaped API v1 using hashed workspace API keys.
9. [x] Workspace package restore for master data with financial-history immutability guard.
10. [x] Recurring invoice due-run automation with month-end-safe recurrence.
11. [x] Unified automation runner for recurring invoices, reminders and webhook dispatch.
12. [x] P3 invariant coverage in CI.

Gate: financial records remain portable, auditable and operationally useful. P3 implementation is complete; live provider/Supabase/Vercel verification remains environment-bound.

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

On-demand audit loop:
1. Inspect current repo state.
2. Compare implementation against this roadmap and PRODUCT_DOCTRINE.md.
3. Fix regressions before adding breadth.
4. Implement the highest-value next incomplete layer.
5. Run available static/type/build checks where accessible.
6. Record meaningful changes and user-only actions.
7. Continue forward without waiting for manual logs.

## Current active layer

P3 reporting, automation and portability → implementation complete on `main`: projects, quotes/conversion, credit notes, recurring invoices, reminder execution architecture, delivery states, shared timelines and command actions. Remaining gates are environment-bound P0 verification and P5 production hardening. Remaining P0 exit checks are environment-bound: the latest hardening commits must pass GitHub CI, then the actual Vercel project/session and the user's FinBooksOS Supabase migration state must be verified. Static migration audit confirms workspace-scoped RLS on core financial tables and security-definer payment mutations with membership checks.
