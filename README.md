# Min Books Internal

Internal merged finance workspace.

## Product identity

There is intentionally no product-facing application brand. The selected organisation is the identity shown in the workspace, public documents and client portal.

Global UI typography is Geist Sans with Geist Mono for financial identifiers. Geist is prepared deterministically for PDF rendering.

## Architectural rules

UI → workspace/components → domain → repository/API → Supabase.

Financial calculations remain deterministic. Issued documents retain immutable snapshots. Payment recording is reconciled server-side. Workspace access remains RLS-scoped.

The invoice editor deliberately has no live preview. Issued-document rendering and PDF generation are separate from data entry.

## Operational surfaces

- Organisation-aware workspace shell and switching
- Invoice, quote, credit-note and recurring workflows
- Payments, expenses and allocation-aware balances
- Client relationship history and projects
- Reminder rules, scheduled execution and provider dispatch
- Document delivery queue and provider dispatch
- GST profile, tax rules, reporting and compliance state
- Receivables ageing and period-aware cashflow
- Operational JSON/CSV export
- Bounded client/master-data import and restore validation
- Scoped external API keys and v1 invoice/payment/client endpoints
- Queued integration events and signed webhook delivery
- Responsive/mobile workspace shell
- Semantic dark design tokens
- Empty/loading/error states and operational feedback

## Automation and integration configuration

The application never embeds provider secrets in source control. Runtime configuration is supplied through the deployment environment.

Supported server-side configuration names include:

- CRON_SECRET — protects scheduled automation endpoints.
- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL.
- SUPABASE_SERVICE_ROLE_KEY — server-only scheduled-job credential; never expose client-side.
- DELIVERY_PROVIDER_URL / DELIVERY_PROVIDER_TOKEN / DELIVERY_FROM_EMAIL — optional configured email delivery adapter.
- FINBOOKS_WEBHOOK_SIGNING_SECRET — signs outbound integration webhook payloads.

Do not place values for these variables in this repository, README, client-side code, screenshots or public issue comments.

## Verification

GitHub Actions is the authoritative source/build check for this repository. A successful source write is not treated as production deployment verification.

Production Vercel deployment and live Supabase migration state remain separate environment gates.
