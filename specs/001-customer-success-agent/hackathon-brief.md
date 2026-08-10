# Official Hackathon Brief — verified from source

**Scanned**: 2026-08-06 via Playwright, full page snapshot (1,507 lines, read 100%)
**Source**: https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
**Status**: This document **supersedes** all earlier assumptions about the hackathon in
`constitution.md`, `plan.md`, and `research.md`, which were built from search summaries because
the page returned HTTP 403 to automated fetch.

---

## 1. Hard facts

| Item | Verified value |
|---|---|
| Event | AI Factory — Native.builder Hackathon, hosted by NativelyAI + lablab.ai |
| Dates | **August 3–10, 2026**, fully online |
| **Submission deadline** | **Aug 10, 8:00 PM Pakistan Standard Time** — the event schedule states this in PKT directly |
| Time remaining from now | **~4 days, 9 hours** |
| Participants | 3,414 registered |
| Builder URL | https://builder.nativelyai.com/ |
| Docs | https://docs-builder.nativelyai.com/ |
| NativelyAI Discord | https://discord.gg/uP2TQVtkRj |

---

## 2. 🎉 THE BIGGEST FINDING — the Builder plan is free

> **Promo code: `AIFACTORY26`**
> "Every participant can activate the **lablab.ai Builder Plan free for 1 month**. Simply create
> your Native.Builder account and use the promo code below when upgrading your Builder plan."

**This kills risk R1 entirely.** plan.md and tasks.md T001 said "pay $20 before the first prompt
or the build stops at 50 credits." That is now wrong. The correct action is:

> **T001 (REVISED): Create the Native.Builder account, go to upgrade, and enter `AIFACTORY26`.
> Cost: $0. Still do it before the first generation prompt.**

Everything else about R1 stands — credits still gate generation, one-screen-per-prompt discipline
still matters, and the paid tier still unlocks the Versions panel used for publish rollback (R5).

---

## 3. Submission requirements — the official checklist

Every item below is required. Missing any one risks the whole entry.

### 📋 Project information
- [ ] A clear description of the problem being solved
- [ ] A clearly defined target user
- [ ] **A written explanation of how native.builder was used**

### 🎬 Demonstration
- [ ] A demo video of **no more than three minutes**
- [ ] **At least one complete end-to-end user workflow shown**

### 🔗 Application and tools
- [ ] The **native.builder project or application URL**
- [ ] A functional, **publicly accessible** application
- [ ] **A list of any external APIs, datasets, or tools used**

### ✅ Eligible
- Created **primarily** using native.builder
- Demonstrates meaningful use of native.builder, not just a landing page
- **Confirmed to have been created during the hackathon period**

### ❌ NOT eligible — automatic disqualification
- Inaccessible to the judging team
- **Primarily built outside native.builder**
- **A direct copy of an existing product without meaningful differentiation**
- **Submitted without a working demonstration**

---

## 4. Judging criteria — confirmed, four dimensions

| Dimension | Official wording |
|---|---|
| **Application of Technology** | How effectively the chosen model(s) are integrated into the solution |
| **Presentation** | The clarity and effectiveness of the project presentation |
| **Business Value** | The impact and practical value, considering how well it fits into business areas |
| **Originality** | The uniqueness and creativity of the solution, highlighting approaches and ability to demonstrate behaviors |

No published weights. Our spec §13.3 mapping stays valid.

---

## 5. ⚠️ Our project is one of their five example ideas

> **"AI Customer Success Workspace** — An application that analyzes customer conversations,
> identifies churn risks, creates follow-up tasks, and recommends responses."

This is listed on the page as Example Project Idea #1, and it describes our product almost exactly.

**Read both ways, honestly:**

| Good | Risk |
|---|---|
| Perfect fit to what organisers want. Zero risk of being "off-brief" | It is the most obvious idea on the page, with 3,414 participants reading it |
| Business Value is easy to argue — they already believe in this problem | **Originality** is now our *weakest* scoring dimension, not our strongest |
| | An existing submission, **Swiftrove AI**, already orchestrates "Sales, Finance, and **Customer Success** agents" |

**What this changes:** originality can no longer come from *what* we built. It has to come from
*how*. Our three real differentiators must be pushed to the front of the video and the submission
text:

1. **Deterministic scoring, not AI scoring** — the score is reproducible and auditable, and we prove it live on camera. Almost nobody else will do this; most will let a model emit a number.
2. **Enforced grounding** — every explanation cites ≥2 real signals, validated server-side against the account record. Fabricated citations are rejected by code, not discouraged by a prompt.
3. **It outputs a drafted action, not a dashboard** — closing the know→act gap, with a hard human-approval boundary and no send capability anywhere in the codebase.

---

## 6. 💰 Partner prizes — $3,800 pool we had not accounted for

| Partner | Prize | Free credits | Promo / claim |
|---|---|---|---|
| **Bright Data** | **$500 CASH + $500 credits** — "Best Agentic Use of Bright Data" | $50, no cap, 30 days, +5,000 free MCP req/mo | Code `aiaccess50` |
| **AI/ML API** | $1,000 credits — "Best Use of AI/ML API" | $10, first 500 participants | Claim link on page |
| **Featherless AI** | $300 credits — "Best Use of Featherless AI" | $25, first 500 | Claim link on page |
| **Speechmatics** | 3 × 500 API credits (1st/2nd/3rd) | $50, first 100, 1 month | Code `LABLABHACKATHON50` |

**Rules:** AI/ML API **OR** Featherless — not both, they are technically equivalent. One coupon per
team, redeemed by the team leader. Speechmatics and Bright Data are unaffected by that restriction.

**Bright Data is the only cash prize in the entire event.**

---

