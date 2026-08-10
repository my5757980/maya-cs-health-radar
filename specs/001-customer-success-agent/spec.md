# Product Spec – Smart Customer Success Agent

**Feature Branch**: `001-customer-success-agent`
**Created**: 2026-08-06
**Status**: Draft — ready for `/sp.plan`
**Constitution**: `.specify/memory/constitution.md` v1.0.0
**Input**: User description: "Using the Constitution above, write a complete Product Spec for Smart Customer Success Agent."

> **Window note:** The request framed this as a 7-day build. Per the ratified constitution, the
> real remaining window is 2026-08-06 → 2026-08-10 (~4.5 days). Everything below is scoped to
> that. Priorities P1–P4 are ordered so that stopping after any one of them still leaves a
> demonstrable product.

---

## 1. One-Sentence Pitch

**Smart Customer Success Agent watches every account a CSM owns, and when one starts to slip it
delivers a ranked risk explanation and a ready-to-send outreach draft — so the CSM's next action
takes one click instead of twenty minutes of digging.**

---

## 2. Problem Statement

A Customer Success Manager carrying 60–120 accounts can actively manage about 15 of them in a
given week. **Churn is decided in the other 85.**

Three failures compound:

| # | Failure | Cost |
|---|---|---|
| 1 | **Signals are fragmented.** Health evidence sits across the support inbox, product analytics, CRM notes, and billing. | ~20 min to manually assemble one account's picture; ~33 hours to sweep a 100-account book once. |
| 2 | **Detection is calendar-driven, not signal-driven.** Risk is discovered when a renewal date approaches. | A problem with a 5-month runway gets a 30-day response window. |
| 3 | **Knowing is not acting.** Identifying risk is not the same as addressing it; a credible, context-specific outreach takes 15–25 minutes to write. | At the end of a reactive day, the at-risk account gets a generic check-in — or silence. |

**The gap we attack:** the distance between *a signal exists* and *a human acts on it*. Today that
is "discovered at renewal, acted on in weeks." The target is "surfaced within a day, acted on in
one click."

**Why an agent and not a dashboard:** the reasoning required — read heterogeneous signals, weigh
them against account context, explain the risk in the CSM's language, and write the specific
message that addresses it — is exactly the work that has kept this problem unsolved by dashboards.
A dashboard reports the score. The CSM still has to do the thinking and the writing. This agent
does both and stops at the human's approval.

---

## 3. Target User

**Primary persona: "Maya" — individual-contributor Customer Success Manager.**

| Attribute | Detail |
|---|---|
| Role | IC CSM — not a manager, not CS Ops, not support |
| Company | B2B SaaS, 30–150 employees, Series A/B, $3M–$20M ARR |
| Contract size | $8k–$60k ACV — too small for a named account team, too large to ignore |
| Book | 60–120 accounts owned simultaneously |
| Existing tools | CRM (HubSpot/Salesforce), support inbox (Intercom/Zendesk), product analytics she rarely opens, one spreadsheet she actually trusts |
| Technical skill | Fluent in SaaS tools; will not write SQL, will not build a dashboard, will not configure a rules engine |
| Reports on | Quarterly Net Revenue Retention |
| Compensation | Base + variable tied to renewal and expansion — churn is personally expensive |

**Her week:** ~10h scheduled calls, ~8h reactive inbox, ~4h internal meetings, ~2h reporting.
Capacity to meaningfully touch **12–18 accounts per week** out of ~100.

**Her moment of failure:** a renewal notice lands 30 days out for an account she has not spoken to
in four months. She opens it, sees warning signs that were visible in week 6, and now has 30 days
to fix a five-month problem.

**Explicit non-users (out of scope):** enterprise CSMs with named account teams, PLG/self-serve
companies with no CSM function, support agents, VP-level portfolio reporting, and the end customer
themselves.

---

## 4. Jobs-to-be-Done

Ordered by how directly each maps to the demonstrated workflow.

