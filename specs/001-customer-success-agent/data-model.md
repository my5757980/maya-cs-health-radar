# Phase 1 Data Model — Smart Customer Success Agent

**Feature**: `001-customer-success-agent` | **Date**: 2026-08-06
**Store**: Supabase Postgres | **Access**: `supabase-js` from the client, RLS-scoped to the demo user

Derived from spec §9. All 7 entities plus one view. Signals are append-only; snapshots are an audit
log; `timeline_events` is a write-time projection.

---

## Enums

```sql
create type signal_type    as enum ('support_ticket','usage_drop','login_gap',
                                    'billing_event','nps_response','feature_adoption',
                                    'external_event');           -- ADDED 2026-08-06
create type severity       as enum ('low','medium','high','critical');
create type signal_source  as enum ('seeded','manual','bright_data');   -- ADDED 2026-08-06
create type risk_tier      as enum ('healthy','watch','critical','stale');
create type rec_status     as enum ('pending','approved','edited_approved','rejected',
                                    'insufficient_signal');
create type cs_action      as enum ('schedule_check_in_call','send_reengagement_email',
                                    'escalate_to_support','offer_training_session',
                                    'executive_sponsor_outreach','flag_for_renewal_risk_review');
create type confidence     as enum ('low','medium','high');
create type reject_reason  as enum ('wrong_risk_driver','already_handled','wrong_timing',
                                    'wrong_tone','other');
create type event_type     as enum ('signal_received','score_changed',
                                    'recommendation_generated','decision_made');
```

`cs_action` as a Postgres enum is the **database-level enforcement of the bounded taxonomy** (spec
§8.4). An out-of-taxonomy value cannot be persisted even if the Edge Function's own guard were
bypassed — two independent layers, which is what "bounded" should mean.

---

## Tables

### `accounts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid not null → `auth.users` | RLS scope |
| `name` | text not null | Fictional company |
| `industry` | text | |
| `arr` | integer not null | USD, whole dollars |
| `plan_tier` | text | |
| `renewal_date` | date not null | Drives `flag_for_renewal_risk_review` (< 90 days) |
| `contact_name` | text not null | |
| `contact_role` | text not null | Used by A4 for drafting register |
| `onboarding_completed_at` | date | Null ⇒ onboarding never finished, feeds `offer_training_session` |
| `current_score` | integer | Denormalized from latest snapshot for fast list render (NFR-3) |
| `current_tier` | risk_tier | Denormalized |
| `dominant_driver` | signal_type | Denormalized |
| `last_touch_at` | timestamptz | Most recent approved decision (spec Assumption 7) |
| `is_demo_data` | boolean not null default true | Drives the CF-9 badge |
| `created_at` | timestamptz default now() | |

**Validation**: `arr > 0`; `current_score` between 0 and 100 when not null.
**Index**: `(user_id, current_score asc)` — the workspace sort.

---

### `signals` — append-only
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` | uuid not null → `accounts` on delete cascade | |
| `type` | signal_type not null | |
| `severity` | severity not null | |
| `occurred_at` | timestamptz not null | Drives decay; **not** `created_at` |
| `raw_description` | text not null | What actually happened |
| `enriched_summary` | text | ≤ 12 words. Authored at seed time, or produced by A1 on manual injection |
| `source` | signal_source not null | `manual` marks the Flow 3 injection |
| `created_at` | timestamptz default now() | |

**Invariant**: no `UPDATE` and no `DELETE` from application code. Signals are evidence; the
timeline is only trustworthy if evidence is immutable. Enforced by RLS granting `select, insert`
only.
**Index**: `(account_id, occurred_at desc)`.

---

### `health_snapshots` — audit log, not a cache
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` | uuid not null → `accounts` | |
| `computed_at` | timestamptz default now() | |
| `score` | integer not null | 0–100 |
| `tier` | risk_tier not null | |
| `contributing` | jsonb not null | `[{signal_id, type, severity, age_days, penalty}]` — this is the answer to "why is it 34?" |
| `dominant_driver` | signal_type | |
| `delta_from_previous` | integer | Null on first snapshot |
| `triggering_signal_id` | uuid → `signals` | Null for the initial seed computation |

