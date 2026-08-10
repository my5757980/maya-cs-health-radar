---
id: 0006
title: Official Hackathon Page Scan Corrections
stage: misc
date: 2026-08-06
surface: agent
model: claude-opus-5
feature: 001-customer-success-agent
branch: 001-customer-success-agent (no git repo; directory-scoped only)
user: ASFAR
command: (user request — Playwright scan of the official event page)
labels: ["research", "playwright", "hackathon-rules", "corrections", "bright-data", "originality-risk"]
links:
  spec: specs/001-customer-success-agent/spec.md
  ticket: https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
  adr: null
  pr: null
files:
 - specs/001-customer-success-agent/hackathon-brief.md
 - specs/001-customer-success-agent/data-model.md
 - specs/001-customer-success-agent/tasks.md
 - specs/001-customer-success-agent/build-prompts.md
 - specs/001-customer-success-agent/plan.md
 - .specify/memory/constitution.md
tests:
 - none executed; T071 added as the US5 end-to-end verification task
---

## Prompt

achaa bat sunoo playwrite connect haii is link par jaoo full scan karoo is hacathone ki full detail haii dekhoo or complete karoooooo

https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits

## Response snapshot

Scanned the official event page with Playwright. The accessibility snapshot was 102,316 characters
across 1,507 lines; **read 100% in four sequential chunks.** WebFetch had returned HTTP 403 on this
page during Phase 0, so every earlier hackathon assumption had been built from search-result
summaries. The scan corrected several of them.

**Findings that changed the project:**

1. **Promo code `AIFACTORY26` — the lablab.ai Builder Plan is FREE for 1 month.** R1, the plan's
   top risk ("pay $20 before the first prompt or the build stops at 50 credits"), collapses to a
   $0 action. Downgraded High → Low; credit *discipline* still applies, and the paid tier still
   unlocks the Versions panel used for R5 rollback.
2. **Deadline is Aug 10, 8:00 PM Pakistan Standard Time** — the event schedule states it in PKT
   directly, so the earlier ambiguity is gone. ~4 days 9 hours remained at scan time.
3. **`T000` was missing entirely** — hackathon sign-up on the lablab page is a prerequisite for
   claiming any partner access. Nothing in the prior task list covered it.
4. **Our project is Example Project Idea #1 on the page** — "AI Customer Success Workspace… analyzes
   customer conversations, identifies churn risks, creates follow-up tasks, and recommends
   responses." Read honestly this cuts both ways: perfect brief fit and easy Business Value, but
   **Originality flips from our strongest dimension to our weakest** with 3,414 registered
   participants reading the same suggestion, and an existing submission (Swiftrove AI) already
   shipping a Customer Success agent. Logged as new risk **R9**.
5. **$3,800 in partner prizes** we had not accounted for — including **Bright Data's $500 cash, the
   only cash prize in the event**. AI/ML API and Featherless are mutually exclusive; one coupon per
   team, redeemed by the team leader.
6. **Our "zero integrations" decision was leaving points on the table.** The page states plainly
   that external APIs, databases, auth providers, and third-party services are *encouraged*. Not
   disqualifying, but scored against us in a dimension the organisers explicitly ask for.

**Decisions taken** (via AskUserQuestion, since both materially change scope):

- ✅ **Add Bright Data** as an `external_event` signal source → new User Story 5 (T067–T071), build prompt D0. Built only after US1 and US2 are green.
- ✅ **Keep Anthropic direct** rather than routing through AI/ML API — forgoing the $1,000 credits prize rather than disturbing the core agent path the whole product runs on.

**A problem the Bright Data decision created, and its fix.** Our accounts are fictional, so a live
web lookup for "Northwind Logistics" returns nothing — and a web-scan demo that finds nothing is
worse than no web scan. Fix: **3 of the 10 demo accounts are renamed to real, well-known public
B2B SaaS companies**, one of them the Flow 3 injection target. Every CSM-side signal on those
accounts stays fictional; only `external_event` signals carry real public information. This does
not breach NFR-10, which forbids real *customer* identities — private data about our customers —
which a public company name on a labeled demo account carrying public news is not.

**US5 placed ABOVE US4 and US3 in the cut order** despite carrying the only cash prize: a failed
live web call on camera costs more than the feature gains. It ships working or it does not ship.

Wrote `hackathon-brief.md` as the authoritative record, and propagated corrections to
`constitution.md`, `plan.md`, `data-model.md`, `tasks.md`, and `build-prompts.md`.

## Outcome

- ✅ Impact: Every hackathon assumption is now verified against the source rather than inferred from search summaries. One risk eliminated, one discovered, one missing prerequisite task added, and a scoped feature added that addresses the discovered risk and the only cash prize simultaneously.
- 🧪 Tests: None executed. T071 added as US5's end-to-end verification against the deployed URL.
- 📁 Files: `hackathon-brief.md` (new), plus corrections to `constitution.md`, `plan.md`, `data-model.md`, `tasks.md`, `build-prompts.md`
- 🔁 Next prompts: Begin D1 — T000 (sign up), then T001 with `AIFACTORY26`, then prompt A1. US5 work does not start until US1 and US2 are green.
- 🧠 Reflection: Phase 0 recorded the 403 as a limitation and moved on with search summaries, which was reasonable at the time — but a browser was available the whole session and nobody reached for it. The 403 was a fetch-tool limitation, not an access limitation. When a primary source blocks one tool, try a different tool before accepting a proxy; the difference here was a free plan, a corrected deadline, a missing prerequisite, an unrecognised scoring risk, and $3,800 in prizes.

## Evaluation notes (flywheel)

- Failure modes observed: `browser_snapshot` exceeded the token limit and spilled to a file — handled by reading all 1,507 lines in four chunks rather than summarizing from a partial read. One malformed Edit (a stray `ps` appended to the search string) failed cleanly and was corrected on retry. One Edit against `plan.md` failed on a whitespace mismatch inside a fenced block; resolved by grepping for the exact line first.
- Graders run and results (PASS/FAIL): Full-page read PASS (100%, 4 chunks); official submission checklist captured PASS (9 items across 3 categories); disqualifier list captured PASS (4 items); judging criteria confirmed against spec §13.3 PASS; artifact propagation PASS (6 files updated consistently); no fabricated detail — every claim in `hackathon-brief.md` traces to a quoted line from the snapshot PASS.
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Before writing T068's three real company names into the seed file, run one manual Bright Data query against each candidate to confirm it returns churn-relevant news from the last 90 days. A company with no recent negative coverage makes a dead demo — pick the names from what the data actually returns, not from brand recognition.
