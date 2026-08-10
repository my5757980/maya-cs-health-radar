---
description: "Task list for Smart Customer Success Agent implementation"
---

# Tasks: Smart Customer Success Agent

**Input**: Design documents from `/specs/001-customer-success-agent/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
**Constitution**: `.specify/memory/constitution.md` v1.0.0

**Tests**: No automated test suite (Constitution: Engineering Discipline — replaced by a manual run
book for this window). The contract tests C1–C8 and the 7-section run book are **manual verification
tasks** in Phase 3, and they are gates, not formalities.

**Organization**: The three phases below use the requested Day groupings. Inside them, tasks are
grouped by user story (US1–US4) so each story stays independently implementable and testable.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path (Size)`

- **[P]**: Order-independent — different files, no dependency on an incomplete task
- **[Story]**: US1–US4, mapping to spec.md user stories. Setup, Foundational, and Polish tasks carry no story label
- **Size**: **S** ≤ 30 min · **M** 30–90 min · **L** 90 min–3 h — measured as *prompt + review + fix cycle*, since most tasks are one instruction to native.builder's Builder agent, not hand-written code

> **Calendar reconciliation.** The requested Day 1–7 grouping is mapped onto the real remaining
> window from plan.md §9: the hackathon runs Aug 3–10 and planning began Aug 6, so hackathon days
> 1–3 elapsed before the project started. **Phase 2's "Day 3–5" compresses into a single build day
> (D3, Aug 8).** That compression is the schedule's tightest point and the reason Phase 2 carries
> only the two highest-priority stories.

| Requested phase | Real build days | Dates |
|---|---|---|
| Phase 1 – Foundation | D1–D2 | 2026-08-06 → 2026-08-07 |
| Phase 2 – Core Workflows & Agents | D3 | 2026-08-08 |
| Phase 3 – Polish, Test, Deploy, Demo | D4–D5 | 2026-08-09 → 2026-08-10 |

**Path conventions** (from plan.md § Project Structure): app code under `src/`, database and
functions under `supabase/`, compliance artifacts under `docs/`. native.builder generates `src/`
and `supabase/`; `docs/` is authored by hand.

---

## Phase 1 – Foundation (Day 1–2 → D1–D2, Aug 6–7)

### Setup — platform, deployment, and risk retirement (D1)

**Purpose**: Retire every risk that can end the project, before a single feature exists. D1 ships
**zero features** by design (plan.md §9, R1/R2/R5).

- [ ] T000 Sign up for the hackathon on the lablab.ai event page — required before any partner access can be claimed (S) ⚠️ **NEW, verified 2026-08-06**
- [ ] T001 Create the account at https://builder.nativelyai.com/ and upgrade using promo code **`AIFACTORY26`** — the lablab.ai Builder Plan is **FREE for 1 month**. Still do this **before issuing any generation prompt** (S) ✅ **REVISED — cost is $0, not $20** (see [hackathon-brief.md](./hackathon-brief.md) §2)
- [ ] T002 [P] Authorize Supabase at workspace level via Settings → Integrations → Supabase OAuth (S)
- [ ] T003 [P] Create an empty Supabase project and record the project reference in `README.md` (S)
- [ ] T004 Create the native.builder project and brief the Product Architect with a **scoped** brief — the 4 screens, 7 entities, and 6-step workflow only; save the brief verbatim to `docs/build-brief.md` (M)
- [ ] T005 Link the app to the Supabase project and enable agent access via App → Integrations (S)
- [ ] T006 **Publish the empty app** via Settings → Publish and record the permanent `*.nativelyai.app` URL in `README.md` (Constitution Principle III) (S)
- [ ] T007 Verify the runtime model path: create a throwaway Supabase Edge Function that calls `claude-opus-5` with a representative 12-signal payload, and record measured latency in `docs/metrics.md` against the ≤17s budget (M)
- [ ] T008 Delete the throwaway Edge Function from `supabase/functions/` (S)
- [ ] T009 [P] Create `docs/escape-hatches.md`, `docs/runbook.md`, and `docs/metrics.md` with section skeletons (S)

**Checkpoint D1**: Public URL loads in an incognito window · paid plan active · Supabase linked ·
one real Anthropic call succeeded and its latency is recorded · **zero features built**.
If T007 exceeded ~17s, reduce the assessment context to the 8 most-weighted signals in
`contracts/agent-functions.md` before D3 rather than discovering the overrun mid-build.

---

### Foundational — schema, scoring, and seed data (D2)