| ID | Job story | Current workaround | Success looks like |
|---|---|---|---|
| **JTBD-1** | When I start my week, I want to know which of my 100 accounts actually need me, so I can spend my 15 slots on the right ones. | Sorting a spreadsheet by renewal date — a proxy for risk, not a measure of it. | A risk-ranked book, top of list = most at risk, visible in under 10 seconds. |
| **JTBD-2** | When an account looks risky, I want to know *why* in specific terms, so I don't open the call blind or guess wrong. | 20 minutes of tab-switching across four tools. | A plain-language explanation citing the actual signals, in seconds. |
| **JTBD-3** | When I know why an account is at risk, I want the right next action already decided and drafted, so acting costs me one minute instead of twenty. | Writing from scratch at 6pm, or sending a generic template. | A recommended action plus a personalized draft that references the real risk driver. |
| **JTBD-4** | When the agent is wrong, I want to correct or reject it easily and have that recorded, so I stay in control and the record stays honest. | N/A — no system to correct. | Edit or reject with a reason; the decision is logged against the account. |
| **JTBD-5** | When I pick an account back up weeks later, I want to see what was flagged and what we did, so I'm not re-deriving history. | Scrolling CRM notes and email threads. | A single chronological account timeline of signals, recommendations, and human decisions. |

---

## 5. Core Features (Must-Have)

These constitute the shippable product. Each maps to an arrow of the Constitution's Principle II
workflow chain.

### CF-1 — Risk-Ranked Account Workspace
The CSM's home screen. All owned accounts in one list, sorted most-at-risk first. Each row shows:
account name, ARR, health score (0–100), risk tier badge, top risk driver in one phrase, days since
last touch, and whether an unreviewed recommendation is pending. Filterable by risk tier.
*(Serves JTBD-1.)*

### CF-2 — Signal Ingestion & Account Context
Every account carries a stream of typed signals. Signals arrive two ways: **seeded** (pre-loaded
demo history) and **manually injected** (an "Add signal" action that lets a live demo trigger the
full chain on stage). Supported signal types: support ticket, usage drop, login gap, billing
event, NPS/sentiment response, feature-adoption change. *(Workflow arrow 1.)*

### CF-3 — Deterministic Health Scoring
A 0–100 health score computed from the account's signals using explicit, inspectable weights with
time-decay on older signals. Risk tiers: **Healthy 70–100**, **Watch 40–69**, **Critical 0–39**.
The score is deterministic and reproducible — the same signals always produce the same score.
*(Workflow arrow 2. See §8.1 for why the score is deterministic and the reasoning is not.)*

### CF-4 — Grounded Risk Explanation
For any Watch or Critical account, the agent produces a plain-language explanation of *why* the
account is at risk. **Every explanation MUST cite at least two specific signals by type and date.**
An explanation that cannot ground itself in concrete signals is not shown; the account shows
"insufficient signal" instead. *(Workflow arrow 3.)*

### CF-5 — Next-Best-Action Recommendation
The agent selects one action from a bounded, defined taxonomy (§8.4) and states in one sentence
why that action addresses this specific risk driver. Recommendations carry a confidence indicator
and the signals they were derived from. *(Workflow arrow 4.)*

### CF-6 — Personalized Outreach Draft
Alongside the recommendation, the agent drafts the actual message — subject line and body — that
executes it. The draft references the account's real situation (the specific ticket, the specific
usage change), not a template merge field. *(Workflow arrow 4.)*

### CF-7 — Human Approval Loop
The CSM reviews the recommendation and draft, then **approves**, **edits then approves**, or
**rejects with a reason**. Nothing is transmitted anywhere; approval records the decision and the
final message text. **No agent output ever leaves the system without human approval.**
*(Workflow arrow 5 — this is the hard safety boundary.)*

### CF-8 — Account Timeline
A per-account chronological record interleaving signals received, health-score changes, agent
recommendations, and human decisions (approved / edited / rejected, with reason). This is the
audit surface that makes the loop credible. *(Workflow arrow 6.)*

### CF-9 — Demo-Data Transparency
Seeded accounts and signals are visibly labeled as demo data in the UI. Honesty about the data is
a Constitution Principle IV requirement, not a nicety.

---

## 6. Nice-to-Have Features

Built **only** if all Core Features are live at the public URL and the run book is green. Listed in
the order we would attempt them. Any of these may be cut without discussion (Constitution:
Scope-Cut Authority).

| ID | Feature | Value | Cut posture |
|---|---|---|---|
| NH-1 | **Book-level summary strip** — counts by tier, total ARR at risk, "N accounts need you this week" | Strong demo opener; one number that frames the whole product | Low effort, high payoff — attempt first |
| NH-2 | **Bulk triage** — approve/reject several recommendations in sequence without leaving the list | Shows the 15-of-100 problem being solved at scale | Attempt second |
| NH-3 | **Risk trend sparkline** — health score over recent weeks per account | Makes "we could have caught this in week 6" visible | Attempt third |
| NH-4 | **Tone control on drafts** — formal / warm / urgent | Pleasant, not load-bearing | Cut freely |
| NH-5 | **Rejection-reason rollup** — where the agent is most often wrong | Honest and judge-pleasing, but no user value inside a 4-day demo | Cut freely |

