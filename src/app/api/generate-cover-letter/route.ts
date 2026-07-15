/**
 * PATCH /api/generate-cover-letter
 *
 * Generates a cover letter in the requested format:
 *  - "text"  → plain text (for simple document use)
 *  - "html"  → styled HTML5 (for web display / HTML download)
 *  - "pdf"   → returns HTML optimized for PDF printing (browser handles PDF conversion)
 *
 * Body: { jobPosting: string, companyResearch: string, format: 'text'|'html'|'pdf', customInstructions?: string }
 * Returns: { content: string, format: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });
    const body = await req.json();
    const jobPosting: string = body.jobPosting || '';
    const companyResearch: string = body.companyResearch || '';
    const format: string = body.format || 'text';
    const customInstructions: string = body.customInstructions || '';

    if (!jobPosting) {
      return NextResponse.json({ error: 'Job posting is required.' }, { status: 400 });
    }

    const profile = await db.profile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!profile || !profile.rawText) {
      return NextResponse.json(
        { error: 'No profile found. Please upload your resume first.' },
        { status: 404 }
      );
    }

    // Build format-specific system prompt
    const formatInstructions = format === 'text'
      ? `Output as PLAIN TEXT. No HTML tags, no markdown. Use proper letter format:
[Date]

[Hiring Manager Name or "Dear Hiring Team,"]

[Body — 4 paragraphs as described]

Sincerely,
[User's Name]`
      : format === 'html'
      ? `Output as STYLED HTML5. Use inline CSS for beautiful formatting. Include:
- A clean letterhead with the user's name
- Proper letter format with date, greeting, body, sign-off
- Professional typography (serif font, 14px body, 1.6 line-height)
- Subtle accent color matching the user's professional brand
- Max width 700px, centered, with padding
- Print-friendly
Return ONLY the HTML (no markdown fences).`
      : `Output as HTML optimized for PDF printing. Use:
- A4 page size considerations (210mm width)
- Print-friendly margins (20mm)
- Professional serif typography
- Clean black text on white background
- Proper page breaks if content is long
- Inline CSS only (no external stylesheets)
Return ONLY the HTML (no markdown fences).`;

    const systemPrompt = `You are an expert cover letter writer. Follow the 4-paragraph formula:
1. Why THIS company — reference a specific recent fact, product, or value you researched
2. Why YOU — connect 2-3 specific achievements from the profile to the job's stated needs
3. What you'll DO — propose concrete value you'll add in the first 90 days
4. Call to action — request a 15-minute meeting

Tone: confident, specific, never generic or desperate. Maximum 350 words.

${formatInstructions}`;

    const userPrompt = `=== USER'S RESUME/PROFILE ===
${profile.rawText}

=== TARGET ROLE ===
${profile.targetRole || 'Not specified'}

=== TARGET JOB POSTING ===
${jobPosting}

=== WHAT THE USER KNOWS ABOUT THE COMPANY ===
${companyResearch || '(no specific research provided — infer from job posting)'}

${customInstructions ? `=== CUSTOM INSTRUCTIONS ===\n${customInstructions}\n` : ''}

Write the cover letter now.`;

    // Call GLM
    let content = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      });
      content = completion.choices?.[0]?.message?.content || '';
    } catch (llmErr: any) {
      console.error('Cover letter LLM call failed:', llmErr);
      return NextResponse.json(
        { error: 'AI service unavailable.', detail: llmErr?.message || String(llmErr) },
        { status: 502 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'The model returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      content,
      format,
    });
  } catch (err: any) {
    console.error('Cover letter generation error:', err);
    return NextResponse.json(
      { error: 'Internal server error.', detail: err?.message },
      { status: 500 }
    );
  }
}
