<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification. All placeholder tokens replaced with concrete,
project-specific governance for the Smart Customer Success Agent hackathon build.

Modified principles: N/A (initial adoption). Seven principles defined:
  I.   Native.builder First (NON-NEGOTIABLE)
  II.  One Workflow, Complete, End-to-End (NON-NEGOTIABLE)
  III. Deployed From Day One
  IV.  Demo Truth — No Faked Paths (NON-NEGOTIABLE)
  V.   One Persona, One Pain
  VI.  Time-Boxed Decisions
  VII. Evidence Over Assertion

Added sections:
  - Project Vision
  - Target User
  - Problem Statement
  - Success Metrics (Hackathon)
  - Technical Guardrails
  - Scope (Build Window)
  - Definition of Done
  - Governance

Removed sections: All `[SECTION_N_NAME]` generic placeholders (replaced by the named
sections above).

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" gate resolves dynamically
     to this file; gate wording added to Governance. No edit required.
  ✅ .specify/templates/spec-template.md — no constitution references; no edit required.
  ✅ .specify/templates/tasks-template.md — no constitution references; no edit required.
  ✅ CLAUDE.md — PHR/ADR workflow unchanged by this amendment.

Deferred items — ALL RESOLVED 2026-08-06 (same day):
  - TODO(NATIVE_BUILDER_CAPABILITY_MATRIX): CLOSED. Resolved by Phase 0 research against
    docs-builder.nativelyai.com, then confirmed by a full Playwright scan of the official
    event page. See specs/001-customer-success-agent/research.md §1 and hackathon-brief.md.
  - CORRECTION: the official event schedule states the submission deadline as
    Aug 10, 8:00 PM Pakistan Standard Time. The Scope day plan is unchanged; the cutoff
    hour is now exact.
  - CORRECTION: the lablab.ai Builder Plan is FREE for one month with promo code
    AIFACTORY26. The plan's R1 mitigation ("pay $20 on D1") is superseded — the action
    stands, the cost does not.
-->

# Smart Customer Success Agent Constitution

## Project Vision

Every B2B SaaS customer emits churn signals long before they cancel — a support ticket
that took four days to resolve, a power user who stopped logging in, an invoice paid late.
Those signals exist. Nobody reads them in time.

The Smart Customer Success Agent is an always-on teammate for Customer Success Managers.
It continuously reads account signals, scores account health, explains *why* an account is
at risk in plain language, and drafts the specific outreach that addresses that specific
risk — then hands it to a human for one-click approval.

We are not building a dashboard. Dashboards tell CSMs they have a problem. This agent tells
them what to send, to whom, today, and lets them send it. Our vision for this hackathon is a
single, undeniable, publicly deployed demonstration of that loop working end to end on real
data flowing through real logic.

## Core Principles

### I. Native.builder First (NON-NEGOTIABLE)

native.builder MUST be the primary construction surface for this product. Every feature is
attempted in native.builder before any alternative is considered.

- Anything built outside native.builder is an **escape hatch** and MUST be recorded in
  `docs/escape-hatches.md` with: what was built, why native.builder could not do it, and
  what was tried first.
- Escape hatches MUST NOT exceed **20% of shipped surface area** (counted as user-facing
  screens plus distinct backend actions). At 20% we stop and re-plan.
- The submission's "how we used the tool" narrative MUST be truthful and specific. If we
  cannot describe the native.builder contribution in three concrete sentences, we have
  violated this principle.

*Rationale: This is the entry condition of the hackathon, not a preference. A superb product
built around native.builder scores zero.*

### II. One Workflow, Complete, End-to-End (NON-NEGOTIABLE)

We ship **one** workflow that runs from external signal to logged human-approved outcome,
with no gaps. Breadth is forbidden until that workflow is complete and deployed.

The canonical workflow is:

```
Account signal ingested  →  Agent enriches with account context  →  Health score +
churn-risk reasoning generated  →  Recommended action + drafted outreach produced  →
CSM reviews and approves/edits in-app  →  Action logged to the account timeline
```

