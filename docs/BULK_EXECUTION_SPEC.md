# FleetSource Bulk Execution Spec (Premium Product Depth + UX + Ops)

## 1) Objective

Execute the next major platform leap in 5 parallel workstreams:
- Product depth for premium managed-service value.
- Pixel-level UX consistency and interaction quality.
- Onboarding/invite lifecycle hardening with guardrails.
- Decision-grade analytics dashboards (not card-only).
- Broader operational automations beyond current SLA alerts.

This spec is implementation-first and maps directly to shippable tasks.

---

## 2) Outcomes and Success Metrics

### Commercial outcomes
- Increase paid-tier conversion by adding high-value operational features.
- Create clear upsell surfaces for concierge/priority services.

### Product outcomes
- Consistent UX across all key pages (desktop + mobile).
- Strong onboarding completion and lower first-session confusion.
- Measurable operations quality (faster response, fewer dropped RFQs).

### Target metrics (first 30 days post-release)
- `+20%` improvement in RFQ->offer conversion for managed-service accounts.
- `+30%` reduction in time-to-first-meaningful-action for new invited users.
- `+25%` reduction in overdue RFQs through automation + queueing.
- UX quality score: zero critical layout issues on top 15 routes.

---

## 3) Workstreams and Epics

## WS-A: Product Depth (High-Value Paid Features)

### Epic A1: Buyer Mandate Workspace (managed-service core)
- Structured intake: sourcing goals, constraints, budget confidence, risk tolerance.
- “Mandate completeness” scoring and missing-field guidance.
- Concierge lane selector: Standard / Priority / Enterprise promises and SLA.

### Epic A2: Service Deliverables Layer
- Deliverable objects per RFQ: sourcing brief, shortlist, negotiation note, close memo.
- Deliverable timeline + status in admin and buyer views.
- Paid-only advanced deliverables (benchmark report, supplier comparison pack).

### Epic A3: Trust + Profile Strength
- Buyer profile trust score inputs: track record, completeness, response reliability.
- Org profile mode improvements (personal vs organization narrative).
- Visibility controls for public/private profile elements.

## WS-B: UX Consistency and Pixel Audit

### Epic B1: Design System Convergence
- Normalize spacing scale, type ramp, card radii, form controls, table behavior.
- Standardize empty/loading/error states across all major routes.
- Replace inconsistent custom controls with shared component patterns.

### Epic B2: Page-by-Page Pixel Audit
- Audit routes: `/`, `/listings*`, `/rfq/new`, `/dashboard*`, `/admin/*`, `/profile`, auth pages.
- Mobile-first corrections: overflow, text clipping, control hit areas, sticky sections.
- Introduce visual regression checklist for top breakpoints.

### Epic B3: Motion and Interaction Polish
- Staggered load-ins for dashboard cards/tables.
- State-change feedback for key actions (save, approve, escalate, invite).
- Controlled transitions (no noisy animation, consistent durations/easing).

## WS-C: Onboarding + Invite Lifecycle + Guardrails

### Epic C1: Invite Lifecycle Completion
- Invite states: created, sent, accepted, stale.
- Resend/regenerate temp password with explicit audit event.
- First-login required actions checklist.

### Epic C2: Guided First Session
- Contextual nudges for invited users (complete profile, set password, create first RFQ).
- Org-aware first-run prompts for approvers/managers.
- Better validation and error messaging for auth/profile/invite flows.

### Epic C3: Guardrails
- Role/action guardrails for risky ops (policy edits, bulk updates, close RFQ).
- Confirmations with “what changes” summary.
- Better API error surface mapping to user-facing copy.

## WS-D: Decision Dashboards (Analytics Upgrade)

### Epic D1: Executive Ops Dashboard
- Funnel + lag/lead metrics with trends (not single value cards).
- Cohorts by service tier, region, category, assignee.
- Drill-down to problematic segments in one click.

### Epic D2: Commercial Effectiveness Dashboard
- Offer coverage, win/loss reasons, response-time distribution, margin proxy.
- Tier performance and SLA breach cost view.
- Supplier/route performance matrix with confidence indicators.

### Epic D3: Policy Impact and Simulation
- Threshold simulation and projected warning/critical impact over historical data.
- Compare “current policy” vs “proposed policy” before save.

## WS-E: Operational Automations