**Validation**: `score` between 0 and 100. Rows are never updated.
**Index**: `(account_id, computed_at desc)`.

---

### `recommendations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` | uuid not null → `accounts` | |
| `snapshot_id` | uuid not null → `health_snapshots` | **The staleness key** — see E7 below |
| `generated_at` | timestamptz default now() | |
| `explanation` | text | Null when `status = insufficient_signal` |
| `cited_signal_ids` | uuid[] not null default '{}' | |
| `action` | cs_action | Null when `insufficient_signal` |
| `action_justification` | text | |
| `confidence` | confidence | |
| `status` | rec_status not null default 'pending' | |
| `model_used` | text | e.g. `claude-opus-5` — attribution for S4 |

**Validation (G1, enforced in DB):**
```sql
constraint grounding_requires_two_citations check (
  status = 'insufficient_signal' or array_length(cited_signal_ids, 1) >= 2
)
```
This is the grounding rule as a database constraint. An ungrounded recommendation cannot be
persisted, which makes SC-003 structurally true rather than merely intended.

**Partial unique index** — at most one open recommendation per account:
```sql
create unique index one_pending_per_account
  on recommendations (account_id) where status = 'pending';
```

---

### `outreach_drafts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recommendation_id` | uuid not null unique → `recommendations` on delete cascade | 1—1 |
| `subject` | text not null | |
| `body` | text not null | |
| `generated_at` | timestamptz default now() | |
| `final_text` | text | Populated on approval; the edited version if edited |
| `was_edited` | boolean not null default false | |

---

### `decisions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recommendation_id` | uuid not null unique → `recommendations` | 1—1, once resolved |
| `decided_by` | uuid not null → `auth.users` | |
| `decided_at` | timestamptz default now() | |
| `outcome` | rec_status not null | One of `approved` / `edited_approved` / `rejected` |
| `rejection_reason` | reject_reason | Required iff `outcome = 'rejected'` |
| `final_message_text` | text | Null iff rejected |

**Validation:**
```sql
constraint reason_iff_rejected check (
  (outcome = 'rejected' and rejection_reason is not null and final_message_text is null)
  or (outcome in ('approved','edited_approved') and final_message_text is not null)
)
```

---

### `timeline_events` — write-time projection
| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` | uuid not null → `accounts` on delete cascade | |
| `occurred_at` | timestamptz not null | |
| `type` | event_type not null | |
| `ref_id` | uuid not null | Points at the source row |
| `summary` | text not null | Pre-rendered display string |

**Index**: `(account_id, occurred_at desc)` — the timeline screen is one indexed read.
Written in the same client transaction as every signal insert, snapshot insert, recommendation
insert, and decision insert.

---

### `v_account_workspace` — the Workspace screen's single query

```sql
create view v_account_workspace as
select a.id, a.name, a.arr, a.renewal_date, a.current_score, a.current_tier,
       a.dominant_driver, a.last_touch_at, a.is_demo_data,
       exists (select 1 from recommendations r
               where r.account_id = a.id and r.status = 'pending') as has_pending,
       (select count(*) from signals s where s.account_id = a.id) as signal_count
from accounts a;
```
Ordered client-side by `current_score asc` (most at risk first), `stale` sorted alongside `watch`.

---

## Relationships

```text
auth.users (demo CSM) 1—N accounts
accounts 1—N signals                      (append-only)
accounts 1—N health_snapshots             (signal insert → new snapshot)
health_snapshots 1—1 recommendations      (only for watch/critical tiers)
recommendations 1—1 outreach_drafts
recommendations 1—1 decisions             (once resolved)
accounts 1—N timeline_events              (projection over the four above)
```

---

## State transitions — `recommendations.status`

```text
                    ┌──────────────────────┐
   generate ───────▶│ insufficient_signal  │  (< 2 groundable signals — E1/E2, terminal)
        │           └──────────────────────┘
        │
        └──────────▶┌─────────┐──── approve ────────▶ approved          (terminal)
                    │ pending │──── edit+approve ───▶ edited_approved   (terminal)
                    └─────────┘──── reject ─────────▶ rejected          (terminal)
                         │
                         └──── new signal arrives ──▶ stale-flagged (E7)
                              (status stays pending; UI warns and offers regenerate)
