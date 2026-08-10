---
id: 0001
title: Smart Customer Success Agent Constitution
stage: constitution
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: none
branch: none (not a git repository)
user: ASFAR
command: /sp.constitution
labels: ["constitution", "hackathon", "native.builder", "customer-success", "scope", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none (documentation artifact; validated by placeholder + date + version checks)
---

## Prompt

You are the Lead Architect for the AI Factory – Native.builder Hackathon (3–10 Aug 2026).

Project: Smart Customer Success Agent

Hackathon Rules (must follow):
- Built primarily with native.builder
- Functional + publicly deployed app
- Must show at least one complete end-to-end workflow
- Clear problem + clear target user
- Not just a landing page

Create a full Constitution that includes:

1. Project Vision
2. Core Principles
3. Target User (detailed)
4. Problem Statement
5. Success Metrics for this hackathon
6. Technical Guardrails (native.builder first)
7. Scope (what we will build in 7 days)
8. Definition of Done

Output in clean Markdown. Be specific and decisive.

## Response snapshot

Ratified `.specify/memory/constitution.md` at **v1.0.0** (initial adoption), replacing every
template placeholder with project-specific governance.

Key decisions:

- **Window correction surfaced.** The request assumed a 7-day build; ratification date is
  2026-08-06 against a 2026-08-10 deadline, leaving ~4.5 days. The Scope section carries an
  explicit correction and a D1–D5 plan mapped to the real calendar, with a hard feature-freeze
  at 2026-08-09 18:00.
- **Seven principles**, three marked NON-NEGOTIABLE: I. Native.builder First (escape hatches
  budgeted at ≤20% of surface area and logged in `docs/escape-hatches.md`); II. One Workflow,
  Complete, End-to-End (a named six-step chain every task must map to); IV. Demo Truth — No
  Faked Paths (synthetic seed data permitted, faked logic forbidden). Plus III. Deployed From
  Day One, V. One Persona One Pain, VI. Time-Boxed Decisions (60-min cap), VII. Evidence Over
  Assertion.
- **Target user** specified as a single named persona ("Maya", IC CSM, 60–120 accounts,
  $8k–$60k ACV, variable comp tied to renewals) with an explicit non-user list.
- **Problem** framed as the quantified gap: a CSM with 100 accounts actively manages ~15;
  churn is decided in the other 85. Three compounding failures — fragmented signals,
  calendar-driven detection, and the know→act gap.
- **Success metrics** in three tiers: Tier 1 submission validity (binary, disqualifying),
  Tier 2 measured product performance (<60s to first recommendation, ≤90s full workflow, 0
  unhandled errors across 10 runs), Tier 3 self-assessment against the four published lablab
  judging dimensions.
- **Guardrails**: native.builder primary with a four-step escape-hatch protocol and a "no
  second platform / no backup implementation" rule; `claude-opus-5` for judge-visible
  reasoning, `claude-sonnet-5` for high-frequency enrichment; grounded output mandatory;
  human-in-the-loop approval before any outreach; synthetic data only; no live third-party
  integrations.
- **Governance** binds `/sp.plan`'s Constitution Check: violating a NON-NEGOTIABLE principle
  blocks progression to `/sp.tasks`. Scope-cut authority granted to the Lead Architect for
  everything except the Principle II workflow.

Research: lablab.ai hackathon page returned HTTP 403 to direct fetch; judging criteria and
submission requirements were recovered via web search. native.builder's own capability
documentation could not be verified from open sources, so the constitution states policy
rather than asserting platform APIs, and defers verification via
`TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)` to Phase 0 of `/sp.plan`.

Template propagation: `plan-template.md` resolves its Constitution Check gate dynamically;
`spec-template.md` and `tasks-template.md` carry no constitution references. No template
edits required.

## Outcome

- ✅ Impact: Project constitution ratified at v1.0.0; scope, persona, metrics, and guardrails are now decidable rather than open. Build window corrected from an assumed 7 days to the actual ~4.5.
- 🧪 Tests: N/A — documentation artifact. Validated: zero unresolved bracket tokens, ISO dates, version line matches Sync Impact Report, one intentional labeled TODO.
- 📁 Files: `.specify/memory/constitution.md` (rewritten from template)
- 🔁 Next prompts: `/sp.specify` for the Smart Customer Success Agent workflow; then `/sp.plan` (must resolve `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)` in Phase 0); then `/sp.tasks`.
- 🧠 Reflection: The highest-value output was not the principles but the calendar correction — a 7-day plan against a 4.5-day window would have failed silently at the deadline. Verify stated timelines against the ratification date before scoping.

## Evaluation notes (flywheel)

- Failure modes observed: External verification of native.builder capabilities blocked by a 403 on the primary source; mitigated by stating policy over platform specifics and deferring a labeled TODO rather than inventing APIs.
- Graders run and results (PASS/FAIL): Placeholder-completeness PASS; date-format PASS; version/report coherence PASS; route-matches-stage PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): During `/sp.plan` Phase 0, open the native.builder console and record the actual capability matrix, then amend the constitution as v1.0.1.