**Explicitly deferred beyond nice-to-have:** notification/digest delivery, saved views, search,
account assignment, and anything requiring authentication beyond a single demo user.

---

## 7. Key User Flows

Five end-to-end flows. **Flow 2 is the canonical Principle II workflow** — the one the demo video
must show running live, unbroken.

### Flow 1 — Weekly triage (JTBD-1)
1. Maya opens the public URL.
2. The workspace loads her book, ranked by risk; Critical accounts sit at the top with their risk driver visible in one phrase.
3. She sees which accounts have pending unreviewed recommendations.
4. She opens the highest-risk account.

**Exit:** Maya knows where to spend her week within 10 seconds of page load, without opening a second tool.

---

### Flow 2 — Signal → recommendation → approved action (CANONICAL, JTBD-2 + 3 + 4)
1. An account accumulates signals (seeded history: a P1 support ticket unresolved for 4 days, a 60% drop in weekly active users, an NPS response of 3).
2. The system computes the health score and assigns the risk tier.
3. The agent generates a grounded risk explanation citing the specific ticket and the specific usage drop, with dates.
4. The agent selects a next-best action from the taxonomy and states why it fits this risk driver.
5. The agent drafts the outreach message executing that action, referencing the real situation.
6. Maya reviews. She edits one sentence, then approves.
7. The approval, the final message text, and the timestamp are written to the account timeline; the account's pending state clears.

**Exit:** One complete traversal of the Constitution's six-step chain — external signal to logged, human-approved outcome, with no stubbed step. **Target: ≤ 90 seconds.**

---

### Flow 3 — Live signal injection (demo-critical)
1. In front of a judge, Maya uses "Add signal" on a currently Healthy account — e.g. logs a new P1 support ticket.
2. The health score recomputes immediately and the account's tier changes.
3. The agent regenerates the risk explanation and produces a fresh recommendation and draft reflecting the new signal.
4. The account re-sorts upward in the workspace list.

**Exit:** Proves the logic is real and running at demo time, not pre-baked. This flow is the single
strongest defense of Constitution Principle IV and the most persuasive 20 seconds of the video.

---

### Flow 4 — Disagreement and correction (JTBD-4)
1. Maya opens a recommendation she disagrees with.
2. She either edits the draft substantively before approving, or rejects it with a selected reason ("wrong risk driver", "already handled", "wrong timing", "wrong tone").
3. The decision and reason are written to the timeline.
4. The account returns to the workspace without a pending recommendation.

**Exit:** The human is demonstrably in control, and disagreement is a first-class recorded outcome
rather than a dead end.

---

### Flow 5 — Account history audit (JTBD-5)
1. Maya opens any account and views its timeline.
2. She sees, in chronological order: signals as they arrived, health-score changes with the signals that caused them, every agent recommendation, and every human decision with its reason.

**Exit:** A judge can reconstruct exactly what the agent did, on what evidence, and what the human
decided — the traceability that makes the product credible rather than a black box.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — See risk and act on it end to end (Priority: P1)

Maya opens her risk-ranked book, opens the top account, reads why it is at risk, and approves the
drafted outreach. Covers Flows 1, 2, and Flow 5's write path.

**Why this priority**: This *is* the Principle II workflow. If only this ships, the submission is
valid and complete.

**Independent Test**: Load the public URL with seeded data and traverse from account list to logged
approval without touching any other feature. Delivers the entire core value proposition.

**Acceptance Scenarios**:

1. **Given** a seeded book with at least 8 accounts across all three tiers, **When** Maya loads the workspace, **Then** accounts appear ranked most-at-risk first, each showing score, tier, and a one-phrase risk driver.
2. **Given** a Critical account with at least 2 signals, **When** Maya opens it, **Then** a risk explanation is shown naming at least two specific signals with their dates.
3. **Given** a displayed recommendation and draft, **When** Maya approves, **Then** the decision, final message text, and timestamp are written to the account timeline and the pending indicator clears.
4. **Given** an approved recommendation, **When** Maya returns to the workspace, **Then** the account no longer shows a pending recommendation.

---