Every task in `tasks.md` MUST identify which arrow of this chain it serves. Tasks that serve
no arrow are out of scope by definition.

*Rationale: Judges score a complete workflow. Six half-built workflows demo as zero complete
workflows.*

### III. Deployed From Day One

A public URL MUST exist and be reachable before any feature work begins, and MUST stay
reachable for the remainder of the build window.

- Deploy at minimum once per working day; never leave a broken deployment overnight.
- The public URL is recorded in `README.md` and never changes after first publication.
- "It works locally" is not a status. A feature is Done only when it is live at the public URL.

*Rationale: Deployment is a submission requirement and the single most common cause of
hackathon failure at the deadline. We de-risk it first, not last.*

### IV. Demo Truth — No Faked Paths (NON-NEGOTIABLE)

Every step of the demonstrated workflow MUST execute real logic on real inputs at demo time.

- **Seed data MAY be synthetic** (fictional accounts, tickets, usage records). Seed data
  MUST be clearly labeled as demo data in the UI.
- **Logic MUST NOT be faked.** No hardcoded model outputs, no pre-baked "AI responses", no
  screens that only look interactive, no `if demo_mode` branches on the happy path.
- If a step cannot be made real inside the build window, we **cut the step from the workflow**
  and say so — we do not stub it and present it as working.

*Rationale: A faked demo is discovered in Q&A and destroys the Application-of-Technology and
Originality scores simultaneously. Cutting scope is survivable; misrepresentation is not.*

### V. One Persona, One Pain

All product decisions are resolved against a single named persona (see Target User) and a
single named pain (see Problem Statement).

- A feature request that does not measurably reduce that persona's pain MUST be rejected,
  regardless of how impressive it is.
- "Some users might want…" is not an argument. Name the persona or drop the feature.

*Rationale: The hackathon explicitly requires a clear target user. Ambiguity here is scored
directly, and it is the most common source of scope creep under time pressure.*

### VI. Time-Boxed Decisions

No design or technical decision may consume more than **60 minutes** of the build window.

- At 60 minutes, the Lead Architect picks the option that is fastest to reverse and the team
  moves on. The decision is logged as a one-line note; if it is architecturally significant,
  an ADR is suggested per `CLAUDE.md`.
- No blocker may sit unescalated for more than **2 hours**. Escalate to the human decision
  maker with 2–3 concrete options, not an open question.

*Rationale: With a compressed window, deliberation cost exceeds decision cost. Reversibility
beats correctness.*

### VII. Evidence Over Assertion

Claims made in the submission MUST be backed by something a judge can observe.

- Every metric in Success Metrics MUST be measurable from the deployed app or a recorded run
  — not estimated.
- The demo video MUST show the live deployed URL, not a local build or a slideshow.
- Impact claims ("saves CSMs N hours") MUST state their derivation in the submission text.

*Rationale: Business Value/Impact is a scored dimension. Unsourced claims read as inflation
and cost more than they gain.*

## Target User

**Primary persona: "Maya" — Customer Success Manager at a growth-stage B2B SaaS company.**

| Attribute | Detail |
|---|---|
| Role | Individual-contributor CSM (not a manager, not CS Ops) |
| Company | B2B SaaS, 30–150 employees, Series A/B, $3M–$20M ARR |
| Contract size | $8k–$60k ACV — too small for a dedicated account team, too large to ignore |
| Book of business | **60–120 accounts owned simultaneously** |
| Tooling | CRM (HubSpot/Salesforce), support inbox (Intercom/Zendesk), product analytics she rarely opens, and a spreadsheet she actually trusts |
| Reports to | VP of Customer Success, on quarterly Net Revenue Retention |
| Technical skill | Comfortable with SaaS tools; will not write SQL, will not build a dashboard |
| Compensation | Base + variable tied to renewal/expansion — churn is personally expensive |

**Her week:** ~10 hours of scheduled calls, ~8 hours of reactive inbox, ~4 hours of internal
meetings, ~2 hours of reporting. She can meaningfully touch **12–18 accounts per week** out of
100. The other 82 are unmonitored.

