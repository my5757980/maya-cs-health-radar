import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Edit3,
  XCircle,
  MessageSquare,
  Activity,
  AlertTriangle,
  FileText,
  ThumbsUp,
  RefreshCw,
  Sparkles,
  Loader2,
  Quote,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type {
  Account,
  Signal,
  HealthSnapshot,
  HealthTier,
  Recommendation,
  OutreachDraft,
  Decision,
  TimelineEvent,
} from "../lib/types";
import {
  ScoreBadge,
  RiskBadge,
  formatDate,
  timeAgo,
} from "./ScoreBadge";
import { Timeline } from "./Timeline";

type Tab = "assessment" | "timeline";

const ACTION_LABELS: Record<string, string> = {
  schedule_check_in_call: "Schedule a check-in call",
  send_reengagement_email: "Send a re-engagement email",
  escalate_to_support: "Escalate to support",
  offer_training_session: "Offer a training session",
  executive_sponsor_outreach: "Executive sponsor outreach",
  flag_for_renewal_risk_review: "Flag for renewal risk review",
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  support_ticket: "Support tickets",
  usage_drop: "Usage drop",
  payment_issue: "Payment issues",
  nps_response: "NPS response",
  feature_adoption: "Feature adoption",
  manual_note: "Manual notes",
};

const REJECTION_REASONS: { value: string; label: string }[] = [
  { value: "wrong_risk_driver", label: "Wrong risk driver" },
  { value: "already_handled", label: "Already handled" },
  { value: "wrong_timing", label: "Wrong timing" },
  { value: "wrong_tone", label: "Wrong tone" },
  { value: "other", label: "Other" },
];

