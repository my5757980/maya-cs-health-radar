# Build Prompts — Smart Customer Success Agent

**Feature**: `001-customer-success-agent` | **Date**: 2026-08-06
**Target surface**: native.builder chat (Product Architect + Builder agent)
**Source**: [plan.md](./plan.md) · [tasks.md](./tasks.md) · [data-model.md](./data-model.md) · [contracts/agent-functions.md](./contracts/agent-functions.md)

Copy each block between the `▼` markers verbatim into native.builder chat. Every prompt is
self-contained — the Builder agent has no access to this repository, so each one restates the
context it needs.

> **Why each lettered section contains several prompts.** plan.md §2 sets a credit-protection rule:
> **one screen or one function per prompt, with acceptance criteria stated inside the prompt.** A
> single mega-prompt produces broad rework, and rework is what exhausts credits (R1 — the top
> project risk). The sections below are grouped as you asked; within each, the prompts are sized to
> the rule.
>
> **When a generation comes back wrong: edit and resend the original prompt.** A corrective
> follow-up is a second full generation. An edited resend is not.

| Section | Prompts | Covers tasks | Build day |
|---|---|---|---|
| A — Initial generation | A1–A4 | T004, T010–T023 | D1–D2 |
| B — UI/UX refinement | B1–B2 | T020, T045–T050 | D2, D4 |
| C — AI agents & workflows | C1–C6 | T024–T030, T033–T035, T039–T043 | D3–D4 |
| D — External tools | D1–D2 | T051 + escape-hatch ruling | D1, D4 |
| E — End-to-end testing | E1–E2 | T052–T055 | D4 |
| F — Submission materials | F1–F2 | T057, T060 | D4–D5 |

---

## Preflight — console actions, not prompts

Do these before prompt A1. None of them is a chat message.

1. **T001** — Settings → Plans → upgrade to Builder ($20/mo) or the Lablab Builder plan. **Before the first generation prompt.** The free tier's 50 one-time credits will not finish this build, and generation pauses at zero.
2. **T002** — Settings → Integrations → Supabase → authorize (workspace level).
3. **T003** — Create an empty Supabase project.
4. **T005** — App → Integrations → point this app at that Supabase project and enable agent access.

---

## A. Initial generation

### A1 — Project brief for the Product Architect (T004)

Deliberately scoped: screens, entities, and the workflow. Not the whole spec. A broad brief
produces broad rework.

▼
```
I'm building a B2B SaaS internal tool called "Smart Customer Success Agent". Plan the project
scope before generating code, then wait for my approval.

WHO IT IS FOR
A single Customer Success Manager ("Maya") who owns 60-120 accounts and can only actively manage
about 15 of them per week. Churn is decided in the other 85. She will not write SQL and will not
configure a rules engine.

WHAT IT DOES
It watches every account, scores health from accumulated signals, explains in plain language why
an account is at risk, recommends the next action, drafts the outreach message that executes it,
and routes all of that to Maya for one-click approval.

THE ONE WORKFLOW EVERYTHING SERVES (six steps)
1. A signal is recorded against an account
2. The account's health score is recomputed
3. A risk explanation is generated, citing specific signals
4. A next-best action and a drafted outreach message are produced
5. Maya reviews and approves, edits then approves, or rejects with a reason
6. The decision is written to that account's timeline

SCREENS — exactly four, nothing else
1. Workspace — all accounts ranked most-at-risk first
2. Account Detail — the assessment, the drafted message, and approve / edit / reject controls
3. Account Timeline — a chronological audit stream for one account
4. Add Signal — a modal form for logging a new signal

DATA ENTITIES — seven
accounts, signals, health_snapshots, recommendations, outreach_drafts, decisions, timeline_events

STACK CONSTRAINTS
- Use the Supabase project already linked to this app for all persistence and auth
- Server-side logic goes in Supabase Edge Functions
- The health score MUST be computed by plain deterministic TypeScript in the app — never by an AI
  model. The same signals must always produce the same score. This is non-negotiable: the score has
  to be reproducible and auditable
- AI is used only for generating prose: risk explanations, action recommendations, and outreach
  drafts

EXPLICITLY DO NOT BUILD
- Any login, signup, or password-reset screen (a single demo user is auto-signed-in)
- Any email, SMS, or Slack sending capability of any kind. Approved messages are recorded, never
  transmitted. Do not add an email client, an SMTP config, or an outbound HTTP sender anywhere
- Settings screens, admin panels, user management, billing, onboarding flows, marketing pages
- Search, saved views, dark mode, mobile layouts, or animations
- Any third-party CRM, helpdesk, analytics, or billing integration

Also add a .gitignore covering node_modules/, dist/, build/, .env*, and .DS_Store — this project
will be synced to GitHub.

Give me the project plan first. Do not generate code yet.
```
▲

**Acceptance**: the returned plan names four screens and seven entities, states that scoring is
deterministic TypeScript, and contains no auth screens and no send capability. If it proposes any
of the excluded items, edit and resend A1 rather than correcting in a follow-up.

---

### A2 — Database schema (T010–T013)