**Her actual moment of failure:** A renewal notice arrives 30 days out for an account she has
not spoken to in four months. She opens the account, sees warning signs that were visible in
week 6, and now has 30 days to fix a problem that had a 5-month runway.

**Explicit non-users (out of scope this build):** enterprise CSMs with named-account teams,
self-serve/PLG companies with no CSM function, support agents, VP-level portfolio reporting,
and the end customer.

## Problem Statement

**A CSM with 100 accounts can actively manage 15 of them. Churn is decided in the other 85.**

Three compounding failures:

1. **Signals are fragmented.** Health evidence lives in the support inbox, the product
   analytics tool, the CRM, and the billing system. No single view exists, and assembling one
   manually takes ~20 minutes per account — 33 hours to sweep a 100-account book once.
2. **Detection is calendar-driven, not signal-driven.** CSMs discover risk when a renewal date
   approaches, not when the risk appears. By then the runway to intervene is measured in weeks
   instead of months.
3. **Knowing is not acting.** Even when a CSM identifies an at-risk account, drafting a
   credible, context-specific outreach takes 15–25 minutes. At the end of a reactive day, the
   at-risk account gets a generic check-in email — or nothing.

**Consequence:** Preventable churn is discovered too late to prevent, and the CSM's variable
compensation and their company's Net Revenue Retention both absorb the loss.

**What we are attacking:** the gap between *signal exists* and *human acts* — compressing it
from "discovered at renewal, acted on in weeks" to "surfaced within a day, acted on in one click."

## Success Metrics (Hackathon)

These are the scored outcomes for the window ending **2026-08-10**. Each is binary or
directly observable.

### Tier 1 — Submission validity (all MUST pass; failure = disqualified)

| # | Metric | Target | Verified by |
|---|---|---|---|
| S1 | App reachable at a public URL | 100% uptime during judging | Open URL in clean browser session |
| S2 | Built primarily with native.builder | Escape hatches ≤ 20% of surface | `docs/escape-hatches.md` audit |
| S3 | One complete end-to-end workflow demonstrable | Runs live, start to finish | Live run, no local fallback |
| S4 | Demo video submitted | ≤ 3 minutes, shows live URL | Submission checklist |
| S5 | Target user + problem stated in submission | Names Maya + the 15-of-100 gap | Submission checklist |

### Tier 2 — Product performance (measured on the deployed app)

| # | Metric | Target | Verified by |
|---|---|---|---|
| P1 | Cold-start to first recommended action | **< 60 seconds** for a new user on seeded data | Stopwatch on live URL, 3 runs |
| P2 | Full workflow completion (signal → logged approved action) | **≤ 90 seconds** end to end | Timed live run |
| P3 | Risk explanation cites specific evidence | **100%** of generated explanations reference ≥ 2 concrete account signals | Manual review of 10 generated outputs |
| P4 | Seeded demo accounts | ≥ 8 accounts spanning healthy / warning / critical | Deployed app inspection |
| P5 | Workflow failure rate on seeded data | **0** unhandled errors across 10 consecutive runs | Pre-submission run book |

### Tier 3 — Judging-dimension coverage (self-assessed 2026-08-09)

| Dimension | Our evidence |
|---|---|
| Application of Technology | native.builder carries the app; model reasoning is visible in-product, not decorative |
| Presentation | 3-minute video: problem (30s) → live workflow (100s) → impact + build story (50s) |
| Business Value/Impact | Time-per-account-review reduction, derived and stated with its assumptions |
| Originality/Creativity | Agent outputs a *drafted action*, not a score — closing the know→act gap |

## Technical Guardrails

### Platform

- **native.builder is the primary build surface.** Application UI, data model, workflow
  orchestration, and deployment MUST originate there. Confirm the platform's real capability
  boundaries in the console during Phase 0 planning — do not design against assumed features.
  See `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)` in the sync report above.
