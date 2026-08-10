// ============================================================
// EXACT scoring formula for Maya CS Health Radar
// Pure synchronous TypeScript — no network, no AI, no random
// ============================================================

export type SignalType =
  | 'support_ticket'
  | 'usage_drop'
  | 'payment_issue'
  | 'nps_response'
  | 'feature_adoption'
  | 'manual_note';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type HealthTier = 'healthy' | 'watch' | 'critical' | 'stale';

export interface SignalInput {
  id: string;
  type: SignalType;
  severity: string | null;
  recorded_at: string; // ISO date string
}

export interface PenaltyBreakdown {
  signal_id: string;
  type: SignalType;
  severity: string | null;
  age_days: number;
  penalty: number;
}

export interface ScoreResult {
  score: number;       // 0–100
  tier: HealthTier;
  contributing: PenaltyBreakdown[];
}

// --- Weight table ---
const BASE_WEIGHT: Record<SignalType, number> = {
  usage_drop: 15,
  payment_issue: 14,
  nps_response: 13,
  support_ticket: 12,
  feature_adoption: 8,
  manual_note: 0, // manual notes contribute no penalty by default
};

const SEVERITY_MULT: Record<string, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.75,
  critical: 2.5,
};

/**
 * Decay factor: linear from 1.0 (fresh) to 0.0 (90+ days old).
 * Returns 0 for signals older than 90 days (they don't contribute).
 */
function decay(ageDays: number): number {
  return Math.max(0, 1 - ageDays / 90);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Compute the health score for an account given its signals.
 *
 * Rules:
 *  - At most 2 signals of the same type on the same calendar day contribute.
 *    Extra same-type/same-day signals are stored but score 0 penalty.
 *  - If no signal occurred in the last 90 days, tier = 'stale' regardless of score.
 *
 * @param signals  All signals for the account (pre-sorted or unsorted).
 * @returns        { score, tier, contributing }
 */
export function computeHealthScore(signals: SignalInput[]): ScoreResult {
  // Sort by recorded_at ascending so we can dedupe by day
  const sorted = [...signals].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const now = new Date();

  // Track how many of each type we've already counted per calendar day
  // key = `${type}::${YYYY-MM-DD}`
  const dayCount = new Map<string, number>();

  let totalPenalty = 0;
  const contributing: PenaltyBreakdown[] = [];

  // Track the most recent signal date for the stale check
  let mostRecentSignalDate: Date | null = null;

  for (const signal of sorted) {
    const signalDate = new Date(signal.recorded_at);
    if (mostRecentSignalDate === null || signalDate > mostRecentSignalDate) {
      mostRecentSignalDate = signalDate;
    }

    const ageDays =
      (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);

    // Compute penalty (may be 0)
    let penalty = 0;

    const base = BASE_WEIGHT[signal.type] ?? 0;
    if (base > 0) {
      // Cap: at most 2 signals of the same type on the same calendar day
      const dayKey = `${signal.type}::${signalDate.toISOString().slice(0, 10)}`;
      const countSoFar = dayCount.get(dayKey) ?? 0;

      if (countSoFar < 2) {
        const sevMult = SEVERITY_MULT[signal.severity ?? ''] ?? 1.0;
        const d = decay(ageDays);
        penalty = base * sevMult * d;
        dayCount.set(dayKey, countSoFar + 1);
      }
      // extra same-type/same-day signals → penalty stays 0
    }

    totalPenalty += penalty;

    contributing.push({
      signal_id: signal.id,
      type: signal.type,
      severity: signal.severity,
      age_days: Math.round(ageDays * 10) / 10,
      penalty: Math.round(penalty * 100) / 100,
    });
  }

  const rawScore = Math.round(100 - totalPenalty);
  const score = clamp(rawScore, 0, 100);

  // Stale rule: if no signal in the last 90 days, tier = 'stale'
  const daysSinceLastSignal =
    mostRecentSignalDate
      ? (now.getTime() - mostRecentSignalDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

  let tier: HealthTier;
  if (daysSinceLastSignal > 90) {
    tier = 'stale';
  } else if (score >= 70) {
    tier = 'healthy';
  } else if (score >= 40) {
    tier = 'watch';
  } else {
    tier = 'critical';
  }

  return { score, tier, contributing };
}