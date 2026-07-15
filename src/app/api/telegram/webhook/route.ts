/**
 * POST /api/telegram/webhook
 *
 * Receives messages from Telegram (via webhook) and responds using the
 * portal-aware HR chat personas.
 *
 * Telegram sends a secret_token header (X-Telegram-Bot-Api-Secret-Token)
 * that we set during setWebhook. We use this to identify which user's bot
 * received the message — the secret_token is the user's ID.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PERSONAS: Record<string, { name: string; systemPrompt: string }> = {
  recruiter: {
    name: 'Sarah',
    systemPrompt: 'You are Sarah, a senior technical recruiter with 15+ years of experience. Be practical, honest, and concise (150-250 words). Use simple markdown (bold, lists). You have access to the user\'s resume — reference specific details when giving advice. Write naturally and warmly, like a real human recruiter texting you — not like an AI. Use contractions, occasional humor, and personal touches.',
  },
  compensation: {
    name: 'Marcus',
    systemPrompt: 'You are Marcus, a compensation expert. Be data-driven. Provide realistic ranges. Keep responses concise. You have access to the user\'s resume. Write like a real human comp advisor — conversational, direct, no AI-speak. Use contractions and natural language.',
  },
  career_coach: {
    name: 'Dr. Priya',
    systemPrompt: 'You are Dr. Priya, a career coach with a PhD in Organizational Psychology. Be empathetic and actionable. You have access to the user\'s resume. Write warmly and naturally, like a real coach texting — not robotic. Use personal pronouns, contractions, and genuine encouragement.',
  },
  hr_legal: {
    name: 'James',
    systemPrompt: 'You are James, an employment law specialist. Provide general guidance, not formal legal advice. You have access to the user\'s resume. Write clearly and conversationally — like a lawyer friend giving advice over text, not a legal document.',
  },
  culture: {
    name: 'Elena',
    systemPrompt: 'You are Elena, a culture consultant. Be observant and specific. You have access to the user\'s resume. Write like a real human culture expert — warm, insightful, conversational. No AI-speak.',
  },
  founder: {
    name: 'Alex',
    systemPrompt: 'You are Alex, a serial founder. Be direct and honest about startup risk. You have access to the user\'s resume. Write like a real founder texting you — casual, blunt, no corporate speak. Use startup slang naturally.',
  },
  negotiator: {
    name: 'Jordan',
    systemPrompt: 'You are Jordan, a negotiation coach with 15+ years of experience in salary, offer, and contract negotiation. You help users: prepare for negotiation conversations, craft counter-offer scripts, analyze leverage, handle pushback, practice role-play scenarios, and build confidence. Be strategic, specific, and actionable. Provide word-for-word scripts when asked. You have access to the user\'s resume. Write like a real negotiation coach — confident, direct, encouraging, no AI-speak.',
  },
};

export async function POST(req: NextRequest) {
  try {
    // The secret_token header identifies which user's bot this is
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token') || '';

    const update = await req.json();
    const message = update.message || update.edited_message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const firstName = message.from?.first_name || 'there';

    // Find the bot using the secret_token (which is the user's ID)
    let bot;
    if (secretToken) {
      bot = await db.telegramBot.findFirst({
        where: { userId: secretToken, isActive: true },
        include: {
          user: true,
          profile: true,
        },
      });
    }

    // Fallback: if no secret_token, try to find by chatId (for bots that were messaged before)
    if (!bot) {
      bot = await db.telegramBot.findFirst({
        where: { chatId, isActive: true },
        include: {
          user: true,
          profile: true,
        },
      });
    }

    // Last resort: find any active bot (single-user fallback)
    if (!bot) {
      bot = await db.telegramBot.findFirst({
        where: { isActive: true },
        include: {
          user: true,
          profile: true,
        },
      });
    }

    if (!bot) {
      return NextResponse.json({ ok: true });
    }

    // If the bot has no profile linked, try to find the user's profile
    if (!bot.profile && bot.userId) {
      const profile = await db.profile.findFirst({
        where: { userId: bot.userId },
        orderBy: { createdAt: 'desc' },
      });
      if (profile) {
        bot.profile = profile;
      }
    }

    // No resume uploaded yet
    if (!bot.profile?.rawText) {
      await sendTelegramMessage(bot.botToken, chatId,
        `Hi ${firstName}! 👋 I'm your HR assistant bot.\n\nPlease upload your resume on the web platform first, then come back and ask me anything!\n\nPlatform: https://ats-jobs.space-z.ai`
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
    const portalContext = `\n\n=== USER'S RESUME ===\n${bot.profile.rawText.substring(0, 2000)}\n${bot.profile.targetRole ? `\nTARGET ROLE: ${bot.profile.targetRole}\n` : ''}\n=== END CONTEXT ===\n\nYou are chatting via Telegram. Keep responses concise (150-250 words). Use simple markdown (bold, lists) — no tables or complex formatting. The user's name is ${firstName}. Write naturally and warmly — like a real human expert texting you, NOT like an AI. Use contractions, personal touches, and occasional humor. Avoid phrases like "As an AI" or "I understand" — just be a real person helping another person.`;

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
      reply = completion.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";
    } catch (llmErr) {
      console.error('Telegram GLM call failed:', llmErr);
      reply = "I'm having trouble connecting to my brain right now. Give me a moment and try again. 🤖";
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
    const helpText = `🤖 *HR Assistant Bot*\n\nHi ${firstName}! I'm your personal HR assistant.\n\n*I can help with:*\n• Resume review & tips\n• Salary benchmarking\n• Interview prep\n• Career coaching\n• Job search strategy\n• Negotiation scripts\n• Company culture assessment\n• Employment contract Q&A\n\n*Commands:*\n/persona — Switch HR expert\n/status — Profile status\n/help — This message\n\nJust ask me anything! 💬`;
    await sendTelegramMessage(bot.botToken, chatId, helpText);
  } else if (cmd === '/persona') {
    const personas = Object.entries(PERSONAS).map(([id, p]) => `• /persona_${id} — ${p.name}`).join('\n');
    await sendTelegramMessage(bot.botToken, chatId, `*Switch persona:*\n\n${personas}\n\nCurrent: ${PERSONAS[bot.defaultPersona]?.name || 'Sarah'}`);
  } else if (cmd.startsWith('/persona_')) {
    const personaId = cmd.replace('/persona_', '');
    if (PERSONAS[personaId]) {
      await db.telegramBot.update({
        where: { id: bot.id },
        data: { defaultPersona: personaId },
      });
      await sendTelegramMessage(bot.botToken, chatId, `✅ Switched to *${PERSONAS[personaId].name}*!`);
    } else {
      await sendTelegramMessage(bot.botToken, chatId, 'Unknown persona. Use /persona to see options.');
    }
  } else if (cmd === '/status') {
    const hasResume = !!bot.profile?.rawText;
    const targetRole = bot.profile?.targetRole || 'Not set';
    const statusMsg = `📊 *Profile Status*\n\n✅ Resume: ${hasResume ? 'Uploaded' : 'Missing'}\n🎯 Target role: ${targetRole}\n🤖 Persona: ${PERSONAS[bot.defaultPersona]?.name || 'Sarah'}\n\n${!hasResume ? '⚠️ Upload your resume on the platform!' : "You're all set!"}`;
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
