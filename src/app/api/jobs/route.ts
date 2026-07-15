/**
 * /api/jobs
 *
 * GET: return all saved jobs for the current profile
 * PATCH: save a job posting (from search results or manual entry)
 *   Body: { job: { title, company, location, url, description, source, salaryRange, jobType, remote } }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

// GET — list all saved jobs
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });

    const profile = await db.profile.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!profile) return NextResponse.json({ jobs: [] });

    const jobs = await db.jobPosting.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        applicationCount: j._count.applications,
      })),
    });
  } catch (err: any) {
    console.error('Jobs GET error:', err);
    return NextResponse.json({ jobs: [] });
  }
}

// PATCH — save a job + auto-calculate match score using AI
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });

    const body = await req.json();
    const jobData = body.job;

    if (!jobData?.title || !jobData?.company) {
      return NextResponse.json({ error: 'Job title and company are required.' }, { status: 400 });
    }

    const profile = await db.profile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!profile) {
      return NextResponse.json({ error: 'No profile found. Upload your resume first.' }, { status: 404 });
    }

    // If the job has a URL but no description, try to fetch it via page_reader
    let description = jobData.description || '';
    if (!description && jobData.url) {
      try {
        const zai = await ZAI.create();
        const pageResult = await zai.functions.invoke('page_reader', { url: jobData.url });
        if (pageResult?.data?.html) {
          // Extract text from HTML (simple strip)
          description = pageResult.data.html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
        }
      } catch (fetchErr) {
        console.error('Failed to fetch job description:', fetchErr);
      }
    }

    // Calculate match score using GLM
    let matchScore: number | undefined;
    let matchReason: string | undefined;
    try {
      const zai = await ZAI.create();
      const matchPrompt = `Analyze the fit between this candidate and job. Return a JSON object with "score" (0-100) and "reason" (1-2 sentences explaining the fit).

Candidate profile:
${profile.rawText.substring(0, 2000)}

Target role: ${profile.targetRole || 'Not specified'}

Job: ${jobData.title} at ${jobData.company}
${jobData.location ? `Location: ${jobData.location}` : ''}
${description ? `Description: ${description.substring(0, 1500)}` : jobData.snippet || ''}

Return ONLY valid JSON: {"score": <number>, "reason": "<string>"}`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert recruiter. Return ONLY valid JSON, no markdown.' },
          { role: 'user', content: matchPrompt },
        ],
        thinking: { type: 'disabled' },
      });

      const matchText = completion.choices?.[0]?.message?.content || '';
      const cleaned = matchText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = JSON.parse(cleaned);
      matchScore = match.score;
      matchReason = match.reason;
    } catch (matchErr) {
      console.error('Match score calculation failed:', matchErr);
    }

    // Save the job
    const job = await db.jobPosting.create({
      data: {
        profileId: profile.id,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location || null,
        url: jobData.url || null,
        description: description || null,
        source: jobData.source || 'web_search',
        salaryRange: jobData.salaryRange || null,
        jobType: jobData.jobType || null,
        remote: jobData.remote ?? false,
        matchScore,
        matchReason,
        status: 'saved',
      },
    });

    return NextResponse.json({
      ok: true,
      job: {
        ...job,
        applicationCount: 0,
      },
    });
  } catch (err: any) {
    console.error('Save job error:', err);
    return NextResponse.json(
      { error: 'Failed to save job.', detail: err?.message },
      { status: 500 }
    );
  }
}

// DELETE — remove a saved job
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('id');
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    await db.application.deleteMany({ where: { jobId } });
    await db.jobPosting.delete({ where: { id: jobId } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Delete job error:', err);
    return NextResponse.json(
      { error: 'Failed to delete job.', detail: err?.message },
      { status: 500 }
    );
  }
}
