/**
 * PATCH /api/auth/login
 *
 * Verifies a Telegram bot token and creates a user session.
 * If the user doesn't exist, creates them + auto-pairs the Telegram bot.
 *
 * Body: { botToken: string }
 * Returns: { ok: true, user: { id, botUsername }, isNewUser: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

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

      // Auto-pair: Create a TelegramBot record linked to the user
      const tgBot = await db.telegramBot.create({
        data: {
          userId: user.id,
          botToken,
          botUsername,
          isActive: true,
          defaultPersona: 'recruiter',
        },
      });

      // Link the bot to a profile if one exists (or will be created later)
      // We don't require a profile at signup — the bot works once a profile is uploaded
      // The webhook will look up the bot by token, not by profileId

      // Set the webhook with a secret_token so we can identify which bot sent the message
      const webhookSecret = user.id; // Use user ID as secret
      try {
        const webhookUrl = `https://ats-jobs.space-z.ai/api/telegram/webhook`;
        await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}&secret_token=${webhookSecret}`, {
          method: 'POST',
        });
        console.log(`Webhook set for bot @${botUsername} with secret ${webhookSecret}`);
      } catch (webhookErr) {
        console.error('Failed to set webhook:', webhookErr);
        // Non-fatal — user can still use the web app
      }
    } else {
      // Update session token for returning user
      user = await db.user.update({
        where: { id: user.id },
        data: {
          sessionToken: generateSessionToken(),
          botUsername,
        },
      });

      // Re-set webhook in case it was lost
      const webhookSecret = user.id;
      try {
        const webhookUrl = `https://ats-jobs.space-z.ai/api/telegram/webhook`;
        await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}&secret_token=${webhookSecret}`, {
          method: 'POST',
        });
      } catch {}
    }

    // Set session cookie
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, botUsername },
      isNewUser,
    });

    const cookieStore = await cookies();
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