**Purpose**: Everything every user story depends on.

**⚠️ BLOCKING**: No user story work begins until T021 passes.

- [ ] T010 Generate the 10 Postgres enums per data-model.md § Enums in `supabase/migrations/` — `cs_action` as an enum is the database-level enforcement of the bounded taxonomy (S)
- [ ] T011 Generate the 7 tables — `accounts`, `signals`, `health_snapshots`, `recommendations`, `outreach_drafts`, `decisions`, `timeline_events` — with all CHECK constraints from data-model.md, including `grounding_requires_two_citations` and `reason_iff_rejected`, in `supabase/migrations/` (L)
- [ ] T012 [P] Create the `v_account_workspace` view and the `one_pending_per_account` partial unique index in `supabase/migrations/` (S)
- [ ] T013 Create RLS policies scoping every table to `auth.uid()`, granting `signals` **select and insert only** (no update, no delete) in `supabase/migrations/` (M)
- [ ] T014 Seed the demo user `maya@demo.invalid` and implement auto-sign-in on page load in `src/lib/supabase.ts` — no login screen, no signup (M)
- [ ] T015 [P] Implement `src/lib/scoring.ts` as a pure synchronous function: weights, severity multipliers, 90-day linear decay, per-type-per-day cap of 2, tier boundaries 70/40, and the stale rule (E5). **No network call, no model call** (M)
- [ ] T016 [P] Implement `src/lib/taxonomy.ts` with the 6 actions and the dominant-driver → default-action map used by the E4 fallback, including the renewal-under-90-days override (S)
- [ ] T017 Author `src/data/seed-data.json` per data-model.md § Seed dataset: 8–12 fictional accounts (≥2 critical, ≥3 watch, ≥3 healthy, ≥1 stale, ≥1 single-signal), 4–10 signals each across ≥3 types with `occurred_at` spread 0–120 days, ≥3 accounts with prior resolved decisions, all `is_demo_data = true` (L)
- [ ] T018 Implement and run the seeding routine that loads `src/data/seed-data.json` into Supabase, writing initial `health_snapshots` and `timeline_events` rows (M)
- [ ] T019 Verify scoring correctness: hand-compute scores for 3 seeded accounts and confirm they match `scoring.ts` output exactly, and confirm the **injection-target account lands in 71–76** (S)
- [ ] T020 [P] Build `src/components/DemoDataBadge.tsx` for the CF-9 demo-data label (S)
- [ ] T021 Publish and verify the seeded data renders at the public URL in a clean incognito session (S)

**Checkpoint D2 / Phase 1 complete**: 8–12 accounts persist and render · scores are reproducible and
hand-verified · injection target sits at 71–76 · deployment is current. **User story work may begin.**

---

## Phase 2 – Core Workflows & Agents (Day 3–5 → D3, Aug 8)

> This phase carries the entire product value in one build day. If it slips, Phase 3 absorbs US2 and
> the nice-to-haves are gone — that trade is pre-authorized (Constitution: Scope-Cut Authority).

### User Story 1 — See risk and act on it end to end (Priority: P1) 🎯 MVP

**Goal**: Maya opens a risk-ranked book, opens the top account, reads a grounded explanation, and
approves a drafted outreach. This is the Constitution's Principle II workflow. **If only this ships,
the submission is valid and complete.**

**Independent Test**: Load the public URL with seeded data and traverse account list → logged
approval without touching any other feature.

