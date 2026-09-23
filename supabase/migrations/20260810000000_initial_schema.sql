-- Maya — CS Health Radar: the database the live app ran on.
--
-- Extracted from the production Supabase project's own backup (taken 2026-09-04), public schema,
-- Maya's seven tables only. The same project also hosts another app's tables (quotes, recipients,
-- transfers, status_events), which are deliberately left out.
--
-- This file is the source of truth for the schema. Where it disagrees with
-- specs/001-customer-success-agent/data-model.md, this file is what actually shipped.
--
-- The guarantees the README makes, and where each one lives:
--   * An ungrounded recommendation cannot be saved  -> CHECK cited_signals_check (>= 2 citations
--     unless status = 'insufficient_signal')
--   * Actions are bounded to six values             -> ENUM action_taxonomy
--   * Signals are append-only evidence              -> RLS: signals has SELECT and INSERT policies
--     and no UPDATE or DELETE policy, so both are refused for anon and authenticated
--   * Decisions are append-only too                 -> same, decisions has no UPDATE/DELETE policy
--   * Every signal, snapshot, recommendation and decision lands on the timeline
--                                                    -> AFTER INSERT triggers below
--
-- Known gap, kept as it was shipped: any signed-in user may UPDATE any recommendation or outreach
-- draft (policies USING (true)). The database does not enforce the pending -> decided transition.

-- ─── Types ───────────────────────────────────────────────────────────────────

CREATE TYPE public.action_taxonomy AS ENUM (
    'schedule_check_in_call',
    'send_reengagement_email',
    'escalate_to_support',
    'offer_training_session',
    'executive_sponsor_outreach',
    'flag_for_renewal_risk_review'
);

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    industry text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    type text NOT NULL,
    severity text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    enrichment_summary text,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT signals_pkey PRIMARY KEY (id),
    CONSTRAINT signals_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT signals_type_check CHECK ((type = ANY (ARRAY['support_ticket'::text, 'usage_drop'::text, 'payment_issue'::text, 'nps_response'::text, 'feature_adoption'::text, 'manual_note'::text, 'login_gap'::text])))
);

CREATE TABLE public.health_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    score integer NOT NULL,
    breakdown jsonb DEFAULT '{}'::jsonb NOT NULL,
    contributing jsonb DEFAULT '[]'::jsonb NOT NULL,
    signal_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tier text DEFAULT 'healthy'::text NOT NULL,
    CONSTRAINT health_snapshots_pkey PRIMARY KEY (id),
    CONSTRAINT health_snapshots_score_check CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT health_snapshots_tier_check CHECK ((tier = ANY (ARRAY['healthy'::text, 'watch'::text, 'critical'::text, 'stale'::text])))
);

CREATE TABLE public.recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    health_snapshot_id uuid NOT NULL,
    risk_explanation text NOT NULL,
    recommended_action public.action_taxonomy NOT NULL,
    outreach_draft_subject text NOT NULL,
    outreach_draft_body text NOT NULL,
    cited_signal_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    justification text NOT NULL,
    confidence text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recommendations_pkey PRIMARY KEY (id),
    CONSTRAINT cited_signals_check CHECK (((status = 'insufficient_signal'::text) OR (array_length(cited_signal_ids, 1) >= 2))),
    CONSTRAINT recommendations_confidence_check CHECK ((confidence = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT recommendations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'edited_approved'::text, 'rejected'::text, 'insufficient_signal'::text])))
);

CREATE TABLE public.outreach_drafts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recommendation_id uuid NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    final_text text,
    was_edited boolean DEFAULT false NOT NULL,
    CONSTRAINT outreach_drafts_pkey PRIMARY KEY (id),
    CONSTRAINT outreach_drafts_recommendation_id_key UNIQUE (recommendation_id)
);

CREATE TABLE public.decisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recommendation_id uuid NOT NULL,
    decided_by text NOT NULL,
    decided_at timestamp with time zone DEFAULT now() NOT NULL,
    outcome text NOT NULL,
    rejection_reason text,
    final_message_text text,
    CONSTRAINT decisions_pkey PRIMARY KEY (id),
    CONSTRAINT decisions_recommendation_id_key UNIQUE (recommendation_id),
    CONSTRAINT decisions_outcome_check CHECK ((outcome = ANY (ARRAY['approved'::text, 'edited_approved'::text, 'rejected'::text]))),
    CONSTRAINT decisions_rejection_reason_check CHECK ((rejection_reason = ANY (ARRAY['wrong_risk_driver'::text, 'already_handled'::text, 'wrong_timing'::text, 'wrong_tone'::text, 'other'::text]))),
    CONSTRAINT final_message_required CHECK (((outcome <> ALL (ARRAY['approved'::text, 'edited_approved'::text])) OR (final_message_text IS NOT NULL))),
    CONSTRAINT rejection_reason_required CHECK (((outcome <> 'rejected'::text) OR (rejection_reason IS NOT NULL)))
);