▼
```
Create the Supabase schema for this project. Generate the migration and apply it.

ENUMS
signal_type:    support_ticket | usage_drop | login_gap | billing_event | nps_response | feature_adoption
severity:       low | medium | high | critical
signal_source:  seeded | manual
risk_tier:      healthy | watch | critical | stale
rec_status:     pending | approved | edited_approved | rejected | insufficient_signal
cs_action:      schedule_check_in_call | send_reengagement_email | escalate_to_support |
                offer_training_session | executive_sponsor_outreach | flag_for_renewal_risk_review
confidence:     low | medium | high
reject_reason:  wrong_risk_driver | already_handled | wrong_timing | wrong_tone | other
event_type:     signal_received | score_changed | recommendation_generated | decision_made

TABLES

accounts
  id uuid pk, user_id uuid not null references auth.users, name text not null, industry text,
  arr integer not null check (arr > 0), plan_tier text, renewal_date date not null,
  contact_name text not null, contact_role text not null, onboarding_completed_at date,
  current_score integer check (current_score between 0 and 100), current_tier risk_tier,
  dominant_driver signal_type, last_touch_at timestamptz,
  is_demo_data boolean not null default true, created_at timestamptz default now()
  index on (user_id, current_score asc)

signals
  id uuid pk, account_id uuid not null references accounts on delete cascade,
  type signal_type not null, severity severity not null, occurred_at timestamptz not null,
  raw_description text not null, enriched_summary text, source signal_source not null,
  created_at timestamptz default now()
  index on (account_id, occurred_at desc)

health_snapshots
  id uuid pk, account_id uuid not null references accounts on delete cascade,
  computed_at timestamptz default now(), score integer not null check (score between 0 and 100),
  tier risk_tier not null, contributing jsonb not null, dominant_driver signal_type,
  delta_from_previous integer, triggering_signal_id uuid references signals
  index on (account_id, computed_at desc)

recommendations
  id uuid pk, account_id uuid not null references accounts on delete cascade,
  snapshot_id uuid not null references health_snapshots, generated_at timestamptz default now(),
  explanation text, cited_signal_ids uuid[] not null default '{}', action cs_action,
  action_justification text, confidence confidence,
  status rec_status not null default 'pending', model_used text,
  constraint grounding_requires_two_citations check (
    status = 'insufficient_signal' or array_length(cited_signal_ids, 1) >= 2
  )
  Also create: create unique index one_pending_per_account
               on recommendations (account_id) where status = 'pending';

outreach_drafts
  id uuid pk, recommendation_id uuid not null unique references recommendations on delete cascade,
  subject text not null, body text not null, generated_at timestamptz default now(),
  final_text text, was_edited boolean not null default false

decisions
  id uuid pk, recommendation_id uuid not null unique references recommendations on delete cascade,
  decided_by uuid not null references auth.users, decided_at timestamptz default now(),
  outcome rec_status not null, rejection_reason reject_reason, final_message_text text,
  constraint reason_iff_rejected check (
    (outcome = 'rejected' and rejection_reason is not null and final_message_text is null)
    or (outcome in ('approved','edited_approved') and final_message_text is not null)
  )

timeline_events
  id uuid pk, account_id uuid not null references accounts on delete cascade,
  occurred_at timestamptz not null, type event_type not null, ref_id uuid not null,
  summary text not null
  index on (account_id, occurred_at desc)

VIEW
create view v_account_workspace as
select a.id, a.name, a.arr, a.renewal_date, a.current_score, a.current_tier, a.dominant_driver,
       a.last_touch_at, a.is_demo_data,
       exists (select 1 from recommendations r where r.account_id = a.id and r.status = 'pending')
         as has_pending,
       (select count(*) from signals s where s.account_id = a.id) as signal_count
from accounts a;

ROW LEVEL SECURITY — enable on every table
- accounts: all operations where user_id = auth.uid()
- all child tables: scope through account_id -> accounts.user_id = auth.uid()
- signals: grant SELECT and INSERT only. No UPDATE, no DELETE. Signals are immutable evidence and
  the audit trail depends on that

AUTH
Create one demo user maya@demo.invalid and have the app sign in as this user automatically on page
load. Do not build a login screen, a signup screen, or a password reset.

Acceptance: all 9 enums exist; all 7 tables exist with every constraint above; the view and the
partial unique index exist; RLS is enabled on all 7 tables; signals has no UPDATE or DELETE policy.
```
▲

---

### A3 — Deterministic scoring, taxonomy, and seed data (T015–T018)

