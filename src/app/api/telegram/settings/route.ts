/**
 * /api/telegram/settings
 *
 * GET: return current Telegram bot settings + paired status
 * PATCH: save/update Telegram bot token + test connection + activate/deactivate
 * DELETE: remove Telegram bot integration
 *
 * Does NOT require a Profile — the bot is linked to the User, not the Profile.
 * The bot works once the user uploads a resume (the webhook looks up the profile by userId).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const maxDuration = 30;

// GET — return current Telegram bot config + paired status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const bot = await db.telegramBot.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!bot) return NextResponse.json({ bot: null, paired: false });

    // Check if the webhook is actually set by querying Telegram
    let webhookActive = false;
    try {
      const whRes = await fetch(`https://api.telegram.org/bot${bot.botToken}/getWebhookInfo`);
      const whData = await whRes.json();
      if (whData.ok && whData.result.url) {
        webhookActive = true;
      }
    } catch {}

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
      paired: bot.isActive && webhookActive,
      webhookActive,
    });
  } catch (err: any) {
    console.error('Telegram GET error:', err);
    return NextResponse.json({ error: 'Failed to load settings.', detail: err?.message }, { status: 500 });
  }
}

// PATCH — save token, test connection, activate/deactivate
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const body = await req.json();
    const action: string = body.action || 'save';

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

      // Re-set or delete webhook
      if (action === 'activate') {
        await setWebhook(existing.botToken, user.id);
      } else {
        await fetch(`https://api.telegram.org/bot${existing.botToken}/deleteWebhook`);
      }

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

      // Upsert — find existing by userId (not by token, since token might change)
      const existing = await db.telegramBot.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      let bot;
      if (existing) {
        // Delete old webhook if token changed
        if (existing.botToken !== botToken) {
          try {
            await fetch(`https://api.telegram.org/bot${existing.botToken}/deleteWebhook`);
          } catch {}
        }
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

      // Also update the User's botToken if it changed
      await db.user.update({
        where: { id: user.id },
        data: { botToken, botUsername: botInfo.username },
      });

      // Set webhook with secret_token = userId
      await setWebhook(botToken, user.id);

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
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const bot = await db.telegramBot.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (bot) {
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

async function setWebhook(token: string, userId: string): Promise<void> {
  const webhookUrl = `https://ats-jobs.space-z.ai/api/telegram/webhook`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: userId,
      }),
    });
    const data = await res.json();
    console.log(`Webhook set result for user ${userId}:`, data.ok, data.description || '');
  } catch (err) {
    console.error('Failed to set webhook:', err);
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
