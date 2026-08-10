# Build Log — live session

**Started**: 2026-08-07 (D2 of the build window)
**Deadline**: 2026-08-10, 8:00 PM Pakistan Standard Time

---

## Live state

| Item | Value |
|---|---|
| Workspace | Muhammad Yaseen's Workspace |
| **Project URL** | https://builder.nativelyai.com/projects/f80b3aa4-eaf2-4876-8215-e4b04bca0fe4 |
| Plan | **Free** (paid upgrade blocked — see below) |
| Credits | started 50.00 → **49.82** after the whole planning phase |
| Stack confirmed by the agent | **Vite + React + Tailwind**, no Supabase attached yet |
| Preview | ✅ ready |
| PRD document | ✅ generated (visible in the Documents panel as `prd`) |

---

## ✅ Done

| Task | Status |
|---|---|
| T000 Hackathon sign-up | ⬜ **still pending — do this** |
| Account created + logged in | ✅ |
| Workspace created | ✅ |
| T001 Upgrade with `AIFACTORY26` | ❌ **BLOCKED — see below** |
| T004 Product Architect brief (prompt A1) | ✅ submitted |
| Clarifying round 1 (3 questions) | ✅ submitted |
| Clarifying round 2 | 🔄 **in progress — 2 of 3 answered** |

### Answers given, and why

**Round 1**

| Q | Answer | Reason |
|---|---|---|
| AI provider for Edge Functions | **Anthropic (Claude)** | plan.md AD-3 decision, confirmed with the user |
| Which signals drive the score | Support tickets · Product usage / login frequency · Payment / billing · NPS / CSAT · Feature adoption | Our 6 spec types. Skipped "License seat changes", "Account age", "Manual sentiment flags" — not in the data model |
| How accounts get created | **One-time import / seed file** | Matches `seed-data.json`. Rejected lazy-creation-on-first-signal — our flow adds signals to *existing* accounts |

**Round 2**

| Q | Answer | Reason |
|---|---|---|
| AI generation threshold | **Yes, < 70** | Exactly our Watch (40–69) + Critical (0–39) tiers |
| Demo user approach | **Hardcoded demo user (pre-seeded, known UID)** | Anonymous auth mints a new ephemeral user per session, so seeded accounts would have no owner and RLS would hide everything |
| Third question | ⬜ not yet seen | Session interrupted |

---

## 🚫 Blocker: the paid plan

`AIFACTORY26` **could not be applied.** Walked the full upgrade path:

`Manage plan → Change plan → Get Builder` → lands on **live Stripe Checkout**
(`checkout.stripe.com/c/pay/cs_live_…`)

- Price shown: **PKR 5,770.76 / month**, recurring
- Requires a real card
- **There is no promo-code field on that page** — no "Add promotion code" link anywhere

So the free-month promo is not redeemable through the normal upgrade flow.

**Ask in the NativelyAI Discord** — https://discord.gg/uP2TQVtkRj — how to apply `AIFACTORY26`.
It is likely applied server-side against your account, or needs a separate link.

**Good news that changes the urgency:** the entire planning phase — a long brief, two rounds of
clarifying questions, and a generated PRD — cost **0.18 credits**. At that rate 50 free credits
is not the hard wall the plan assumed. Keep building on Free; chase the promo in parallel, not
as a blocker.

---

## ▶️ Next actions, in order

1. **Answer the last clarifying question** in the builder and Submit.
2. **Sign up for the hackathon** on the lablab event page (T000) — required before any partner coupon can be claimed.
3. **Claim Bright Data** with code `aiaccess50`.
4. **Ask in Discord** about `AIFACTORY26`.
5. **Create a Supabase project** and connect it: `Settings → Integrations → Supabase`, then point this app at it and enable agent access. The agent said Supabase is not attached yet, so this blocks all data work.
6. **Publish the empty app** (T006) — the Publish button is top-right. Record the URL in `README.md`. This is Constitution Principle III: get the public URL before features exist.
7. Then continue with prompt **A2** (schema) from [build-prompts.md](./build-prompts.md).

---

---

## Session 2 — 2026-08-08

**App name chosen by the agent: "Maya — CS Health Radar"**

### Unblocked and running

