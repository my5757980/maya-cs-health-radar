// ============================================================
// generate-prose — Supabase Edge Function
// Calls Claude Opus (via AI/ML API, OpenAI-compatible) to
// generate risk explanation, action recommendation, and
// outreach draft in one structured call.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const ALLOWED_ACTIONS = [
  'schedule_check_in_call',
  'send_reengagement_email',
  'escalate_to_support',
  'offer_training_session',
  'executive_sponsor_outreach',
  'flag_for_renewal_risk_review',
] as const;

const AI_ML_BASE = 'https://api.aimlapi.com/v1';
const MODEL_QUALITY = 'anthropic/claude-opus-5';

interface ProseInput {
  account_id: string;
  health_snapshot_id: string;
  score: number;
  tier: string;
  contributing: Array<{
    signal_id: string;
    type: string;
    severity: string | null;
    age_days: number;
    penalty: number;
  }>;
  signals: Array<{
    id: string;
    type: string;
    severity: string | null;
    recorded_at: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const input: ProseInput = await req.json();
    const { account_id, health_snapshot_id, score, tier, contributing, signals } = input;

    if (!account_id || !health_snapshot_id || !signals) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Never fabricate prose — if fewer than 2 groundable signals, short-circuit
    if (signals.length < 2) {
      const { data: fallbackRec } = await supabaseClient
        .from('recommendations')
        .insert({
          account_id,
          health_snapshot_id,
          risk_explanation: 'Not enough signal data to generate an AI assessment. At least 2 signals are needed for a grounded analysis.',
          recommended_action: 'schedule_check_in_call',
          outreach_draft_subject: 'Checking in',
          outreach_draft_body: 'Hi team, I wanted to check in and see how things are going. Let me know if there is anything we can help with.',
          cited_signal_ids: [],
          justification: 'Insufficient signal data — fewer than 2 signals available for analysis.',
          confidence: 'low',
          status: 'insufficient_signal',
        })
        .select()
        .single();

      return new Response(
        JSON.stringify(fallbackRec ?? { status: 'insufficient_signal', reason: 'Fewer than 2 signals available' }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Get account info
    const { data: account } = await supabaseClient
      .from('accounts')
      .select('name, industry')
      .eq('id', account_id)
      .single();

    // Get the signal IDs we know about (for validation later)
    const knownSignalIds = new Set(signals.map((s) => s.id));

    // Build the prompt with all context
    const systemPrompt = `You are a Customer Success intelligence assistant. Given account signals and a health score, you output a structured risk assessment.

You MUST return a JSON object with exactly these fields:
- "risk_explanation": 2-3 sentence plain-English explanation of what's driving the risk
- "recommended_action": one of: ${ALLOWED_ACTIONS.join(', ')}
- "justification": why this action is the right one, referencing specific signals
- "confidence": "low", "medium", or "high"
- "outreach_draft_subject": a short email subject line (max 10 words)
- "outreach_draft_body": a 3-5 sentence outreach email body (ready to send, human tone)
- "cited_signal_ids": an array of at least 2 signal IDs from those provided below that support this assessment

CRITICAL RULES:
- Only use signal IDs from the list provided below. Never invent signal IDs.
- The recommended_action MUST be exactly one of the allowed values listed above.
- cited_signal_ids must contain at least 2 valid signal IDs.
- NEVER write a raw signal ID (a UUID like "a0000000-0000-0000-0000-000000000301") into risk_explanation, justification, outreach_draft_subject, or outreach_draft_body. You may use the IDs internally to reason about which signals to cite, and you MUST still return them in cited_signal_ids — but in prose you must refer to signals in human terms, e.g. "the critical payment issue from 7 Aug" or "the high-severity support ticket opened 5 Aug". Never expose a database id to the reader.`;

    const userPrompt = `Account: ${account?.name ?? 'Unknown'} (${account?.industry ?? 'Unknown industry'})
Health Score: ${score}/100 (Tier: ${tier})

Signal Breakdown:
${contributing.map((c) =>
  `  - Signal ${c.signal_id}: type=${c.type}, severity=${c.severity ?? 'none'}, age=${c.age_days}d, penalty=${c.penalty}`
).join('\n')}

Total Signals (with IDs):
${signals.map((s) =>
  `  - ${s.id}: type=${s.type}, severity=${s.severity ?? 'none'}, recorded=${s.recorded_at}`
).join('\n')}

Generate the risk assessment.`;

    const apiKey = Deno.env.get('AIML_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI/ML API key not configured', status: 'insufficient_signal' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Try up to 2 times (initial + 1 retry)
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(`${AI_ML_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MODEL_QUALITY,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `AI/ML API error (${response.status}): ${errText}`;
          if (attempt === 1) break;
          continue;
        }

        const body = await response.json();
        const content: string = body.choices?.[0]?.message?.content ?? '';

        // Parse the JSON response
        let parsed: Record<string, unknown>;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON found in response');
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          lastError = 'Failed to parse JSON from model response';
          if (attempt === 1) break;
          continue;
        }

        // Validate cited_signal_ids
        const citedIds: string[] = (parsed.cited_signal_ids as string[]) ?? [];
        const allValid = citedIds.every((id) => knownSignalIds.has(id));
        if (!allValid) {
          lastError = 'Model invented signal IDs not in the provided set';
          if (attempt === 1) break;
          continue;
        }

        // Never leak raw signal IDs into user-visible prose
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const proseHasUuid = ['risk_explanation', 'justification', 'outreach_draft_subject', 'outreach_draft_body']
          .some((field) => typeof parsed[field] === 'string' && uuidPattern.test(parsed[field] as string));
        if (proseHasUuid) {
          lastError = 'Prose field contains a raw signal ID — must reference signals in human terms only';
          if (attempt === 1) break;
          continue;
        }

        if (citedIds.length < 2) {
          lastError = 'Fewer than 2 cited signal IDs';
          if (attempt === 1) break;
          continue;
        }

        // Validate action
        const action = parsed.recommended_action as string;
        if (!ALLOWED_ACTIONS.includes(action as typeof ALLOWED_ACTIONS[number])) {
          lastError = `Invalid action: ${action}`;
          if (attempt === 1) {
            // Fall back to the dominant driver's default action
            const dominantSignal = signals.reduce((a, b) => {
              const aPenalty = contributing.find(c => c.signal_id === a.id)?.penalty ?? 0;
              const bPenalty = contributing.find(c => c.signal_id === b.id)?.penalty ?? 0;
              return aPenalty > bPenalty ? a : b;
            });
            const defaultActionMap: Record<string, string> = {
              support_ticket: 'schedule_check_in_call',
              usage_drop: 'send_reengagement_email',
              payment_issue: 'flag_for_renewal_risk_review',
              nps_response: 'schedule_check_in_call',
              feature_adoption: 'offer_training_session',
              manual_note: 'schedule_check_in_call',
            };
            parsed.recommended_action = defaultActionMap[dominantSignal.type] ?? 'schedule_check_in_call';
            parsed.confidence = 'low';
            const recommendation = await writeToDb(supabaseClient, account_id, health_snapshot_id, parsed, knownSignalIds, defaultActionMap[dominantSignal.type] ?? 'schedule_check_in_call');
            return new Response(JSON.stringify(recommendation), { status: 200, headers: corsHeaders });
          }
          continue;
        }

        // All validations passed — write to DB
        const recommendation = await writeToDb(supabaseClient, account_id, health_snapshot_id, parsed, knownSignalIds, action);
        return new Response(JSON.stringify(recommendation), { status: 200, headers: corsHeaders });
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
        if (attempt === 1) break;
      }
    }

    // Both attempts failed — save as insufficient_signal
    const { data: fallbackRec } = await supabaseClient
      .from('recommendations')
      .insert({
        account_id,
        health_snapshot_id,
        risk_explanation: 'Unable to generate assessment automatically due to a model error.',
        recommended_action: 'schedule_check_in_call',
        outreach_draft_subject: 'Checking in',
        outreach_draft_body: 'Hi team, I wanted to check in and see how things are going. Let me know if there is anything we can help with.',
        cited_signal_ids: [],
        justification: lastError ?? 'Unknown error',
        confidence: 'low',
        status: 'insufficient_signal',
      })
      .select()
      .single();

    return new Response(
      JSON.stringify(fallbackRec ?? { status: 'insufficient_signal', reason: lastError }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function writeToDb(
  supabaseClient: ReturnType<typeof createClient>,
  account_id: string,
  health_snapshot_id: string,
  parsed: Record<string, unknown>,
  knownSignalIds: Set<string>,
  action: string
) {
  const citedIds = ((parsed.cited_signal_ids as string[]) ?? []).filter(id => knownSignalIds.has(id));
  const confidence = ['low', 'medium', 'high'].includes(parsed.confidence as string)
    ? (parsed.confidence as string)
    : 'medium';

  // Insert recommendation
  const { data: rec, error: recError } = await supabaseClient
    .from('recommendations')
    .insert({
      account_id,
      health_snapshot_id,
      risk_explanation: (parsed.risk_explanation as string) ?? 'Risk analysis pending.',
      recommended_action: action,
      outreach_draft_subject: (parsed.outreach_draft_subject as string) ?? 'Checking in',
      outreach_draft_body: (parsed.outreach_draft_body as string) ?? '',
      cited_signal_ids: citedIds,
      justification: (parsed.justification as string) ?? '',
      confidence,
      status: 'pending',
    })
    .select()
    .single();

  if (recError) throw new Error(`Failed to insert recommendation: ${recError.message}`);

  // Insert outreach draft
  const { error: draftError } = await supabaseClient
    .from('outreach_drafts')
    .insert({
      recommendation_id: rec.id,
      subject: (parsed.outreach_draft_subject as string) ?? '',
      body: (parsed.outreach_draft_body as string) ?? '',
      final_text: null,
      was_edited: false,
    });

  if (draftError) {
    console.error('Failed to insert outreach draft:', draftError);
  }

  return rec;
}