/**
 * PATCH /api/jobs/[id]/apply
 *
 * Full auto-curation flow: generates a tailored resume + cover letter
 * for a specific saved job, based on the user's profile.
 *
 * Body: { coverLetterFormat?: 'text'|'html'|'pdf' }
 * Returns: { application: { id, tailoredResume, coverLetter, coverLetterFormat, status } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json().catch(() => ({}));
    const coverLetterFormat: string = body.coverLetterFormat || 'html';

    // Load the job
    const job = await db.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    // Load the user's profile
    const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!profile || !profile.rawText) {
      return NextResponse.json(
        { error: 'No profile found. Upload your resume first.' },
        { status: 404 }
      );
    }

    const jobContext = `
Job Title: ${job.title}
Company: ${job.company}
${job.location ? `Location: ${job.location}` : ''}
${job.url ? `URL: ${job.url}` : ''}
${job.description ? `Job Description:\n${job.description.substring(0, 3000)}` : 'No detailed description available.'}
`.trim();

    const zai = await ZAI.create();

    // ─── 1. Generate tailored resume ────────────────────────────────────
    let tailoredResume = '';
    try {
      const resumeCompletion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert resume writer. Generate a perfectly tailored resume as markdown.
Mirror the job posting's exact keywords. Quantify achievements. Use action verbs.
Format with clear sections: PROFESSIONAL SUMMARY, CORE SKILLS, WORK EXPERIENCE, EDUCATION.
Output ONLY the resume markdown — no explanation, no code fences.`,
          },
          {
            role: 'user',
            content: `=== CANDIDATE'S CURRENT RESUME ===\n${profile.rawText}\n\n=== TARGET ROLE ===\n${profile.targetRole || job.title}\n\n=== JOB TO TAILOR FOR ===\n${jobContext}\n\n${profile.targetContext ? `=== ADDITIONAL CONTEXT ===\n${profile.targetContext}\n` : ''}\n\nGenerate the tailored resume now.`,
          },
        ],
        thinking: { type: 'disabled' },
      });
      tailoredResume = resumeCompletion.choices?.[0]?.message?.content || '';
    } catch (resumeErr) {
      console.error('Resume generation failed:', resumeErr);
    }

    // ─── 2. Generate cover letter ────────────────────────────────────────
    let coverLetter = '';
    try {
      const clSystemPrompt = coverLetterFormat === 'text'
        ? `You are an expert cover letter writer. Output as PLAIN TEXT. Use proper letter format with date, greeting, 4-paragraph body (Why company, Why you, What you'll do, Call to action), and sign-off. Maximum 350 words.`
        : coverLetterFormat === 'pdf'
        ? `You are an expert cover letter writer. Output as HTML optimized for PDF printing. Use A4-friendly layout, serif typography, print margins. Include letterhead with the candidate's name. Return ONLY HTML — no markdown fences.`
        : `You are an expert cover letter writer. Output as STYLED HTML5 with inline CSS. Include a clean letterhead, professional typography (serif, 14px body), accent color. Max width 700px. Return ONLY HTML — no markdown fences.`;

      const clCompletion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: clSystemPrompt },
          {
            role: 'user',
            content: `=== CANDIDATE'S RESUME ===\n${profile.rawText.substring(0, 2000)}\n\n=== JOB ===\n${jobContext}\n\nWrite the cover letter for ${job.title} at ${job.company}.`,
          },
        ],
        thinking: { type: 'disabled' },
      });
      coverLetter = clCompletion.choices?.[0]?.message?.content || '';
    } catch (clErr) {
      console.error('Cover letter generation failed:', clErr);
    }

    // ─── 3. Create or update the application record ─────────────────────
    const existingApp = await db.application.findFirst({
      where: { jobId: job.id, profileId: profile.id },
    });

    let application;
    if (existingApp) {
      application = await db.application.update({
        where: { id: existingApp.id },
        data: {
          tailoredResume,
          coverLetter,
          coverLetterFormat,
          status: 'ready',
        },
      });
    } else {
      application = await db.application.create({
        data: {
          profileId: profile.id,
          jobId: job.id,
          tailoredResume,
          coverLetter,
          coverLetterFormat,
          status: 'ready',
        },
      });
    }

    // Update job status to "applied"
    await db.jobPosting.update({
      where: { id: job.id },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      application: {
        id: application.id,
        tailoredResume,
        coverLetter,
        coverLetterFormat,
        status: application.status,
      },
    });
  } catch (err: any) {
    console.error('Auto-apply error:', err);
    return NextResponse.json(
      { error: 'Auto-apply failed.', detail: err?.message },
      { status: 500 }
    );
  }
}