### Epic E1: Rule Engine v1
- Trigger-action framework for:
  - RFQ age > threshold
  - No offer after X hours
  - Approval pending too long
  - Missing docs on critical milestones
- Actions: notify assignee, escalate owner, create task, add queue label.

### Epic E2: Automation Inbox + Task Queue
- Unified operations inbox with priorities and SLA clocks.
- Auto-generated tasks with owner assignment and due windows.
- Acknowledge/snooze/resolve lifecycle.

### Epic E3: Reliability + Observability
- Structured audit entries for automation decisions.
- Retry/de-duplication for automated notifications.
- Minimal run logs and health counters for automations.

---

## 4) Delivery Plan (Bulk Order)

### Phase 1 (Foundation, 1-2 weeks)
- WS-B/B1+B2 baseline (system convergence + critical pixel issues).
- WS-C/C1 lifecycle completion.
- WS-E/E1 scaffolding.
- Exit criteria:
  - no critical UI overflows on audited routes,
  - invite lifecycle complete,
  - automation rules persisted and executable.

### Phase 2 (Value, 1-2 weeks)
- WS-A/A1+A2 (mandate + deliverables).
- WS-D/D1 (exec ops dashboard).
- WS-E/E2 (task queue + inbox).
- Exit criteria:
  - buyer mandate + deliverables live,
  - dashboard drill-down usable,
  - automation-generated tasks visible and actionable.

### Phase 3 (Premium, 1 week)
- WS-A/A3, WS-D/D2+D3, WS-C/C2+C3, WS-E/E3.
- Exit criteria:
  - premium insight surfaces live,
  - policy simulation available,
  - robust guardrails + logs in place.

---

## 5) Task Backlog (Implementation-Ready)

## Sprint Task Set S1 (Do first)
- `B1-01`: define canonical spacing/type tokens and apply to shared layout wrappers.
- `B1-02`: standardize table/list empty/loading/error patterns.
- `B2-01`: mobile overflow fixes for `/admin/rfqs`, `/admin/settings`, `/dashboard/rfqs/[id]`.
- `C1-01`: persist invite state model + timestamps.
- `C1-02`: add resend invite / regenerate temp password action with audit log.
- `E1-01`: introduce automation rule schema + CRUD API.
- `E1-02`: connect rule evaluator to RFQ queue/escalation pipeline.

## Sprint Task Set S2
- `A1-01`: mandate intake schema + UI wizard sections.
- `A1-02`: completeness scoring + missing-data prompts.
- `A2-01`: deliverable entities and timeline rendering.
- `D1-01`: trend queries (daily/weekly) for funnel + response metrics.
- `D1-02`: dashboard with segment filters and drill links.
- `E2-01`: operations inbox model and views.
- `E2-02`: auto-task creation on key rule triggers.

## Sprint Task Set S3
- `A3-01`: profile trust score computation and badges.
- `D2-01`: commercial dashboard (coverage/win/loss/lag distributions).
- `D3-01`: policy simulation compare mode.
- `C2-01`: first-session guided checklist by role.
- `C3-01`: high-risk action confirmation framework.
- `E3-01`: automation run logs + de-dup + retry visibility.

---

## 6) Engineering Standards for This Program

- Every epic ships with:
  - API contract updates (zod + handler validation),
  - UI empty/loading/error states,
  - audit logging for privileged operations.
- No feature merged without:
  - `npm run lint` clean,
  - `npm run build` clean,
  - route-level smoke checks for changed APIs.
- UX acceptance:
  - no text clipping/overflow at common mobile widths,
  - consistent component states and spacing hierarchy.

---

## 7) Risks and Controls

- Risk: feature bloat without coherent IA.
  - Control: ship by workstream gates and use exit criteria.
- Risk: analytics mistrust from weak definitions.
  - Control: metric definitions documented per dashboard panel.
- Risk: automation noise fatigue.
  - Control: dedupe keys, severity thresholds, owner-targeted routing.
- Risk: onboarding friction.
  - Control: role-based first-session and forced-password completion guardrails.

---

## 8) Immediate Next Execution (starting now)

1. Implement S1 tasks in this exact order:
   - `B1-01` -> `B1-02` -> `B2-01` -> `C1-01` -> `C1-02` -> `E1-01` -> `E1-02`
2. After each task:
   - run lint/build,
   - run live smoke for touched endpoints/pages.
3. Update `docs/FRONTEND_BACKEND_PARITY.md` and this spec status after each sprint set.
