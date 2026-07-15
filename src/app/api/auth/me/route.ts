/**
 * GET /api/auth/me — returns the current logged-in user
 * POST /api/auth/logout — clears the session cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: user.id, botUsername: user.botUsername },
  });
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('career-arsenal-session');
  return response;
}