## 7. ⚠️ Correction to our "zero integrations" decision

The page states, under Required Technologies:

> "Participants **may use external APIs, AI models, databases, authentication providers, and
> third-party services** where appropriate. The use of **integrations, backend functionality, AI
> agents, data sources, authentication, and advanced native.builder capabilities is encouraged.**"

Our spec §10 chose zero live third-party integrations. That decision was defensible on time-risk
grounds and it is still not *disqualifying* — but it now reads as leaving points on the table in a
dimension the organisers explicitly say they want to see.

### Recommended change — one new signal source, not a rebuild

Add **Bright Data** as a single new signal type. It fits our existing architecture exactly, because
our whole data model is already built around typed signals:

```
new signal type:  external_event
source:           Bright Data live web lookup on the account's company name
examples:         funding round, layoffs, exec departure, acquisition, negative press
```

**Why this is the right addition and not scope creep:**

- It is **one new enum value plus one lookup call**. The scoring, the assessment prompt, the timeline, and the UI all already handle "a typed signal with a severity and a date" — nothing structural changes.
- It makes the product genuinely better, not just prize-eligible: a churn signal from *outside* the product (their CTO just left; they just did layoffs) is exactly the kind of thing a CSM never sees in time. That is a real product insight, not a bolt-on.
- It restores **Originality**, which §5 shows is now our weak dimension.
- It qualifies us for the **$500 cash prize** — the only cash in the event.
- It satisfies the "integrations are encouraged" line without touching OAuth, webhooks, or any sandbox provisioning, which is what §10 was actually protecting us from.

**Cost estimate: 3–4 hours on D3.** Tasks would slot in as T067–T070.

### Optional second change — model provider

Routing our Edge Function calls through **AI/ML API** instead of the Anthropic API directly would
make us eligible for the $1,000 credits prize, and it is close to a drop-in swap in
`generate-assessment`. It also removes the need for a personal Anthropic key.

**Recommendation: only if D1's latency probe is clean and time allows.** Prize eligibility is not
worth risking the core agent path, and the Anthropic path is what the plan was verified against.

---

## 8. What did NOT change

Everything in the plan that was built from the docs at `docs-builder.nativelyai.com` remains
correct and is now confirmed by the event page:

- ✅ native.builder generates the app; publish gives a public URL
- ✅ Supabase for database, auth, and Edge Functions is supported and encouraged
- ✅ The six-step platform workflow (describe → generate → refine UX → add workflows/data → test → deploy) matches our build sequence exactly
- ✅ "Beyond a static landing page, at least one meaningful workflow" — our Principle II chain
- ✅ Four judging dimensions, as spec §13.3 assumed
- ✅ Demo video ≤ 3 minutes with a complete E2E workflow

---

## 9. Revised D1 checklist

| # | Action | Change from tasks.md |
|---|---|---|
| 1 | Sign up for the hackathon on the lablab page (required before claiming partner access) | **NEW — was missing entirely** |
| 2 | Create account at https://builder.nativelyai.com/ | Same |
| 3 | Upgrade with promo code **`AIFACTORY26`** — free for 1 month | **REVISED — was "pay $20"** |
| 4 | Claim Bright Data with code `aiaccess50` | **NEW — if §7 is adopted** |
| 5 | Authorize Supabase at workspace level | Same (T002) |
| 6 | Create the empty Supabase project | Same (T003) |
| 7 | Brief the Product Architect (prompt A1) | Same (T004) |
| 8 | Link the app to Supabase, enable agent access | Same (T005) |
| 9 | **Publish the empty app**, record the URL | Same (T006) |
| 10 | Verify the model path from an Edge Function, record latency | Same (T007) |

---

## 10. Decisions taken — 2026-08-06

| Question | Decision | Consequence |
|---|---|---|
| Add Bright Data as an `external_event` signal source? | ✅ **YES** | New User Story 5, tasks **T067–T071**, build prompt **D0**. Built only after US1 + US2 are green |
| Model provider — Anthropic direct or AI/ML API? | ✅ **Anthropic direct** | Core agent path stays exactly as verified in plan.md AD-3. We forgo the $1,000 AI/ML API prize rather than risk the path the whole product runs on |

### Changes applied across the artifacts

| File | Change |
|---|---|
| `constitution.md` | TODO closed; deadline and promo-code corrections recorded in the Sync Impact Report |
| `plan.md` | R1 downgraded High → Low (`AIFACTORY26` is free); **R9 added** (Originality risk); `external_event` weight 11 added to the scoring formula |
| `data-model.md` | `external_event` added to `signal_type`; `bright_data` added to `signal_source`; account-naming rule amended |
| `tasks.md` | **T000 added** (hackathon sign-up — was missing entirely); T001 revised to $0 via promo code; **US5 / T067–T071 added**; cut order updated |
| `build-prompts.md` | **Prompt D0 added** — the full Bright Data build prompt |

### The naming problem this created, and its fix

Our accounts are fictional, so a live web lookup for "Northwind Logistics" returns nothing — and a
web-scan demo that finds nothing is worse than no web scan. **Fix: 3 of the 10 demo accounts are
renamed to real, well-known public B2B SaaS companies**, one of which is the Flow 3 injection
target. Every CSM-side signal on those accounts stays fictional; only `external_event` signals
carry real public information.

This does not breach NFR-10, which forbids real *customer* identities — private data about our
customers. A public company's name on a clearly-labeled demo account, carrying only public news,
is not that. Full reasoning in [data-model.md](./data-model.md) § Account naming.

### Cut-order placement

US5 sits **above** US4 and US3 in the pre-authorized cut order, despite carrying the only cash
prize in the event. A failed live web call on camera costs more than the feature gains. It ships
working, or it does not ship.