▼
```
Create two pure logic files and a seed dataset.

FILE 1 — src/lib/scoring.ts
A pure synchronous module. No network calls, no AI calls, no async. Exported function
computeHealth(signals, now) returns { score, tier, dominantDriver, contributing }.

  base_weight = { usage_drop: 15, billing_event: 14, nps_response: 13,
                  support_ticket: 12, login_gap: 10, feature_adoption: 8 }
  severity_mult = { low: 0.5, medium: 1.0, high: 1.75, critical: 2.5 }
  decay(ageDays) = max(0, 1 - ageDays / 90)
  penalty(signal) = base_weight[type] * severity_mult[severity] * decay(ageDays)
  score = clamp(round(100 - sum(penalties)), 0, 100)

  Cap: at most 2 signals of the same type on the same calendar day contribute. Extras are stored
  but score zero.
  tier = score >= 70 ? 'healthy' : score >= 40 ? 'watch' : 'critical'
  Stale rule: if no signal occurred within the last 90 days, tier = 'stale' regardless of score.
  A silent account is not a healthy account.
  dominantDriver = the signal type with the largest summed penalty.
  contributing = array of { signal_id, type, severity, age_days, penalty } — this is what gets
  stored in health_snapshots.contributing so any score is explainable later.

FILE 2 — src/lib/taxonomy.ts
Export the 6 allowed actions and this dominant-driver -> default-action map, used as a fallback
when the AI returns an invalid action:
  support_ticket    -> escalate_to_support
  usage_drop        -> send_reengagement_email
  login_gap         -> send_reengagement_email
  feature_adoption  -> offer_training_session
  billing_event     -> schedule_check_in_call
  nps_response      -> schedule_check_in_call
Override: if tier is 'critical' AND renewal_date is within 90 days, the default is
flag_for_renewal_risk_review regardless of driver.

FILE 3 — src/data/seed-data.json plus a seeding routine that loads it into Supabase
10 fictional accounts. Invent realistic B2B SaaS company names, industries, contacts, and ARR
between $8,000 and $60,000. Every account: is_demo_data = true, source = 'seeded'.

Distribution required:
  - 2 accounts scoring under 40 (critical)
  - 3 accounts scoring 40-69 (watch)
  - 3 accounts scoring 70-100 (healthy)
  - 1 account whose most recent signal is over 90 days old (exercises the stale rule)
  - 1 account with exactly ONE signal (exercises the insufficient-signal state)

Each account gets 4-10 signals across at least 3 different types, with occurred_at spread from
0 to 120 days ago so decay is visibly doing work. Every signal needs a specific raw_description
(a real-sounding event, not "usage went down") and an enriched_summary of 12 words or fewer.

3 of the accounts must also have a prior resolved decision — a recommendation, a draft, and a
decision — so their timelines are not empty.

WORKED EXAMPLE — critical account (verify your generated data behaves like this):
  support_ticket / critical / 4 days ago   -> 12 * 2.5 * 0.956 = 28.7
  usage_drop     / high     / 9 days ago   -> 15 * 1.75 * 0.900 = 23.6
  nps_response   / critical / 15 days ago  -> 13 * 2.5 * 0.833 = 27.1
  login_gap      / medium   / 30 days ago  -> 10 * 1.0 * 0.667 =  6.7
  total 86.1 -> score 14 -> critical

CRITICAL REQUIREMENT — the demo account
Exactly one healthy account must be seeded to score between 71 and 76. Name it distinctively so I
can find it. Use exactly these four signals:
  usage_drop       / medium / 12 days ago -> 15 * 1.0 * 0.867 = 13.0
  feature_adoption / medium / 20 days ago ->  8 * 1.0 * 0.778 =  6.2
  login_gap        / medium / 35 days ago -> 10 * 1.0 * 0.611 =  6.1
  nps_response     / low    / 50 days ago -> 13 * 0.5 * 0.444 =  2.9
  total 28.2 -> score 72 -> healthy
This account is the live demo target: adding one critical support_ticket to it must drop the score
by ~30 points and flip the tier from healthy to watch. Verify it lands at 72 before you finish.

Seeding must also write an initial health_snapshots row and the corresponding timeline_events rows
for every account.

Acceptance: 10 accounts persist; the tier distribution above holds; the demo account scores 71-76;
computeHealth is pure and contains no network or AI call.
```
▲

**Then run T019 yourself**: hand-compute three accounts and confirm they match. If the demo account
is not in 71–76, edit and resend A3 rather than patching the data by hand — the seed file is the
source of truth.

---

### A4 — Workspace screen (T022–T023)

▼
```
Build the Workspace screen at src/pages/Workspace.tsx — the app's home screen and its only entry
point.

DATA: one single query against the v_account_workspace view. Do not query accounts and
recommendations separately, and do not compute anything per row on the client.

SORT: most at risk first — order by current_score ascending. Accounts with tier 'stale' sort
alongside 'watch'.

Build src/components/AccountRow.tsx showing, in one scannable row:
  - Account name, and ARR formatted as $42K
  - Health score 0-100, visually prominent
  - Risk tier badge: critical / watch / healthy / stale
  - The dominant risk driver as one short human phrase, not the raw enum
    (support_ticket -> "Unresolved support issue", usage_drop -> "Usage falling",
     login_gap -> "Gone quiet", billing_event -> "Billing friction",
     nps_response -> "Negative feedback", feature_adoption -> "Low adoption",
     stale -> "No recent signal")
  - Days since last touch, e.g. "Last touched 96 days ago"
  - A clear indicator when has_pending is true — this account has an unreviewed recommendation
  - A small "Demo data" badge when is_demo_data is true

Add a filter control for tier: All / Critical / Watch / Healthy.
Clicking a row opens that account's detail page.

Empty state: if there are no accounts at all, show an explanatory message with a button that runs
the seeding routine. Never render a blank page.

Acceptance: the full seeded book renders in under 3 seconds; the most at-risk account is first;
every row shows score, tier, driver phrase, and last-touch; rows with pending recommendations are
visually distinct.
```
▲

**End of A**: publish (Settings → Publish) and confirm in an incognito window. That is T021's gate —
"works in preview" is not a status.

---

## B. UI/UX refinement

### B1 — Visual system and demo legibility (T020, T049, T050)

Run after A4, once real data is on screen. Refining an empty layout wastes credits.

