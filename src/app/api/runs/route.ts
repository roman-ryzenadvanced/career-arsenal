/**
 * /api/runs
 * - GET: return recent skill runs (may be CDN-cached)
 * - PATCH: execute a skill via GLM (PATCH is used because POST is blocked by edge layer)
 *   Body: { skillId: string, inputs: Record<string, string> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSkill } from '@/lib/skills';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET() {
  const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });
    const profile = await getCurrentProfile(user.id);

  return NextResponse.json({ runs });
}

// PATCH — execute a skill (using PATCH because POST is blocked by edge layer)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const skillId: string = body.skillId;
    const inputs: Record<string, string> = body.inputs || {};

    if (!skillId) {
      return NextResponse.json({ error: 'Missing skillId in request body.' }, { status: 400 });
    }

    const skill = getSkill(skillId);
    if (!skill) {
      return NextResponse.json({ error: `Unknown skill: ${skillId}` }, { status: 404 });
    }

    for (const inp of skill.inputs) {
      if (inp.required && !inputs[inp.key]?.trim()) {
        return NextResponse.json(
          { error: `Missing required input: ${inp.label}` },
          { status: 400 }
        );
      }
    }

    const profile = await db.profile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!profile || !profile.rawText) {
      return NextResponse.json(
        { error: 'No profile found. Please upload your resume or LinkedIn export first.' },
        { status: 404 }
      );
    }

    const userMessage = skill.userPromptTemplate({
      profile: {
        fullName: profile.fullName,
        rawText: profile.rawText,
        parsedJson: profile.parsedJson,
        targetRole: profile.targetRole,
        targetContext: profile.targetContext,
      },
      inputs,
    });

    let output = '';
    let modelUsed = 'glm-4.6';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: skill.systemPrompt },
          { role: 'user', content: userMessage },
        ],
        thinking: { type: 'disabled' },
      });
      output = completion.choices?.[0]?.message?.content || '';
      if (!output) {
        return NextResponse.json(
          { error: 'The model returned an empty response. Please try again.' },
          { status: 502 }
        );
      }
    } catch (llmErr: any) {
      console.error('LLM call failed:', llmErr);
      return NextResponse.json(
        { error: 'LLM call failed.', detail: llmErr?.message || String(llmErr) },
        { status: 502 }
      );
    }

    const run = await db.skillRun.create({
      data: {
        profileId: profile.id,
        skillId: skill.id,
        skillName: skill.name,
        input: JSON.stringify(inputs),
        output,
        modelUsed,
      },
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      skillId: skill.id,
      skillName: skill.name,
      output,
      modelUsed,
      createdAt: run.createdAt,
    });
  } catch (err: any) {
    console.error('Skill run error:', err);
    return NextResponse.json(
      { error: 'Internal server error.', detail: err?.message },
      { status: 500 }
    );
  }
}
