/**
 * Auth helper — extracts the session token from cookies and returns the user.
 * All user-scoped APIs use this to identify which user is making the request.
 */
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  botToken: string;
  botUsername: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('career-arsenal-session')?.value;
    if (!sessionToken) return null;

    const user = await db.user.findFirst({
      where: { sessionToken },
    });

    if (!user) return null;

    return {
      id: user.id,
      botToken: user.botToken,
      botUsername: user.botUsername,
    };
  } catch {
    return null;
  }
}

export async function getCurrentProfile(userId: string) {
  return db.profile.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