function readableType(type: string): string {
  return SIGNAL_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

function penaltyColor(penalty: number): string {
  if (penalty >= 20) return "var(--color-critical)";
  if (penalty >= 10) return "var(--color-watch)";
  return "var(--color-stale)";
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    high: "bg-healthy/10 text-healthy border-healthy/20",
    medium: "bg-watch/10 text-watch border-watch/20",
    low: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
        styles[confidence] ?? styles.low
      }`}
    >
      {confidence} confidence
    </span>
  );
}

interface ContributingItem {
  signal_id: string;
  type: string;
  severity: string | null;
  age_days: number;
  penalty: number;
}

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("assessment");
  const [account, setAccount] = useState<Account | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisionMade, setDecisionMade] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    // Reset cross-account state
    setAccount(null);
    setSignals([]);
    setSnapshot(null);
    setRecommendation(null);
    setDraft(null);
    setDecision(null);
    setDecisionMade(null);
    setEditing(false);
    setShowRejectReason(false);
    setActionError(null);
    setGenerateError(null);
    setGenerating(false);

    try {
      const [acctRes, sigRes, snapRes, recRes, tlRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("id", id).single(),
        supabase
          .from("signals")
          .select("*")
          .eq("account_id", id)
          .order("recorded_at", { ascending: false }),
        supabase
          .from("health_snapshots")
          .select("*")
          .eq("account_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("recommendations")
          .select("*")
          .eq("account_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("timeline_events")
          .select("*")
          .eq("account_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (acctRes.data) setAccount(acctRes.data);
      if (sigRes.data) setSignals(sigRes.data);
      if (snapRes.data && !snapRes.error) setSnapshot(snapRes.data);
      if (tlRes.data) setTimeline(tlRes.data);

      // Fetch recommendation, draft, decision
      if (recRes.data) {
        setRecommendation(recRes.data);

        const [draftRes, decRes] = await Promise.all([
          supabase
            .from("outreach_drafts")
            .select("*")
            .eq("recommendation_id", recRes.data.id)
            .maybeSingle(),
          supabase
            .from("decisions")
            .select("*")
            .eq("recommendation_id", recRes.data.id)
            .maybeSingle(),
        ]);

        setDraft(draftRes.data ?? null);
        setDecision(decRes.data ?? null);
        setDecisionMade(decRes.data?.outcome ?? null);
      }
    } catch (err) {
      console.error("Failed to load account detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Driver totals from real contributing data ---
  const contributing: ContributingItem[] = useMemo(
    () => (snapshot?.contributing as ContributingItem[]) ?? [],
    [snapshot]
  );

  const driverTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contributing) {
      if (c.penalty > 0) {
        map.set(c.type, (map.get(c.type) ?? 0) + c.penalty);
      }
    }
    return [...map.entries()]
      .map(([type, penalty]) => ({ type, penalty }))
      .sort((a, b) => b.penalty - a.penalty);
  }, [contributing]);

  const maxPenalty = driverTotals.length > 0 ? driverTotals[0].penalty : 0.1;

  const citedSignals = useMemo(() => {
    if (!recommendation) return [];
    return signals.filter((s) =>
      recommendation.cited_signal_ids.includes(s.id)
    );
  }, [signals, recommendation]);

  const contributingBySignal = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of contributing) m.set(c.signal_id, c.penalty);
    return m;
  }, [contributing]);

  // --- Generate AI Assessment ---
  const handleGenerate = async () => {
    if (!id || !snapshot) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prose", {
        body: {
          account_id: id,
          health_snapshot_id: snapshot.id,
          score: snapshot.score,
          tier: snapshot.tier,
          contributing: contributing,
          signals: signals.map((s) => ({
            id: s.id,
            type: s.type,
            severity: s.severity,
            recorded_at: s.recorded_at,
          })),
        },
      });
      if (error) throw error;
      if (data && typeof data === "object" && "error" in data) throw new Error(String((data as { error: unknown }).error));
      await loadData();
    } catch (err) {
      console.error("Generate failed:", err);
      setGenerateError(
        "We couldn't generate the assessment right now. The AI service may be busy — please try again in a moment."
      );
    } finally {
      setGenerating(false);
    }
  };

  // --- Decision handlers ---
  const composeMessage = (subject: string, body: string) =>
    `${subject}\n\n${body}`;

  const handleApprove = async () => {
    if (!recommendation) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const subject = draft?.subject ?? recommendation.outreach_draft_subject ?? "";
      const body = draft?.body ?? recommendation.outreach_draft_body ?? "";
      const finalText = composeMessage(subject, body);

      await supabase
        .from("recommendations")
        .update({ status: "approved" })
        .eq("id", recommendation.id);

      const { error: decError } = await supabase.from("decisions").insert({
        recommendation_id: recommendation.id,
        decided_by: "maya@example.com",
        outcome: "approved",
        rejection_reason: null,
        final_message_text: finalText,
      });
      if (decError) throw decError;

      if (draft) {
        await supabase
          .from("outreach_drafts")
          .update({ final_text: finalText })
          .eq("id", draft.id);
      }

      await supabase.from("timeline_events").insert({
        account_id: id,
        event_type: "decision",
        metadata: {
          recommendation_id: recommendation.id,
          outcome: "approved",
        },
      });

      setDecisionMade("approved");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "We couldn't record the approval."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveEdited = async () => {
    if (!recommendation) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const finalText = composeMessage(editSubject, editBody);

      await supabase
        .from("recommendations")
        .update({ status: "edited_approved" })
        .eq("id", recommendation.id);

      const { error: decError } = await supabase.from("decisions").insert({
        recommendation_id: recommendation.id,
        decided_by: "maya@example.com",
        outcome: "edited_approved",
        rejection_reason: null,
        final_message_text: finalText,
      });
      if (decError) throw decError;

      if (draft) {
        await supabase
          .from("outreach_drafts")
          .update({ final_text: finalText, was_edited: true })
          .eq("id", draft.id);
      }

      await supabase.from("timeline_events").insert({
        account_id: id,
        event_type: "decision",
        metadata: {
          recommendation_id: recommendation.id,
          outcome: "edited_approved",
        },
      });

      setDecisionMade("edited_approved");
      setEditing(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "We couldn't save the edited version."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!recommendation) return;
    if (!rejectReason) {
      setActionError("Please select a reason for rejecting.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await supabase
        .from("recommendations")
        .update({ status: "rejected" })
        .eq("id", recommendation.id);

      const { error: decError } = await supabase.from("decisions").insert({
        recommendation_id: recommendation.id,
        decided_by: "maya@example.com",
        outcome: "rejected",
        rejection_reason: rejectReason,
        final_message_text: null,
      });
      if (decError) throw decError;

      await supabase.from("timeline_events").insert({
        account_id: id,
        event_type: "decision",
        metadata: {
          recommendation_id: recommendation.id,
          outcome: "rejected",
          reason: rejectReason,
        },
      });

      setDecisionMade("rejected");
      setShowRejectReason(false);
      setRejectReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "We couldn't record the rejection."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const score = snapshot?.score ?? 0;
  const tier: HealthTier = snapshot?.tier ?? "stale";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-60 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
        <h2 className="text-lg font-heading font-semibold text-foreground/60">
          Account not found
        </h2>
        <Link
          to="/"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          Back to workspace
        </Link>
      </div>
    );
  }

  const hasEnoughSignals = signals.length >= 2;
  const showAssessmentSection =
    !generating &&
    !generateError &&
    !!recommendation &&
    recommendation.status !== "insufficient_signal";
  const showInsufficientSignal =
    !generating &&
    !generateError &&
    (!hasEnoughSignals ||
      recommendation?.status === "insufficient_signal");
  const showEmptyGenerate =
    !generating && !generateError && hasEnoughSignals && !recommendation;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors duration-150 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Workspace
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
        <ScoreBadge score={score} tier={tier} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {account.name}
            </h1>
            <RiskBadge score={score} tier={tier} />
          </div>
          {account.industry && (
            <p className="text-sm text-foreground/50 mt-1">{account.industry}</p>
          )}
          <p className="text-xs text-foreground/40 mt-1">
            {signals.length} signals ·{" "}
            {snapshot
              ? `Last updated ${timeAgo(snapshot.created_at)}`
              : "No health data"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["assessment", "timeline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {t === "assessment" ? "Assessment" : "Timeline"}
          </button>
        ))}
      </div>

      {tab === "assessment" ? (
        <div className="space-y-6 animate-fade-in">
          {/* ============ SCORE DRIVERS ============ */}
          {snapshot && (
            <section>
              <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">
                Score Drivers
              </h3>
              <div className="bg-white rounded-xl border border-border p-5">
                {driverTotals.length === 0 ? (
                  <p className="text-sm text-foreground/40 text-center py-2">
                    No active penalties — this account is healthy.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {driverTotals.map((d) => {
                      const pct = (d.penalty / maxPenalty) * 100;
                      return (
                        <div key={d.type}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-foreground/70">
                              {readableType(d.type)}
                            </span>
                            <span className="text-sm font-semibold text-destructive">
                              -{d.penalty.toFixed(1)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: penaltyColor(d.penalty),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============ CONTRIBUTING FACTORS ============ */}
          {snapshot?.contributing && snapshot.contributing.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">
                Contributing Factors
              </h3>
              <div className="bg-white rounded-xl border border-border p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-foreground/40 border-b border-border">
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Age</th>
                      <th className="pb-2 font-medium text-right">Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributing
                      .filter((c) => c.penalty > 0)
                      .sort((a, b) => b.penalty - a.penalty)
                      .slice(0, 10)
                      .map((c) => (
                        <tr
                          key={c.signal_id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2">
                            <span className="font-medium text-foreground">
                              {c.type.replace(/_/g, " ")}
                            </span>
                            {c.severity && (
                              <span
                                className={`ml-2 text-xs font-medium ${
                                  c.severity === "critical" ||
                                  c.severity === "high"
                                    ? "text-destructive"
                                    : "text-watch"
                                }`}
                              >
                                ({c.severity})
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-foreground/60">
                            {c.age_days}d
                          </td>
                          <td className="py-2 text-right font-semibold text-destructive">
                            -{c.penalty}
                          </td>
                        </tr>
                      ))}
                    {contributing.filter((c) => c.penalty > 0).length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-3 text-center text-foreground/40">
                          No significant penalties — account is healthy.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ============ AI ASSESSMENT ============ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-3.5 h-3.5" />
                AI Assessment
              </h3>
              {!generating &&
                recommendation &&
                recommendation.status !== "insufficient_signal" &&
                hasEnoughSignals && (
                  <button
                    onClick={handleGenerate}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground/50 hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all duration-150 cursor-pointer active:scale-[0.97]"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                )}
            </div>

            {/* Decision banner */}
            {decisionMade && (
              <div
                className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  decisionMade === "approved"
                    ? "bg-healthy/10 text-healthy border border-healthy/20"
                    : decisionMade === "edited_approved"
                    ? "bg-watch/10 text-watch border border-watch/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {decisionMade === "approved" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : decisionMade === "edited_approved" ? (
                  <Edit3 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {decisionMade === "approved"
                  ? "Approved"
                  : decisionMade === "edited_approved"
                  ? "Edited & Approved"
                  : "Rejected"}
              </div>
            )}

            {/* Generating state */}
            {generating && (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground/70">
                  Generating AI assessment…
                </p>
                <p className="text-xs text-foreground/40 mt-1">
                  Calling Claude Opus for risk analysis
                </p>
              </div>
            )}

            {/* Error state */}
            {generateError && !generating && (
              <div className="bg-white rounded-xl border border-destructive/30 p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
                <p className="text-sm font-semibold text-destructive mb-1">
                  {generateError}
                </p>
                <p className="text-xs text-foreground/50 mb-4 max-w-sm mx-auto">
                  The AI assessment is currently unavailable. You can retry or
                  come back later.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-destructive text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-150 cursor-pointer active:scale-[0.97]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            )}

            {/* Insufficient signal state */}
            {showInsufficientSignal && !generating && !generateError && (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-foreground/30" />
                </div>
                {!hasEnoughSignals ? (
                  <>
                    <p className="text-sm font-semibold text-foreground/60 mb-1">
                      Not enough signal data
                    </p>
                    <p className="text-xs text-foreground/40 max-w-sm mx-auto leading-relaxed">
                      At least 2 signals are needed to generate a grounded AI
                      assessment. Add signals from the workspace to get started.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-150 cursor-pointer"
                    >
                      Add signals
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground/60 mb-1">
                      Could not generate assessment
                    </p>
                    <p className="text-xs text-foreground/40 max-w-sm mx-auto leading-relaxed">
                      The AI model could not produce a grounded analysis for
                      this account. Try regenerating.
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-150 cursor-pointer active:scale-[0.97]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Empty generate CTA */}
            {showEmptyGenerate && (
              <div className="bg-white rounded-xl border border-dashed border-foreground/15 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground/60 mb-1">
                  Generate an AI assessment
                </p>
                <p className="text-xs text-foreground/40 max-w-sm mx-auto leading-relaxed">
                  Get a risk explanation, recommended action, and outreach draft
                  generated from this account's signals.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-all duration-150 cursor-pointer active:scale-[0.97] shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate assessment
                </button>
              </div>
            )}

            {/* Full assessment */}
            {showAssessmentSection && recommendation && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Risk Explanation */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                      Risk Explanation
                    </h4>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI-generated
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {recommendation.risk_explanation}
                  </p>
                </div>

                {/* Cited Signals */}
                <div className="p-5 border-b border-border">
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Quote className="w-3 h-3" />
                    Cited Signals
                    <span className="normal-case font-medium text-foreground/30 text-[10px]">
                      the grounding behind this assessment
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {citedSignals.map((s) => {
                      const penalty = contributingBySignal.get(s.id);
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg"
                        >
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {s.type.replace(/_/g, " ")}
                          </span>
                          {s.severity && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                s.severity === "critical" ||
                                s.severity === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-watch/10 text-watch"
                              }`}
                            >
                              {s.severity}
                            </span>
                          )}
                          <span className="text-xs text-foreground/40">
                            {formatDate(s.recorded_at)}
                          </span>
                          {penalty !== undefined && penalty > 0 && (
                            <span className="ml-auto text-xs font-semibold text-destructive">
                              -{penalty.toFixed(1)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="p-5 border-b border-border">
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                    Recommended Action
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-semibold text-foreground">
                        {ACTION_LABELS[recommendation.recommended_action] ??
                          recommendation.recommended_action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <ConfidenceBadge confidence={recommendation.confidence} />
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed mt-3">
                    {recommendation.justification}
                  </p>
                </div>

                {/* Outreach Draft */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Outreach Draft
                  </h4>

                  {!editing ? (
                    <div className="rounded-lg border border-border p-4 bg-background/40">
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {draft?.subject ??
                          recommendation.outreach_draft_subject ??
                          "Subject"}
                      </p>
                      <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                        {draft?.body ?? recommendation.outreach_draft_body ?? ""}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground/60 mb-1.5">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground/60 mb-1.5">
                          Body
                        </label>
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApproveEdited}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-[0.97]"
                        >
                          {actionLoading ? "Saving..." : "Save & Approve"}
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted transition-all duration-150 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {actionError && (
                    <p className="text-xs text-destructive font-medium mt-3">
                      {actionError}
                    </p>
                  )}

                  {/* Approval controls — three buttons per spec */}
                  {!editing && !decisionMade && (
                    <div className="flex flex-wrap gap-2 mt-4 items-center">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-healthy text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-[0.97]"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setEditing(true);
                          setEditSubject(
                            draft?.subject ??
                              recommendation.outreach_draft_subject ??
                              ""
                          );
                          setEditBody(
                            draft?.body ??
                              recommendation.outreach_draft_body ??
                              ""
                          );
                        }}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-[0.97]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Approve edited
                      </button>
                      <button
                        onClick={() => setShowRejectReason(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground/60 hover:bg-muted disabled:opacity-50 transition-all duration-150 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <span className="text-[10px] text-foreground/30 ml-auto">
                        Nothing is ever sent.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ============ SIGNALS ============ */}
          <section>
            <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Signals ({signals.length})
            </h3>
            <div className="space-y-2">
              {signals.length === 0 && (
                <div className="bg-white rounded-xl border border-border p-8 text-center">
                  <p className="text-sm text-foreground/40">
                    No signals recorded yet.
                  </p>
                </div>
              )}
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="bg-white rounded-xl border border-border p-4 hover:border-foreground/10 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {signal.type.replace(/_/g, " ")}
                        </span>
                        {signal.severity && (
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              signal.severity === "critical" ||
                              signal.severity === "high"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-watch/10 text-watch"
                            }`}
                          >
                            {signal.severity}
                          </span>
                        )}
                      </div>
                      {signal.enrichment_summary && (
                        <p className="text-xs text-foreground/60 mt-1 italic">
                          {signal.enrichment_summary}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-foreground/40">
                        {formatDate(signal.recorded_at)}
                      </p>
                      <p className="text-[10px] text-foreground/30 mt-0.5">
                        {timeAgo(signal.recorded_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <Timeline
          accountId={id!}
          events={timeline}
          signals={signals}
          recommendation={recommendation}
          decision={decision}
          onRefresh={loadData}
        />
      )}

      {/* Reject Reason Modal */}
      {showRejectReason && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRejectReason(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-slide-up">
            <h3 className="text-base font-heading font-bold text-foreground mb-4">
              Reject Recommendation
            </h3>
            <p className="text-xs text-foreground/50 mb-3">
              Why are you rejecting this recommendation?
            </p>
            <select
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setRejectReason(e.target.value);
                setActionError(null);
              }}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm mb-4 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {actionError && (
              <p className="text-xs text-destructive font-medium mb-3">
                {actionError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason}
                className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-150 cursor-pointer active:scale-[0.97]"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
              <button
                onClick={() => {
                  setShowRejectReason(false);
                  setActionError(null);
                }}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground/60 hover:bg-muted transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
