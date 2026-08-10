# Quickstart — Smart Customer Success Agent

**Feature**: `001-customer-success-agent` | **Date**: 2026-08-06

How to stand this up from zero, and how to verify it. Written so that a total loss of the
native.builder project costs hours, not the hackathon.

---

## Prerequisites

| # | Item | Notes |
|---|---|---|
| 1 | native.builder account with a **paid plan** (Builder $20/mo or the Lablab Builder plan) | The free tier's 50 one-time credits will not finish this build. Do this **before the first generation prompt** — see plan.md R1 |
| 2 | Supabase account with an empty project | Free tier is sufficient at this scale |
| 3 | Anthropic API key with access to `claude-opus-5` and `claude-sonnet-5` | Est. spend for the whole build: < $5 |
| 4 | GitHub account | For Sync — the offline backup that makes R1 survivable |

---

## Setup (D1 — no feature work, deliberately)

1. **Upgrade the plan first.** Settings → Plans. Nothing else in this list matters if generation pauses on D3.
2. **Authorize Supabase at workspace level.** Settings → Integrations → Supabase → OAuth. This alone does nothing visible; step 4 is what activates it.
3. **Create the project.** Brief the Product Architect with a *scoped* brief — the four screens, the seven entities, and the six-step workflow. Do not paste the whole spec; a broad brief produces broad rework, and rework is what spends credits.
4. **Link the app to the Supabase project** and enable agent access. App → Integrations.
5. **Publish immediately.** Settings → Publish. Record the `*.nativelyai.app` URL in `README.md`. **This URL never changes** (Constitution Principle III).
6. **Verify the Anthropic path** with a throwaway Edge Function that makes one call and returns the response. If this fails, you have found it on D1 with four days of runway instead of on D3 with one.
7. Delete the throwaway function.

**D1 is complete when:** the URL loads in an incognito window, the plan is paid, Supabase is linked,
and one real Anthropic call has succeeded. Zero features exist. That is the correct D1 state.

---

## Build order

Follow plan.md §2, steps 5–15. One screen or one function per prompt; state the acceptance
criteria inside the prompt. When a generation comes back wrong, **edit and resend the original
prompt** rather than adding a corrective follow-up — a follow-up is a second full generation, an
edited resend is not.

---

## Storing the Anthropic key (D3, step 8)

Ask the Builder agent to add the secret. It presents a **masked input**; the value goes to Supabase
secret storage, never appears in the conversation, and is not visible to the agent.

**Replacing a secret has no undo.** Have the correct key on the clipboard before starting.

---

## Verification run book

Run the full script before every deploy on D4 and D5. Ten consecutive clean passes is the
NFR-6 / SC-004 gate.

### §1 — Cold start (NFR-1, SC-001)
1. Open the public URL in a **fresh incognito window**.
2. Start a stopwatch at page load.
3. Reach a specific, grounded recommended action without instruction.
4. **Pass: < 60 seconds.** A clean session is not optional — cached auth is exactly how R5 hides.

### §2 — Canonical workflow, Flow 2 (NFR-2, SC-002)
1. Open the top-ranked critical account.
2. Read the explanation. Confirm ≥ 2 signals cited **by type and date**.
3. Confirm the action is one of the six, and the justification names the risk driver.
4. Edit one sentence of the draft. Approve.
5. Confirm the timeline shows the decision with the **edited** text and `was_edited = true`.
6. Confirm the account no longer shows a pending recommendation.
7. **Pass: ≤ 90 seconds, zero errors.**

### §3 — Contract tests
Execute C1–C8 from [contracts/agent-functions.md](./contracts/agent-functions.md) §4.

### §4 — Live injection, Flow 3 (SC-005)
1. Open the injection-target account (seeded to score 71–76, tier Healthy).
2. Add a `critical` `support_ticket`.
3. Confirm: score drops ≈ 30 points · tier changes Healthy → Watch · a fresh assessment cites the **new** signal by date · the account moves up the workspace ranking.
4. **Pass: all four, within 20 seconds.**

If the tier does not visibly change, retune that account's seed signals. This is the demo's
strongest twenty seconds and it is worth a ten-minute fix.

### §5 — Grounding review (NFR-5, SC-003)
Generate 10 assessments across different accounts. For each, confirm ≥ 2 citations, that every
cited signal **actually exists** on that account, and that no company, person, date, or dollar
figure appears that is not in the account record.
**Pass: 10/10.** Any fabrication is a hard failure (G4), not a stylistic note.

### §6 — Failure paths (NFR-7, FR-016)
1. Temporarily invalidate the Anthropic key → confirm a human-readable message and a retry control. No stack trace, no blank screen.
2. Restore the key, retry, confirm recovery.
3. Open the single-signal account → confirm the insufficient-signal state, with no fabricated explanation.

### §7 — Deployment (NFR-8)
Confirm the Publish button shows no stale indicator, and the live URL serves the current build in a
clean session.

---

## Recovery procedures

| Situation | Recovery |
|---|---|
| **Database corrupted / bad seed** | Re-run the seeding routine from `src/data/seed-data.json`. ~2 minutes. This is why seed data is version-controlled rather than hand-entered |
| **Bad publish broke the demo** | Versions panel → revert to the last good version. Paid-plan only — a second reason plan.md requires the upgrade |
| **Credits exhausted** | Upgrade tier. Code is GitHub-synced from D4, so worst case the build finishes outside the platform — logged in `docs/escape-hatches.md` and disclosed in the submission |
| **Platform outage near the deadline** | Submit the recorded demo video plus the GitHub repo, and state plainly what happened. An honest disclosure beats a missing submission |
| **Anthropic access blocked** | Switch the Edge Function to OpenRouter BYOK routing to `anthropic/claude-opus-5`. Pre-identified in research.md §2 precisely so it is not a decision invented under pressure |

---

## Submission checklist (D5)

- [ ] Public URL live, verified in a clean browser session with no cached auth
- [ ] `docs/escape-hatches.md` audit — expected 0%, budget 20%
- [ ] `docs/metrics.md` records measured Tier-2 results
- [ ] Demo video ≤ 3 minutes, showing the live URL, Flow 2, and Flow 3
- [ ] Submission text names Maya, the 15-of-100 problem, and the native.builder build story in three concrete sentences
- [ ] Business-value claim states its derivation (Constitution Principle VII)
- [ ] **Submitted with ≥ 4 hours before the deadline**