### User Story 2 — Trigger the agent live on a new signal (Priority: P2)

Maya adds a signal to a Healthy account and watches score, explanation, recommendation, and draft
all regenerate. Covers Flow 3.

**Why this priority**: Converts a plausible demo into an undeniable one and directly defends
Principle IV. Second only to the workflow itself.

**Independent Test**: On the deployed app, add a severe signal to a Healthy account and confirm the
tier change and fully regenerated agent output, without relying on any seeded recommendation.

**Acceptance Scenarios**:

1. **Given** a Healthy account, **When** Maya logs a new high-severity signal, **Then** the health score decreases and the risk tier updates.
2. **Given** the recomputed score, **When** the agent regenerates, **Then** the new explanation cites the newly added signal by type and date.
3. **Given** the regenerated recommendation, **When** Maya returns to the workspace, **Then** the account has moved up the risk ranking.

---

### User Story 3 — Disagree, correct, and record (Priority: P3)

Maya edits or rejects a recommendation with a reason. Covers Flow 4.

**Why this priority**: Establishes human-in-the-loop control as real rather than decorative. Cheap
to build once CF-7 exists.

**Independent Test**: Reject one recommendation with a reason and edit-then-approve another;
confirm both outcomes are distinctly recorded.

**Acceptance Scenarios**:

1. **Given** a pending recommendation, **When** Maya rejects it with a reason, **Then** the rejection and its reason appear in the timeline and the recommendation clears.
2. **Given** a drafted message, **When** Maya edits the text and approves, **Then** the timeline records the edited text — not the original — and marks the entry as edited.

---

### User Story 4 — Reconstruct account history (Priority: P4)

Maya reviews a full account timeline. Covers Flow 5's read path.

**Why this priority**: Traceability and judge credibility. The last thing to cut.

**Independent Test**: Open an account with prior activity and confirm signals, score changes,
recommendations, and decisions all appear in correct chronological order.

**Acceptance Scenarios**:

1. **Given** an account with signals and at least one prior decision, **When** Maya opens the timeline, **Then** all event types appear in chronological order with timestamps.
2. **Given** a health-score change in the timeline, **When** Maya inspects it, **Then** the signal that caused the change is identifiable.

---

### Edge Cases

| # | Condition | Required behavior |
|---|---|---|
| E1 | Account has fewer than 2 signals | Show "Insufficient signal — not enough history to assess." No score, no recommendation, no fabricated explanation. |
| E2 | Agent cannot ground an explanation in ≥ 2 signals | Suppress the explanation and show the insufficient-signal state. Never emit an ungrounded narrative. |
| E3 | Model call fails or times out | Human-readable message ("Couldn't generate a recommendation — retry"), a retry control, and the account remains usable. Never a stack trace, never a blank screen, never a silent failure. |
| E4 | Model returns an action outside the taxonomy | Reject the output, retry once, then fall back to the highest-weight taxonomy action for that risk driver and mark it low confidence. |
| E5 | All signals older than the decay horizon | Score trends toward neutral and the account is flagged "stale — no recent signal" rather than Healthy. A silent account is not a healthy account. |
| E6 | Two signals of the same type on the same day | Both recorded; scoring counts them without double-penalizing beyond a per-type-per-day cap. |
| E7 | Maya approves a recommendation that is stale (a newer signal arrived after generation) | Warn that a new signal has arrived since generation; offer regenerate-or-proceed. Do not silently approve against outdated reasoning. |
| E8 | Empty book (no accounts) | Explanatory empty state with a path to seed demo data — never a blank page. |
| E9 | Very long generated draft | Draft is bounded and scrollable; layout never breaks. |
| E10 | Concurrent edit of the same recommendation | Last write wins; the timeline records what was actually approved. Acceptable for a single-user demo — documented, not silently ignored. |

---

## 8. AI / Agent Capabilities

### 8.1 The core architectural decision — deterministic score, reasoned narrative

**The health score is computed deterministically. Only the explanation, recommendation, and draft
are model-generated.**

Rationale:

- **Reproducibility** — the same signals always yield the same score, so a judge can verify cause and effect live (Flow 3 depends on this).
- **Auditability** — "why is this 34?" has an inspectable answer, which a model-generated number cannot provide.
- **Latency and cost** — scoring a full book via model calls on page load would blow the < 60s cold-start budget.
- **Honesty** — Constitution Principle IV. A model asked to produce a number produces a plausible number, not a correct one.

