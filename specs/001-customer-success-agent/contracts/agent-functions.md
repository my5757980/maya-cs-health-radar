# Phase 1 Contracts — Supabase Edge Functions

**Feature**: `001-customer-success-agent` | **Date**: 2026-08-06

Two functions. Both are invoked from the client via `supabase.functions.invoke()` with the user's
JWT. Neither holds service-role write access to `accounts` or `signals` — they read context and
return JSON; **the client performs every write** (spec boundary S2).

`ANTHROPIC_API_KEY` is read from Supabase secret storage inside the function. It never reaches the
browser bundle.

---

## 1. `POST /functions/v1/enrich-signal`

Spec capability **A1**. Fired only on manual signal injection; seeded signals are pre-enriched at
authoring time.

**Model**: `claude-sonnet-5` · **Budget**: ≤ 3s · **Timeout**: 8s

### Request
```json
{
  "account_name": "Northwind Logistics",
  "type": "support_ticket",
  "severity": "critical",
  "raw_description": "P1: bulk export endpoint returning 500s since Tuesday, blocking their nightly reconciliation job"
}
```

### Response 200
```json
{ "enriched_summary": "P1 export outage blocking nightly reconciliation" }
```

**Constraint**: `enriched_summary` ≤ 12 words. Longer output is truncated at the word boundary
rather than rejected — the summary is cosmetic, and failing a signal insert over a cosmetic field
would be the wrong trade.

### Errors
| Status | Body | Client behavior |
|---|---|---|
| 502 | `{"error":"model_unavailable"}` | Insert the signal anyway with `enriched_summary = null`. **A1 failure must never block signal ingestion** — the signal is the evidence, the summary is decoration |
| 504 | `{"error":"timeout"}` | Same |

---

## 2. `POST /functions/v1/generate-assessment`

Spec capabilities **A2 + A3 + A4** collapsed into one structured call (plan AD-2).

**Model**: `claude-opus-5` · **Budget**: ≤ 17s · **Timeout**: 25s hard

### Request
```json
{
  "account": {
    "name": "Northwind Logistics",
    "industry": "3PL / freight",
    "arr": 42000,
    "plan_tier": "Growth",
    "renewal_date": "2026-10-14",
    "contact_name": "Devin Alarcón",
    "contact_role": "Director of Operations",
    "onboarding_completed_at": null,
    "last_touch_at": "2026-05-02T00:00:00Z"
  },
  "score": 34,
  "tier": "critical",
  "dominant_driver": "support_ticket",
  "signals": [
    {
      "id": "b1f0…",
      "type": "support_ticket",
      "severity": "critical",
      "occurred_at": "2026-08-02T09:12:00Z",
      "age_days": 4,
      "penalty": 28.7,
      "raw_description": "P1: bulk export endpoint returning 500s since Tuesday…",
      "enriched_summary": "P1 export outage blocking nightly reconciliation"
    }
  ],
  "taxonomy": ["schedule_check_in_call","send_reengagement_email","escalate_to_support",
               "offer_training_session","executive_sponsor_outreach","flag_for_renewal_risk_review"]
}
```

**Context is closed.** Up to the **12 most-weighted signals** are supplied. The model receives
nothing else and has no tools — this is the structural half of the anti-fabrication guarantee (G4).
The other half is the citation-subset check below.

### Response 200 — assessed
```json
{
  "status": "assessed",
  "explanation": "Northwind has had a P1 export outage open since 2 Aug that is blocking their nightly reconciliation, and weekly active users dropped 61% on 28 Jul — the two are almost certainly the same story. Their renewal is 10 weeks out and Devin has not heard from us since May.",
  "cited_signal_ids": ["b1f0…", "c7a2…"],
  "action": "escalate_to_support",
  "action_justification": "The dominant driver is an unresolved P1, so relationship outreach before the ticket is fixed would read as tone-deaf.",
  "confidence": "high",
  "draft_subject": "Your export outage — escalating today",
  "draft_body": "Hi Devin,\n\nI saw the bulk export tickets from Tuesday are still open…",
  "model_used": "claude-opus-5"
}
```

