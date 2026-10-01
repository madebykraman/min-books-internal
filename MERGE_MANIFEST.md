# Merge Manifest — min-books-internal

Date: 1 October 2026

## Source repositories

1. madebykraman/minimical.finance
   - financial invariants and reconciliation
   - organisation-as-brand model
   - secure portal requirements
   - canonical invoice PDF geometry
   - Geist PDF preparation
   - client statements and receipts
   - historical document integrity requirements

2. madebykraman/FinBooksOS
   - dark finance workspace shell
   - document-centric invoice lifecycle
   - bigint/centralized calculation model
   - clients, projects, payments, expenses, catalog
   - reminders
   - reports
   - responsive workspace UI
   - immutable document snapshots

Both source repositories are read-only inputs for this target. No source repository changes are part of this merge.

## Visual direction absorbed from the supplied screenshots

- dark-first finance workspace
- restrained purple accent
- dense but legible operational panels
- strong hierarchy rather than KPI-wall repetition
- compact sidebar/navigation
- high-information tables
- restrained charts
- rounded surfaces used as containers, not decoration
- strong numerical typography
- mobile layouts treated as dedicated compositions

The screenshots are references, not copied product interfaces.

## Explicit supersessions

- No FinOS/FinBooksOS/minimical.finance product branding in the product UI.
- Organisation is the visible identity.
- No live invoice preview in the invoice creation flow.
- No silent line-item truncation.
- No client access to internal audit information.
- Financial calculations remain server/domain-owned.
- Issued documents remain historically stable.

## Implemented merge layer

- organisation table and workspace→organisation mapping
- organisation switcher
- organisation-aware invoice numbering
- organisation identity snapshotting
- semantic dark design tokens
- Geist Sans + Geist Mono
- deterministic Geist PDF preparation
- canonical A4 invoice PDF
- multipage line-item PDF flow
- client portal authentication/session foundation
- portal enable/disable controls
- portal invoice/account views
- account statement PDF
- payment receipt PDF
- dashboard connected to invoices/payments/expenses instead of demo values
- invoice creation without live preview
- operational invoice detail without preview canvas

## Remaining verification

- run the target repository's GitHub Actions typecheck/build
- apply and verify Supabase migrations against the target project
- verify RLS with owner/non-member fixtures
- verify portal service-role secret in Vercel
- verify PDF rendering with long addresses, many items, TBD values and logos
- mobile/iPad visual QA
- payment reversal/void workflow
- deeper GST/compliance layer
- production deployment verification