- **Escape-hatch protocol.** Before building anything outside native.builder: (1) attempt it in
  native.builder, (2) record the failure mode, (3) build the smallest possible external piece,
  (4) log it in `docs/escape-hatches.md`. Steps 1–4 are not optional.
- **No second platform.** We will not introduce a competing app framework, a separate hosting
  provider for the main app, or a parallel implementation "as a backup." A backup we maintain
  is a product we did not finish.

### AI models

- Where LLM reasoning is required, default to the most capable current Claude models —
  `claude-opus-5` for risk reasoning and outreach drafting where quality is visible to the
  judge; `claude-sonnet-5` for high-frequency classification/enrichment steps where latency
  matters. Use native.builder's own model integration if it provides one; only call the
  Anthropic API directly as a logged escape hatch.
- **Model output MUST be grounded.** Every risk explanation MUST cite the specific account
  signals it was derived from. Ungrounded generation is a defect, not a feature.
- **No model output is auto-sent.** The CSM approves before any outreach leaves the system.
  This is a product principle (human-in-the-loop) and a safety guardrail.

### Data and secrets

- **Synthetic data only.** No real customer names, emails, support tickets, or usage records
  enter this system. Seeded accounts are fictional and labeled as demo data in the UI.
- **No secrets in the repo or in native.builder prompts.** API keys live in environment
  configuration. A committed secret is an immediate stop-work event: rotate, then continue.
- **No third-party production integrations.** We simulate inbound signals from a seeded source
  rather than connecting a live Zendesk/HubSpot account. Real OAuth integrations are explicitly
  out of scope and out of the demo narrative.

### Engineering discipline

- Smallest viable diff; no refactoring of working code during the build window.
- Every user-visible error path MUST render a human-readable message — never a raw stack trace,
  never a silent failure. A judge who hits a blank screen scores what they see.
- Manual run-book verification of the full workflow replaces automated test suites for this
  window. The run book lives in `docs/runbook.md` and MUST be executed before every deploy on
  the final two days.

## Scope (Build Window)

> **Window correction:** This constitution is ratified **2026-08-06**. The hackathon runs
> 2026-08-03 → 2026-08-10. The remaining window is **~4.5 days, not 7.** The plan below is
> scoped to the real remaining calendar. Any plan that assumes 7 days is invalid.

### In scope — the shippable product

1. **Account workspace** — list of seeded accounts with health score, risk tier, and last-touch
   date. Sortable by risk.
2. **Signal ingestion** — seeded inbound signals (support tickets, usage deltas, billing events)
   attached to accounts, plus a manual "add signal" path so the workflow can be triggered live
   during the demo.
3. **Health scoring + risk reasoning** — agent computes a health score and produces a plain-
   language explanation citing the specific signals behind it.
4. **Recommended action + drafted outreach** — agent proposes the next best action and drafts
   the message that executes it.
5. **Human approval loop** — CSM reviews, edits, approves or rejects. Approval writes to the
   account timeline.
6. **Account timeline** — chronological record of signals, agent recommendations, and human
   decisions per account.

### Out of scope — explicitly not building

- Live third-party integrations (Zendesk, HubSpot, Salesforce, Stripe, Slack) — simulated only.
- Real outbound email/SMS delivery — approved actions are logged, not transmitted.
- Multi-tenant authentication, org management, roles, permissions, billing.
- Manager/VP portfolio analytics, forecasting, or NRR reporting.
- Mobile-native applications.
- Historical model training, fine-tuning, or evaluation harnesses.
- Onboarding flows, marketing site, pricing page, settings screens.
- Anything serving a persona other than Maya.

### Day plan (real remaining calendar)

