// ============================================================
// recalculate-health — Supabase Edge Function
// Calculates deterministic health score for an account.
// If score crosses risk threshold (<70), calls generate-prose.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

interface SignalInput {
  id: string;
  type: string;
  severity: string | null;
  recorded_at: string;
}

interface PenaltyBreakdown {
  signal_id: string;
  type: string;
  severity: string | null;
  age_days: number;
  penalty: number;
}

interface ScoreResult {
  score: number;
  tier: string;
  contributing: PenaltyBreakdown[];
}

// --- CORS headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// --- Scoring constants ---
const BASE_WEIGHT: Record<string, number> = {
  usage_drop: 15,
  payment_issue: 14,
  nps_response: 13,
  support_ticket: 12,
  login_gap: 10,
  feature_adoption: 8,
  manual_note: 0,
};

const SEVERITY_MULT: Record<string, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.75,
  critical: 2.5,
};

function decay(ageDays: number): number {
  return Math.max(0, 1 - ageDays / 90);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeHealthScore(signals: SignalInput[]): ScoreResult {
  const sorted = [...signals].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
  const now = new Date();
  const dayCount = new Map<string, number>();
  let totalPenalty = 0;
  const contributing: PenaltyBreakdown[] = [];
  let mostRecentSignalDate: Date | null = null;

  for (const signal of sorted) {
    const signalDate = new Date(signal.recorded_at);
    if (mostRecentSignalDate === null || signalDate > mostRecentSignalDate) {
      mostRecentSignalDate = signalDate;
    }

    const ageDays = (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);
    let penalty = 0;
    const base = BASE_WEIGHT[signal.type] ?? 0;

    if (base > 0) {
      const dayKey = `${signal.type}::${signalDate.toISOString().slice(0, 10)}`;
      const countSoFar = dayCount.get(dayKey) ?? 0;
      if (countSoFar < 2) {
        const sevMult = SEVERITY_MULT[signal.severity ?? ''] ?? 1.0;
        const d = decay(ageDays);
        penalty = base * sevMult * d;
        dayCount.set(dayKey, countSoFar + 1);
      }
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

  const daysSinceLastSignal =
    mostRecentSignalDate
      ? (now.getTime() - mostRecentSignalDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

  let tier: string;
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

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get JWT user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { account_id } = await req.json();
    if (!account_id) {
      return new Response(
        JSON.stringify({ error: 'account_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all signals for this account
    const { data: signals, error: signalsError } = await supabaseClient
      .from('signals')
      .select('id, type, severity, recorded_at')
      .eq('account_id', account_id)
      .order('recorded_at', { ascending: true });

    if (signalsError) {
      return new Response(
        JSON.stringify({ error: signalsError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Compute score
    const result = computeHealthScore(signals ?? []);

    // Save health snapshot
    const { data: snapshot, error: snapshotError } = await supabaseClient
      .from('health_snapshots')
      .insert({
        account_id,
        score: result.score,
        tier: result.tier,
        breakdown: {
          support_ticket_velocity: 0,
          usage: 0,
          billing: 0,
          nps: 0,
          feature_adoption: 0,
        },
        contributing: result.contributing,
      })
      .select()
      .single();

    if (snapshotError) {
      return new Response(
        JSON.stringify({ error: snapshotError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If score crosses the risk threshold (<70), call generate-prose
    let recommendation = null;
    if (result.score < 70) {
      try {
        const proseResponse = await supabaseClient.functions.invoke('generate-prose', {
          body: {
            account_id,
            health_snapshot_id: snapshot.id,
            score: result.score,
            tier: result.tier,
            contributing: result.contributing,
            signals,
          },
        });

        if (!proseResponse.error && proseResponse.data) {
          recommendation = proseResponse.data;
        }
      } catch (proseErr) {
        // Log but don't fail the whole request — the snapshot was saved
        console.error('generate-prose invocation failed:', proseErr);
      }
    }

    return new Response(
      JSON.stringify({
        snapshot,
        recommendation,
        score: result.score,
        tier: result.tier,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});