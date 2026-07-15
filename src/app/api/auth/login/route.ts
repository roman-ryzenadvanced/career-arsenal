/**
 * PATCH /api/auth/login
 *
 * Verifies a Telegram bot token and creates a user session.
 * If the user doesn't exist, creates them. Sets a session cookie.
 *
 * Body: { botToken: string }
 * Returns: { ok: true, user: { id, botUsername }, isNewUser: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const botToken: string = body.botToken?.trim();

    if (!botToken || !botToken.includes(':')) {
      return NextResponse.json({ error: 'Invalid bot token. Format: 123456789:ABCdef...' }, { status: 400 });
    }

    // Verify the token with Telegram
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return NextResponse.json({ error: tgData.description || 'Invalid Telegram bot token' }, { status: 401 });
    }

    const botUsername = tgData.result.username;
    const botFirstName = tgData.result.first_name;

    // Check if user already exists
    let user = await db.user.findUnique({ where: { botToken } });
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      user = await db.user.create({
        data: {
          botToken,
          botUsername,
          sessionToken: generateSessionToken(),
        },
      });

      // Create a TelegramBot record (auto-pair)
      await db.telegramBot.create({
        data: {
          userId: user.id,
          botToken,
          botUsername,
          isActive: true,
          defaultPersona: 'recruiter',
        },
      });

      // Set the webhook automatically
      try {
        const webhookUrl = `https://ats-jobs.space-z.ai/api/telegram/webhook`;
        await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
      } catch {}
    } else {
      // Update session token for returning user
      user = await db.user.update({
        where: { id: user.id },
        data: {
          sessionToken: generateSessionToken(),
          botUsername,
        },
      });
    }

    // Set session cookie
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, botUsername },
      isNewUser,
    });

    response.cookies.set('career-arsenal-session', user.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed.', detail: err?.message }, { status: 500 });
  }
}
