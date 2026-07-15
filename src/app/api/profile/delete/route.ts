/**
 * DELETE /api/profile
 * Wipes the current profile + all its uploads + skill runs.
 * Used by the "Clean slate" button to give the user a fresh start.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE() {
  try {
    const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!profile) {
      return NextResponse.json({ ok: true, deleted: false, message: 'Nothing to delete.' });
    }
    await db.skillRun.deleteMany({ where: { profileId: profile.id } });
    await db.uploadedFile.deleteMany({ where: { profileId: profile.id } });
    await db.profile.delete({ where: { id: profile.id } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err: any) {
    console.error('Profile delete error:', err);
    return NextResponse.json(
      { error: 'Failed to clear profile.', detail: err?.message },
      { status: 500 }
    );
  }
}