```

**E7 staleness rule** — a `pending` recommendation is stale when:
`recommendations.snapshot_id ≠ (latest health_snapshots.id for that account)`.
The Account Detail screen checks this before enabling Approve, and offers regenerate-or-proceed.
Silently approving against outdated reasoning is the failure this rule exists to prevent.

---

## Validation rules mapped to requirements

| Rule | Enforced where | Requirement |
|---|---|---|
| Score is 0–100 and deterministic | `scoring.ts` (pure) + CHECK constraint | FR-002 |
| Tier boundaries 70 / 40 | `scoring.ts` | FR-003 |
| ≥ 2 cited signals or `insufficient_signal` | DB CHECK constraint + Edge Function guard | FR-006, FR-007, SC-003 |
| Action within the 6-item taxonomy | `cs_action` enum + Edge Function guard | FR-008, FR-017 |
| Cited IDs must exist in supplied context | Edge Function subset validation | G1b, G4 |
| Rejection requires a reason | DB CHECK constraint | FR-010, FR-012 |
| One open recommendation per account | Partial unique index | Workflow integrity |
| Signals immutable | RLS grants `select, insert` only | Timeline trustworthiness |
| Demo data labeled | `is_demo_data` column | FR-015, CF-9 |
| Stale ≠ healthy | `scoring.ts` tier logic | E5 |
| No external transmission | **No table, column, or function models an outbound send** | FR-011, S1 |

---

## RLS

Every table: `using (user_id = auth.uid())` on `accounts`; child tables join through
`account_id → accounts.user_id`. `signals` grants `select, insert` only — no update, no delete.
Edge Functions hold **no service-role write access** to `accounts` or `signals`: they read context
and return JSON; the client performs the write (spec boundary S2).

---

## Seed dataset requirement

- **8–12 accounts** spanning all tiers: ≥ 2 critical, ≥ 3 watch, ≥ 3 healthy, ≥ 1 stale (exercises E5).
- **4–10 signals per account**, ≥ 3 distinct types each, `occurred_at` spread across 0–120 days so decay is visibly doing work.
- **≥ 3 accounts with prior resolved decisions** so timelines are not empty on camera.
- **≥ 1 account with a single signal** — exercises E1 insufficient-signal.
- **Exactly 1 injection-target account seeded to score 71–76** so one injected `critical` `support_ticket` (−30) produces a visible Healthy→Watch tier change and re-rank during Flow 3. Without this the demo's strongest moment lands flat.
- `is_demo_data = true` everywhere (NFR-10).

### AMENDED 2026-08-06 — account naming, for the Bright Data lookup

The original rule was "all names fictional." That makes the Bright Data `external_event` lookup
(added per [hackathon-brief.md](./hackathon-brief.md) §7) useless — searching the live web for
"Northwind Logistics" returns nothing, and a demo where the web scan finds nothing is worse than
no web scan at all.

**Revised rule:**

| Accounts | Naming | Why |
|---|---|---|
| **3 accounts** | Real, well-known **public** B2B SaaS company names | So the Bright Data lookup returns genuine recent news on camera. **One of these must be the Flow 3 injection target.** |
| **7 accounts** | Fictional, as before | Bulk of the book |

**This does not violate NFR-10.** That requirement forbids real *customer* identities — our
customers' private data. A publicly traded or widely covered company's name, used to label a
fictional account, with only public news attached, is not private customer data. Every account
still carries `is_demo_data = true` and the demo badge.

**What stays fictional on those 3 accounts:** every CSM-side signal — support tickets, usage
drops, login gaps, billing events, NPS. Only `external_event` signals carry real public
information, and only from Bright Data.

**State this in the submission text.** Explaining the choice is stronger than letting a judge
wonder about it.