▼
```
Refine the visual design of this app. Do not add features, do not change data logic, do not add
new screens.

CONTEXT THAT DRIVES EVERY CHOICE: this will be judged from a 3-minute screen-recorded demo, viewed
at 1280x720 and possibly projected. Anything a viewer cannot read in two seconds is not doing its
job.

RISK TIER COLOR SYSTEM — apply consistently everywhere a tier appears:
  critical -> red    watch -> amber    healthy -> green    stale -> slate/grey
Colors must never be the only signal — every tier badge also carries its text label, so the design
survives projector color shift and colorblind viewers.

HIERARCHY on the Workspace screen, in descending prominence:
  1. Health score and tier badge
  2. Account name
  3. Dominant risk driver phrase
  4. ARR and last-touch
Someone glancing for two seconds must come away knowing which account needs attention.

TYPOGRAPHY: minimum 14px body, 16px preferred. Health score at least 24px. No thin weights on
colored backgrounds.

AGENT ATTRIBUTION — required, not decorative: every element written by AI (risk explanation,
action justification, outreach draft) carries a small consistent label such as "AI-generated".
Maya must always know what a machine wrote. Never style AI output to look like human-authored
content.

DEMO DATA BADGE: build src/components/DemoDataBadge.tsx as a small neutral pill reading
"Demo data", and place it on every account row and every account detail header where
is_demo_data is true. This is an honesty requirement — the data is synthetic and the interface
must say so.

LOADING STATES: nothing may sit silent for more than 2 seconds. AI generation can take up to 20
seconds, so it needs a visible, honest progress state that says what is happening
("Analyzing account signals..."), not a bare spinner.

LAYOUT: desktop-first, fixed max width, comfortable density. No dark mode, no animations, no
mobile breakpoints — none of them are being judged and all of them cost time.

Acceptance: all four tier colors are distinguishable at 1280x720; every AI-generated element is
labeled; the demo badge appears wherever demo data does; no text below 14px.
```
▲

### B2 — Edge cases, empty states, and error paths (T045–T048)

Run on D4 after the workflows exist.

▼
```
Add the missing edge-case, empty, and error states across this app. No new features.

1. INSUFFICIENT SIGNAL — when an account has fewer than 2 usable signals, or the AI could not
   ground an explanation in at least 2 signals: show "Insufficient signal — not enough history to
   assess." Show no score, no recommendation, and above all no AI-written explanation. Generating
   prose we cannot ground is worse than showing nothing.

2. STALE ACCOUNT — when tier is 'stale', display "No signal in over 90 days" rather than a health
   verdict. Do not present a silent account as healthy.

3. AI GENERATION FAILURE — if an Edge Function returns an error or times out, show a plain
   sentence ("Couldn't generate a recommendation right now.") plus a Retry button. Any previously
   generated assessment stays visible. Never show a stack trace, an error code, or a blank panel.

4. STALE RECOMMENDATION WARNING — on Account Detail, compare the pending recommendation's
   snapshot_id with the account's most recent health_snapshots row. If they differ, a new signal
   arrived after the recommendation was written: show a warning banner ("New signal received since
   this was generated") with Regenerate and Approve anyway options. Never let Maya silently approve
   reasoning that is out of date.

5. EMPTY BOOK — if there are no accounts, show an explanatory message and a button that runs the
   seeding routine.

6. LONG DRAFT — the outreach draft editor must have a bounded max height and scroll internally.
   A long generated message must never break the page layout.

7. TIMELINE EMPTY — an account with no events yet shows "No activity recorded yet", not a blank
   panel.

Acceptance: every one of the seven states renders a readable human message; no raw error text
appears anywhere in the UI; no state produces a blank screen.
```
▲

---

## C. AI agents and workflows

The core of the product. C2 and C3 are the highest-value prompts in this pack.

### C1 — Store the API key (T024)

▼
```
I need to store an Anthropic API key as a secret for this app's Edge Functions to use. Give me a
masked input for it, store it in Supabase secret storage as ANTHROPIC_API_KEY, and confirm it is
never exposed to the client bundle and never echoed back into this conversation.
```
▲

> Have the correct key on your clipboard first. **Replacing a stored secret has no undo.**

### C2 — The assessment agent (T025)

▼
```
Create a Supabase Edge Function named generate-assessment. This is the core AI capability of the
product.

PURPOSE: given one account and its signals, produce a grounded risk explanation, choose the single
best next action, and draft the outreach message that executes it — all in ONE model call
returning ONE JSON object. Do not split this into multiple calls; total latency must stay under
20 seconds.

MODEL: claude-opus-5 via the Anthropic API, key from Supabase secret storage as ANTHROPIC_API_KEY.
Use structured JSON output. Hard timeout 25 seconds.

REQUEST BODY:
{
  account: { name, industry, arr, plan_tier, renewal_date, contact_name, contact_role,
             onboarding_completed_at, last_touch_at },
  score: number, tier: string, dominant_driver: string,
  signals: [ { id, type, severity, occurred_at, age_days, penalty, raw_description,
               enriched_summary } ],   // the 12 highest-penalty signals only
  taxonomy: [ the 6 allowed action strings ]
}

RESPONSE 200:
{
  status: "assessed",
  explanation: string,             // 2-4 sentences, plain language, written to a CSM
  cited_signal_ids: string[],      // at least 2, drawn ONLY from the signals supplied
  action: string,                  // exactly one value from taxonomy
  action_justification: string,    // one sentence naming the risk driver it addresses
  confidence: "low" | "medium" | "high",
  draft_subject: string,
  draft_body: string,
  model_used: "claude-opus-5"
}
or, when it cannot be grounded:
{ status: "insufficient_signal", reason: "fewer_than_two_groundable_signals" }

PROMPT RULES for the model — these are the product's quality bar:
- The explanation MUST reference at least two specific signals by what they are and when they
  happened ("a P1 export outage open since 2 Aug", "weekly active users down 61% on 28 Jul"), and
  connect them into one coherent story rather than listing them
- NEVER invent a signal, date, dollar figure, person, or event that is not in the supplied context.
  The supplied context is the complete and only source of truth
- The action must be chosen from the taxonomy and must address the dominant risk driver. Do not
  recommend relationship outreach while a P1 ticket is unresolved — fix the problem before asking
  for the meeting
- The draft must read like a specific human who knows this account wrote it. It must reference the
  actual situation. If the draft would still make sense with the company name swapped out, it has
  failed
- Address the draft to contact_name and pitch its register to contact_role
- No marketing language, no "I hope this email finds you well", no filler

Acceptance: a single call returns valid JSON with all fields; the explanation cites 2+ real
signals; the action is in the taxonomy; the draft names something specific about the account;
p50 latency under 17 seconds.
```
▲