### Response 200 — insufficient signal
```json
{ "status": "insufficient_signal", "reason": "fewer_than_two_groundable_signals" }
```

### Server-side validation — applied in order, before the response is returned

| # | Guard | Failure handling |
|---|---|---|
| V1 | `action` ∈ taxonomy | Retry once. Then fall back to the dominant driver's default action with `confidence: "low"` (E4, FR-017) |
| V2 | `cited_signal_ids.length >= 2` | Retry once. Then return `insufficient_signal` (G1, E2, FR-007) |
| V3 | **`cited_signal_ids` ⊆ supplied signal IDs** | Any unknown ID is fabrication. Retry once, then `insufficient_signal` (G1b, G4) |
| V4 | `explanation`, `draft_subject`, `draft_body` all non-empty | Retry once, then 502 |
| V5 | `confidence` ∈ {low, medium, high} | Coerce to `medium` |

**One retry, never two.** Two retries would spend ~34s and blow both NFR-4 and the demo's pacing.

**Driver → default action map** (the V1 fallback, mirrored in `src/lib/taxonomy.ts`):

| Dominant driver | Default action |
|---|---|
| `support_ticket` | `escalate_to_support` |
| `usage_drop` | `send_reengagement_email` |
| `login_gap` | `send_reengagement_email` |
| `feature_adoption` | `offer_training_session` |
| `billing_event` | `schedule_check_in_call` |
| `nps_response` | `schedule_check_in_call` |
| *any, renewal < 90 days & tier critical* | `flag_for_renewal_risk_review` (overrides) |

### Errors
| Status | Body | Client behavior |
|---|---|---|
| 502 | `{"error":"model_unavailable"}` | Human-readable message + retry control (E3, FR-016). Any previously generated assessment stays visible |
| 504 | `{"error":"timeout"}` | Same |
| 400 | `{"error":"insufficient_context"}` | Render the insufficient-signal state (E1) |

---

## 3. Client-side write contracts

Writes the client performs after a function returns. Every one of these is also a
`timeline_events` insert in the same transaction.

| Operation | Writes | Timeline event |
|---|---|---|
| **Add signal** | `signals` insert → recompute via `scoring.ts` → `health_snapshots` insert → update `accounts` denormalized fields → if tier ∈ {watch, critical} invoke `generate-assessment` → `recommendations` + `outreach_drafts` insert | `signal_received`, `score_changed`, `recommendation_generated` |
| **Approve** | `decisions` insert (`approved`) · `outreach_drafts.final_text` · `recommendations.status = 'approved'` · `accounts.last_touch_at = now()` | `decision_made` |
| **Edit + approve** | Same, with `outcome = 'edited_approved'`, `was_edited = true`, `final_text` = edited body | `decision_made` |
| **Reject** | `decisions` insert (`rejected` + `rejection_reason`) · `recommendations.status = 'rejected'` | `decision_made` |
| **Regenerate** | Invoke `generate-assessment` against the latest snapshot; supersede the pending recommendation | `recommendation_generated` |

**There is no outbound-send operation in this contract set, and there is no function that could
perform one.** FR-011 and boundary S1 are enforced by the absence of a code path, not by a flag
that could be flipped.

---

## 4. Contract tests (manual — run book §3, executed ×10 on D4)

| # | Test | Expected |
|---|---|---|
| C1 | Assessment on a critical account | 200 `assessed`, ≥ 2 citations, action in taxonomy |
| C2 | Assessment on an account with 1 signal | `insufficient_signal`, no fabricated prose |
| C3 | Force a fabricated citation ID in a stubbed model response | V3 catches it → retry → `insufficient_signal` |
| C4 | Force an out-of-taxonomy action | V1 catches it → retry → driver default, `confidence: low` |
| C5 | Kill the API key temporarily | 502 → human-readable error + retry control, no stack trace |
| C6 | Add signal while a recommendation is pending | E7 staleness warning appears before Approve is enabled |
| C7 | Enrichment failure during signal insert | Signal still inserted, `enriched_summary` null, no error shown to Maya |
| C8 | Full Flow 2 timed | ≤ 90s end to end (NFR-2) |
