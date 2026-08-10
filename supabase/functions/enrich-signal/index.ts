// ============================================================
// enrich-signal — Supabase Edge Function
// Calls Claude Sonnet (via AI/ML API, OpenAI-compatible) to
// generate a short enrichment summary for a signal.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const AI_ML_BASE = 'https://api.aimlapi.com/v1';
const MODEL_FAST = 'anthropic/claude-sonnet-5';

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

    const { signal_id } = await req.json();
    if (!signal_id) {
      return new Response(
        JSON.stringify({ error: 'signal_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch the signal
    const { data: signal, error: signalError } = await supabaseClient
      .from('signals')
      .select('id, type, severity, details, recorded_at, enrichment_summary')
      .eq('id', signal_id)
      .single();

    if (signalError || !signal) {
      return new Response(
        JSON.stringify({ error: 'Signal not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // If already enriched, return cached
    if (signal.enrichment_summary) {
      return new Response(
        JSON.stringify({ signal_id, enrichment_summary: signal.enrichment_summary, cached: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get('AIML_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI/ML API key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Build a concise prompt for the signal
    let userPrompt = `Summarize this customer success signal in one concise sentence (max 25 words):\n\n`;
    userPrompt += `Type: ${signal.type}\n`;
    if (signal.severity) userPrompt += `Severity: ${signal.severity}\n`;
    userPrompt += `Details: ${JSON.stringify(signal.details)}\n`;

    try {
      const response = await fetch(`${AI_ML_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_FAST,
          max_tokens: 128,
          messages: [
            {
              role: 'system',
              content: 'You produce one concise sentence summarizing a customer success signal. Output the summary directly, no preamble, no JSON wrapping, no quotes.',
            },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(
          JSON.stringify({ error: `AI/ML API error: ${errText}` }),
          { status: 502, headers: corsHeaders }
        );
      }

      const body = await response.json();
      const summary = (body.choices?.[0]?.message?.content ?? '').trim();

      return new Response(
        JSON.stringify({
          signal_id: signal.id,
          enrichment_summary: summary,
          cached: false,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : 'AI enrichment failed' }),
        { status: 502, headers: corsHeaders }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});