### C3 — Server-side validation guardrails (T026)

**The most important prompt in this pack.** It converts prompt instructions into enforced behavior.

▼
```
Add server-side validation to the generate-assessment Edge Function. Apply these checks to the
model's response BEFORE returning it. Prompt instructions are not guarantees — these checks are.

Run in order:

V1 — ACTION IN TAXONOMY
  If `action` is not one of the 6 allowed values: retry the model call ONCE. If it fails again,
  fall back to the dominant-driver default from src/lib/taxonomy.ts and set confidence to "low".
  Never return an action outside the taxonomy.

V2 — AT LEAST TWO CITATIONS
  If cited_signal_ids has fewer than 2 entries: retry ONCE, then return
  { status: "insufficient_signal" }. Never return an explanation with fewer than 2 citations.

V3 — CITATIONS MUST BE REAL  (the anti-fabrication check)
  Every id in cited_signal_ids must appear in the signals array that was supplied in the request.
  If any id is not in that set, the model invented a citation: retry ONCE, then return
  { status: "insufficient_signal" }. Do not return the response with the bad ids filtered out — a
  model that invented one citation cannot be trusted on the surrounding prose either.

V4 — NON-EMPTY OUTPUT
  explanation, draft_subject, and draft_body must all be non-empty. Otherwise retry ONCE, then
  return 502 { error: "model_unavailable" }.

V5 — CONFIDENCE
  If confidence is not low/medium/high, coerce it to "medium".

RETRY POLICY: exactly ONE retry, never two. Two retries would take about 34 seconds and blow the
latency budget.

ERRORS: 502 { error: "model_unavailable" } on API failure; 504 { error: "timeout" } past 25
seconds; 400 { error: "insufficient_context" } when fewer than 2 signals were supplied.

This function must NOT write to the database. It reads context and returns JSON. The client
performs all writes. Do not give it service-role write access to accounts or signals.

Acceptance: forcing a fabricated citation id triggers V3 and returns insufficient_signal; forcing
an invalid action triggers V1 and returns the driver default at low confidence; neither ever
reaches the UI.
```
▲

### C4 — Signal enrichment and the Add Signal modal (T033–T034)

▼
```
Create a second Supabase Edge Function named enrich-signal, plus the Add Signal modal.

EDGE FUNCTION enrich-signal
  Model: claude-sonnet-5 (fast tier — this runs on every manual signal and latency matters).
  Timeout 8 seconds.
  Request:  { account_name, type, severity, raw_description }
  Response: { enriched_summary }  — 12 words or fewer, factual, no adjectives.
            Example: "P1 export outage blocking nightly reconciliation"
  If the model returns something longer, truncate at a word boundary rather than rejecting it.
  On any failure return 502 — the caller will proceed without a summary.

MODAL src/components/AddSignalModal.tsx
  A typed form, not free text: type (6 options), severity (4 options), occurred_at (defaults to
  now), raw_description (textarea). Submit is disabled until type, severity, and description are
  filled.

  On submit: call enrich-signal, then insert the signal with source = 'manual'.

  CRITICAL: if enrich-signal fails or times out, insert the signal anyway with enriched_summary
  null and show no error to the user. The signal is the evidence; the summary is decoration.
  Enrichment failure must never block signal ingestion.

Acceptance: a signal can be added in under 15 seconds; summaries are 12 words or fewer; killing
the enrich-signal endpoint does not prevent signals from being saved.
```
▲

### C5 — The add-signal workflow chain (T035)

The live-demo moment. This is what proves nothing is pre-baked.

▼
```
Wire the full chain that fires when a new signal is added. Every step must be real — no cached
values, no precomputed results.

In order, in one client transaction where possible:

1. INSERT the signal into signals
2. RECOMPUTE the account's health using computeHealth() from src/lib/scoring.ts against ALL of
   that account's signals — recompute from scratch, do not adjust the previous score
3. INSERT a health_snapshots row with: score, tier, the full contributing breakdown,
   dominant_driver, delta_from_previous, and triggering_signal_id = the new signal's id
4. UPDATE the account's denormalized current_score, current_tier, and dominant_driver
5. IF the new tier is 'watch' or 'critical': call generate-assessment with the recomputed context
   and the 12 highest-penalty signals, then INSERT the resulting recommendations row and its
   outreach_drafts row. If a pending recommendation already exists for this account, supersede it
6. INSERT timeline_events rows for each step: signal_received, score_changed, and
   recommendation_generated

Then return the user to the account view showing the updated score and the new assessment.

The Workspace screen must reflect the new ranking position when the user navigates back.

Acceptance: adding a critical support_ticket to the demo account (seeded at score 72) drops the
score by roughly 30 points, flips the tier from healthy to watch, produces a fresh explanation that
cites the newly added signal by date, moves the account up the ranking, and completes within 20
seconds.
```
▲

