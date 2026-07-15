/**
 * POST /api/telegram/webhook
 *
 * Receives messages from Telegram (via webhook) and responds using the
 * portal-aware HR chat personas. The bot reads the user's resume and
 * portal context, just like the in-app HR chat.
 *
 * Telegram sends: { message: { chat: { id }, text, from: { first_name } } }
 * We respond via: https://api.telegram.org/bot{token}/sendMessage
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Persona system prompts (same as hr-chat route)
const PERSONAS: Record<string, { name: string; systemPrompt: string }> = {
  recruiter: {
    name: 'Sarah',
    systemPrompt: 'You are Sarah, a senior technical recruiter with 15+ years of experience. Be practical, honest, and concise (150-250 words). Use markdown. You have access to the user\'s resume — reference specific details when giving advice.',
  },
  compensation: {
    name: 'Marcus',
    systemPrompt: 'You are Marcus, a compensation expert. Be data-driven. Provide realistic ranges. Keep responses concise. You have access to the user\'s resume.',
  },
  career_coach: {
    name: 'Dr. Priya',
    systemPrompt: 'You are Dr. Priya, a career coach with a PhD in Organizational Psychology. Be empathetic and actionable. You have access to the user\'s resume.',
  },
  hr_legal: {
    name: 'James',
    systemPrompt: 'You are James, an employment law specialist. Provide general guidance, not formal legal advice. You have access to the user\'s resume.',
  },
  culture: {
    name: 'Elena',
    systemPrompt: 'You are Elena, a culture consultant. Be observant and specific. You have access to the user\'s resume.',
  },
  founder: {
    name: 'Alex',
    systemPrompt: 'You are Alex, a serial founder. Be direct and honest about startup risk. You have access to the user\'s resume.',
  },
};

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Telegram sends updates — we only handle text messages
    const message = update.message || update.edited_message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const firstName = message.from?.first_name || 'there';

    // Find the bot by looking up all active bots with a profile
    // In multi-user mode, each user has their own bot — we need to match the incoming
    // message to the right user. Telegram doesn't send the bot token in the webhook payload,
    // so we match by checking which bot has this chatId, or fall back to the most recent.
    const bots = await db.telegramBot.findMany({
      where: { isActive: true, profileId: { not: null } },
      include: { profile: true, user: true },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (bots.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // For single-user demo: use the first (most recent) bot
    const bot = bots[0];
    if (!bot?.profile?.rawText) {
      // No profile — send a message telling them to upload a resume
      await sendTelegramMessage(bot.botToken, chatId, 
        `Hi ${firstName}! I'm your HR assistant bot. Please upload your resume on the web platform first, then come back and ask me anything! 📄\n\nPlatform: https://ats-jobs.space-z.ai`
      );
      return NextResponse.json({ ok: true });
    }

    // Handle commands
    if (text.startsWith('/')) {
      return handleCommand(bot, chatId, text, firstName);
    }

    // Save/update chatId if not set
    if (!bot.chatId) {
      await db.telegramBot.update({
        where: { id: bot.id },
        data: { chatId },
      });
    }

    // Update last message time
    await db.telegramBot.update({
      where: { id: bot.id },
      data: { lastMessageAt: new Date() },
    });

    // Send "typing" indicator
    await sendChatAction(bot.botToken, chatId, 'typing');

    // Build portal context
    const persona = PERSONAS[bot.defaultPersona] || PERSONAS.recruiter;
    const portalContext = `\n\n=== USER'S RESUME ===\n${bot.profile.rawText.substring(0, 2000)}\n${bot.profile.targetRole ? `\nTARGET ROLE: ${bot.profile.targetRole}\n` : ''}\n=== END CONTEXT ===\n\nYou are chatting via Telegram. Keep responses concise (150-250 words) since this is a chat interface. Use simple markdown (bold, lists) — no tables or complex formatting. The user's name is ${firstName}.`;

    // Call GLM
    let reply = '';
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: persona.systemPrompt + portalContext },
          { role: 'user', content: text },
        ],
        thinking: { type: 'disabled' },
      });
      reply = completion.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again.';
    } catch (llmErr) {
      console.error('Telegram GLM call failed:', llmErr);
      reply = 'Sorry, I\'m having trouble connecting to my AI brain right now. Please try again in a moment. 🤖';
    }

    // Send the reply via Telegram
    await sendTelegramMessage(bot.botToken, chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function handleCommand(bot: any, chatId: string, text: string, firstName: string) {
  const cmd = text.toLowerCase().split(' ')[0];

  if (cmd === '/start' || cmd === '/help') {
    const helpText = `🤖 *HR Assistant Bot*\n\nHi ${firstName}! I'm your personal HR assistant powered by AI.\n\n*I can help you with:*\n• Resume review and tips\n• Salary benchmarking\n• Interview preparation\n• Career coaching\n• Job search strategy\n• Company culture assessment\n• Employment contract questions\n\n*Commands:*\n/persona — Switch HR expert persona\n/status — Check your profile status\n/help — Show this help message\n\nJust ask me anything in natural language! 💬`;
    await sendTelegramMessage(bot.botToken, chatId, helpText);
  } else if (cmd === '/persona') {
    const personas = Object.entries(PERSONAS).map(([id, p]) => `• /persona\\_${id.replace(/_/g, '_')} — ${p.name}`).join('\n');
    await sendTelegramMessage(bot.botToken, chatId, `*Switch persona:*\n\n${personas}\n\nCurrent: ${PERSONAS[bot.defaultPersona]?.name || 'Sarah'}`);
  } else if (cmd.startsWith('/persona_')) {
    const personaId = cmd.replace('/persona_', '');
    if (PERSONAS[personaId]) {
      await db.telegramBot.update({
        where: { id: bot.id },
        data: { defaultPersona: personaId },
      });
      await sendTelegramMessage(bot.botToken, chatId, `✅ Switched to *${PERSONAS[personaId].name}*! Ask me anything.`);
    } else {
      await sendTelegramMessage(bot.botToken, chatId, '❌ Unknown persona. Use /persona to see options.');
    }
  } else if (cmd === '/status') {
    const hasResume = !!bot.profile?.rawText;
    const targetRole = bot.profile?.targetRole || 'Not set';
    const statusMsg = `📊 *Your Profile Status*\n\n✅ Resume: ${hasResume ? 'Uploaded' : 'Missing'}\n🎯 Target role: ${targetRole}\n🤖 Active persona: ${PERSONAS[bot.defaultPersona]?.name || 'Sarah'}\n\n${!hasResume ? '⚠️ Upload your resume on the platform to get personalized advice!' : "You're all set! Ask me anything."}`;
    await sendTelegramMessage(bot.botToken, chatId, statusMsg);
  } else {
    await sendTelegramMessage(bot.botToken, chatId, 'Unknown command. Use /help to see available commands.');
  }

  return NextResponse.json({ ok: true });
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

async function sendChatAction(token: string, chatId: string, action: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {}
}
