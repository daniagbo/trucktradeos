# FleetSource Feature Backlog (Saved Ideas)

Execution planning docs:
- `docs/BULK_EXECUTION_SPEC.md`
- `docs/BULK_TASK_BOARD.md`

## UX/Product Ideas
- Saved admin views: Let admins save named filter/sort presets for listings and RFQs.
- SLA timers on RFQs: Countdown badges for time-to-first-response and time-in-stage.
- Bulk actions: Multi-select listings/RFQs for batch status updates and archive/delete.
- Smart duplicate detection: Warn when new listings look similar to existing inventory.
- Offer templates: Reusable offer snippets by category, with legal and logistics presets.
- Audit panel: Inline “who changed what” timeline for listing and RFQ entities.
- Sticky command palette: Keyboard-driven search/navigation for all admin pages.
- Watchlist mode: Flag high-priority RFQs/listings and pin them across dashboards.

## Data/Workflow Ideas
- Stage conversion funnel: Received -> In progress -> Offer sent -> Won/Lost analytics.
- Supplier performance scorecards: Win rate, response time, and margin by source.
- Auto-enrichment jobs: Normalize listing specs and detect missing critical fields.
- Risk checks: Detect missing documents for export-ready claims before publish.

## Technical Ideas
- E2E contract tests: Route-by-route smoke coverage for auth/listings/rfqs/offers.
- API schema versioning: Shared zod schemas for client+server payload contracts.
- Observability layer: Request tracing + structured logs for app and API routes.
- Background jobs: Queue for notifications, reminders, and SLA breach alerts.
