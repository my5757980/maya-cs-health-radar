---
id: 0003
title: Technical Plan Native Builder Supabase
stage: plan
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: 001-customer-success-agent
branch: 001-customer-success-agent (no git repo; directory-scoped only)
user: ASFAR
command: /sp.plan
labels: ["plan", "architecture", "native.builder", "supabase", "edge-functions", "anthropic", "hackathon"]
links:
  spec: specs/001-customer-success-agent/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-customer-success-agent/plan.md
 - specs/001-customer-success-agent/research.md
 - specs/001-customer-success-agent/data-model.md
 - specs/001-customer-success-agent/contracts/agent-functions.md
 - specs/001-customer-success-agent/quickstart.md
 - CLAUDE.md (agent context updated by update-agent-context.ps1)
tests:
 - none executed (planning artifact); 8 manual contract tests C1–C8 defined in contracts/agent-functions.md §4
 - 7-section verification run book defined in quickstart.md, to be executed ×10 on D4
---

## Prompt

Based on the Constitution + Product Spec, create a detailed Technical Plan.

Include:
1. High-level Architecture
2. native.builder workflow sequence
3. Agent roles inside the app
4. External services (if any)
5. Data storage approach
6. Authentication
7. Deployment plan
8. Risks + mitigation
9. Day-by-day build plan (Day 1 to Day 7)

## Response snapshot

Wrote `plan.md` covering all 9 requested sections plus the plan-template's mandatory sections
(Summary, Technical Context, Constitution Check, Project Structure, Complexity Tracking), and
produced the Phase 0 and Phase 1 artifacts.

**Phase 0 closed the constitution's deferred TODO.** Located native.builder's real documentation at
`docs-builder.nativelyai.com` (the lablab.ai hackathon page and tutorial both return HTTP 403 to
automated fetch) and built a verified capability matrix. Findings that changed the plan:

- **BYOK ≠ runtime model access.** native.builder's BYOK providers (OpenRouter, AI/ML API,
  Fireworks, Featherless — Anthropic is *not* among them) unlock models in the **builder's own chat
  model picker**. They do not hand the generated app a runtime model client. The deployed app must
  therefore call Anthropic from a **Supabase Edge Function** with the key in Supabase secret
  storage. This is the single most consequential Phase 0 correction; designing against the wrong
  assumption would have surfaced on D3 with one day of runway.
- **Escape-hatch budget: 0% projected against 20%.** Every surface — Vite+React generation,
  Supabase schema/auth/edge functions, secret storage, publish to `*.nativelyai.app` — is a
  documented platform capability. The Anthropic call is made from an Edge Function the Builder
  agent generates *inside* the project, so it is explicitly ruled not an escape hatch; the ruling
  is recorded in `docs/escape-hatches.md` so it is auditable rather than assumed.
- **Credits are the top project risk (R1).** Free tier is 50 one-time credits, consumed by every
  generation; at zero, all generation pauses. Decision: upgrade to a paid plan on D1 *before the
  first prompt*. Publish rollback (Versions panel) is also paid-only, which is the mitigation for
  R5 — the failure mode that breaks the app after it looks finished.

**Three load-bearing architecture decisions:**

- **AD-1 — the score never touches a model.** `scoring.ts` is pure synchronous TypeScript with
  documented weights, severity multipliers, and 90-day linear decay. Concrete formula specified.
  This is what makes Flow 3 verifiable to a judge rather than assertable.
- **AD-2 — A2+A3+A4 collapse into one structured `generate-assessment` call.** Three sequential
  opus calls would run ~30–45s against a 20s budget (NFR-4), triple failure surface, triple tokens
  — and would produce worse drafts, since a message written to justify an already-fixed action
  reads like a template.
- **AD-3 — model access is server-side only**, via Edge Functions, key never in the client bundle.

**Guardrails moved from prompt to code and schema.** Grounding (≥2 citations) is a Postgres CHECK
constraint; the 6-action taxonomy is a Postgres enum; citation IDs are validated as a subset of
supplied context (fabrication check); one retry, never two. FR-011 / boundary S1 is enforced by the
*absence* of any outbound-send code path, not by a flag.

**Auth:** Supabase Auth, single pre-provisioned demo user, auto-signed-in. No login wall — a judge
lands directly in Maya's book, which is what protects SC-001's 60-second budget. Auth exists so RLS
is honest, not to gate the demo.