- [ ] T022 [US1] Build `src/pages/Workspace.tsx` as a single query against `v_account_workspace`, sorted most-at-risk first with `stale` ranked alongside `watch` (M)
- [ ] T023 [P] [US1] Build `src/components/AccountRow.tsx` showing name, ARR, score, tier badge, one-phrase dominant risk driver, days since last touch, and the pending-recommendation indicator (M)
- [ ] T024 [US1] Store `ANTHROPIC_API_KEY` in Supabase secret storage using the Builder agent's **masked input** — have the correct key ready, replacement has no undo (S)
- [ ] T025 [US1] Build `supabase/functions/generate-assessment/` per contracts/agent-functions.md §2: `claude-opus-5`, closed context of the 12 most-weighted signals, single structured JSON response containing explanation, citations, action, justification, confidence, and draft subject/body (L)
- [ ] T026 [US1] Add server-side validations V1–V5 to `supabase/functions/generate-assessment/`: taxonomy membership, ≥2 citations, **citation-ID subset check against supplied context**, non-empty fields, confidence coercion — with exactly **one retry**, then the driver-default fallback at `confidence: "low"` or `insufficient_signal` (L)
- [ ] T027 [P] [US1] Build `src/components/AssessmentPanel.tsx` rendering the explanation, cited signals with type and date, selected action, justification, confidence, and a visible agent-generated attribution label (S4) (M)
- [ ] T028 [P] [US1] Build `src/components/DraftEditor.tsx` with editable subject and body and an Approve control (M)
- [ ] T029 [US1] Build `src/pages/AccountDetail.tsx` wiring AssessmentPanel and DraftEditor, invoking `generate-assessment` for Watch/Critical accounts (M)
- [ ] T030 [US1] Implement the approve write path per contracts/agent-functions.md §3: insert `decisions`, set `outreach_drafts.final_text`, set `recommendations.status`, update `accounts.last_touch_at`, insert `timeline_events` — all in one client transaction (M)
- [ ] T031 [US1] Pre-generate and persist assessments for all seeded Watch/Critical accounts so the workspace has no cold-generation delay on first load (R4 mitigation, protects SC-001) (S)
- [ ] T032 [US1] Publish and verify Flow 2 end to end in a clean incognito session: ≤ 90 seconds, ≥ 2 cited signals, decision written to the timeline (S)

**Checkpoint US1**: The Principle II workflow runs live at the public URL. **The submission is now
valid even if everything below is cut.**

---

### User Story 2 — Trigger the agent live on a new signal (Priority: P2)

**Goal**: Maya adds a signal to a Healthy account and score, tier, ranking, and agent output all
regenerate on camera. This is the strongest available defense of Constitution Principle IV.

**Independent Test**: On the deployed app, add a `critical` signal to the injection-target account
and confirm the tier change and fully regenerated output, without relying on any seeded
recommendation.

- [ ] T033 [P] [US2] Build `supabase/functions/enrich-signal/` per contracts/agent-functions.md §1: `claude-sonnet-5`, ≤12-word summary, 8s timeout, truncate rather than reject on overlength (M)
- [ ] T034 [US2] Build `src/components/AddSignalModal.tsx` as a typed form — type, severity, occurred-at, raw description — so injection is deterministic and needs no free-text parsing (M)
- [ ] T035 [US2] Implement the add-signal write path: insert `signals` → recompute via `scoring.ts` → insert `health_snapshots` with contributing-signal breakdown and triggering signal → update the denormalized `accounts` fields → invoke `generate-assessment` when tier is Watch or Critical → insert `timeline_events` for each step. **Enrichment failure must never block the signal insert** (L)
- [ ] T036 [US2] Verify Flow 3 on the deployed URL: score drops ≈30 points, tier changes Healthy → Watch, the new assessment cites the newly added signal by date, and the account moves up the ranking — all within 20 seconds (S)
- [ ] T037 [US2] If the tier change is not visibly dramatic, retune the injection-target account's seed signals in `src/data/seed-data.json` and reseed (S)
- [ ] T038 [US2] Publish and re-verify both Flow 2 and Flow 3 in a clean session (S)

**Checkpoint US2 / Phase 2 complete**: The demo's two decisive moments both work live.

---

## Phase 3 – Polish, Test, Deploy, Demo (Day 6–7 → D4–D5, Aug 9–10)

### User Story 3 — Disagree, correct, and record (Priority: P3)

**Goal**: Rejection and edit-then-approve are first-class recorded outcomes, establishing that
human-in-the-loop control is real rather than decorative.

**Independent Test**: Reject one recommendation with a reason and edit-then-approve another; confirm
both outcomes are recorded distinctly.

- [ ] T039 [P] [US3] Add reject-with-reason controls to `src/components/DraftEditor.tsx` with the 5 reason options from the `reject_reason` enum (M)
- [ ] T040 [US3] Implement the reject and edited-approve write paths: `decisions` with `outcome` and `rejection_reason`, `outreach_drafts.was_edited = true` with the **edited** text in `final_text`, `recommendations.status`, and a `timeline_events` row (M)
- [ ] T041 [US3] Verify both outcomes appear distinctly in the timeline and that the edited text — not the original — is recorded (S)

---

### User Story 4 — Reconstruct account history (Priority: P4)

**Goal**: A judge can reconstruct what the agent did, on what evidence, and what the human decided,
from the timeline alone (SC-006).

**Independent Test**: Open an account with prior activity and confirm all four event types appear in
correct chronological order.

