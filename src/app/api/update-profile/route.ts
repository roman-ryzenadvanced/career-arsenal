/**
 * PATCH /api/profile
 * Updates the current profile's targetRole, targetContext, or fullName.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!profile) {
      return NextResponse.json({ error: 'No profile found. Upload a resume first.' }, { status: 404 });
    }

    const updated = await db.profile.update({
      where: { id: profile.id },
      data: {
        fullName: body.fullName !== undefined ? body.fullName : profile.fullName,
        targetRole: body.targetRole !== undefined ? body.targetRole : profile.targetRole,
        targetContext: body.targetContext !== undefined ? body.targetContext : profile.targetContext,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        id: updated.id,
        fullName: updated.fullName,
        targetRole: updated.targetRole,
        targetContext: updated.targetContext,
      },
    });
  } catch (err: any) {
    console.error('Profile patch error:', err);
    return NextResponse.json({ error: 'Failed to update profile.', detail: err?.message }, { status: 500 });
  }
}
