# Submission — copy-paste ready

**Submit at:** https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits
**Deadline:** 2026-08-10, 8:00 PM Pakistan Standard Time

---

## 1. Project name

```
Maya — CS Health Radar
```

## 2. Application URL

```
https://eonhw2qcm2ajxbmcp3jdtvopw.nativelyai.app
```

## 3. native.builder project URL

```
https://builder.nativelyai.com/projects/f80b3aa4-eaf2-4876-8215-e4b04bca0fe4
```

## 4. Short description (one paragraph)

```
Maya — CS Health Radar is an always-on teammate for Customer Success Managers. A CSM owns
60–120 accounts and can actively manage about 15 in a given week; churn is decided in the
other 85. Maya watches every account, scores health deterministically from accumulated
signals, explains in plain language exactly why an account is at risk — citing the specific
evidence with dates — then recommends the next action and drafts the outreach message that
executes it. The CSM approves, edits, or rejects with a reason, and the decision is written
to the account timeline. Nothing is ever sent automatically.
```

## 5. The problem

```
A Customer Success Manager carrying 60–120 accounts can actively manage about 15 of them in
a given week. Churn is decided in the other 85.

Three failures compound:

1. Signals are fragmented. Health evidence sits across the support inbox, product analytics,
   CRM notes and billing. Assembling one account's picture manually takes roughly 20 minutes
   — about 33 hours to sweep a 100-account book once.

2. Detection is calendar-driven, not signal-driven. Risk gets discovered when a renewal date
   approaches, so a problem with a five-month runway gets a 30-day response window.

3. Knowing is not acting. Even once risk is identified, writing a credible, context-specific
   outreach takes 15–25 minutes. At the end of a reactive day, the at-risk account gets a
   generic check-in — or nothing.

Maya attacks the distance between "a signal exists" and "a human acts on it".
```

## 6. Target user

```
An individual-contributor Customer Success Manager at a growth-stage B2B SaaS company —
30–150 employees, $3M–$20M ARR. Accounts are $8k–$60k ACV: too small for a named account
team, too large to ignore. She owns 60–120 accounts, reports on Net Revenue Retention, and
is compensated partly on renewals, so churn is personally expensive. She is fluent in SaaS
tools but will not write SQL and will not configure a rules engine.

Explicitly not for: enterprise CSMs with named account teams, support agents, VP-level
portfolio reporting, or PLG companies with no CSM function.
```

## 7. How native.builder was used

```
native.builder's Product Architect planned the project from a written brief covering four
screens, seven data entities and a six-step workflow, and interrogated it with clarifying
questions before any code was generated. Its Builder agent then generated the entire
application — the React front end, the full Postgres schema with row-level security, the
seed dataset, and three Supabase Edge Functions that call Claude — while its QA agent
independently verified the build and caught two real defects, including a broken demo-user
auth path that was silently returning zero rows through RLS. Every screen was iterated in
chat, inspected in the code tab, and the finished app was deployed from native.builder to
its public URL with no external build tooling.
```

## 8. External APIs, datasets and tools used

```
- native.builder (NativelyAI) — build surface, agent orchestration, hosting and deployment
- Supabase — Postgres, Auth, Edge Functions, Secrets Manager
- AI/ML API — model gateway
    anthropic/claude-opus-5   — risk explanation, action selection, outreach drafting
                                (one combined structured JSON call)
    anthropic/claude-sonnet-5 — signal enrichment summaries
- Datasets: none. All 10 demo accounts are fictional and labelled as demo data in the UI.
  No real customer data is used.
```

## 9. What makes it different

```
Most customer-success tooling outputs a score and stops — the CSM still has to do the
thinking and the writing. Maya closes the know→act gap: it delivers the drafted action, not
the number.

The health score is computed by deterministic TypeScript, never by a model:

  penalty(signal) = base_weight[type] × severity_mult[severity] × decay(ageDays)
  decay(ageDays)  = max(0, 1 − ageDays/90)
  score           = clamp(round(100 − Σ penalty), 0, 100)
  tier            = ≥70 healthy · ≥40 watch · else critical
                    (no signal in 90 days ⇒ stale, regardless of score)

The same signals always produce the same score, so cause and effect can be verified live
rather than taken on trust — every account page shows the full per-signal penalty breakdown
that produced its number. The model is used only where it genuinely beats rules: reading
heterogeneous signals into a coherent narrative, choosing a fitting action, and writing the
message.

Grounding is enforced in code and schema, not in the prompt:
- Every explanation must cite at least 2 real signals — a Postgres CHECK constraint makes an
  ungrounded recommendation impossible to save.
- Returned citation ids are validated server-side as a subset of the context actually
  supplied. An invented citation is rejected outright, not filtered out — a model that
  fabricated one citation cannot be trusted on the surrounding prose either.
- Actions are bounded to a six-value Postgres enum. Out-of-taxonomy output retries once, then
  falls back to the dominant driver's default at low confidence.
- The signals table grants SELECT and INSERT only. Evidence is immutable, which is what makes
  the audit timeline trustworthy.

And there is a hard human boundary: approving records the decision and the final message
text. There is no email client, no SMTP configuration and no outbound sender anywhere in the
codebase — the guarantee is enforced by absence, not by a flag. The UI says so plainly:
"Nothing is ever sent."
```