The model is applied where it is genuinely better than rules: reading heterogeneous signals into a
coherent human narrative, choosing a fitting action, and writing the message.

### 8.2 Agent capability inventory

| # | Capability | Input | Output | Model tier |
|---|---|---|---|---|
| A1 | **Signal enrichment** — normalize a raw signal into type, severity, and a one-phrase summary | Raw signal text/metadata | Typed, severity-rated signal | Fast tier (`claude-sonnet-5`) |
| A2 | **Risk explanation** — explain why this account is at risk, in the CSM's language | Account context + scored signals | 2–4 sentence grounded explanation citing ≥ 2 signals with dates | Quality tier (`claude-opus-5`) |
| A3 | **Next-best-action selection** — choose the action addressing the dominant risk driver | Explanation + risk driver + taxonomy | One taxonomy action + one-sentence justification + confidence | Quality tier (`claude-opus-5`) |
| A4 | **Outreach drafting** — write the message that executes the action | Action + account context + risk driver | Subject + body referencing the account's actual situation | Quality tier (`claude-opus-5`) |

Model selection follows the Constitution's Technical Guardrails: `claude-opus-5` where output
quality is directly visible to a judge, `claude-sonnet-5` for high-frequency enrichment where
latency dominates. Prefer native.builder's own model integration; a direct API call is a logged
escape hatch.

### 8.3 Grounding requirements (non-negotiable)

- **G1** — Every risk explanation MUST cite ≥ 2 specific signals, each identified by type and date. Ungrounded output is a defect, not a stylistic issue.
- **G2** — Every recommendation MUST name the risk driver it addresses.
- **G3** — Every outreach draft MUST reference at least one concrete account fact (the specific ticket, the specific usage change, the specific product area).
- **G4** — The agent MUST NOT invent signals, dates, contract values, people, or events absent from the account record. Fabrication is a hard failure, not a hallucination to tolerate.
- **G5** — When grounding is impossible, the agent MUST return the insufficient-signal state rather than generating anyway.

### 8.4 Bounded action taxonomy

The agent selects from exactly these six actions. A response outside this set is invalid output
(see edge case E4).

| Action | Fits when the dominant driver is |
|---|---|
| `schedule_check_in_call` | Broad decline with no single cause; relationship gap |
| `send_reengagement_email` | Usage/login decline with no support friction |
| `escalate_to_support` | Unresolved or aging support tickets |
| `offer_training_session` | Low feature adoption; onboarding never completed |
| `executive_sponsor_outreach` | High ARR combined with champion departure or executive dissatisfaction |
| `flag_for_renewal_risk_review` | Critical tier with a renewal inside 90 days |

A bounded taxonomy is a deliberate constraint: it makes agent output evaluable, prevents the demo
from wandering, and gives E4's fallback a well-defined target.

### 8.5 Safety and control boundaries

- **S1** — **No auto-send.** No agent output leaves the system without explicit human approval. This is a product principle, not a configuration option.
- **S2** — **No destructive autonomy.** The agent cannot modify account records, delete signals, or alter its own scoring weights.
- **S3** — **Synthetic data only.** No real customer identities enter the system (Constitution: Data and Secrets).
- **S4** — **Attribution visible.** Every agent-generated element is labeled as agent-generated in the UI. The CSM always knows what a machine wrote.

---

## 9. Data Model

Business-level entities and their meaningful attributes. Storage mechanics are a `/sp.plan` concern.

### Key Entities

- **Account** — a customer company Maya owns. Attributes: name, industry, ARR, plan tier, renewal date, owning CSM, primary contact name and role, onboarding completion date, current health score, current risk tier, last touch date, demo-data flag.
- **Signal** — one piece of evidence about an account's state; the atomic input to everything. Attributes: account, type (support_ticket | usage_drop | login_gap | billing_event | nps_response | feature_adoption), occurred-at, severity (low | medium | high | critical), raw description, enriched summary (agent-produced, A1), source (seeded | manual injection), weight contribution.
- **HealthSnapshot** — a point-in-time score with its derivation, making score changes auditable. Attributes: account, computed-at, score (0–100), tier, contributing signals with per-signal weight, dominant risk driver, delta from previous snapshot, triggering signal.
- **Recommendation** — one agent proposal awaiting or having received a human decision. Attributes: account, health snapshot, generated-at, risk explanation (A2), cited signals (≥ 2, enforced), selected action (taxonomy), action justification, confidence, status (pending | approved | edited_approved | rejected), model used.
- **OutreachDraft** — the message that executes the recommendation. Attributes: recommendation, subject, body, generated-at, final text after human edit, was-edited flag.
- **Decision** — the human's response; the record that closes the loop. Attributes: recommendation, decided-by, decided-at, outcome (approved | edited_approved | rejected), rejection reason (wrong_risk_driver | already_handled | wrong_timing | wrong_tone | other), final message text.
- **TimelineEvent** — the unified audit stream rendered per account. Attributes: account, occurred-at, event type (signal_received | score_changed | recommendation_generated | decision_made), reference to the source record, display summary.
- **User (CSM)** — Maya. Single demo user for this build; no multi-tenancy, no roles, no permissions. Attributes: name, email, book of accounts.