| Step | Result |
|---|---|
| Supabase authorized at workspace level | ✅ (first OAuth attempt 400'd — *"Invalid or expired OAuth state"* — because ~12 min elapsed between opening the consent screen and clicking Authorize. Redo it fast and it works) |
| Supabase project linked | ✅ **aurum-rails** (ap-northeast-2) — pre-existing project in the user's org |
| "Enable Supabase for this project" | ✅ on |
| Corrections message sent to Builder | ✅ |
| Build | 🔄 running — 25 → 27 → 29 → **31 actions, 4 files modified** |
| `.gitignore` | ✅ created as requested |

### Corrections sent to the Builder agent

The Task Planner's own brief had drifted from our spec. Sent four fixes:

1. **Seven tables, not five** — it had dropped `outreach_drafts` and `decisions`, which are the audit records for the entire human-approval loop. Included both schemas plus the `reason_iff_rejected` CHECK.
2. **Exact scoring formula** — full weights, severity multipliers, 90-day decay, per-type-per-day cap, tier boundaries, stale rule, and the `contributing` breakdown for auditability.
3. **Model ids** — `claude-opus-5` / `claude-sonnet-5`, explicitly not 3.x. Plus: one combined structured call, not three.
4. **Hard guardrails in code and schema, not prose** — taxonomy as a Postgres enum, the `array_length >= 2` CHECK on `cited_signal_ids`, server-side validation that cited ids are a subset of the supplied context, one retry never two, and `signals` granted SELECT+INSERT only.

### Note on the third clarifying question

The agent asked "Claude 3.5 Sonnet or 3.5 Haiku?" and the recorded answer already specified
`claude-opus-5` / `claude-sonnet-5` with the one-call requirement — correct, and consistent with
plan.md AD-2 and AD-3. That answer was entered outside this agent's session.

### 🎟️ Hackathon registration + partner credits — DONE 2026-08-08

| Item | Value |
|---|---|
| Hackathon enrollment (T000) | ✅ **Enrolled** |
| **Team** | ✅ **CS Health Radar** — https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/cs-health-radar |
| **AI/ML API coupon** | ✅ **`AFHL-WJHW-8RSQ`** — redeemed 2026-08-08 15:29, $10 credits |

**Coupons are team-admin only.** The redeem page returns *"Access Denied — Only team admins can
claim coupons"* until a team exists. Create the team first; the ordering is not documented on the
event page.

**Decision reversed — model provider.** plan.md AD-3 chose the Anthropic API directly, and
hackathon-brief.md §10 recorded "Anthropic direct, forgo the $1,000 AI/ML API prize." That
decision assumed a funded Anthropic account. The user has no budget for one, so the constraint
changed and the decision changes with it:

> **Use AI/ML API instead of the Anthropic API directly.** It is a unified gateway that serves
> Claude models, the hackathon supplies $10 of credit free, and it makes the project eligible for
> the $1,000 "Best Use of AI/ML API" prize. Featherless was rejected — open-source models only,
> no Claude — and the rules allow only one of the two.

The Edge Functions change by roughly two lines: base URL and auth header. Request/response
shapes, the V1–V5 validations, the one-retry rule, and the model ids all stay as specified.

### 🔑 API key — resolved without spending money

| Item | Value |
|---|---|
| Provider | **AI/ML API** (aimlapi.com), OpenAI-compatible gateway serving Claude |
| Account | Existing, signed in with Google. **Balance $9.93** already on it |
| Key created | `cs-health-radar-hackathon` |
| Stored as | Supabase secret, via the Builder agent's masked input |

**The key value is deliberately not recorded in this repo** (NFR-11). It lives in Supabase secret
storage and a one-time download file outside the project tree. If it is ever lost, generate a new
one — the value is shown only once at creation.

**Follow-up message sent to the Builder** telling it the stored secret is an AI/ML API key, not an
Anthropic one, so it must switch transport:

- Base URL → `https://api.aimlapi.com/v1`
- OpenAI-shaped `POST /v1/chat/completions`, not the Anthropic Messages shape
- `Authorization: Bearer <key>` — no `x-api-key`, no `anthropic-version`
- **Model ids: do not guess.** Call `GET /v1/models` first, pick the best available Claude for the
  quality path and a faster one for enrichment, then report which two were chosen. If no Claude is
  available, say so and stop rather than silently substituting another vendor.
- Everything else unchanged: one combined call, all five validations, one retry, pure deterministic
  scoring, no outbound send path.

Status: agent is deploying the Edge Functions with the new transport.

---

## Session 3 — 2026-08-09 — provider switched to AI/ML API

### The money problem, and how it resolved

The user has no paid Anthropic account. The hackathon's own partner program covers it:

| Item | Value |
|---|---|
| Coupon claimed | `AFHL-WJHW-8RSQ` (redeemed 2026-08-08) |
| **AI/ML API balance** | **$9.93** — live and confirmed |
| API key created | `maya-cs-health-radar`, $10 cap, all endpoints |

**Verified against the live AI/ML API `/v1/models` endpoint** — these exact ids exist and are what
the Edge Functions now use:

```
anthropic/claude-opus-5      quality path  (explanation + action + draft, one JSON call)
anthropic/claude-sonnet-5    fast path     (signal enrichment)
```

Base URL `https://api.aimlapi.com/v1`, OpenAI-compatible `POST /chat/completions`,
`Authorization: Bearer <AIML_API_KEY>`.

**This supersedes the plan.md AD-3 decision** to call Anthropic directly. The constraint changed —
no budget for an Anthropic key — and AI/ML API carries the same models for free. It also makes the
project eligible for the $1,000 "Best Use of AI/ML API" partner prize, which the earlier decision
had deliberately forgone.

### State of the app

✅ **The app renders.** "Maya — CS Health Radar" is running in preview:
- Workspace screen with tier filters: All / Critical / Watch / Healthy / **Stale**
- "Add Signal" button
- Empty state reading *"No accounts yet — Add some seed data or the first signal to get started"* — our E8 requirement, unprompted
- Build compiles in 2.31s

| Item | Status |
|---|---|
| `AIML_API_KEY` in Supabase Secrets | ✅ saved via the masked input |
| Edge Functions | 🔄 redeploying against AI/ML API |
| Seed data | ❌ **still 0 accounts** — instruction sent, not yet run |
| Credits | 50.00 → **46.09** |

### Still to do

- [ ] Store `ANTHROPIC_API_KEY` as a Supabase secret — **the agent cannot generate real assessments without it**
- [ ] Publish → get the public URL (T006)
- [ ] Verify the schema actually applied in Supabase
- [ ] Seed data: confirm the injection-target account scores 71–76
- [ ] Hackathon sign-up (T000) + Bright Data `aiaccess50`
- [ ] Demo video, submission

---

---

## Session 3 — 2026-08-10 (DEADLINE DAY, 8:00 PM PKT)

### 🚀 THE APP IS LIVE

**https://eonhw2qcm2ajxbmcp3jdtvopw.nativelyai.app**

Published 2026-08-10 ~05:12 UTC. Credits used so far: 50.00 → **44.23**.

### Working on the live URL ✅

| Feature | State |
|---|---|
| Workspace, 10 accounts, ranked most-at-risk first | ✅ |
| Header count "10 accounts · 5 need attention" | ✅ |
| Tier filters (All / Critical / Watch / Healthy / Stale) | ✅ |
| Colour system red / amber / green **with text labels** | ✅ |
| Account Detail with **Contributing Factors** table | ✅ |
| Deterministic scoring | ✅ **verified live** |
| Signals list with real dates | ✅ |
| Timeline tab | present |
| AI/ML API switch (`AIML_API_KEY`, `anthropic/claude-opus-5` + `anthropic/claude-sonnet-5`) | ✅ |
| 3 Edge Functions deployed (`recalculate-health` v3 etc.) | ✅ |

**Live tier distribution:** Blue Ridge Partners 27 · Nexus Industries 9 (critical) · Crestview 60 ·
Prism 68 · Titan 59 (watch) · **Acme Dashboard 72** · Atlas Reach 100 · Horizon 91 · Momentum 97 ·
Stellar 96 (healthy).

**Scoring verified by hand on the live app** — Blue Ridge Partners:
`-34.01 + -19.94 + -13.57 + -5.59 = 73.11` → `100 − 73.11 = 27` ✅ exact.

**Acme Dashboard sits at exactly 72**, as the plan required, so the live-injection demo will flip
it healthy → watch on camera.

### Bugs found and fixed this session

1. **All accounts rendered 0 / "stale" / "No data"** despite correct DB rows. Root cause was in the read path, not the data. Fixed — the live app now shows real scores and tiers.
2. *(Earlier, by the QA agent)* the demo user `maya@example.com` did not exist in `auth.users`, so sign-in failed → anon role → RLS returned zero rows → "0 accounts". Fixed; sign-in returns 200 and 10 accounts are readable under RLS. **RLS was never disabled** — the policies are still real.

### 🔴 THE ONE REMAINING BLOCKER

**The AI layer does not render in the UI.** The Assessment tab shows Score Drivers, Contributing
Factors, and the raw signals list — but no risk explanation, no cited signals, no recommended
action, no drafted message, and no approve / edit / reject controls.

Without it this is a scoring dashboard, not a Customer Success Agent — and the six-step workflow
(Constitution Principle II) is not demonstrable.

Likely cause: `generate-prose` was never invoked for the seeded accounts, so no `recommendations`
rows exist. A detailed fix request is **queued** with the Builder: backfill the 5 watch/critical
accounts, add a Regenerate button, render all five missing pieces, keep every guardrail, and either
fix or remove the broken "Score Drivers" panel (all zeros, weights that do not match our model).

### Remaining sequence

1. ⏳ AI layer renders + approval loop works (queued)
2. ⬜ Re-publish
3. ⬜ Verify Flow 2 end to end and Flow 3 live injection on Acme Dashboard
4. ⬜ Rename project from "New Project" to "Maya — CS Health Radar"
5. ⬜ Demo video ≤ 3 min
6. ⬜ Submit on lablab **before 8:00 PM PKT**

---

---

## FINAL STATE — 2026-08-10, ~4:15 PM PKT

### ✅ Everything built, published, and verified

**Live:** https://eonhw2qcm2ajxbmcp3jdtvopw.nativelyai.app
**Project:** Maya — CS Health Radar (renamed) · Credits remaining **37.72**

| Requirement | State |
|---|---|
| Functional app on a public URL | ✅ |
| Built primarily with native.builder | ✅ Product Architect + Builder + QA agents |
| One complete end-to-end workflow | ✅ all six steps live |
| Clear problem + target user | ✅ |
| Beyond a landing page | ✅ |
| Demo video ≤ 3 min | ✅ recorded |

### Final round of fixes (all verified live)

1. **Raw UUIDs removed from prose** — justifications now read "the critical payment issue from 7 Aug" instead of leaking `a0000000-…-301`
2. **Blue Ridge reset to pending** — Approve / Approve edited / Reject render, with "Nothing is ever sent."
3. **Trailing-slash route fixed** — `/account/<id>/` no longer 404s

### Flow 3 verified twice, on the real live app

| Account | Before | After | Delta |
|---|---|---|---|
| Horizon Data (test run) | 91 healthy | **61 watch** | −30 |
| Acme Dashboard (**during recording**) | 72 healthy | **42 watch** | −30 |

Both match `12 × 2.5 × 1.0 = 30` exactly. The formula is doing real work, and the video captured a
genuine state change rather than a staged one.

### Demo video

`video/maya-cs-health-radar-demo.webm` — 7.51 MB, ~2:30, 1280×720, captions burned in, no audio.

Recorded via a Playwright context with `recordVideo`, driving the **live published URL**. The
Acme Dashboard injection in the video is real: the workspace read 42 / watch / "Updated 2m ago"
immediately afterwards.

### ⚠️ Note for any future live demo

Acme Dashboard is now **42 / watch** — it has been "spent". For another live injection use a
still-healthy account: Atlas Reach (100), Momentum Labs (97), or Stellar Cloud (96).

### Only thing left

**Submit on lablab before 8:00 PM PKT** — video + the text in `SUBMISSION.md`.

---

## Notes for the next session

- The Product Architect asks clarifying questions in rounds and will not generate code until they are answered and submitted. Budget for that.
- Free plan caps at **2 projects** — do not create a throwaway project casually.
- The model picker showed "Natively Medium". Premium models are Paid-only, so the build runs on standard models regardless of what the Edge Functions call at runtime. Runtime Claude access is unaffected — that goes through Supabase secrets, not the builder's model picker.
- Publishing consumes **no credits**, so deploy often.
