# Min Books Internal

Internal merged finance workspace.

This repository is the integration target for the capabilities developed independently in:

- `madebykraman/minimical.finance` — financial invariants, organisation identity, secure client portal, document/PDF requirements and historical finance rules.
- `madebykraman/FinBooksOS` — dark finance workspace UI, document-centric domain, payments, expenses, catalog, reminders, reporting and responsive shell.

The two source repositories remain untouched.

## Product identity

There is intentionally no product-facing application brand. The selected organisation is the identity shown in the workspace, public documents and client portal.

Global UI typography is Geist Sans with Geist Mono for financial identifiers. Geist is also prepared deterministically for PDF rendering. citeturn2search0

## Architectural rules

UI → workspace/components → domain → repository/API → Supabase.

Financial calculations remain deterministic. Issued documents retain immutable snapshots. Payment recording is reconciled server-side. Workspace access remains RLS-scoped.

The invoice editor deliberately has no live preview. Issued-document rendering and PDF generation are separate from data entry.

## Merged surfaces

- Organisation-aware application shell and switching
- Dashboard and operational attention queue
- Invoice ledger and issue flow
- Organisation-specific invoice numbering
- Payments and expenses
- Service catalog
- Reminder automation foundation
- Reports
- Secure password-protected client portal
- Client invoice detail
- Account statement PDF
- Payment receipt PDF
- Canonical A4 invoice PDF with Geist
- Responsive/mobile shell
- Semantic dark design tokens
- Empty/loading/error states and operational feedback

## Verification

GitHub Actions are the authoritative build check for this repository. A successful source write is not treated as production deployment verification.