**Day plan reconciled to the real calendar.** The hackathon runs Aug 3–10 (8 days); planning began
Aug 6, so hackathon days 1–3 elapsed before the project started. Build days D1–D5 map to hackathon
days 4–8. D1 contains **zero feature work** by design — plan upgrade, Supabase link, published
empty URL, and one verified Anthropic call — because R1, R2, and R5 all end or silently break the
project and all three are retired on day one. Hard feature freeze 2026-08-09 18:00.

**Constitution Check: PASS** both pre-Phase-0 and post-Phase-1. No NON-NEGOTIABLE violations;
Complexity Tracking table empty.

Phase 1 artifacts: `data-model.md` (7 tables + 1 view, enums, CHECK constraints, RLS, state
transitions, seed spec including the 71–76 injection-target tuning requirement),
`contracts/agent-functions.md` (both Edge Function contracts, 5 ordered server-side validations,
driver→default-action fallback map, client write contracts, 8 contract tests), and `quickstart.md`
(setup, 7-section run book, 5 recovery procedures, submission checklist).

`update-agent-context.ps1 -AgentType claude` ran successfully and updated `CLAUDE.md` with the
detected stack.

## Outcome

- ✅ Impact: Feature 001 is fully planned and ready for `/sp.tasks`. The constitution's deferred capability TODO is closed with verified sources, and every architectural decision the build window would otherwise have to make is pre-made — which is the point of Constitution Principle VI.
- 🧪 Tests: None executed (planning stage). Defined: 8 contract tests (C1–C8) and a 7-section run book gated at 10 consecutive clean passes for NFR-6/SC-004.
- 📁 Files: `plan.md`, `research.md`, `data-model.md`, `contracts/agent-functions.md`, `quickstart.md`, `CLAUDE.md`
- 🔁 Next prompts: `/sp.adr` for the two flagged decisions (recommended before tasks — they are cheap to write now and expensive to reconstruct later); then `/sp.tasks` to generate the dependency-ordered task list against the D1–D5 plan.
- 🧠 Reflection: The BYOK finding is the whole value of Phase 0. "Model provider integration exists" read as "the app can call models" — two different things, one documentation page apart, and the wrong reading would have been discovered on D3. Verify the *runtime* path separately from the *build-time* path whenever a platform advertises both.

## Evaluation notes (flywheel)

- Failure modes observed: `lablab.ai` returns HTTP 403 to WebFetch on both the hackathon page and the native.builder tutorial — search-result summaries were the only path to judging criteria. Direct `native.builder` / `www.native.builder` DNS does not resolve; the real docs live at `docs-builder.nativelyai.com` (vendor is NativelyAI). Both `create-new-feature.ps1` and `setup-plan.ps1` exit 128 from internal `git` calls in this non-git directory but degrade correctly and emit valid JSON.
- Graders run and results (PASS/FAIL): Constitution Check pre-Phase-0 PASS (1 item ⚠️ pending, since resolved); post-Phase-1 PASS 7/7; NEEDS CLARIFICATION resolution 4/4 PASS; Phase 1 artifact completeness 4/4 PASS; placeholder scan PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): On D1 step 6, measure a real `generate-assessment`-shaped Anthropic call from an Edge Function with a representative 12-signal payload, and record actual latency against the ≤17s budget. If it exceeds ~17s, drop the context to the 8 most-weighted signals before D3 rather than discovering the overrun mid-build.

## ADR candidates

Two decisions pass the three-part significance test (long-term impact · viable alternatives
considered · cross-cutting scope):

📋 **Architectural decision detected: deterministic rule-based health scoring with a
model-generated explanation layer** (AD-1, carried forward from the spec stage). Defines the
product's trust and audit model; alternatives were model-generated and hybrid scoring; drives the
data model, latency budget, and demo strategy.
Run `/sp.adr deterministic-scoring-with-reasoned-explanation`

📋 **Architectural decision detected: runtime Claude access via Supabase Edge Functions rather than
native.builder BYOK** (AD-3 + research.md §2). Determines the security boundary for the API key,
the escape-hatch ruling under Principle I, and the fallback path if Anthropic access is blocked.
Run `/sp.adr runtime-model-access-via-edge-functions`
