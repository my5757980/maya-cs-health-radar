---
id: 0005
title: Native Builder Build Prompt Pack
stage: misc
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: 001-customer-success-agent
branch: 001-customer-success-agent (no git repo; directory-scoped only)
user: ASFAR
command: /sp.implement
labels: ["implementation", "prompt-pack", "native.builder", "supabase", "edge-functions", "demo-script", "submission"]
links:
  spec: specs/001-customer-success-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-customer-success-agent/build-prompts.md
tests:
 - none executed (prompt-authoring artifact; no code was generated in this session)
 - E1 self-audit prompt (12 checks) and E2 run-book gates authored, to be executed on D4
---

## Prompt

Generate ready-to-use prompts for:

A. Initial generation prompt for native.builder
B. UI/UX refinement prompt
C. Adding main AI agents & workflows
D. Integrating external tools (if any)
E. Full end-to-end testing prompt
F. Submission materials prompt (description + how native.builder was used + demo script)

Make every prompt self-contained and high quality.

## Response snapshot

Prerequisites checked: `check-prerequisites.ps1 -RequireTasks -IncludeTasks` returned all five
design docs; `checklists/requirements.md` is **16/16 complete → PASS**, so implementation proceeded
without a confirmation stop.

**Scope reading.** The implementation surface for this project is native.builder's chat, which this
agent cannot drive. `/sp.implement`'s normal behavior — execute tasks and mark them `[X]` — does not
apply, and the user's request was explicit about what the deliverable is. Wrote
`specs/001-customer-success-agent/build-prompts.md`: **16 copy-pasteable prompts** across the six
requested sections, plus a preflight of four console actions that are not prompts.

**Deliberate deviation from "6 prompts".** Each lettered section contains 1–6 prompts rather than
one. plan.md §2 sets a credit-protection rule — one screen or one function per prompt, acceptance
criteria stated inside the prompt — because a mega-prompt produces broad rework, and rework is what
exhausts credits (R1, the top project risk). Delivering six mega-prompts would have satisfied the
letter of the request while creating the exact failure the plan was written to avoid. The reasoning
is stated at the top of the file rather than left implicit.

**Section contents:**

- **A (A1–A4)** — Product Architect brief scoped to 4 screens / 7 entities / 6-step workflow with an explicit do-not-build list; full schema with all CHECK constraints and RLS; `scoring.ts` + `taxonomy.ts` + seed data; Workspace screen.
- **B (B1–B2)** — visual system driven by the actual constraint (judged at 1280×720 from a 3-minute recording): tier color system that never relies on color alone, mandatory AI attribution labels, demo-data badges, honest progress states. Then seven edge/empty/error states.
- **C (C1–C6)** — the core. Secret storage; `generate-assessment` as one structured call; **C3, the server-side validation prompt (V1–V5), which is the highest-value prompt in the pack** because it converts prompt instructions into enforced behavior; `enrich-signal` + modal; the add-signal chain; approval loop + timeline.
- **D (D1–D2)** — answered directly: there are no third-party product integrations by design. Only Supabase, Anthropic, and GitHub. Includes the pre-written OpenRouter fallback so that contingency is never invented under deadline pressure.
- **E (E1–E2)** — a 12-check self-audit prompt (grounding, safety, determinism, data integrity, error paths) that has the agent find failures more cheaply than a human would on D4, plus the human-executed run-book gates.
- **F (F1–F2)** — a beat-by-beat 3:00 demo script with timings and spoken lines, and the submission-text prompt.

**Concrete arithmetic carried into the prompts.** A3 embeds fully worked scoring examples so the
seed data is verifiable rather than approximate: a critical account totalling 86.1 penalty → score
14, and the **live-demo target account specified signal by signal to land at exactly 72**
(13.0 + 6.2 + 6.1 + 2.9 = 28.2 penalty), so injecting one critical `support_ticket` (−30) drops it
to 42 and flips healthy → watch on camera. Without that tuning the demo's strongest twenty seconds
lands flat (R7).

**Safety constraints repeated at every layer** rather than stated once: A1 forbids building any
send capability, C6 restates that Approve means recorded not sent, and E1 check 4 has the agent
grep the whole codebase for any send/deliver/dispatch/notify path. FR-011 is enforced by absence,
and absence needs verifying more than presence does.

No tasks were marked `[X]` — nothing was built. The file closes with a prompt-to-task coverage
table and an explicit list of the 15 tasks that are the user's to perform (publish/verify steps,
the D1 latency probe, hand-verification of scores, the feature freeze, and submission).

## Outcome

- ✅ Impact: The build is now executable by copy-paste. Every architectural constraint from plan.md, every guardrail from contracts/, and the exact seed arithmetic are embedded in prompts the Builder agent can act on without access to this repository.
- 🧪 Tests: None executed. Authored for D4 — E1's 12-check self-audit and E2's seven run-book gates, of which §2 (≤90s workflow) and §5 (10/10 grounding, 0 fabrications) are hard gates.
- 📁 Files: `specs/001-customer-success-agent/build-prompts.md`
- 🔁 Next prompts: Begin D1 at the preflight (T001 plan upgrade first, before any generation). The two ADRs flagged at plan stage remain unwritten. `/sp.analyze` is available for a cross-artifact consistency pass if wanted before building.
- 🧠 Reflection: The request asked for six prompts; the plan's credit rule required sixteen. Delivering six would have satisfied the wording and caused the failure the plan exists to prevent. Where a stated format and a stated constraint collide, honor the constraint and say why in the artifact — the user can override with full information, which they cannot do if the tension is silently resolved.

## Evaluation notes (flywheel)

- Failure modes observed: `check-prerequisites.ps1` again exits 128 from its internal `git` call in this non-git directory while emitting valid JSON. Step 4 of the command outline (ignore-file creation) found no applicable target in this SDD repo — no git, no Docker, no eslint/prettier configs — so `.gitignore` guidance was folded into prompt A1 instead, since the *generated* native.builder project is what actually gets GitHub-synced at T051.
- Graders run and results (PASS/FAIL): Checklist gate PASS (16/16, no confirmation stop needed); all six requested sections present PASS; self-containment PASS (every prompt restates its own context — no prompt references this repo or a prior prompt's output implicitly); prompt-to-task coverage PASS (51 of 66 tasks mapped, remaining 15 explicitly listed as human-performed); no tasks falsely marked complete PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): After running A3, hand-verify the demo account scores exactly 72 before proceeding to A4. If the Builder agent's generated seed drifts off that number, edit-and-resend A3 with the four signals pinned as literal JSON rather than as a computed target — the demo depends on that one value more than on any other data in the system.