- [ ] T042 [P] [US4] Build `src/components/TimelineFeed.tsx` rendering all four event types from `timeline_events` in one indexed read (M)
- [ ] T043 [US4] Build `src/pages/AccountTimeline.tsx` and route to it from AccountDetail (S)
- [ ] T044 [US4] Verify chronological ordering and that the signal causing each score change is identifiable from the snapshot's contributing breakdown (S)

---

### Polish — edge cases, error paths, and compliance surfaces (D4)

- [ ] T045 [P] Implement the E7 staleness warning in `src/pages/AccountDetail.tsx`: compare `recommendations.snapshot_id` against the account's latest snapshot and offer regenerate-or-proceed before Approve (M)
- [ ] T046 [P] Implement the E1/E2 insufficient-signal state across `src/components/AssessmentPanel.tsx` — no score, no recommendation, and **no fabricated explanation** (M)
- [ ] T047 [P] Implement E3 error handling for both Edge Functions in `src/pages/AccountDetail.tsx`: human-readable message with a retry control, previously generated assessment stays visible, **no stack trace and no blank screen anywhere** (M)
- [ ] T048 [P] Implement remaining edge cases — E5 stale tier display, E8 empty-book state with a reseed path, E9 bounded scrollable draft, E10 last-write-wins — across `src/pages/` and `src/components/` (M)
- [ ] T049 [P] Audit that every seeded record shows the demo-data badge and every agent-generated element shows attribution (CF-9, S4) (S)
- [ ] T050 Verify legibility at 1280×720 projected resolution and on a laptop browser (NFR-12) (S)
- [ ] T051 Connect GitHub Sync and push the project, then download the project zip — two independent backups outside the platform (R1 mitigation) (S)

### Verification — the gates (D4)

- [ ] T052 Write the full 7-section verification script into `docs/runbook.md` from quickstart.md § Verification run book (M)
- [ ] T053 Execute contract tests C1–C8 from contracts/agent-functions.md §4, including deliberately forcing a fabricated citation ID and an out-of-taxonomy action to prove V1 and V3 fire (L)
- [ ] T054 Execute the full run book **10 consecutive times** and record results — 0 unhandled errors required (NFR-6, SC-004) (L)
- [ ] T055 Generate 10 assessments across different accounts and review every one for ≥2 real citations and zero invented companies, people, dates, or dollar figures — **10/10 required** (NFR-5, SC-003, G4) (M)
- [ ] T056 Record all measured Tier-2 results in `docs/metrics.md`: cold start, full workflow duration, generation latency, grounding compliance, error count (Constitution Principle VII) (S)
- [ ] T057 Record the demo video, ≤ 3 minutes: problem 30s → live Flow 2 on the public URL 60s → live Flow 3 injection 30s → impact and native.builder build story 60s (L)
- [ ] T058 **HARD FEATURE FREEZE at 2026-08-09 18:00.** No new feature work after this checkpoint — D5 is submission and stabilization only (S)

### Submission (D5)

- [ ] T059 [P] Complete the escape-hatch audit in `docs/escape-hatches.md`, including the recorded ruling that the Edge Function Anthropic call is generated inside the native.builder project and therefore does not consume the 20% budget (S)
- [ ] T060 [P] Write the submission text: names Maya, states the 15-of-100 problem, gives the native.builder build story in three concrete sentences, and states the derivation behind the business-value claim (M)
- [ ] T061 Final publish; confirm the Publish button shows no stale indicator (S)
- [ ] T062 Verify all Tier-1 metrics (S1–S5) in a clean browser session with no cached auth (S)
- [ ] T063 **Submit with ≥ 4 hours before the deadline** (S)

---

### User Story 5 — Live web signals via Bright Data (Priority: P2.5) 🆕

**Added 2026-08-06** after the official event page scan. Rationale in
[hackathon-brief.md](./hackathon-brief.md) §7. **Build only after US1 and US2 are green on the
deployed URL** — this is an addition to a working product, never a substitute for one.

**Goal**: The agent pulls real churn signals from outside the product — funding trouble, layoffs,
an executive departure — that a CSM would never see in time. This is both a genuine product
insight and our answer to the Originality risk (R9), plus eligibility for the event's only cash
prize.

**Independent Test**: On a real-company demo account, click "Scan web signals" and confirm a
genuine recent news item becomes an `external_event` signal that changes the score and appears in
the regenerated assessment.