### C6 — Account Detail, the approval loop, and the timeline (T029–T030, T039–T043)

▼
```
Build the Account Detail screen, the human approval loop, and the Account Timeline screen.

SCREEN src/pages/AccountDetail.tsx
Header: account name, ARR, renewal date, contact, health score, tier badge, demo-data badge.

src/components/AssessmentPanel.tsx shows:
  - the risk explanation, labeled AI-generated
  - the cited signals as a small list, each with its type and date, so the grounding is visible
    rather than merely claimed
  - the recommended action as a readable label, its one-sentence justification, and the confidence
  - a Regenerate control

src/components/DraftEditor.tsx shows:
  - editable subject and body, prefilled from the generated draft
  - three controls: Approve · Approve edited · Reject

  Approve                -> decisions(outcome 'approved'), outreach_drafts.final_text = body,
                            recommendations.status = 'approved', accounts.last_touch_at = now()
  Approve after editing  -> outcome 'edited_approved', was_edited = true, final_text = the EDITED
                            body (never the original), status = 'edited_approved'
  Reject                 -> require a reason from: wrong risk driver / already handled /
                            wrong timing / wrong tone / other. outcome 'rejected',
                            rejection_reason set, final_message_text stays null,
                            status = 'rejected'

  Every one of these three paths also writes a decision_made row to timeline_events.

  ABSOLUTE CONSTRAINT: approving records the decision and the final text. It does NOT send
  anything anywhere. There must be no email client, no SMTP configuration, no outbound HTTP sender,
  and no "send" code path anywhere in this application. The word Approve means recorded, not sent —
  make that unambiguous in the UI copy.

SCREEN src/pages/AccountTimeline.tsx with src/components/TimelineFeed.tsx
A single chronological read from timeline_events for this account, newest first, rendering all four
event types with distinct icons and timestamps:
  signal_received          -> what arrived and how severe
  score_changed            -> old -> new score, and which signal caused it
  recommendation_generated -> which action was proposed
  decision_made            -> approved / edited / rejected, plus the reason when rejected

Someone reading this timeline cold must be able to reconstruct what the agent recommended, what
evidence it used, and what the human decided — without asking a question.

Acceptance: all three decision outcomes are recorded distinctly; edited approvals store the edited
text; rejections require and store a reason; the timeline shows all four event types in correct
chronological order.
```
▲

---

## D. External tools

**Direct answer: there are no third-party product integrations, by design.** The only external
services are the three the architecture already requires — Supabase, the Anthropic API, and GitHub
for backup. Support desk, CRM, analytics, and billing systems are represented as seeded signals
(spec §10). This is a deliberate scope decision that gets stated plainly in the submission rather
than implied away: OAuth flows, webhook reliability, and sandbox provisioning are three of the most
common ways a hackathon team spends two days and ships nothing.

### D0 — Bright Data live web signals (T067, T069, T070) 🆕

**Added 2026-08-06.** Run only after US1 and US2 are green on the deployed URL.
First: claim Bright Data with promo code `aiaccess50` on the lablab event page.

▼
```
Add a live web signal source to this app using Bright Data. Build it in three parts.

PART 1 — SECRET
Give me a masked input to store BRIGHTDATA_API_TOKEN in Supabase secret storage. It must never
reach the client bundle.

PART 2 — EDGE FUNCTION fetch-external-signals
  Request:  { account_id, company_name }
  Behavior:
    a) Use Bright Data to retrieve recent public news about company_name from roughly the last
       90 days. Bright Data's MCP is token-only auth — no proxy or username config needed. Scope
       the tools you request to keep the payload small.
    b) Pass each result to claude-sonnet-5 and classify it as:
       {
         is_churn_relevant: boolean,
         severity: "low" | "medium" | "high" | "critical",
         one_phrase_summary: string   // 12 words max
       }
       Churn-relevant means it would make a Customer Success Manager worry about this account
       renewing: layoffs, funding trouble, an acquisition, a CTO or champion departure, a
       security incident, sustained negative press.
       NOT churn-relevant: product launches, awards, routine hiring, marketing announcements,
       conference talks.
    c) Return ONLY the churn-relevant hits, at most 3, newest first. Each with its source URL and
       publication date.

  CRITICAL: discard everything that is not churn-relevant. A web scan that surfaces a product
  launch as a "risk signal" is worse than no web scan — it destroys trust in every other signal
  the product shows.

  Timeout 20 seconds. On failure return 502; the caller shows a retry and the account stays usable.

PART 3 — UI
  Add a "Scan web signals" button to the Account Detail page.
  On click: call fetch-external-signals, then insert each returned hit as a signal with
    type = 'external_event', source = 'bright_data', severity from the classifier,
    occurred_at = the article's publication date,
    raw_description = the headline plus the source URL,
    enriched_summary = one_phrase_summary

  Then reuse the EXISTING add-signal chain exactly as it already works — recompute the score,
  write a health_snapshots row, update the account, regenerate the assessment if the tier is watch
  or critical, and write timeline_events. Do not create a second write path.

  If no churn-relevant news is found, show "No external risk signals found" — do not show an
  error, and do not invent a signal.

Acceptance: clicking the button on a real-company demo account returns at least one genuine recent
news item; it becomes a visible signal in the timeline with its date and source; the score changes;
and the regenerated explanation cites it alongside a product-side signal.
```
▲

