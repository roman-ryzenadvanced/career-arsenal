/**
 * GET /api/runs
 * Returns recent skill runs for the current profile, newest first.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const profile = await db.profile.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!profile) return NextResponse.json({ runs: [] });

  const runs = await db.skillRun.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      skillId: true,
      skillName: true,
      output: true,
      modelUsed: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ runs });
}
