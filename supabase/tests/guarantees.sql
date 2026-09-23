-- Proves the safety guarantees Maya's README claims are enforced by the DATABASE itself,
-- not merely by the app. Run order:  supabase_stub.sql  ->  the migration  ->  this file.
-- Each negative test raises 'FAIL ...' if a bad write is accepted, and prints 'PASS ...'
-- (a NOTICE) when the database correctly rejects it. Any FAIL aborts the whole run.
\set ON_ERROR_STOP on

-- Seed the minimum: one account, two signals to cite, one snapshot.
INSERT INTO accounts (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Acme');
INSERT INTO signals (id, account_id, type, severity) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'support_ticket', 'high'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'usage_drop', 'high');
INSERT INTO health_snapshots (id, account_id, score, tier)
  VALUES ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 42, 'watch');

-- G1  A recommendation citing fewer than 2 signals must be refused (cited_signals_check).
DO $$ BEGIN
  BEGIN
    INSERT INTO recommendations (account_id, health_snapshot_id, risk_explanation, recommended_action,
      outreach_draft_subject, outreach_draft_body, cited_signal_ids, justification, confidence, status)
    VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','x','escalate_to_support',
      's','b', ARRAY['00000000-0000-0000-0000-0000000000a1']::uuid[], 'j','high','pending');
    RAISE EXCEPTION 'FAIL G1: a recommendation with one citation was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS G1: recommendation with <2 citations rejected';
  END;
END $$;

-- G1b  ...but status = insufficient_signal is allowed to have no citations.
DO $$ BEGIN
  INSERT INTO recommendations (account_id, health_snapshot_id, risk_explanation, recommended_action,
    outreach_draft_subject, outreach_draft_body, cited_signal_ids, justification, confidence, status)
  VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','x','escalate_to_support',
    's','b', '{}'::uuid[], 'j','low','insufficient_signal');
  RAISE NOTICE 'PASS G1b: insufficient_signal recommendation allowed with 0 citations';
END $$;

-- G2  An action outside the six-value taxonomy cannot be stored (enum action_taxonomy).
DO $$ BEGIN
  BEGIN
    INSERT INTO recommendations (account_id, health_snapshot_id, risk_explanation, recommended_action,
      outreach_draft_subject, outreach_draft_body, cited_signal_ids, justification, confidence, status)
    VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','x','delete_the_account',
      's','b', ARRAY['00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2']::uuid[], 'j','high','pending');
    RAISE EXCEPTION 'FAIL G2: an out-of-taxonomy action was accepted';
  EXCEPTION WHEN invalid_text_representation THEN RAISE NOTICE 'PASS G2: out-of-taxonomy action rejected';
  END;
END $$;

-- G3  A rejected decision with no reason is refused (rejection_reason_required).
DO $$ BEGIN
  INSERT INTO recommendations (id, account_id, health_snapshot_id, risk_explanation, recommended_action,
    outreach_draft_subject, outreach_draft_body, cited_signal_ids, justification, confidence, status)
  VALUES ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1',
    'x','escalate_to_support','s','b',
    ARRAY['00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a2']::uuid[], 'j','high','pending');
  BEGIN
    INSERT INTO decisions (recommendation_id, decided_by, outcome, rejection_reason, final_message_text)
    VALUES ('00000000-0000-0000-0000-0000000000c1','csm@x','rejected', NULL, NULL);
    RAISE EXCEPTION 'FAIL G3: a rejected decision with no reason was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS G3: rejected decision without a reason rejected';
  END;
END $$;

-- G3b  An approved decision with no final message is refused (final_message_required).
DO $$ BEGIN
  BEGIN
    INSERT INTO decisions (recommendation_id, decided_by, outcome, rejection_reason, final_message_text)
    VALUES ('00000000-0000-0000-0000-0000000000c1','csm@x','approved', NULL, NULL);
    RAISE EXCEPTION 'FAIL G3b: an approved decision with no final message was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS G3b: approved decision without final text rejected';
  END;
END $$;

-- G4  A tier outside the four values is refused (health_snapshots_tier_check).
DO $$ BEGIN
  BEGIN
    INSERT INTO health_snapshots (account_id, score, tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 10, 'on_fire');
    RAISE EXCEPTION 'FAIL G4: an invalid tier was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS G4: invalid tier rejected';
  END;
END $$;

-- G5  A score outside 0..100 is refused (health_snapshots_score_check).
DO $$ BEGIN
  BEGIN
    INSERT INTO health_snapshots (account_id, score, tier)
    VALUES ('00000000-0000-0000-0000-000000000001', 250, 'watch');
    RAISE EXCEPTION 'FAIL G5: a score of 250 was accepted';
  EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS G5: score outside 0..100 rejected';
  END;
END $$;

-- G6  Signals are append-only for an ordinary signed-in user: no UPDATE, no DELETE policy,
--     so both silently touch zero rows and the evidence is unchanged.
SET request.jwt.claim.role = 'authenticated';
SET ROLE authenticated;
DO $$
DECLARE changed int; deleted int; still text;
BEGIN
  UPDATE signals SET severity = 'low' WHERE id = '00000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS changed = ROW_COUNT;
  DELETE FROM signals WHERE id = '00000000-0000-0000-0000-0000000000a1';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RESET ROLE;
  SELECT severity INTO still FROM signals WHERE id = '00000000-0000-0000-0000-0000000000a1';
  IF changed = 0 AND deleted = 0 AND still = 'high' THEN
    RAISE NOTICE 'PASS G6: signals are append-only for authenticated (update/delete touched 0 rows)';
  ELSE
    RAISE EXCEPTION 'FAIL G6: authenticated changed % / deleted % row(s); severity now %', changed, deleted, still;
  END IF;
END $$;
RESET ROLE;

-- G7  Every signal insert is projected onto the timeline by the DB trigger, not the client.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM timeline_events
   WHERE account_id = '00000000-0000-0000-0000-000000000001' AND event_type = 'signal';
  IF n >= 2 THEN RAISE NOTICE 'PASS G7: signal timeline trigger fired (% signal events)', n;
  ELSE RAISE EXCEPTION 'FAIL G7: expected >=2 signal timeline events, found %', n;
  END IF;
END $$;

SELECT 'ALL GUARANTEES PASSED' AS result;