## 10. Business value

```
Assessing one account's risk drops from roughly 20 minutes of manual cross-tool assembly to
under 30 seconds.

Derivation and assumption stated plainly: the 20-minute baseline is the time to open four
tools (support inbox, product analytics, CRM, billing), read recent history, and form a
judgement. Maya replaces that with a single ranked view plus a grounded explanation. We are
not claiming a measured churn-reduction percentage — we have not run the experiment that
would justify one.

The human-approval boundary is what makes it deployable in a real CS organisation on day one:
the agent never acts on a customer without a person signing off.
```

---

## Demo video — auto-recorded

A captioned walkthrough is being recorded straight off the **live public URL** via Playwright, with
the captions burned into the frame. It lands in:

```
E:\New folder\lablab.ai-hackathone\video\
```

Format is **.webm**, roughly 2:30. Most upload forms accept webm; if the lablab form refuses it,
convert at https://cloudconvert.com/webm-to-mp4 (no signup needed) or open it in VLC →
Media → Convert/Save.

**What it shows, in order:** the ranked book → Blue Ridge Partners at 27/critical → the deterministic
penalty breakdown → the grounded AI explanation → the cited signals → the recommended action →
the drafted message → then the live injection on Acme Dashboard, 72 → 42, healthy → watch, with the
agent regenerating against a ticket created seconds earlier.

There is **no audio** — captions carry the whole narrative, which is what was asked for.

> If you would rather record it yourself with a voiceover, the manual script is below. A live
> human-narrated take is stronger than an automated one; this exists so a video ships either way.

---

## Manual demo video script — 3:00 (optional alternative)

Record against the **live public URL**, address bar visible throughout. No slides.

| Time | On screen | Say |
|---|---|---|
| **0:00–0:30** | Workspace, full book visible | "A customer success manager owns about a hundred accounts. In a normal week she can actively manage fifteen. Churn is decided in the other eighty-five — and it's usually visible months before anyone notices. Every signal is already there. Nobody has time to read them." |
| **0:30–0:50** | Workspace ranked by risk | "This is Maya's entire book, ranked by risk — not by renewal date, by what the signals actually say. Ten accounts, five need attention. Top of the list: Blue Ridge Partners, health twenty-seven, critical." |
| **0:50–1:35** | Blue Ridge detail — scroll the explanation and cited signals | "The agent explains why, and it cites the specific evidence: a low NPS response twelve days ago, a usage drop at eight days, a high-severity support ticket at four days, and a critical payment issue two days old. It reads that as one compounding escalation — a pre-churn trajectory, not four isolated incidents. Below it, every signal it cited, with dates and the exact penalty each contributed to the score of twenty-seven." |
| **1:35–2:00** | Recommended action + draft, then approve | "It picks executive sponsor outreach and says why — a commercial-level problem a standard check-in can't resolve. Then it drafts the actual message. Maya edits a line and approves. Nothing is ever sent: the approval records the decision and the final text, and it lands on the account timeline." |
| **2:00–2:25** | ⭐ **Acme Dashboard (72, healthy) → Add Signal → critical support ticket** | "This account is healthy right now — seventy-two. Watch. I'm logging a new critical support ticket. Score drops to forty-two, tier flips to watch, it moves up the ranking, and the agent regenerates — citing the ticket I created seconds ago. None of this is pre-recorded." |
| **2:25–3:00** | Split: the app, then the native.builder project | "Built with native.builder. Its Product Architect planned it from a written brief, its Builder agent generated the React app, the Postgres schema with row-level security, and three Supabase Edge Functions calling Claude, and its QA agent caught two real bugs along the way. One deliberate design choice: the health score is plain deterministic code, never AI — so it's reproducible and auditable, and you just watched me verify it. The model does what only a model can: reading heterogeneous signals into a story, and writing the message. Assessing one account drops from about twenty minutes to under thirty seconds." |

**Rules:** live URL in the address bar the whole time · **no cut during 2:00–2:25** — the unbroken
take is the entire point · if a take fails, keep the best complete pass rather than assembling a
perfect one from fragments.

---

## Pre-submit checklist

- [ ] All three fixes landed (UUID leak, Blue Ridge reset to pending, trailing-slash route)
- [ ] Project renamed to "Maya — CS Health Radar"
- [ ] **Re-published** after the fixes
- [ ] Live URL loads in a **fresh incognito window** — no cached auth
- [ ] Blue Ridge Partners shows Approve / Approve edited / Reject
- [ ] No database id appears anywhere in user-visible prose
- [ ] Flow 3 rehearsed once: Acme Dashboard 72 → add critical support ticket → 42 / watch
- [ ] Demo video recorded, ≤ 3:00
- [ ] Submitted with buffer before 8:00 PM PKT
