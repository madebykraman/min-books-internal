# FinBooksOS API v1

Base path: /api/v1

Authentication:
- Send `x-api-key: fb_...` or `Authorization: Bearer fb_...`.
- Keys are workspace-scoped and hashed at rest.
- Current external scope is `read`.
- Never place an API key in a browser bundle.

Endpoints:
- `GET /api/v1/health` — authenticated connectivity check.
- `GET /api/v1/invoices?type=INVOICE&limit=50` — issued/draft invoice records in the key's workspace.
- `GET /api/v1/clients?limit=100` — client records.
- `GET /api/v1/payments?limit=100` — payment facts and allocations.

Operational exports:
- `GET /api/exports/operational?workspaceId=<id>` — versioned JSON workspace export.
- `GET /api/exports/operational?workspaceId=<id>&format=csv` — document CSV export.
- `POST /api/imports/clients` — bounded client import; use `dryRun:true` first.

Integration events:
- Document and payment events populate `integration_events`.
- Authenticated workspace users can configure webhook endpoints.
- Webhook dispatch sends event type, entity identity, payload and a deterministic signature header.
- Delivery providers are explicit HTTP adapters; email/WhatsApp are not claimed as delivered without an actual provider.

Automation:
- `GET /api/cron/reminders` is protected by `CRON_SECRET` and is registered hourly in `vercel.json`.
- Reminder runs use a workspace/document/rule dedupe key, so repeated scheduler execution does not create duplicate jobs.

Environment requirements for external automation:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` for cron and external API routes
- `CRON_SECRET` for the scheduled reminder endpoint

The API does not mutate immutable issued documents through the public v1 surface.
