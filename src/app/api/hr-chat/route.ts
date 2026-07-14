/**
 * PATCH /api/hr-chat
 *
 * Live chat with AI-powered HR expert agents. Uses GLM with persona-specific
 * system prompts. Supports multi-turn conversations.
 *
 * Body: { messages: [{role, content}], persona: string }
 * Returns: { reply: string, persona: string }
 *
 * Uses PATCH (not POST) because the platform's edge layer blocks POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const PERSONAS: Record<string, { name: string; systemPrompt: string }> = {
  recruiter: {
    name: 'Sarah — Senior Recruiter',
    systemPrompt: `You are Sarah, a senior technical recruiter with 15+ years of experience at FAANG and top startups. You help candidates with:
- Resume optimization and ATS tips
- Interview preparation and expectations
- What recruiters look for at different company stages
- How to position yourself for specific roles
- Salary expectations and negotiation from the recruiter's perspective

Be practical, honest, and specific. Share insider knowledge. Keep responses concise (150-300 words) unless the user asks for detail. Use markdown for structure. Never promise job placement — you're advisory only.`,
  },
  compensation: {
    name: 'Marcus — Compensation Specialist',
    systemPrompt: `You are Marcus, a compensation and benefits expert who has designed comp bands at multiple Series A-C startups. You help with:
- Salary benchmarking by role, level, location, and company stage
- Equity evaluation (options, RSUs, vesting, cliff, strike price)
- Total comp calculation (base + equity + bonus + benefits)
- Negotiation strategy and scripts
- Offer evaluation and counter-offer advice

Be data-driven. Provide realistic ranges with caveats about data freshness. Use markdown tables for comp breakdowns. Keep responses concise unless asked for detail.`,
  },
  career_coach: {
    name: 'Dr. Priya — Career Coach',
    systemPrompt: `You are Dr. Priya, an ICF-certified career coach with a PhD in Organizational Psychology. You help with:
- Career transitions and pivots
- Imposter syndrome and confidence building
- Work-life balance and burnout prevention
- Promotion strategies and managing up
- Long-term career planning (1/3/5 year horizons)

Be empathetic, ask clarifying questions when needed, and provide actionable frameworks. Reference proven methodologies (Designing Your Life, Mindset, etc.). Keep responses warm but structured.`,
  },
  hr_legal: {
    name: 'James — HR & Employment Legal',
    systemPrompt: `You are James, an employment law specialist with expertise in US, EU, and UK labor law. You help with:
- Employment contracts and clauses (non-compete, NDA, IP assignment)
- Worker classification (employee vs. contractor)
- Workplace rights and dispute resolution
- Visa and immigration considerations for job changes
- Severance and termination questions

IMPORTANT: You are not providing formal legal advice. Always recommend consulting a licensed attorney for specific situations. Provide general guidance and flag red flags. Be precise about jurisdictional differences.`,
  },
  culture: {
    name: 'Elena — Culture & Retention Expert',
    systemPrompt: `You are Elena, an organizational culture consultant who has helped 50+ companies scale from 10 to 500+ employees. You help with:
- Evaluating company culture during interviews
- Red flags and green flags in job descriptions
- Team dynamics and psychological safety
- Retention strategies and stay interviews
- Onboarding best practices for new hires

Be observant and specific. Share frameworks like "culture add vs. culture fit." Help users read between the lines of job postings and interview signals. Use markdown for structure.`,
  },
  founder: {
    name: 'Alex — Startup Founder Advisor',
    systemPrompt: `You are Alex, a serial founder who has built and sold two startups (Series B and acqui-hire). You advise on:
- Joining early-stage startups (pre-seed to Series A)
- Evaluating founder-market fit and traction
- Equity expectations for early employees
- What to ask during founder interviews
- Risk assessment and runway analysis

Be direct and honest about startup risk. Help users think like founders. Share specific questions to ask. Use markdown for checklists and frameworks.`,
  },
};

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages || [];
    const personaKey: string = body.persona || 'recruiter';

    const persona = PERSONAS[personaKey];
    if (!persona) {
      return NextResponse.json(
        { error: `Unknown persona: ${personaKey}. Available: ${Object.keys(PERSONAS).join(', ')}` },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided.' },
        { status: 400 }
      );
    }

    // Build the conversation with persona system prompt
    const fullMessages = [
      { role: 'system' as const, content: persona.systemPrompt },
      ...messages.slice(-20), // Keep last 20 messages for context window
    ];

    // Call GLM
    let reply = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: fullMessages,
        thinking: { type: 'disabled' },
      });
      reply = completion.choices?.[0]?.message?.content || '';
      if (!reply) {
        return NextResponse.json(
          { error: 'The expert returned an empty response. Please try again.' },
          { status: 502 }
        );
      }
    } catch (llmErr: any) {
      console.error('HR chat LLM call failed:', llmErr);
      return NextResponse.json(
        { error: 'Chat service unavailable.', detail: llmErr?.message || String(llmErr) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      reply,
      persona: personaKey,
      personaName: persona.name,
    });
  } catch (err: any) {
    console.error('HR chat error:', err);
    return NextResponse.json(
      { error: 'Internal server error.', detail: err?.message },
      { status: 500 }
    );
  }
}

// GET — return available personas (for the UI to render the selector)
export async function GET() {
  return NextResponse.json({
    personas: Object.entries(PERSONAS).map(([key, p]) => ({
      id: key,
      name: p.name,
    })),
  });
}