### Relationships

```text
User (CSM)      1—N  Account
Account         1—N  Signal
Account         1—N  HealthSnapshot     (Signal triggers HealthSnapshot)
HealthSnapshot  1—1  Recommendation     (generated for Watch/Critical tiers only)
Recommendation  1—1  OutreachDraft
Recommendation  1—1  Decision           (once resolved)
Account         1—N  TimelineEvent      (projection over Signal, HealthSnapshot,
                                         Recommendation, Decision)
```

### Seed data requirement

At least **8 accounts** (Constitution metric P4) spanning all three tiers, each with **4–10 signals**
across at least three signal types, and at least **3 accounts carrying prior resolved decisions** so
timelines are not empty at demo time. At least one account must be Healthy with recent activity —
it is the target for the Flow 3 live injection.

---

## 10. Integrations

**Position: zero live third-party integrations in this build.** All external systems are represented
by seeded and manually injected signals. This is a deliberate scope decision, stated plainly in the
submission rather than implied away.

| System | Status this build | Represented as |
|---|---|---|
| Support desk (Zendesk / Intercom) | **Simulated** | Seeded `support_ticket` signals; live injection via "Add signal" |
| Product analytics (Amplitude / Mixpanel) | **Simulated** | Seeded `usage_drop`, `login_gap`, `feature_adoption` signals |
| CRM (HubSpot / Salesforce) | **Simulated** | Account attributes: ARR, plan, renewal date, contact |
| Billing (Stripe) | **Simulated** | Seeded `billing_event` signals |
| Survey (Delighted / in-app NPS) | **Simulated** | Seeded `nps_response` signals |
| Email delivery (SendGrid / Gmail) | **Not integrated — by design** | Approved messages are logged, never transmitted (boundary S1) |
| Slack / Teams notification | **Not integrated** | Out of scope |

**Actually integrated:**

| Dependency | Role |
|---|---|
| **native.builder** | Primary build surface — UI, data, workflow orchestration, deployment (Constitution Principle I) |
| **Claude models** | Agent reasoning: `claude-opus-5` for A2–A4, `claude-sonnet-5` for A1. Via native.builder's model integration where available; direct API is a logged escape hatch |

**Why no live integrations:** OAuth flows, webhook reliability, and third-party sandbox provisioning
are three of the most common ways a hackathon team spends two days and ships nothing. The signal
*abstraction* is the product's real interface — a live connector is a post-hackathon adapter behind
it, and we will say exactly that in the submission.

---

## 11. Non-Functional Requirements

| ID | Requirement | Target | Verified by |
|---|---|---|---|
| **NFR-1** | Cold start to first recommended action, new visitor on seeded data | < 60 s | Stopwatch on public URL, 3 runs (Constitution P1) |
| **NFR-2** | Full canonical workflow (Flow 2) completion | ≤ 90 s | Timed live run (Constitution P2) |
| **NFR-3** | Workspace list renders the full seeded book | ≤ 3 s on standard broadband | Manual timing, 3 runs |
| **NFR-4** | Agent generation (explanation + recommendation + draft) | ≤ 20 s, with a visible progress state throughout | Timed; no silent wait over 2 s anywhere |
| **NFR-5** | Grounding compliance | 100% of shown explanations cite ≥ 2 signals | Manual review of 10 generated outputs (Constitution P3) |
| **NFR-6** | Reliability | 0 unhandled errors across 10 consecutive full workflow runs | Pre-submission run book (Constitution P5) |
| **NFR-7** | Error visibility | 100% of failure paths render a human-readable message with a next step | Deliberate fault injection per E3/E4 |
| **NFR-8** | Availability | Public URL reachable throughout the judging window | Daily check from a clean browser session (Constitution S1) |
| **NFR-9** | Demo-data transparency | Seeded data visibly labeled in-product | Visual inspection (Constitution Principle IV) |
| **NFR-10** | Privacy | Zero real customer identities in the system | Seed-data audit before submission |
| **NFR-11** | Secrets handling | No credentials in repo, prompts, or client-visible surfaces | Pre-submission scan |
| **NFR-12** | Presentation surface | Legible on a 1280×720 projected screen and on a laptop browser | Visual check at demo resolution |

