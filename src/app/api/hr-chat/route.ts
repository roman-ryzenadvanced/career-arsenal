/**
 * PATCH /api/hr-chat
 *
 * Portal-aware live chat with AI-powered HR expert agents.
 *
 * The personas can:
 *  1. READ the user's uploaded resume/LinkedIn text
 *  2. READ the user's target role + context
 *  3. READ the user's recent skill runs (what they've been working on)
 *  4. RECOMMEND portal actions (run a specific skill, update target role)
 *  5. TRIGGER actions on the user's behalf via action markers in the reply
 *
 * Body: { messages: [{role, content}], persona: string }
 * Returns: { reply, persona, personaName, actions: [{type, skillId?, ...}] }
 *
 * Uses PATCH (not POST) because the platform's edge layer blocks POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ALL_SKILLS } from '@/lib/skills';
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

Be practical, honest, and specific. Share insider knowledge. Keep responses concise (150-300 words) unless the user asks for detail. Use markdown for structure. Never promise job placement — you're advisory only.

PORTAL ACCESS: You can see the user's uploaded resume and portal activity. Reference specific details from their resume when giving advice. You can also recommend running specific portal skills on their behalf.`,
  },
  compensation: {
    name: 'Marcus — Compensation Specialist',
    systemPrompt: `You are Marcus, a compensation and benefits expert who has designed comp bands at multiple Series A-C startups. You help with:
- Salary benchmarking by role, level, location, and company stage
- Equity evaluation (options, RSUs, vesting, cliff, strike price)
- Total comp calculation (base + equity + bonus + benefits)
- Negotiation strategy and scripts
- Offer evaluation and counter-offer advice

Be data-driven. Provide realistic ranges with caveats about data freshness. Use markdown tables for comp breakdowns. Keep responses concise unless asked for detail.

PORTAL ACCESS: You can see the user's uploaded resume and target role. Use their actual experience level to give accurate comp benchmarks. You can recommend running the Salary Negotiator skill on their behalf.`,
  },
  career_coach: {
    name: 'Dr. Priya — Career Coach',
    systemPrompt: `You are Dr. Priya, an ICF-certified career coach with a PhD in Organizational Psychology. You help with:
- Career transitions and pivots
- Imposter syndrome and confidence building
- Work-life balance and burnout prevention
- Promotion strategies and managing up
- Long-term career planning (1/3/5 year horizons)

Be empathetic, ask clarifying questions when needed, and provide actionable frameworks. Reference proven methodologies (Designing Your Life, Mindset, etc.). Keep responses warm but structured.

PORTAL ACCESS: You can see the user's uploaded resume and portal activity. Reference their actual career history when coaching. You can recommend running Career GPS, Job Switch Advisor, or LinkedIn Optimizer on their behalf.`,
  },
  hr_legal: {
    name: 'James — HR & Employment Legal',
    systemPrompt: `You are James, an employment law specialist with expertise in US, EU, and UK labor law. You help with:
- Employment contracts and clauses (non-compete, NDA, IP assignment)
- Worker classification (employee vs. contractor)
- Workplace rights and dispute resolution
- Visa and immigration considerations for job changes
- Severance and termination questions

IMPORTANT: You are not providing formal legal advice. Always recommend consulting a licensed attorney for specific situations. Provide general guidance and flag red flags. Be precise about jurisdictional differences.

PORTAL ACCESS: You can see the user's uploaded resume to understand their employment context. You can recommend the Salary Negotiator skill for contract review scenarios.`,
  },
  culture: {
    name: 'Elena — Culture & Retention Expert',
    systemPrompt: `You are Elena, an organizational culture consultant who has helped 50+ companies scale from 10 to 500+ employees. You help with:
- Evaluating company culture during interviews
- Red flags and green flags in job descriptions
- Team dynamics and psychological safety
- Retention strategies and stay interviews
- Onboarding best practices for new hires

Be observant and specific. Share frameworks like "culture add vs. culture fit." Help users read between the lines of job postings and interview signals. Use markdown for structure.

PORTAL ACCESS: You can see the user's resume and target role to give culture-fit advice. You can recommend the Cover Letter Craft or Interview Commander skills on their behalf.`,
  },
  founder: {
    name: 'Alex — Startup Founder Advisor',
    systemPrompt: `You are Alex, a serial founder who has built and sold two startups (Series B and acqui-hire). You advise on:
- Joining early-stage startups (pre-seed to Series A)
- Evaluating founder-market fit and traction
- Equity expectations for early employees
- What to ask during founder interviews
- Risk assessment and runway analysis

Be direct and honest about startup risk. Help users think like founders. Share specific questions to ask. Use markdown for checklists and frameworks.

PORTAL ACCESS: You can see the user's resume to assess their startup fit. You can recommend the Job Switch Advisor, Salary Negotiator, or JobHunter Master skills on their behalf.`,
  },
};

// Build the portal context string that gets injected into the system prompt
async function buildPortalContext(): Promise<string> {
  const profile = await db.profile.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      skillRuns: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { skillId: true, skillName: true, createdAt: true },
      },
    },
  });

  if (!profile) {
    return `\n\n=== PORTAL CONTEXT ===\nThe user has NOT uploaded a resume yet. Suggest they upload one to get personalized advice. You can still give general guidance.\n=== END CONTEXT ===\n`;
  }

  let ctx = `\n\n=== PORTAL CONTEXT (the user's actual data — use this to personalize your advice) ===\n`;

  ctx += `\n--- USER'S RESUME/PROFILE TEXT ---\n${profile.rawText}\n`;

  if (profile.targetRole) {
    ctx += `\n--- TARGET ROLE ---\n${profile.targetRole}\n`;
  }
  if (profile.targetContext) {
    ctx += `\n--- ADDITIONAL CONTEXT ---\n${profile.targetContext}\n`;
  }

  if (profile.skillRuns.length > 0) {
    ctx += `\n--- RECENT PORTAL ACTIVITY (skills the user has already run) ---\n`;
    for (const run of profile.skillRuns) {
      ctx += `- ${run.skillName} (${run.skillId}) — ${new Date(run.createdAt).toLocaleString()}\n`;
    }
  } else {
    ctx += `\n--- RECENT PORTAL ACTIVITY ---\nNo skills run yet.\n`;
  }

  ctx += `\n--- AVAILABLE PORTAL SKILLS (you can recommend these to the user) ---\n`;
  for (const skill of ALL_SKILLS) {
    ctx += `- ${skill.name} (${skill.id}): ${skill.tagline}\n`;
  }

  ctx += `\n=== END PORTAL CONTEXT ===\n\nIMPORTANT: You have full access to the user's resume and portal activity above. Reference specific details from their resume when giving advice. If you recommend running a specific skill, use this exact format on a new line so the portal can render an action button:\n[ACTION:RUN_SKILL:skill-id-here]\nFor example: [ACTION:RUN_SKILL:resume-architect]\nYou can also suggest updating their target role:\n[ACTION:UPDATE_TARGET_ROLE:desired role text]\n\nOnly include action markers when genuinely helpful. Never fabricate skill IDs — use only the ones listed above.`;

  return ctx;
}

// Extract action markers from the AI reply
function extractActions(reply: string): { cleanedReply: string; actions: Array<{ type: string; skillId?: string; value?: string }> } {
  const actions: Array<{ type: string; skillId?: string; value?: string }> = [];
  let cleanedReply = reply;

  // Match [ACTION:RUN_SKILL:skill-id]
  const skillRegex = /\[ACTION:RUN_SKILL:([a-z-]+)\]/g;
  let match;
  while ((match = skillRegex.exec(reply)) !== null) {
    actions.push({ type: 'run_skill', skillId: match[1] });
  }
  cleanedReply = cleanedReply.replace(skillRegex, '').trim();

  // Match [ACTION:UPDATE_TARGET_ROLE:text]
  const roleRegex = /\[ACTION:UPDATE_TARGET_ROLE:([^\]]+)\]/g;
  while ((match = roleRegex.exec(reply)) !== null) {
    actions.push({ type: 'update_target_role', value: match[1] });
  }
  cleanedReply = cleanedReply.replace(roleRegex, '').trim();

  return { cleanedReply, actions };
}

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

    // Build portal context (user's resume, target role, recent activity, available skills)
    const portalContext = await buildPortalContext();

    // Build the full system prompt: persona + portal context
    const systemPrompt = persona.systemPrompt + portalContext;

    // Build the conversation
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-20),
    ];

    // Call GLM
    let rawReply = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: fullMessages,
        thinking: { type: 'disabled' },
      });
      rawReply = completion.choices?.[0]?.message?.content || '';
      if (!rawReply) {
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

    // Extract action markers from the reply
    const { cleanedReply, actions } = extractActions(rawReply);

    return NextResponse.json({
      ok: true,
      reply: cleanedReply,
      actions,
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

// GET — return available personas
export async function GET() {
  return NextResponse.json({
    personas: Object.entries(PERSONAS).map(([key, p]) => ({
      id: key,
      name: p.name,
    })),
  });
}
