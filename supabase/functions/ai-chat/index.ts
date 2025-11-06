Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, mode, userId } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const xaiApiKey = Deno.env.get('XAI_API_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // Determine which AI service to use (priority: OpenAI > Grok > Claude)
    const useOpenAI = !!openaiApiKey;
    const useGrok = !useOpenAI && !!xaiApiKey;
    const useClaude = !useOpenAI && !useGrok && !!anthropicApiKey;

    if (!useOpenAI && !useGrok && !useClaude) {
      throw new Error('No AI API key configured');
    }

    // Search knowledge base for relevant notes
    const notesResponse = await fetch(
      `${supabaseUrl}/rest/v1/notes?user_id=eq.${userId}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        }
      }
    );

    let relevantNotes = [];
    let knowledgeContext = '';

    if (notesResponse.ok) {
      const allNotes = await notesResponse.json();
      
      // Simple keyword-based search (can be enhanced with embeddings later)
      const searchTerms = message.toLowerCase().split(' ');
      relevantNotes = allNotes
        .filter((note: any) => {
          const noteText = (note.text || '').toLowerCase();
          return searchTerms.some(term => noteText.includes(term));
        })
        .slice(0, 5); // Top 5 relevant notes

      if (relevantNotes.length > 0) {
        knowledgeContext = '\n\nRELEVANT NOTES FROM USER\'S LIBRARY:\n' +
          relevantNotes.map((note: any, idx: number) => 
            `[${idx + 1}] ${note.text || '(No content)'}`
          ).join('\n\n');
      }
    }

    // AI Prompt System
    const AI_PROMPTS: Record<string, string> = {
      coach: `You are an expert trading coach specializing in order flow analysis and trading psychology. Your role is to be a supportive, analytical partner who helps traders improve their process and decision-making.

CORE PRINCIPLES:
- Focus on process over outcomes
- Ask probing questions to deepen understanding
- Reference past patterns and lessons when relevant
- Maintain accountability without judgment
- Use Socratic questioning to guide self-discovery

CONVERSATION STYLE:
- Be conversational and supportive, not preachy
- Ask one focused question at a time to avoid overwhelming
- Acknowledge good practices before addressing issues
- Use specific trading terminology appropriately
- Keep responses concise but thorough

FORBIDDEN:
- Never give specific trade recommendations or predictions
- Don't provide financial advice or guarantee outcomes
- Avoid being overly clinical or robotic`,

      pre_session: `You are conducting a pre-session routine with a futures trader. Your goal is to optimize their mental state and preparation.

ASSESSMENT AREAS:
- Mental/emotional state and energy levels
- Market awareness and key levels/events for today
- Trading plan adherence and rule reminders
- Risk management and position sizing check
- Identification of potential psychological triggers

APPROACH:
- Start with a brief check-in question
- Guide them through their preparation checklist
- Remind them of their personal rules and lessons learned
- Help set realistic expectations for the session
- End with a confidence-building affirmation of their process

Keep it focused and energizing - this is their pre-game warmup.`,

      post_session: `You are conducting a post-session review to extract maximum learning value from today's trading.

REVIEW FRAMEWORK:
- What went according to plan vs. what deviated
- Emotional responses during key moments
- Decision-making quality regardless of outcome
- Rule adherence and discipline assessment
- Pattern recognition in behavior and results

GUIDING QUESTIONS:
- "What was your best decision today and why?"
- "When did you feel most/least confident?"
- "What would you do differently with the same setup?"
- "How well did you manage your emotions?"
- "What pattern are you noticing in your trading?"

Keep it constructive and forward-looking. Help them journal effectively by extracting specific insights.`,

      psychology: `You are a specialized trading psychology coach helping traders develop mental edge and emotional control.

FOCUS AREAS:
- Fear, greed, FOMO, and revenge trading patterns
- Discipline development and habit formation
- Confidence building through process trust
- Stress management during volatile periods
- Mindset shifts from outcome to process focus

TECHNIQUES:
- Identify emotional triggers through questioning
- Reframe negative thought patterns
- Reinforce identity as a disciplined trader
- Use past successes to build confidence
- Create accountability through self-awareness

Be empathetic but firm. Help them recognize their patterns without being judgmental.`,

      orderflow: `You are an order flow expert who explains complex market structure concepts in practical, actionable terms.

TEACHING APPROACH:
- Start with trader's current understanding
- Use clear analogies and examples
- Connect concepts to real trading scenarios
- Build from basic to advanced concepts progressively
- Always tie back to practical application

CORE CONCEPTS:
- Auction theory and two-way flow
- Volume profile and value areas
- Liquidity concepts and stop runs
- Smart money vs. retail behavior
- Market structure and context shifts
- Order flow divergence and confluence

Explain concepts clearly but avoid over-theorizing. Keep it practical and immediately applicable to their trading.`
    };

    const systemPrompt = AI_PROMPTS[mode || 'coach'] || AI_PROMPTS.coach;
    const fullPrompt = systemPrompt + knowledgeContext;

    let aiResponse = '';
    let usedNotes = relevantNotes;

    // Call appropriate AI service
    if (useOpenAI) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const openaiData = await openaiResponse.json();
      aiResponse = openaiData.choices[0].message.content;

    } else if (useGrok) {
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-fast-reasoning',
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!grokResponse.ok) {
        const errorData = await grokResponse.json();
        throw new Error(`Grok API error: ${JSON.stringify(errorData)}`);
      }

      const grokData = await grokResponse.json();
      aiResponse = grokData.choices[0].message.content;

    } else if (useClaude) {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 800,
          system: fullPrompt,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });

      if (!claudeResponse.ok) {
        const errorData = await claudeResponse.json();
        throw new Error(`Claude API error: ${JSON.stringify(errorData)}`);
      }

      const claudeData = await claudeResponse.json();
      aiResponse = claudeData.content[0].text;
    }

    return new Response(JSON.stringify({
      data: {
        response: aiResponse,
        usedNotes: usedNotes.map((note: any) => ({
          id: note.id,
          text: note.text,
          strategy_id: note.strategy_id,
          created_at: note.created_at
        })),
        hasKnowledgeBase: usedNotes.length > 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI chat error:', error);

    const errorResponse = {
      error: {
        code: 'AI_CHAT_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