**Deliberately not required this build:** horizontal scale, multi-tenancy, authentication hardening,
accessibility certification, internationalization, mobile layouts, offline support, data-retention
policy. Each is a real production requirement and an explicit non-goal here (Constitution: One
Persona, One Pain).

---

## 12. Out of Scope

**Product surface**

- Live third-party integrations of any kind (see §10)
- Real outbound email / SMS / Slack delivery — approved actions are logged only
- Multi-tenant auth, org management, roles, permissions, billing
- Manager or VP portfolio analytics, NRR forecasting, cohort reporting
- Mobile-native applications
- Onboarding flows, marketing site, pricing page, settings screens
- Search, saved views, account assignment, bulk import

**Agent scope**

- Autonomous sending, or any action without human approval (hard boundary S1)
- Model fine-tuning, training, or evaluation harnesses
- Agent-authored changes to scoring weights
- Multi-turn conversational chat with the agent — output is structured, reviewed, and decided upon, not chatted about
- Any action outside the six-item taxonomy (§8.4)

**Users**

- Anyone who is not Maya: enterprise CSMs with account teams, support agents, VP-level reporting, PLG companies without a CSM function, and the end customer

**Process**

- Automated test suites — replaced by a manual run book for this window (Constitution: Engineering Discipline)
- Refactoring of working code during the build window
- Any "backup implementation" on a second platform (Constitution: No Second Platform)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all accounts ranked by risk, most at-risk first, with score, tier, one-phrase risk driver, and pending-recommendation state visible per row.
- **FR-002**: System MUST compute a deterministic 0–100 health score from an account's signals, applying time-decay to older signals; identical signal sets MUST produce identical scores.
- **FR-003**: System MUST assign risk tiers by score: Healthy 70–100, Watch 40–69, Critical 0–39.
- **FR-004**: System MUST support both seeded signals and manual signal injection through the UI.
- **FR-005**: System MUST recompute the health score and regenerate agent output whenever a new signal is added to an account.
- **FR-006**: System MUST generate a risk explanation citing at least two specific signals by type and date for every Watch or Critical account.
- **FR-007**: System MUST suppress the explanation and show an insufficient-signal state when fewer than two groundable signals exist.
- **FR-008**: System MUST select exactly one action from the six-item taxonomy and state in one sentence how it addresses the dominant risk driver.
- **FR-009**: System MUST generate an outreach draft (subject and body) referencing at least one concrete account fact.
- **FR-010**: Users MUST be able to approve, edit-then-approve, or reject-with-reason every recommendation.
- **FR-011**: System MUST NOT transmit any generated message to any external destination under any circumstance.
- **FR-012**: System MUST record every human decision — outcome, reason, final message text, timestamp — to the account timeline.
- **FR-013**: System MUST render a per-account chronological timeline interleaving signals, score changes, recommendations, and decisions.
- **FR-014**: System MUST visibly label agent-generated content as agent-generated.
- **FR-015**: System MUST visibly label seeded demo data as demo data.
- **FR-016**: System MUST render a human-readable message with a recovery path on every failure, including model timeout and invalid model output.
- **FR-017**: System MUST reject model output specifying an action outside the taxonomy, retry once, then fall back to a taxonomy default marked low-confidence.
- **FR-018**: System MUST warn before approving a recommendation generated prior to a newer unprocessed signal.
- **FR-019**: System MUST ship with at least 8 seeded accounts spanning all three tiers, each carrying 4–10 signals across at least 3 signal types.
- **FR-020**: System MUST be reachable at a stable public URL throughout the judging window.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor reaches a specific, grounded recommended action within **60 seconds** of opening the public URL, without instruction.
- **SC-002**: The complete workflow — signal to logged human-approved decision — is traversable in **≤ 90 seconds**.
- **SC-003**: **100%** of displayed risk explanations cite at least two specific signals with dates, across a 10-output review.
- **SC-004**: **Zero** unhandled errors across **10 consecutive** full workflow runs.
- **SC-005**: Adding a signal live changes the account's score, tier, ranking position, and regenerated agent output within **20 seconds**.
- **SC-006**: A judge can reconstruct what the agent recommended, on what evidence, and what the human decided, from the timeline alone — without asking a question.
- **SC-007**: **Zero** generated messages are transmitted externally.
- **SC-008**: Time to assess one account's risk drops from a manual baseline of **~20 minutes** to **under 30 seconds**, stated with its derivation per Constitution Principle VII.