| Day | Date | Objective | Exit condition |
|---|---|---|---|
| D1 | 2026-08-06 | Constitution → spec → plan → tasks. Provision native.builder. **Deploy an empty app to a public URL.** | Public URL live; `tasks.md` exists |
| D2 | 2026-08-07 | Data model + account workspace + seeded accounts and signals | Account list renders seeded data at the public URL |
| D3 | 2026-08-08 | Agent core: scoring, grounded risk reasoning, action recommendation, outreach draft | Workflow arrows 2–4 run live end to end |
| D4 | 2026-08-09 | Approval loop + timeline. Error paths. Run book × 10. Record demo video. Self-assess Tier 3. | Full workflow green ×10; video recorded |
| D5 (half) | 2026-08-10 | Submission text, escape-hatch audit, final deploy, **submit with ≥ 4 hours of buffer** | Submitted |

**Hard cutoff:** No new feature work begins after **2026-08-09 18:00 local**. D5 is submission
and stabilization only. This rule overrides enthusiasm.

## Definition of Done

A **task** is Done when:

- [ ] It is deployed and observable at the public URL — not merely working locally.
- [ ] It serves an identified arrow of the Principle II workflow.
- [ ] Its failure path renders a human-readable message.
- [ ] Anything built outside native.builder is logged in `docs/escape-hatches.md`.
- [ ] A PHR was created per `CLAUDE.md`.

The **workflow** is Done when:

- [ ] All six steps of the Principle II chain execute live, in one sitting, on the public URL.
- [ ] It has been run **10 consecutive times with zero unhandled errors** (P5).
- [ ] It completes in ≤ 90 seconds (P2).
- [ ] Every risk explanation cites ≥ 2 concrete account signals (P3).
- [ ] No step is stubbed, mocked, or pre-baked (Principle IV).

The **submission** is Done when:

- [ ] Public URL is live, verified in a clean browser session with no cached login (S1).
- [ ] Escape-hatch audit shows ≤ 20% non-native.builder surface area (S2).
- [ ] Demo video ≤ 3 minutes, showing the live URL and one full workflow run (S4).
- [ ] Submission text names the target user (Maya), the problem (15 of 100), and the
      native.builder build story in three concrete sentences (S5).
- [ ] Business-value claim states its derivation and assumptions (Principle VII).
- [ ] All Tier 1 metrics pass; Tier 2 measurements are recorded in `docs/metrics.md`.
- [ ] Submitted with ≥ 4 hours before the deadline.

## Governance

**Authority.** This constitution supersedes all other practices, preferences, and in-flight
opinions for the duration of the hackathon build window. Where this document and a convenience
conflict, this document wins.

**Constitution Check gate.** `/sp.plan` MUST evaluate its design against Principles I–VII and
record the result in the plan's Constitution Check section. A plan that violates a
NON-NEGOTIABLE principle (I, II, IV) MUST NOT proceed to `/sp.tasks`; it is revised or the
scope is cut. Violations of Principles III, V, VI, VII MAY proceed only with a written
justification in the plan's Complexity Tracking table.

**Amendment procedure.**

1. Propose the amendment with: the principle affected, the concrete situation forcing the
   change, and the smallest edit that resolves it.
2. The human decision maker approves. No amendment is self-applied by an agent.
3. Update this file, increment the version, prepend the Sync Impact Report, and propagate to
   `.specify/templates/*` where affected.
4. Record the amendment as a PHR under `history/prompts/constitution/`.

**Versioning policy (semantic).**

- **MAJOR** — a principle is removed or redefined incompatibly; the workflow of Principle II
  changes shape.
- **MINOR** — a principle or named section is added, or guidance is materially expanded.
- **PATCH** — clarification, wording, typo, or deferred-TODO resolution with no semantic change.

**Compliance review.** At each day's exit condition (see Day plan), verify: Tier 1 metrics
still pass, escape-hatch budget is under 20%, and the public URL is live. A failing check is
addressed before new feature work resumes.

**Scope-cut authority.** When the window and the scope conflict, **scope loses**. The Lead
Architect may cut any item from the In-scope list except the Principle II workflow itself,
without further approval. Cutting is logged, not debated.

**Runtime guidance.** Development conduct, PHR creation, and ADR suggestion rules are defined
in `CLAUDE.md` and remain in force alongside this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-08-06 | **Last Amended**: 2026-08-06