> **Note on the demo:** this only works on the 3 accounts named after real public companies
> (T068). On fictional accounts the scan will correctly return nothing.

### D1 — Backup to GitHub (T051)

Console action, not a prompt: Settings → Integrations → GitHub → authorize → Sync. Then Files →
download the project zip. Two independent copies outside the platform, which is what makes the
credit risk (R1) survivable.

### D2 — Fallback if Anthropic access is blocked (contingency only)

Do not run this unless direct Anthropic access fails. Pre-written so it is never a decision made
under deadline pressure.

▼
```
Switch both Edge Functions (generate-assessment and enrich-signal) from calling the Anthropic API
directly to calling OpenRouter, using the OpenRouter key already connected to this workspace.

Map the models: claude-opus-5 -> anthropic/claude-opus-5, claude-sonnet-5 -> anthropic/claude-sonnet-5.

Change nothing else. All request/response shapes, all validation logic (V1-V5), the one-retry
policy, and the timeouts stay exactly as they are. Keep model_used reporting the underlying
Anthropic model id.
```
▲

---

## E. Full end-to-end testing

### E1 — Self-audit before manual verification (T053)

Cheaper to have the agent find these than to find them yourself on D4.

▼
```
Audit this application against the following requirements and report every failure with the file
and line. Fix what you find, then re-report. Do not add features.

GROUNDING
1. Can a risk explanation ever render with fewer than 2 cited signals? Trace every path.
2. Are cited signal ids always validated against the supplied context before display?
3. Does the insufficient-signal state render instead of prose whenever grounding fails?

SAFETY
4. Search the entire codebase for any outbound send capability — email client, SMTP config, fetch
   or axios call to a mail/SMS/webhook provider, anything named send/deliver/dispatch/notify.
   There must be ZERO. Report anything you find.
5. Is ANTHROPIC_API_KEY referenced anywhere outside the Edge Functions? It must never appear in the
   client bundle.
6. Can either Edge Function write to accounts or signals? It must not.

DETERMINISM
7. Does computeHealth() contain any network call, AI call, random value, or non-injected clock
   read? It must be pure.
8. Calling computeHealth twice with identical input must return byte-identical output.

DATA INTEGRITY
9. Is there any code path that UPDATEs or DELETEs a signal? There must be none.
10. Does every mutation — signal insert, snapshot insert, recommendation insert, decision insert —
    also write its timeline_events row? Find any that does not.
11. Can two pending recommendations exist for one account at once?

ERROR PATHS
12. Trace every Edge Function failure to what the user actually sees. Report any path ending in a
    raw error, a blank panel, or a silent failure.

Report as a table: requirement number, PASS/FAIL, file:line, and what you changed.
```
▲

### E2 — Manual run book (T052, T054, T055)

Written to `docs/runbook.md` and executed by you, not by the agent — the gate only means something
if a human runs it against the deployed URL. Full script in [quickstart.md](./quickstart.md)
§ Verification run book. Summary of the gates:

| § | Test | Gate |
|---|---|---|
| 1 | Cold start in a fresh incognito window → first grounded recommendation | **< 60s** |
| 2 | Flow 2: open → read → edit → approve → verify timeline | **≤ 90s, 0 errors** |
| 3 | Contract tests C1–C8 from contracts/agent-functions.md §4 | All pass |
| 4 | Flow 3: inject critical signal into the demo account | Tier flips, re-ranks, new citation, **< 20s** |
| 5 | Generate 10 assessments, review every one | **10/10** grounded, **0** fabrications |
| 6 | Invalidate the API key, retry, restore | Human-readable error, clean recovery |
| 7 | Publish state and clean-session load | No stale indicator |

**§2 and §5 are the hard gates.** Ten consecutive clean passes of the full script is NFR-6 /
SC-004. Record everything measured in `docs/metrics.md` — Constitution Principle VII means no claim
ships without a measurement behind it.

---

## F. Submission materials

### F1 — Demo video script (T057)

Record on **D4, not D5**. A working app with no video is an invalid submission — this is R8, and it
is the most common way teams lose work that was actually finished. Record against the live public
URL, never a local build.

**Total: 3:00.**

