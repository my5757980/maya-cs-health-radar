import { Clock, Activity, Brain, CheckCircle2, Edit3, XCircle } from "lucide-react";
import type {
  TimelineEvent,
  Signal,
  Recommendation,
  Decision,
} from "../lib/types";
import { formatDate, timeAgo } from "./ScoreBadge";

interface Props {
  accountId: string;
  events: TimelineEvent[];
  signals: Signal[];
  recommendation: Recommendation | null;
  decision: Decision | null;
  onRefresh: () => void;
}

interface TimelineItem {
  id: string;
  type: "signal" | "health_change" | "recommendation" | "decision";
  timestamp: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

function buildTimelineItems(
  events: TimelineEvent[],
  signals: Signal[],
  recommendation: Recommendation | null,
  decision: Decision | null
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Add signal events
  for (const signal of signals) {
    items.push({
      id: `signal-${signal.id}`,
      type: "signal",
      timestamp: signal.recorded_at,
      label: signal.type.replace(/_/g, " "),
      description:
        signal.enrichment_summary ??
        `Severity: ${signal.severity ?? "none"}`,
      icon: <Activity className="w-3.5 h-3.5" />,
      color: "var(--color-secondary)",
    });
  }

  // Add recommendation event
  if (recommendation) {
    items.push({
      id: `rec-${recommendation.id}`,
      type: "recommendation",
      timestamp: recommendation.created_at,
      label: "AI Recommendation Generated",
      description: `${recommendation.recommended_action.replace(/_/g, " ")} — ${recommendation.risk_explanation.slice(0, 100)}...`,
      icon: <Brain className="w-3.5 h-3.5" />,
      color: "var(--color-accent)",
    });
  }

  // Add decision event
  if (decision) {
    const outcomeLabels: Record<string, string> = {
      approved: "Approved",
      edited_approved: "Edited & Approved",
      rejected: "Rejected",
    };
    const outcomeIcons: Record<string, React.ReactNode> = {
      approved: <CheckCircle2 className="w-3.5 h-3.5" />,
      edited_approved: <Edit3 className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />,
    };
    items.push({
      id: `dec-${decision.id}`,
      type: "decision",
      timestamp: decision.decided_at,
      label: `Maya ${outcomeLabels[decision.outcome] ?? decision.outcome}`,
      description: decision.rejection_reason
        ? `Reason: ${decision.rejection_reason.replace(/_/g, " ")}`
        : "No further changes",
      icon: outcomeIcons[decision.outcome] ?? <CheckCircle2 className="w-3.5 h-3.5" />,
      color:
        decision.outcome === "rejected"
          ? "var(--color-destructive)"
          : "var(--color-healthy)",
    });
  }

  // Add DB events not covered above
  for (const event of events) {
    const meta = event.metadata as Record<string, unknown>;
    const key = `${event.event_type}-${event.id}`;
    if (items.some((i) => i.id === key)) continue;

    items.push({
      id: key,
      type: event.event_type as TimelineItem["type"],
      timestamp: event.created_at,
      label: event.event_type.replace(/_/g, " "),
      description: JSON.stringify(meta),
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "var(--color-foreground)",
    });
  }

  // Sort reverse chronological
  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return items;
}

export function Timeline({
  events,
  signals,
  recommendation,
  decision,
}: Props) {
  const timelineItems = buildTimelineItems(
    events,
    signals,
    recommendation,
    decision
  );

  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <Clock className="w-12 h-12 text-foreground/20 mb-4" />
        <h3 className="text-lg font-heading font-semibold text-foreground/60 mb-1">
          No Timeline Events
        </h3>
        <p className="text-sm text-foreground/40 max-w-sm">
          Events will appear here as signals are recorded, health scores change,
          and AI recommendations are generated.
        </p>
      </div>
    );
  }

  return (
    <div className="relative ml-5 pl-8 border-l-2 border-border animate-fade-in">
      {timelineItems.map((item) => (
        <div key={item.id} className="relative pb-6 last:pb-0">
          {/* Dot */}
          <div
            className="absolute -left-[calc(2rem+6px)] top-1 w-3 h-3 rounded-full border-2 bg-white"
            style={{ borderColor: item.color }}
          />

          {/* Card */}
          <div className="bg-white rounded-xl border border-border p-4 hover:border-foreground/10 transition-all duration-150">
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {item.label}
                  </h4>
                  <span className="text-xs text-foreground/40 shrink-0">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-[10px] text-foreground/30 mt-1">
                  {formatDate(item.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}