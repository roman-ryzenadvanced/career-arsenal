/**
 * PATCH /api/jobs/[id]/status
 *
 * Update a job's status (saved → applied → interviewing → offered → rejected)
 *
 * Body: { status: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json();
    const status: string = body.status;

    const validStatuses = ['saved', 'applied', 'interviewing', 'offered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const job = await db.jobPosting.update({
      where: { id: jobId },
      data: { status },
    });

    return NextResponse.json({ ok: true, job });
  } catch (err: any) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: 'Failed to update status.', detail: err?.message }, { status: 500 });
  }
}
