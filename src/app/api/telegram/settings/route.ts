/**
 * /api/telegram/settings
 *
 * GET: return current Telegram bot settings (token masked)
 * PATCH: save/update Telegram bot token + test connection
 *   Body: { action: 'save' | 'test' | 'activate' | 'deactivate', botToken?, defaultPersona? }
 * DELETE: remove Telegram bot integration
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

// GET — return current Telegram bot config
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated. Please login.' }, { status: 401 });
    const profile = await getCurrentProfile(user.id);

    if (!bot) return NextResponse.json({ bot: null });

    return NextResponse.json({
      bot: {
        id: bot.id,
        botToken: maskToken(bot.botToken),
        botUsername: bot.botUsername,
        chatId: bot.chatId,
        isActive: bot.isActive,
        defaultPersona: bot.defaultPersona,
        lastMessageAt: bot.lastMessageAt,
        hasToken: true,
      },
    });
  } catch (err: any) {
    console.error('Telegram GET error:', err);
    return NextResponse.json({ error: 'Failed to load settings.', detail: err?.message }, { status: 500 });
  }
}

// PATCH — save token, test connection, activate/deactivate
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action: string = body.action || 'save';

    const profile = await db.profile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!profile) {
      return NextResponse.json({ error: 'No profile found. Upload your resume first.' }, { status: 404 });
    }

    // ─── Test connection ──────────────────────────────────────────────
    if (action === 'test') {
      const existing = await db.telegramBot.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'No bot token saved yet.' }, { status: 400 });
      }
      return testBotConnection(existing.botToken);
    }

    // ─── Activate / Deactivate ────────────────────────────────────────
    if (action === 'activate' || action === 'deactivate') {
      const existing = await db.telegramBot.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!existing) {
        return NextResponse.json({ error: 'No bot configured.' }, { status: 404 });
      }
      await db.telegramBot.update({
        where: { id: existing.id },
        data: { isActive: action === 'activate' },
      });
      return NextResponse.json({ ok: true, isActive: action === 'activate' });
    }

    // ─── Save token ───────────────────────────────────────────────────
    if (action === 'save') {
      const botToken: string = body.botToken?.trim();
      if (!botToken || !botToken.includes(':')) {
        return NextResponse.json({ error: 'Invalid bot token. Format: 123456:ABC-DEF...' }, { status: 400 });
      }

      // Don't save if it's just the masked version
      if (botToken.includes('••••')) {
        return NextResponse.json({ ok: true, message: 'Token unchanged (masked).' });
      }

      // Test the token first
      const testResult = await testBotConnection(botToken);
      if (!testResult.ok) {
        return NextResponse.json(testResult, { status: 400 });
      }

      // Get bot info
      const botInfo = await getBotInfo(botToken);

      // Upsert
      const existing = await db.telegramBot.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      let bot;
      if (existing) {
        bot = await db.telegramBot.update({
          where: { id: existing.id },
          data: {
            botToken,
            botUsername: botInfo.username,
            isActive: true,
            defaultPersona: body.defaultPersona || existing.defaultPersona,
          },
        });
      } else {
        bot = await db.telegramBot.create({
          data: {
            userId: user.id,
            botToken,
            botUsername: botInfo.username,
            isActive: true,
            defaultPersona: body.defaultPersona || 'recruiter',
          },
        });
      }

      // Set webhook
      await setWebhook(botToken);

      return NextResponse.json({
        ok: true,
        message: `Bot @${botInfo.username} connected! Send a message to your bot on Telegram to start chatting with your HR assistant.`,
        botUsername: botInfo.username,
      });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Telegram PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update settings.', detail: err?.message }, { status: 500 });
  }
}

// DELETE — remove bot
export async function DELETE() {
  try {
    const profile = await db.profile.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (!profile) return NextResponse.json({ ok: true });

    const bot = await db.telegramBot.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (bot) {
      // Delete webhook before removing
      try {
        await fetch(`https://api.telegram.org/bot${bot.botToken}/deleteWebhook`);
      } catch {}
      await db.telegramBot.delete({ where: { id: bot.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove bot.', detail: err?.message }, { status: 500 });
  }
}

// ─── Helper functions ──────────────────────────────────────────────────────

async function testBotConnection(token: string): Promise<{ ok: boolean; botUsername?: string; error?: string; message?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return {
        ok: true,
        botUsername: data.result.username,
        message: `Connected to @${data.result.username}!`,
      };
    }
    return { ok: false, error: data.description || 'Invalid token' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

async function getBotInfo(token: string): Promise<{ id: number; username: string; firstName: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  return {
    id: data.result.id,
    username: data.result.username,
    firstName: data.result.first_name,
  };
}

async function setWebhook(token: string): Promise<void> {
  // Get the public URL — we can't know it for sure, so we use long polling fallback
  // The webhook URL would be: https://ats-jobs.space-z.ai/api/telegram/webhook
  // But we need the user to have a public URL. For now, we just try.
  const webhookUrl = `https://ats-jobs.space-z.ai/api/telegram/webhook`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
  } catch {
    // If webhook fails, the bot can still work with getUpdates (polling)
  }
}

function maskToken(token: string): string {
  if (!token || token.length < 10) return '••••••••';
  const parts = token.split(':');
  if (parts.length === 2) {
    return parts[0] + ':••••••••••••••••';
  }
  return '••••••••';
}