CREATE TABLE public.timeline_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_events_pkey PRIMARY KEY (id),
    CONSTRAINT timeline_events_event_type_check CHECK ((event_type = ANY (ARRAY['signal'::text, 'health_change'::text, 'recommendation'::text, 'decision'::text])))
);

-- ─── Foreign keys ────────────────────────────────────────────────────────────

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.health_snapshots
    ADD CONSTRAINT health_snapshots_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.health_snapshots
    ADD CONSTRAINT health_snapshots_signal_id_fkey FOREIGN KEY (signal_id) REFERENCES public.signals(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_health_snapshot_id_fkey FOREIGN KEY (health_snapshot_id) REFERENCES public.health_snapshots(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.outreach_drafts
    ADD CONSTRAINT outreach_drafts_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_signals_account_id ON public.signals USING btree (account_id);
CREATE INDEX idx_signals_recorded_at ON public.signals USING btree (recorded_at);
CREATE INDEX idx_health_snapshots_account_id ON public.health_snapshots USING btree (account_id);
CREATE INDEX idx_health_snapshots_created_at ON public.health_snapshots USING btree (created_at DESC);
CREATE INDEX idx_recommendations_account_id ON public.recommendations USING btree (account_id);
CREATE INDEX idx_recommendations_status ON public.recommendations USING btree (status);
CREATE INDEX idx_timeline_events_account_id ON public.timeline_events USING btree (account_id);
CREATE INDEX idx_timeline_events_created_at ON public.timeline_events USING btree (created_at DESC);

-- ─── Timeline: written by the database, not the client ───────────────────────

CREATE FUNCTION public.log_signal_timeline() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO timeline_events (account_id, event_type, metadata)
  VALUES (
    NEW.account_id,
    'signal',
    jsonb_build_object(
      'signal_id', NEW.id,
      'type', NEW.type,
      'severity', NEW.severity,
      'recorded_at', NEW.recorded_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.log_snapshot_timeline() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO timeline_events (account_id, event_type, metadata)
  VALUES (
    NEW.account_id,
    'health_change',
    jsonb_build_object(
      'snapshot_id', NEW.id,
      'score', NEW.score,
      'breakdown', NEW.breakdown
    )
  );
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.log_recommendation_timeline() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO timeline_events (account_id, event_type, metadata)
  VALUES (
    NEW.account_id,
    'recommendation',
    jsonb_build_object(
      'recommendation_id', NEW.id,
      'recommended_action', NEW.recommended_action,
      'confidence', NEW.confidence,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.log_decision_timeline() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO timeline_events (account_id, event_type, metadata)
  VALUES (
    (SELECT account_id FROM recommendations WHERE id = NEW.recommendation_id),
    'decision',
    jsonb_build_object(
      'decision_id', NEW.id,
      'recommendation_id', NEW.recommendation_id,
      'outcome', NEW.outcome,
      'rejection_reason', NEW.rejection_reason,
      'decided_at', NEW.decided_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_signal_timeline AFTER INSERT ON public.signals FOR EACH ROW EXECUTE FUNCTION public.log_signal_timeline();
CREATE TRIGGER trg_log_snapshot_timeline AFTER INSERT ON public.health_snapshots FOR EACH ROW EXECUTE FUNCTION public.log_snapshot_timeline();
CREATE TRIGGER trg_log_recommendation_timeline AFTER INSERT ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.log_recommendation_timeline();
CREATE TRIGGER trg_log_decision_timeline AFTER INSERT ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.log_decision_timeline();

-- ─── Row-level security ──────────────────────────────────────────────────────

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Reads: any signed-in user (the demo signs in automatically). Not signed in: nothing.
CREATE POLICY authenticated_users_select_all ON public.accounts FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.signals FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.health_snapshots FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.recommendations FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.outreach_drafts FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.decisions FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_select_all ON public.timeline_events FOR SELECT USING ((auth.role() = 'authenticated'::text));

-- Inserts. accounts has none: accounts are seeded, never created by the app.
CREATE POLICY authenticated_users_insert_signals ON public.signals FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_insert_snapshots ON public.health_snapshots FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_insert_recommendations ON public.recommendations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY authenticated_users_insert_drafts ON public.outreach_drafts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY authenticated_users_insert_decisions ON public.decisions FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY authenticated_users_insert_events ON public.timeline_events FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));

-- Updates: only these two tables (status change on approve/reject, final text on the draft).
-- signals, health_snapshots, decisions and timeline_events have no UPDATE and no DELETE policy.
CREATE POLICY authenticated_users_update_recommendations ON public.recommendations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY authenticated_users_update_drafts ON public.outreach_drafts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── Grants (Supabase's defaults for the public schema; RLS above does the restricting) ──

GRANT ALL ON FUNCTION public.log_signal_timeline() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.log_snapshot_timeline() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.log_recommendation_timeline() TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.log_decision_timeline() TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.accounts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.signals TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.health_snapshots TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.recommendations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.outreach_drafts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.decisions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.timeline_events TO anon, authenticated, service_role;