- [ ] T067 Claim Bright Data access with promo code `aiaccess50` and store `BRIGHTDATA_API_TOKEN` via the Builder agent's masked secret input into Supabase secret storage (S)
- [ ] T068 Rename 3 seeded accounts to real, well-known public B2B SaaS companies per [data-model.md](./data-model.md) § Account naming, keeping every CSM-side signal fictional and `is_demo_data = true`. **One of the three must be the Flow 3 injection target** (S)
- [ ] T069 Build `supabase/functions/fetch-external-signals/`: query Bright Data for recent news on the account's company name, then classify each hit with `claude-sonnet-5` into `{is_churn_relevant, severity, one_phrase_summary}`. Return only relevant hits. Discard everything else — a web scan that surfaces irrelevant news is worse than no scan (M)
- [ ] T070 [US5] Add a "Scan web signals" control to `src/pages/AccountDetail.tsx` that inserts returned hits as `external_event` signals with `source = 'bright_data'`, then reuses the **existing** T035 chain — rescore, snapshot, reassess, timeline. No new write path (M)
- [ ] T071 [US5] Verify end to end on the deployed URL: a real news item becomes a signal, the score moves, and the regenerated explanation cites it by date alongside a product-side signal (S)

**Checkpoint US5**: The product now reads signals from both inside and outside itself. Add this
beat to the demo video only if it works cleanly — a failed live web call on camera costs more than
the feature gains.

---

### Optional — nice-to-haves (attempt only if D4 slack exists and the run book is green)

- [ ] T064 [P] NH-1: book-level summary strip — counts by tier, total ARR at risk, "N accounts need you this week" in `src/pages/Workspace.tsx` (M)
- [ ] T065 [P] NH-2: bulk triage — approve/reject in sequence without leaving the list, in `src/pages/Workspace.tsx` (L)
- [ ] T066 [P] NH-3: risk-trend sparkline from `health_snapshots` history in `src/components/AccountRow.tsx` (M)

**Cut order under time pressure, pre-authorized**: T066 → T065 → T064 → **US5 (T067–T071)** →
US4 (T042–T044) → US3 (T039–T041). US1 and US2 are never cut.

> US5 sits above US4 and US3 in the cut order despite its prize value, because a broken live web
> call on camera costs more than the feature gains. It ships working or it does not ship.

---

## Critical Path — the 5 tasks that decide the outcome

Ranked by damage if they fail or slip. Four of the five sit on D1–D3, which is the point: this
project is won or lost before the last two days.

| Rank | Task | Why it is critical | If it fails |
|---|---|---|---|
| **1** | **T001** — upgrade the plan before the first prompt | The free tier's 50 one-time credits will not finish this build, and generation **pauses at zero**. Exhausting credits on D3 does not slow the project, it stops it (R1) | Everything downstream halts. $20 against a 4.5-day window is not a decision worth deliberating |
| **2** | **T007** — verify the Anthropic path and latency from an Edge Function on D1 | The whole agent layer rests on an assumption Phase 0 corrected: BYOK does **not** give the deployed app runtime model access. If the Edge Function path fails, it must fail on D1 with four days of runway, not D3 with one (R4, AD-3) | Switch to the pre-identified OpenRouter BYOK fallback — a ~2-line change, deliberately decided in advance so it is never invented under pressure |
| **3** | **T017** — author the seed dataset | Every flow, every screen, and both demo moments read from it. A bland dataset makes a working product look unremarkable, and a mistuned injection target makes the demo's strongest 20 seconds land flat (R7) | Retune and reseed — cheap on D2, expensive on D4 |
| **4** | **T026** — server-side validations on `generate-assessment` | This is where grounding, the bounded taxonomy, and the anti-fabrication guarantee stop being prompt instructions and become enforced behavior. SC-003's 100% and the Application-of-Technology score both depend on it (G1, G1b, E4) | Ungrounded or fabricated output surfaces during judging Q&A — the failure mode that costs two scored dimensions at once |
| **5** | **T057** — record the demo video on D4, not D5 | A functioning app with no video is an invalid submission. Leaving it to the last day is the single most common way hackathon teams lose work that was actually finished (R8) | Screen-record one unedited Flow 2 + Flow 3 pass. Unpolished and submitted beats polished and late |

**The chain in order:** `T001 → T006 → T007 → T017 → T019 → T025 → T026 → T032 → T036 → T054 → T057 → T063`

