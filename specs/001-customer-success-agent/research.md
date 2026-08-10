# Phase 0 Research — Smart Customer Success Agent

**Feature**: `001-customer-success-agent` | **Date**: 2026-08-06
**Purpose**: Resolve every NEEDS CLARIFICATION in the plan's Technical Context, and close the
constitution's deferred `TODO(NATIVE_BUILDER_CAPABILITY_MATRIX)`.

**Sources**: native.builder official documentation at `docs-builder.nativelyai.com`, retrieved
2026-08-06. The lablab.ai hackathon page and tutorial return HTTP 403 to automated fetch; judging
criteria and submission requirements were recovered via search result summaries.

---

## 1. native.builder capability matrix (resolves the constitution TODO)

| Capability | Verified finding | Source page |
|---|---|---|
| **What it generates** | Vite-based React web applications — landing pages, dashboards, internal tools, SaaS products. Code is inspectable in a Code tab | `introduction/getting-started`, lablab tutorial summary |
| **Build model** | Specialized agents: **Product Architect** plans scope; **Builder agent** generates the app. Iterative chat with live preview | `introduction/getting-started` |
| **Database / backend** | **Supabase** is a first-class documented integration. The agent generates schema, security rules, and login flow from a conversational description | `features/supabase` |
| **Edge Functions** | Supabase integration explicitly "enable[s] edge function execution within the generated application" | `features/integrations` |
| **Secrets** | Agent accepts secrets through a **masked input**; values are stored in Supabase secure secret storage, "never appear in the conversation", and are not visible to the agent. Replacement has no undo | `features/supabase` |
| **Deployment** | Settings → Publish → live at `yourproject.nativelyai.app`. Build output visible in terminal panel. Publish button flags a **stale** deployment after changes | `features/publish` |
| **Publishing cost** | **Publishing consumes no AI credits** — credits are for chat and generation only | `introduction/plans-and-credits` |
| **Rollback** | Versions panel on paid plans — revert to earlier project versions | `features/publish` |
| **Custom domains** | Paid plans; removes platform branding | `features/custom-domain` |
| **Code portability** | GitHub Sync (push project code to a repo) and full project download as zip | `features/github-sync`, `features/files-and-download` |
| **Auth** | Via Supabase. The platform "automatically configures Supabase to accept Builder's preview URLs" so login works during preview | `features/supabase` |
| **Other integrations** | Google Drive, Dropbox (document sources for AI agents); Bright Data and Speechmatics as partner integrations | `features/data-connectors`, `partners/*` |
| **Credits — free tier** | **50 credits, one-time, never renew.** 80 msg/hour, 400 msg/day. Premium models unavailable | `introduction/plans-and-credits` |
| **Credits — paid** | Builder $20/mo = 100 credits; Pro $50 = 400; Business $200 = 2,000; Scale $700 = 10,000. Monthly, no rollover. At zero, "AI chat and generation pause" | `introduction/plans-and-credits` |

**Conclusion: the platform covers 100% of this product's needs natively.**

- **Decision**: Build entirely inside native.builder + Supabase. Projected escape-hatch usage **0%** against the constitution's 20% budget.
- **Rationale**: Every architectural need — React SPA, Postgres schema with RLS, server-side functions, secret storage, public deployment — maps to a documented platform capability.
- **Alternatives considered**: (a) native.builder frontend + separately hosted backend — rejected, it manufactures an escape hatch the platform makes unnecessary and violates Principle I's spirit; (b) native.builder without Supabase, client-side state only — rejected, no persistence means no timeline, no audit trail, and no credible product.

---

## 2. How the deployed app calls Claude at runtime

**This is the finding that most changes the plan.**

- **Finding**: native.builder's BYOK feature (OpenRouter, AI/ML API, Fireworks AI, Featherless AI) unlocks models in the **builder's own chat model picker**. It is a build-time convenience for the agents that write your app. It is *not* a runtime model client handed to the generated application. **Anthropic is not offered as a direct BYOK provider.**
- **Decision**: The deployed app calls the Anthropic API **from a Supabase Edge Function**, with `ANTHROPIC_API_KEY` held in Supabase secret storage and injected via the agent's masked-secret input.
- **Rationale**: Keeps the key off the client entirely (NFR-11); is the only path that satisfies the constitution's mandate for `claude-opus-5` / `claude-sonnet-5`; and stays inside the documented native.builder + Supabase surface, so it does not consume escape-hatch budget.
- **Alternatives considered**: (a) OpenRouter BYOK routing to `anthropic/claude-opus-5` — **retained as the R4/contingency fallback**, a ~2-line change inside the Edge Function, deliberately pre-identified so it is never a decision made under deadline pressure; (b) client-side Anthropic call — rejected outright, exposes the key in the browser bundle; (c) a non-Claude model via BYOK — rejected, the constitution fixes the model family.
- **Escape-hatch ruling**: Not an escape hatch. Principle I budgets things *built outside* native.builder; the Edge Function is generated by the Builder agent inside the project. This ruling is recorded in `docs/escape-hatches.md` so the judgment is auditable rather than assumed.

---

## 3. Agent call structure — one call, not three