| Time | Beat | On screen | Say |
|---|---|---|---|
| 0:00–0:30 | **The problem** | Workspace, scrolled to show the full book | "A customer success manager owns about a hundred accounts. In a normal week she can actively manage fifteen. Churn is decided in the other eighty-five — and it's usually visible months before anyone notices. Every signal is already there. Nobody has time to read them." |
| 0:30–0:50 | **Triage** | Workspace ranked by risk | "This is Maya's entire book, ranked by risk. Not by renewal date — by what the signals actually say. Top of the list: [account], health 14, unresolved support issue, last touched 96 days ago." |
| 0:50–1:30 | **The assessment** | Account Detail, scroll the explanation and cited signals | "The agent explains why — and it cites the specific evidence: this P1 ticket from the second, this 61% usage drop from the twenty-eighth. It picks the next action from a fixed set of six, and it says which risk that action addresses. Then it drafts the actual message. Not a template — it references their specific outage." |
| 1:30–1:50 | **The human decides** | Edit a sentence, approve, land on the timeline | "Maya edits a line and approves. That's the whole loop. Nothing is ever sent automatically — the approval records the decision and the final text, and it lands on the account timeline with everything that led to it." |
| 1:50–2:20 | **Proof it's live** ⭐ | Open a *healthy* account, add a critical signal, watch it recompute | "This account is healthy right now — 72. Watch. I'm logging a new P1 ticket. Score drops to 42, tier flips to watch, and the agent regenerates — citing the ticket I just created, seconds ago. None of this is pre-recorded." |
| 2:20–3:00 | **How it was built** | Split: the app and the native.builder project | "Built with native.builder. Its agents generated the React app, the Postgres schema, and both Supabase Edge Functions from a written brief — and it's deployed at this public URL. One deliberate design choice: the health score is plain deterministic code, never AI, so it's reproducible and auditable. The model does what only a model can — reading heterogeneous signals into a story, and writing the message. Assessing one account drops from about twenty minutes to under thirty seconds." |

**Recording rules:** live URL in the address bar the entire time · no slides · no cuts during the
1:50–2:20 injection beat, because an unbroken take is the whole point · if a take fails, keep the
best complete pass rather than assembling a perfect one from fragments.

### F2 — Submission text (T060)

▼
```
Write the hackathon submission text for this project. Requirements:

PROJECT NAME: Smart Customer Success Agent
PUBLIC URL: [paste the live *.nativelyai.app URL]

MUST INCLUDE, each stated concretely:

1. THE PROBLEM, quantified — a CSM owns 60-120 accounts and can actively manage about 15 per week;
   churn is decided in the other 85. Three compounding failures: signals fragmented across four
   tools (~20 min to assemble one account's picture), detection driven by renewal dates instead of
   signals, and knowing not being the same as acting (15-25 min to write a credible outreach).

2. THE TARGET USER, named and specific — an individual-contributor CSM at a 30-150 person B2B SaaS
   company, $8k-$60k ACV accounts, compensated partly on renewals. Not enterprise CSMs with named
   account teams, not support agents, not VP-level reporting.

3. THE COMPLETE WORKFLOW, all six steps — signal recorded, health recomputed, grounded risk
   explanation generated, action recommended and message drafted, human approves or rejects,
   decision written to the account timeline.

4. HOW NATIVE.BUILDER WAS USED — three concrete sentences, no vagueness:
   "native.builder's Product Architect planned the project from a written brief covering four
   screens, seven entities, and a six-step workflow. Its Builder agent generated the React
   application, the full Postgres schema with row-level security, and both Supabase Edge Functions
   that call Claude — I iterated screen by screen in chat and inspected everything in the code tab.
   The app is deployed from native.builder to a public URL, and the entire product was built inside
   the platform with no external build tooling."

5. THE DESIGN DECISION WORTH EXPLAINING — the health score is computed by deterministic TypeScript,
   never by a model, so it is reproducible and auditable and you can verify cause and effect live.
   The model is used only where it beats rules: reading heterogeneous signals into a coherent
   narrative, choosing a fitting action, and writing the message. State that AI output is grounded —
   every explanation cites at least two specific signals, validated server-side against the actual
   account record, and generation is bounded to a fixed six-action taxonomy.

6. THE HUMAN-IN-THE-LOOP BOUNDARY — nothing is ever sent automatically. Approval records the
   decision and the final text. There is no outbound send capability anywhere in the codebase.

7. BUSINESS VALUE WITH ITS DERIVATION SHOWN, not asserted — assessing one account's risk drops from
   roughly 20 minutes of manual cross-tool assembly to under 30 seconds. State the assumption
   behind the 20-minute baseline. Do not claim a churn-reduction percentage; we have not measured
   one and inventing it would undercut everything else.

8. HONEST SCOPE — third-party systems (helpdesk, CRM, analytics, billing) are represented as seeded
   signals rather than live integrations. The signal abstraction is the real interface; connectors
   are adapters behind it. Say this plainly.

TONE: specific and measured. No superlatives, no "revolutionary", no invented metrics. Every claim
must be something a judge can verify by opening the URL.
```
▲

---

## Prompt-to-task coverage

| Prompt | Tasks |
|---|---|
| Preflight | T001, T002, T003, T005 |
| A1 | T004 |
| A2 | T010, T011, T012, T013, T014 |
| A3 | T015, T016, T017, T018 |
| A4 | T022, T023 |
| B1 | T020, T049, T050 |
| B2 | T045, T046, T047, T048 |
| C1 | T024 |
| C2 | T025 |
| C3 | T026 |
| C4 | T033, T034 |
| C5 | T035 |
| C6 | T029, T030, T039, T040, T042, T043 |
| D1 | T051 |
| E1 | supports T053 |
| E2 | T052, T053, T054, T055 |
| F1 | T057 |
| F2 | T060 |

**Not covered by a prompt — these are yours to perform**: T006 and T021 (publish + incognito
verify), T007–T008 (D1 latency probe), T009 (docs skeletons), T019 (hand-verify three scores),
T031 (pre-generate seeded assessments), T032/T036/T037/T038/T041/T044 (verification steps),
T056 (record metrics), T058 (feature freeze), T059 (escape-hatch audit), T061–T063 (final publish,
Tier-1 check, submit).