Everything not on that chain is cuttable.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T009)**: T001 blocks everything. T002/T003 are parallel. T004 requires T001–T003. T006 requires T004–T005. T007 requires T005.
- **Foundational (T010–T021)**: requires Setup complete. **Blocks all user stories.**
- **US1 (T022–T032)**: requires Foundational. No dependency on other stories.
- **US2 (T033–T038)**: requires Foundational; T035 reuses the assessment invocation built in T025/T026, so US2 is best sequenced after US1 rather than beside it.
- **US3 (T039–T041)**: requires T028 (DraftEditor) and T030 (write path).
- **US4 (T042–T044)**: requires `timeline_events` rows, which US1 and US2 produce.
- **Polish (T045–T051)**: requires the stories it hardens.
- **Verification (T052–T058)**: requires all shipped stories. T054 and T055 are hard gates.
- **Submission (T059–T063)**: requires T058 freeze.

### Within each story

Schema → pure logic → Edge Function → UI component → page wiring → write path → deploy-and-verify.
Every story ends with a publish-and-verify task, because "works locally" is not a status
(Constitution Principle III).

### Parallel opportunities

- **T002 ∥ T003** — Supabase authorization and project creation
- **T012 ∥ T015 ∥ T016 ∥ T020** — view/index, scoring, taxonomy, badge: four different files, no shared state
- **T023 ∥ T027 ∥ T028** — three independent components, no shared file
- **T045 ∥ T046 ∥ T047 ∥ T048 ∥ T049** — edge cases across distinct files
- **T059 ∥ T060** — audit and submission text
- **T064 ∥ T065 ∥ T066** — independent optional features

> **Single-builder caveat**: with one person driving the Builder agent chat, `[P]` mostly means
> *order-independent*, not *simultaneous*. It becomes real parallelism only if a second person
> shares the workspace — and native.builder workspaces do support shared members and roles.

---

## Parallel Example: Foundational phase (D2)

```text
# Four independent files, no shared state — issue as separate prompts in any order:
Task T012: Create v_account_workspace view + one_pending_per_account index in supabase/migrations/
Task T015: Implement pure deterministic scoring in src/lib/scoring.ts
Task T016: Implement the 6-action taxonomy + driver-default map in src/lib/taxonomy.ts
Task T020: Build the demo-data badge in src/components/DemoDataBadge.tsx
```

## Parallel Example: User Story 1 components (D3)

```text
# Three independent components — none imports another:
Task T023: AccountRow.tsx — score, tier badge, risk driver, pending indicator
Task T027: AssessmentPanel.tsx — explanation, citations, action, confidence, attribution
Task T028: DraftEditor.tsx — editable subject/body + Approve
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Complete Setup (T001–T009) — **zero features, all risk retired**
2. Complete Foundational (T010–T021) — blocks everything
3. Complete US1 (T022–T032)
4. **STOP and VALIDATE**: run Flow 2 end to end on the public URL, timed
5. At this point the submission is valid and complete. Everything after is upside.

### Incremental delivery

| Increment | Adds | Submission state after |
|---|---|---|
| Setup + Foundational | A live URL with a risk-ranked book | Not yet valid — no workflow |
| **+ US1** | The full Principle II workflow | ✅ **Valid and complete** |
| + US2 | Live signal injection | ✅ Valid + demonstrably not pre-baked |
| + US3 | Human correction as a recorded outcome | ✅ Valid + credible control story |
| + US4 | Full audit timeline | ✅ Valid + judge-reconstructable |
| + NH-1…NH-3 | Framing and scale polish | ✅ Valid + more persuasive |

Every increment ends deployed. Nothing waits for the end.

### If a day is lost

Cut in the pre-authorized order — T066 → T065 → T064 → US4 → US3 — and protect T054 (run book ×10)
and T057 (video) above all remaining feature work. A smaller product that runs 10/10 clean and has a
video beats a larger one that does not.

---

## Task Summary

| Group | Tasks | Count |
|---|---|---|
| Setup (D1) | T001–T009 | 9 |
| Foundational (D2) | T010–T021 | 12 |
| **US1 — P1, MVP** | T022–T032 | **11** |
| **US2 — P2** | T033–T038 | **6** |
| US3 — P3 | T039–T041 | 3 |
| US4 — P4 | T042–T044 | 3 |
| Polish | T045–T051 | 7 |
| Verification | T052–T058 | 7 |
| Submission | T059–T063 | 5 |
| Optional (NH) | T064–T066 | 3 |
| **Total** | | **66** |

**Sizing distribution**: 31 S · 26 M · 9 L.
**MVP scope**: T001–T032 (32 tasks) — Setup + Foundational + US1.
**Parallel opportunities**: 23 tasks marked `[P]`, 6 named clusters.
