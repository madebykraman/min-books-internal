# FinBooksOS Product Doctrine

The attached invoice product intelligence report is the governing specification. When implementation choices conflict with it, stop and resolve the conflict explicitly rather than silently inventing a new rule.

## Non-negotiables

1. The invoice is a document, not a database row.
2. A client is a relationship, not just a billing address.
3. Issued financial documents are historically stable.
4. Calculations are deterministic and never owned by UI components or AI.
5. AI assists; it does not own financial truth.
6. Compliance is data-driven.
7. The PDF is part of the brand.
8. The public invoice page is part of the client experience.
9. Every important financial action has an audit trail.
10. Data export is a product feature.
11. Mobile is designed, not merely squeezed.
12. Semantic tokens are mandatory.
13. Prefer vertical product slices over disconnected feature accumulation.

## Anti-patterns

Do not introduce arbitrary gradients, generic purple/blue SaaS styling, decorative dashboard cards, excessive shadows, giant rounded rectangles, fake personalization, emoji in business UI, random icon styles, literal colors scattered through components, charts without a decision purpose, or screens whose information hierarchy has not been defined.

## Interaction principles

Motion communicates state change, hierarchy, causality or confirmation. Target 120–200ms for micro-interactions and 200–320ms for meaningful transitions. Respect reduced motion.

Important financial actions require feedback. Destructive actions require protection. Preserve context with detail panels/sheets where practical.

## Invoice vertical slice contract

The invoice creation slice supports existing/new client selection, invoice metadata, line-item CRUD, quantity × rate, discount/tax foundations, centralized rounding, draft persistence, live preview, autosave feedback, keyboard navigation, responsive/mobile layout and validation.

It does not silently issue invoices, own payment state, implement e-invoicing or put team permissions into the editor.

## Source-of-truth hierarchy

Regulatory source → compliance catalogue → domain rules engine → database state → UI → AI explanation.

Never reverse this hierarchy.

## Reference philosophy

Study benchmark products for underlying lessons, not interface duplication. Invoice Ninja informs document engine and data density. Wave informs simplicity. Zoho Books informs India compliance depth. Refrens informs freelancer workflow and India-first document flow. Bonsai, Moxie and Runey inform business OS continuity. Bookipi informs fast mobile entry. Invoicerr informs compliance architecture and legal archive. Invoice Builder informs local ownership, snapshots and portability. Invora informs the low-friction public invoice loop.

The target synthesis is beautiful + fast + financially correct + India-ready + portable + automation-friendly + AI-assisted, not AI-controlled.