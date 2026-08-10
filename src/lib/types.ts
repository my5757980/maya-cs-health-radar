// ============================================================
// Database types matching the 001_initial_schema migration
// ============================================================

export type ActionTaxonomy =
  | 'schedule_check_in_call'
  | 'send_reengagement_email'
  | 'escalate_to_support'
  | 'offer_training_session'
  | 'executive_sponsor_outreach'
  | 'flag_for_renewal_risk_review';

export type SignalType =
  | 'support_ticket'
  | 'usage_drop'
  | 'payment_issue'
  | 'nps_response'
  | 'feature_adoption'
  | 'manual_note';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type RecommendationStatus =
  | 'pending'
  | 'approved'
  | 'edited_approved'
  | 'rejected'
  | 'insufficient_signal';

export type DecisionOutcome = 'approved' | 'edited_approved' | 'rejected';

export type RejectionReason =
  | 'wrong_risk_driver'
  | 'already_handled'
  | 'wrong_timing'
  | 'wrong_tone'
  | 'other';

export type TimelineEventType =
  | 'signal'
  | 'health_change'
  | 'recommendation'
  | 'decision';

export type HealthTier = 'healthy' | 'watch' | 'critical' | 'stale';

// --- Row types ---

export interface Account {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
}

export interface Signal {
  id: string;
  account_id: string;
  type: SignalType;
  severity: string | null;
  details: Record<string, unknown>;
  enrichment_summary: string | null;
  recorded_at: string;
}

export interface HealthSnapshot {
  id: string;
  account_id: string;
  score: number;
  tier: HealthTier;
  breakdown: Record<string, number>;
  contributing: {
    signal_id: string;
    type: SignalType;
    severity: string | null;
    age_days: number;
    penalty: number;
  }[];
  signal_id: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  account_id: string;
  health_snapshot_id: string;
  risk_explanation: string;
  recommended_action: ActionTaxonomy;
  outreach_draft_subject: string;
  outreach_draft_body: string;
  cited_signal_ids: string[];
  justification: string;
  confidence: 'low' | 'medium' | 'high';
  status: RecommendationStatus;
  created_at: string;
}

export interface OutreachDraft {
  id: string;
  recommendation_id: string;
  subject: string;
  body: string;
  generated_at: string;
  final_text: string | null;
  was_edited: boolean;
}

export interface Decision {
  id: string;
  recommendation_id: string;
  decided_by: string;
  decided_at: string;
  outcome: DecisionOutcome;
  rejection_reason: string | null;
  final_message_text: string | null;
}

export interface TimelineEvent {
  id: string;
  account_id: string;
  event_type: TimelineEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Composed types used in the UI ---

export interface AccountWithScore extends Account {
  health_snapshot: HealthSnapshot | null;
  risk_tier: HealthTier;
}

export interface AccountDetail {
  account: Account;
  signals: Signal[];
  latest_snapshot: HealthSnapshot | null;
  latest_recommendation: Recommendation | null;
  latest_draft: OutreachDraft | null;
  latest_decision: Decision | null;
  timeline: TimelineEvent[];
}