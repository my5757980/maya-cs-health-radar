---
id: 0002
title: Product Spec Customer Success Agent
stage: spec
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: 001-customer-success-agent
branch: 001-customer-success-agent (no git repo; directory-scoped only)
user: ASFAR
command: /sp.specify
labels: ["spec", "customer-success", "hackathon", "native.builder", "agent-design", "grounding"]
links:
  spec: specs/001-customer-success-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-customer-success-agent/spec.md
 - specs/001-customer-success-agent/checklists/requirements.md
tests:
 - none (specification artifact; validated against requirements.md quality checklist — 16/16 PASS)
---

## Prompt

Using the Constitution above, write a complete Product Spec for Smart Customer Success Agent.

Structure:

# Product Spec – Smart Customer Success Agent

1. One-Sentence Pitch
2. Problem Statement
3. Target User
4. Jobs-to-be-Done
5. Core Features (must-have)
6. Nice-to-have Features
7. Key User Flows (3–5 end-to-end flows)
8. AI / Agent Capabilities
9. Data Model
10. Integrations
11. Non-Functional Requirements
12. Out of Scope
13. Success Criteria (mapped to Judging: Technology, Presentation, Business Value, Originality)

Be concrete and realistic for a 7-day hackathon.

## Response snapshot

Created feature `001-customer-success-agent` (scaffold script ran with `HAS_GIT:false` — no branch
created, directories only) and wrote the full spec to
`specs/001-customer-success-agent/spec.md`, covering all 13 requested sections plus the
spec-template's mandatory sections (User Scenarios & Testing, Requirements, Success Criteria)
folded in without disturbing the requested structure.

Key decisions made in the spec:

- **Deterministic score, reasoned narrative (§8.1).** The health score is computed by explicit
  weighted rules with 90-day time decay; only the risk explanation, action recommendation, and
  outreach draft are model-generated. Four reasons: reproducibility (Flow 3's live injection
  depends on verifiable cause→effect), auditability, latency (model-scoring a full book would
  blow the <60s cold-start budget), and Constitution Principle IV honesty — a model asked for a
  number returns a plausible one, not a correct one. **This is the spec's most architecturally
  significant decision.**
- **Enforced grounding (G1–G5).** Every explanation must cite ≥2 signals by type and date;
  ungrounded output is suppressed in favor of an explicit insufficient-signal state rather than
  generated anyway. Maps directly to Constitution metric P3 / SC-003.
- **Bounded six-action taxonomy (§8.4).** Agent output is constrained to a defined action set,
  making it evaluable and giving edge case E4 (out-of-taxonomy output) a well-defined fallback.
- **Hard no-auto-send boundary (S1).** Approved messages are logged, never transmitted. Product
  principle, not a config flag.
- **Zero live third-party integrations (§10),** stated plainly rather than implied away —
  OAuth/webhook/sandbox work is the classic way to burn two hackathon days and ship nothing. The
  signal abstraction is the real interface; connectors are post-hackathon adapters behind it.
- **Five flows, with Flow 2 canonical** (the Principle II six-step chain, ≤90s) and **Flow 3
  (live signal injection) as the demo's credibility proof** — the strongest available defense of
  Principle IV.
- **Four user stories P1–P4,** each independently testable, ordered so that stopping after any
  one still leaves a valid submission.
- **20 functional requirements, 8 measurable success criteria, 12 NFRs, 10 edge cases.** Every
  Constitution Tier-2 metric (P1–P5) has a corresponding NFR and SC.

Validation: quality checklist at `specs/001-customer-success-agent/checklists/requirements.md` —
16/16 items PASS on the first iteration, zero `[NEEDS CLARIFICATION]` markers. Two intentional
"implementation detail" deviations documented and justified: native.builder and the Claude model
tiers are constitution-imposed constraints, not free technical choices, and neither leaks into
FR-001–FR-020 or SC-001–SC-008.

Window note carried forward from the constitution: the prompt said 7 days; the real remaining
window is ~4.5 days (2026-08-06 → 2026-08-10). The spec is scoped to the real calendar.

## Outcome

- ✅ Impact: Feature 001 specified end to end and ready for `/sp.plan`. Scope, agent behavior, grounding rules, safety boundaries, and judging-dimension evidence are now decidable rather than open.
- 🧪 Tests: N/A — specification artifact. Quality checklist 16/16 PASS; zero unresolved clarification markers; traceability verified (CF→workflow arrows, JTBD→flows, Constitution P1–P5→NFR/SC).
- 📁 Files: `specs/001-customer-success-agent/spec.md`, `specs/001-customer-success-agent/checklists/requirements.md`
- 🔁 Next prompts: `/sp.plan` (must resolve `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)` in Phase 0 before task generation); then `/sp.tasks`. `/sp.clarify` is optional — no markers were generated.
- 🧠 Reflection: The deterministic-score decision is the one that makes the live demo verifiable; had the score been model-generated, Flow 3 would show a number changing with no way for a judge to confirm it was computed rather than improvised. Decide what the model is *not* allowed to do before deciding what it does.

## Evaluation notes (flywheel)

- Failure modes observed: `create-new-feature.ps1` returned exit code 128 from its internal `git rev-parse` in a non-git directory, but degraded correctly — emitted valid JSON and created `specs/001-customer-success-agent/` and `history/prompts/001-customer-success-agent/`. Non-blocking; worth noting if the project is later `git init`-ed, since numbering would then also consult branches.
- Graders run and results (PASS/FAIL): Content Quality 4/4 PASS; Requirement Completeness 8/8 PASS; Feature Readiness 4/4 PASS; placeholder scan PASS; route-matches-stage PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): In `/sp.plan` Phase 0, verify native.builder can hold the 8-entity data model and the A1–A4 agent chain natively; if not, size the escape hatch against the constitution's 20% budget before any task is written.

## ADR candidate

📋 Architectural decision detected: **deterministic rule-based health scoring with a model-generated
explanation layer, rather than end-to-end model scoring.** It passes all three significance tests —
long-term impact (defines the trust and audit model of the product), viable alternatives existed
(full-model scoring; pure rules with templated text), and it is cross-cutting (drives the data
model, latency budget, demo strategy, and Principle IV compliance).

Document reasoning and tradeoffs? Run `/sp.adr deterministic-scoring-with-reasoned-explanation`
