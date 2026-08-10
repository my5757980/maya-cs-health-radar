---
id: 0004
title: Actionable Task List 66 Tasks
stage: tasks
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: 001-customer-success-agent
branch: 001-customer-success-agent (no git repo; directory-scoped only)
user: ASFAR
command: /sp.tasks
labels: ["tasks", "critical-path", "hackathon", "native.builder", "supabase", "scheduling"]
links:
  spec: specs/001-customer-success-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-customer-success-agent/tasks.md
tests:
 - none executed (task-generation artifact)
 - defined as tasks: T053 contract tests C1–C8; T054 run book ×10 (NFR-6/SC-004 gate); T055 10-output grounding review (NFR-5/SC-003 gate)
---

## Prompt

From the Technical Plan, create a complete actionable Task List.

Format:

### Phase 1 – Foundation (Day 1-2)
- [ ] Task (S/M/L)

### Phase 2 – Core Workflows & Agents (Day 3-5)
- [ ] Task (S/M/L)

### Phase 3 – Polish, Test, Deploy, Demo (Day 6-7)
- [ ] Task (S/M/L)

Also add a Critical Path section (top 5 most important tasks).

## Response snapshot

Wrote `specs/001-customer-success-agent/tasks.md` — **66 tasks**, using the requested three-phase
Day grouping as the top-level container with the template's required checklist format
(`- [ ] T001 [P] [US1] Description with file path (Size)`) and user-story organization nested
inside, so both the requested shape and the SDD contract are satisfied without compromise.

**Calendar mapping.** The requested Day 1–7 grouping maps onto the real D1–D5 window from plan.md
§9. Hackathon days 1–3 elapsed before the project began, so **Phase 2's "Day 3–5" compresses into
a single build day (D3)** — flagged explicitly as the schedule's tightest point, and the reason
Phase 2 carries only US1 and US2.

**Structure:**

| Group | Tasks | Count |
|---|---|---|
| Setup (D1) | T001–T009 | 9 |
| Foundational (D2) | T010–T021 | 12 |
| US1 — P1, MVP | T022–T032 | 11 |
| US2 — P2 | T033–T038 | 6 |
| US3 — P3 | T039–T041 | 3 |
| US4 — P4 | T042–T044 | 3 |
| Polish | T045–T051 | 7 |
| Verification | T052–T058 | 7 |
| Submission | T059–T063 | 5 |
| Optional NH | T064–T066 | 3 |

Sizing 31 S · 26 M · 9 L; 23 tasks marked `[P]` across 6 named clusters. Size is defined as
*prompt + review + fix cycle*, since most tasks are one instruction to native.builder's Builder
agent rather than hand-written code — a distinction that makes the estimates mean something in
this build model.

**Critical path — the 5 tasks that decide the outcome**, four of which sit on D1–D3:

1. **T001** upgrade the plan before the first prompt — free tier's 50 one-time credits will not finish the build and generation *pauses* at zero (R1)
2. **T007** verify the Anthropic path and latency from an Edge Function on D1 — the whole agent layer rests on the Phase 0 correction that BYOK is not runtime model access; if it fails it must fail with four days of runway, not one
3. **T017** author the seed dataset — every flow reads from it, and a mistuned injection target makes the demo's strongest 20 seconds land flat (R7)
4. **T026** server-side validations on `generate-assessment` — where grounding, the bounded taxonomy, and the anti-fabrication guarantee stop being prompt instructions and become enforced behavior
5. **T057** record the video on D4, not D5 — a working app with no video is an invalid submission (R8)

Explicit chain: `T001 → T006 → T007 → T017 → T019 → T025 → T026 → T032 → T036 → T054 → T057 → T063`.
Everything off that chain is cuttable.

**Pre-authorized cut order** under time pressure: T066 → T065 → T064 → US4 → US3. US1 and US2 are
never cut. T054 (run book ×10) and T057 (video) outrank all remaining feature work — a smaller
product that runs 10/10 clean with a video beats a larger one that does not.

**Design choices worth noting:** every story phase ends with a publish-and-verify task, because
"works locally" is not a status under Constitution Principle III. D1 ships zero features by design.
A single-builder caveat is stated on `[P]`: with one person driving the Builder agent chat, `[P]`
means *order-independent*, not *simultaneous* — real parallelism requires a second workspace member.

## Outcome

- ✅ Impact: Feature 001 is now executable task by task. Every task carries a file path, a size, and a story label; every gate has a task; the critical path and the cut order are decided in advance rather than under deadline pressure.
- 🧪 Tests: None executed. Defined as gated tasks — T053 (contract tests C1–C8, including deliberately forcing a fabricated citation and an out-of-taxonomy action), T054 (run book ×10, 0 unhandled errors), T055 (10-output grounding review, 10/10 required).
- 📁 Files: `specs/001-customer-success-agent/tasks.md`
- 🔁 Next prompts: `/sp.adr` for the two decisions flagged at plan stage (still unwritten); `/sp.analyze` for a cross-artifact consistency pass; then `/sp.implement` or begin D1 manually at T001.
- 🧠 Reflection: The most valuable output is not the 66 tasks but the ordering — four of the five critical-path items land on D1–D3, which encodes the real lesson that this project is won or lost before the final two days. A task list that treats all days as equally recoverable would hide that.

## Evaluation notes (flywheel)

- Failure modes observed: `check-prerequisites.ps1` exits 128 from its internal `git` call in this non-git directory but degrades correctly and emits valid JSON listing all four design docs. Self-caught a summary error before publishing: initially asserted 30 S / 24 M / 12 L and 24 `[P]` tasks; recount gave 31 / 26 / 9 and 23 `[P]`, corrected in place.
- Graders run and results (PASS/FAIL): Checklist-format compliance 66/66 PASS (checkbox + ID + optional [P] + story label where required + file path + size); story-label placement PASS (absent on Setup/Foundational/Polish, present on all US tasks); task-count arithmetic PASS after correction; user-requested sections present PASS (3 phases + Critical Path).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): After T007 on D1, feed the measured Edge Function latency back into `contracts/agent-functions.md` §2 — if it exceeds ~17s, cut the supplied context from the 12 most-weighted signals to 8 and re-record the budget before T025 is written.