- **Decision**: Collapse spec capabilities A2 (risk explanation), A3 (action selection), and A4 (outreach drafting) into a **single structured `generate-assessment` call** returning one JSON object. Keep A1 (signal enrichment) separate and on the fast model.
- **Rationale**: Three sequential `claude-opus-5` calls would run ~30–45s against a 20s budget (NFR-4), triple the failure surface (E3), and triple token spend. One call also lets the model choose the action and write the message *together* — which is where draft quality actually comes from, since a message written to justify an already-fixed action reads like a template.
- **Alternatives considered**: (a) three chained calls — rejected on latency and failure surface; (b) fold A1 in as well — rejected, enrichment fires on a different trigger (manual injection only) and belongs on the cheaper, faster model; (c) streaming partial results — rejected as build complexity that buys nothing inside a ≤20s budget.

---

## 4. Scoring: deterministic vs. model-generated

- **Decision**: Health score is computed by pure TypeScript. No model participates in the number.
- **Rationale**: Four reasons, in order of weight — (1) **verifiability**: Flow 3's live injection only proves something if the judge can see a deterministic cause→effect; (2) **auditability**: "why is this 34?" must have an inspectable answer, which a generated number never has; (3) **latency**: model-scoring a full book on page load breaks NFR-3 and the 60-second cold-start budget; (4) **honesty**: Constitution Principle IV — a model asked for a number returns a plausible one, not a correct one.
- **Alternatives considered**: (a) model-generated score — rejected on all four counts; (b) hybrid, rules with model adjustment — rejected, it inherits the non-reproducibility of (a) while adding complexity; (c) pure rules with templated prose instead of generated explanations — rejected, templated prose is exactly the generic output the product exists to replace, and it would gut the Application-of-Technology score.
- **Consequence**: Weights are hand-tuned and documented for inspection. This is a defensible hackathon posture, stated as such in the submission rather than dressed up as learned.

---

## 5. Authentication approach

- **Decision**: Supabase Auth with a single pre-provisioned demo user, auto-signed-in on page load. No login screen, no signup, no password reset.
- **Rationale**: A judge on a 3-minute budget must not meet a login wall — SC-001 allows 60 seconds to a recommended action, and a signup flow spends most of it. Auth still exists because RLS needs an authenticated role to be meaningful; removing it entirely forces either public-anon table access or no RLS, both worse.
- **Alternatives considered**: (a) full auth with signup — rejected, spends scarce build days and demo seconds on an explicit non-goal; (b) no auth, anon-public tables — rejected, RLS becomes theatre and the data model can't carry ownership; (c) a shared demo password shown on screen — rejected, it is a login wall with extra steps.

---

## 6. Credits as the primary project risk

- **Finding**: 50 one-time credits on the free plan, consumed by chat, generation, and refactoring. At zero, all generation stops.
- **Decision**: Upgrade to the Builder plan (or the Lablab Builder plan, if the hackathon provides it) on **D1, before the first generation prompt**.
- **Rationale**: The entire build is agent-generated through chat. Exhausting credits on D3 does not slow the project down — it stops it. $20 against a 4.5-day window is not a decision worth deliberating, which is exactly why the constitution's 60-minute decision cap exists.
- **Secondary rationale**: the Versions panel (publish rollback) is paid-only, and rollback is the mitigation for R5, the failure mode that breaks the app *after* it looks finished.
- **Alternatives considered**: (a) run free and conserve — rejected, it converts every prompt into a risk calculation and makes rework catastrophic; (b) upgrade reactively when credits run low — rejected, the platform pauses generation at zero and mid-build interruption is the exact failure being avoided.
- **Mitigations beyond upgrading**: one screen or one function per prompt; acceptance criteria stated inside each prompt; edit-and-resend rather than corrective follow-ups (a corrective follow-up is a second full generation, an edited resend is not).

---

## 7. Data storage shape

- **Decision**: 7 Postgres tables plus one workspace view; signals append-only; `timeline_events` written as a projection at mutation time rather than derived at read time.
- **Rationale**: The timeline is the credibility surface (SC-006) — a judge must reconstruct what the agent did and what the human decided without asking. Writing the projection at mutation time costs a little duplication and buys a single indexed read instead of a 4-way UNION on the hot path.
- **Alternatives considered**: (a) derive the timeline at read time — rejected on read complexity and query cost; (b) event-sourcing everything and projecting all state — rejected as multi-day architecture for a 4.5-day build; (c) client-side state with no persistence — rejected, kills the timeline, the audit trail, and the product.

---

## 8. Residual unknowns

| Unknown | Why it is safe to carry | Resolution point |
|---|---|---|
| Exact generated stack version (Vite/React specifics) | The Builder agent owns it; nothing in this design depends on a particular version | Observable in the Code tab on D1 |
| Edge Function cold-start latency | Absorbed by the 25s function timeout and a visible progress state; NFR-4's budget has ~3s of headroom | Measured during D3 |
| Whether the Lablab Builder plan is granted to participants | Only affects who pays $20, not the architecture | D1, step 0 |
| Per-signal-type scoring weights | Starting values are specified in plan.md §3; tuning is a seed-data activity, not a scope question | D2, alongside seed authoring |

**No unresolved NEEDS CLARIFICATION remains. Phase 0 is closed.**
