/**
 * PATCH /api/generate-resume
 *
 * Generates a structured resume JSON from the user's profile + a target job posting.
 * The AI returns structured data that the frontend renders into one of 20 templates.
 *
 * Body: { jobPosting?: string, customInstructions?: string, format?: string }
 * Returns: { resume: ResumeData, templateRecommendation: string[] }
 *
 * Uses PATCH (not POST) because the platform's edge layer blocks POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const jobPosting: string = body.jobPosting || '';
    const customInstructions: string = body.customInstructions || '';
    const format: string = body.format || 'senior';

    // Load profile
    const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!profile || !profile.rawText) {
      return NextResponse.json(
        { error: 'No profile found. Please upload your resume or LinkedIn export first.' },
        { status: 404 }
      );
    }

    // Build the prompt
    const systemPrompt = `You are an expert resume writer. Generate a perfectly structured resume as JSON.

Return ONLY valid JSON (no markdown, no code fences, no explanation) in this exact schema:
{
  "fullName": "string",
  "title": "string (target role title)",
  "contact": {
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string or empty",
    "linkedin": "string or empty",
    "github": "string or empty",
    "website": "string or empty"
  },
  "summary": "2-3 sentence professional summary tailored to the target role",
  "skills": [
    { "category": "string", "items": ["string", "string"] }
  ],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "dates": "string (e.g. Jan 2022 – Present)",
      "location": "string or empty",
      "bullets": ["achievement with metric", "achievement with metric"]
    }
  ],
  "education": [
    { "degree": "string", "school": "string", "dates": "string", "details": "string or empty" }
  ],
  "certifications": [{ "name": "string", "issuer": "string", "date": "string" }],
  "languages": [{ "name": "string", "level": "string" }]
}

Rules:
1. Mirror the job posting's exact keywords where possible
2. Quantify achievements (X%, $Y, Z users) — never fabricate, use the profile data
3. Use action verbs (Led, Built, Drove, Architected, Reduced, Scaled)
4. 3-5 bullets per experience, most recent role gets the most detail
5. Extract contact info from the profile text
6. If no job posting provided, optimize for the profile's targetRole
7. Return ONLY the JSON object — no text before or after`;

    const userPrompt = `=== USER'S CURRENT RESUME/PROFILE TEXT ===
${profile.rawText}

=== TARGET ROLE ===
${profile.targetRole || 'Not specified — infer from profile'}

=== ADDITIONAL CONTEXT ===
${profile.targetContext || 'None'}

${jobPosting ? `=== TARGET JOB POSTING (mirror these keywords) ===\n${jobPosting}\n` : ''}
${customInstructions ? `=== CUSTOM INSTRUCTIONS FROM USER ===\n${customInstructions}\n` : ''}
${format ? `=== RESUME FORMAT ===\n${format}\n` : ''}

Generate the structured resume JSON now. Return ONLY the JSON.`;

    // Call GLM
    let rawOutput = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      });
      rawOutput = completion.choices?.[0]?.message?.content || '';
    } catch (llmErr: any) {
      console.error('Resume generation LLM call failed:', llmErr);
      return NextResponse.json(
        { error: 'AI service unavailable.', detail: llmErr?.message || String(llmErr) },
        { status: 502 }
      );
    }

    // Parse the JSON (strip any markdown fences if present)
    let resumeData: any;
    try {
      const cleaned = rawOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      resumeData = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('Resume JSON parse failed:', parseErr);
      console.error('Raw output:', rawOutput.substring(0, 500));
      return NextResponse.json(
        { error: 'Failed to parse AI output as JSON. Please try again.' },
        { status: 502 }
      );
    }

    // Recommend templates based on format/category
    const templateRecommendations = recommendTemplates(format, profile.targetRole || '');

    return NextResponse.json({
      ok: true,
      resume: resumeData,
      templateRecommendations,
    });
  } catch (err: any) {
    console.error('Resume generation error:', err);
    return NextResponse.json(
      { error: 'Internal server error.', detail: err?.message },
      { status: 500 }
    );
  }
}

function recommendTemplates(format: string, targetRole: string): string[] {
  const role = targetRole.toLowerCase();
  if (role.includes('engineer') || role.includes('developer') || role.includes('tech')) {
    return ['tech-modern', 'modern-minimal', 'stark-bw', 'compact-twocol'];
  }
  if (role.includes('ceo') || role.includes('cto') || role.includes('coo') || role.includes('vp') || role.includes('director')) {
    return ['executive-dark', 'corporate-blue', 'bold-centered', 'elegant-serif'];
  }
  if (role.includes('design') || role.includes('creative') || role.includes('marketing')) {
    return ['gradient-header', 'creative-circles', 'soft-pastel', 'creative-sidebar'];
  }
  if (format === 'entry') {
    return ['modern-minimal', 'emerald-green', 'creative-circles', 'underlined-headers'];
  }
  return ['modern-minimal', 'classic-professional', 'executive-dark', 'compact-twocol'];
}