### Mapping to judging dimensions

| Dimension | Our evidence | Backed by |
|---|---|---|
| **Application of Technology** | The model does the work only a model can do — reading heterogeneous signals into a human narrative, choosing a fitting action, writing the message — while deterministic logic owns the score. Grounding is enforced (≥ 2 cited signals), output is bounded to a defined taxonomy, and invalid output has a defined fallback. Applied AI with guardrails, not a chat box bolted onto a CRUD app. | SC-003, SC-005, FR-006–FR-009, FR-017, §8.1 |
| **Presentation** | 3-minute video: problem (30s) → live Flow 2 on the public URL (60s) → live Flow 3 signal injection proving nothing is pre-baked (30s) → impact and native.builder build story (60s). Every claim shown, not asserted. | SC-001, SC-002, SC-005, Constitution S4 |
| **Business Value/Impact** | Named persona with a quantified gap: 15 of 100 accounts managed. Per-account assessment falls from ~20 minutes to under 30 seconds, with the derivation and assumptions stated rather than inflated. The human-approval boundary makes it deployable in a real CS org on day one. | SC-008, §2, §3, boundary S1 |
| **Originality/Creativity** | Most CS tooling outputs a score and stops — the CSM still does the thinking and the writing. This agent closes the know→act gap: it delivers the drafted action, not the number. The bounded taxonomy plus enforced grounding is a deliberately un-flashy design choice that makes agent output trustworthy enough for a human to actually approve. | §8.1, §8.3, §8.4, CF-5, CF-6 |

---

## Assumptions

1. **native.builder can host the full application** — data model, workflow logic, UI, and public deployment. Verified in Phase 0 of `/sp.plan` against `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)` in the constitution. Any gap becomes a logged escape hatch under the 20% budget.
2. **Model access is available** either through native.builder's integration or a direct Anthropic API call as a logged escape hatch.
3. **Single demo user.** No authentication is built; the deployed app opens directly into Maya's book. Multi-user is out of scope.
4. **Signals are pre-typed at ingestion.** Manual injection presents a typed form rather than free-text parsing, keeping A1 enrichment lightweight and the demo deterministic.
5. **Scoring weights are hand-tuned, not learned**, and are documented so a judge can inspect them. Defensible for a hackathon; a learned model is a post-hackathon concern.
6. **Time-decay horizon is 90 days** — signals older than that contribute negligibly and trigger the stale state (E5).
7. **"Last touch" is derived** from the most recent approved decision on the account, since no real communication channel is integrated.
8. **Demo data is fictional** — invented company names, contacts, and events. No real or recognizable customer data (NFR-10).
9. **Judging is a browser session, not an install.** All value must be reachable from the public URL with zero setup.

---

## Dependencies

| Dependency | Owner | Risk if unavailable |
|---|---|---|
| native.builder account + deployment capability | Team | **Critical** — blocks Constitution Principle I and metric S1. Resolved on D1 before feature work. |
| Claude model access (`claude-opus-5`, `claude-sonnet-5`) | Team | **High** — blocks CF-4 through CF-6. Mitigation: verify on D1 alongside deployment. |
| Seed dataset (8+ accounts, 40+ signals) | Team | **Medium** — blocks every demo flow. Authored on D2. |
| Demo recording and submission | Team | **Critical at deadline** — record D4, submit D5 with ≥ 4h buffer (Constitution hard cutoff). |

---

## Open Questions

None blocking. Two items are deferred by design and resolved in `/sp.plan` Phase 0:

1. **native.builder capability boundaries** — carried from the constitution as `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)`. Determines how much of §9's data model and §8's agent orchestration lives natively versus behind a logged escape hatch. Changes *where* things are built, not *what* is built.
2. **Exact scoring weights per signal type** — a tuning detail, not a scope question. Authored with the seed data on D2 and documented for inspection.
