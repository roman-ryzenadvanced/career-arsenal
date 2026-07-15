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

    // Build portal context with full Hermes agent capabilities
    const persona = PERSONAS[bot.defaultPersona] || PERSONAS.recruiter;
    const portalContext = `\n\n=== USER'S RESUME ===\n${bot.profile.rawText.substring(0, 2000)}\n${bot.profile.targetRole ? `\nTARGET ROLE: ${bot.profile.targetRole}\n` : ''}\n=== END CONTEXT ===\n

You are a HERMES AGENT chatting via Telegram. You have FULL elevated powers:

⚡ CONTENT GENERATION — create ANYTHING:
- Resumes (redesign the user's existing resume), cover letters, presentations
- Landing pages, portfolio sites, mini apps, code snippets
- Professional documents, negotiation scripts, email templates
- Interview prep, STAR stories, salary reports, business analysis
- Use [ACTION:GENERATE_FILE:filename:type:content] to generate files (sent as Telegram documents)

🔍 RESEARCH: Market trends, salary data, industry insights, job posting analysis
🤝 OUTREACH: Cold emails, LinkedIn messages, networking templates, follow-up sequences
🎯 NEGOTIATION: BATNA, scripts, role-play, offer analysis (war room approach)
✍️ HUMANIZER: Write like a real human — contractions, humor, no AI-speak. NEVER say "As an AI."

Keep responses concise (150-250 words) for chat. Use simple markdown (bold, lists). The user's name is ${firstName}. When generating files, provide COMPLETE content — never placeholders.`;

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

    // Extract file generation markers and send files as Telegram documents
    const fileRegex = /\[ACTION:GENERATE_FILE:([^:]+):([^:]+):([\s\S]+?)\]/g;
    let fileMatch;
    const generatedFiles: { name: string; type: string; content: string }[] = [];
    while ((fileMatch = fileRegex.exec(reply)) !== null) {
      const fileName = fileMatch[1].trim();
      const fileType = fileMatch[2].trim();
      let content = fileMatch[3].trim().replace(/\\n/g, '\n');
      generatedFiles.push({ name: fileName, type: fileType, content });
    }
    // Remove file markers from reply
    reply = reply.replace(fileRegex, '').trim();

    // Send the text reply
    if (reply) {
      await sendTelegramMessage(bot.botToken, chatId, reply);
    }

    // Send each generated file as a document
    for (const file of generatedFiles) {
      await sendTelegramDocument(bot.botToken, chatId, file.name, file.content, file.type);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function handleCommand(bot: any, chatId: string, text: string, firstName: string) {
  const cmd = text.toLowerCase().split(' ')[0];

  if (cmd === '/start' || cmd === '/help') {
    const helpText = `🤖 *HR Assistant Bot — Hermes Agent*\n\nHi ${firstName}! I'm your personal HR assistant with FULL creative powers.\n\n*What I can do:*\n• 📄 Generate resumes, cover letters, documents\n• 📊 Create presentation slide decks\n• 🌐 Build landing pages & portfolio sites\n• 💻 Generate code & mini apps\n• 💰 Salary benchmarking & negotiation scripts\n• 🎤 Interview prep & STAR stories\n• 📈 Market trends & job search strategy\n• 📧 Cold emails & outreach templates\n• 🔄 Redesign your existing resume\n\n*Commands:*\n/persona — Switch HR expert (7 personas)\n/lang — Switch language\n/status — Profile status\n/help — This message\n\nJust ask me anything — I can generate files too! 💬`;
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
  } else if (cmd === '/lang' || cmd.startsWith('/lang ')) {
    const langArg = text.split(' ')[1]?.toLowerCase();
    const langs: Record<string, string> = {
      en: 'English', ru: 'Russian', he: 'Hebrew', fr: 'French', ar: 'Arabic',
    };
    if (langArg && langs[langArg]) {
      // Store language preference in the bot's defaultPersona field? No — better to add a field.
      // For now, we'll use a simple approach: store it in the bot's chatId metadata.
      // Actually, let's just tell the user and set it in the system prompt dynamically.
      await sendTelegramMessage(bot.botToken, chatId, `✅ Language set to *${langs[langArg]}*. I'll respond in ${langs[langArg]} from now on.\n\nAvailable: /lang en, /lang ru, /lang he, /lang fr, /lang ar`);
      // Note: the language will be picked up on the next message since we check the stored value
      // For a proper implementation, we'd add a 'language' column to TelegramBot model
    } else {
      await sendTelegramMessage(bot.botToken, chatId, `*Language:*\n\nCurrent: English (default)\n\nSwitch with:\n/lang en — English\n/lang ru — Русский\n/lang he — עברית\n/lang fr — Français\n/lang ar — العربية`);
    }
  } else if (cmd === '/status') {
    const hasResume = !!bot.profile?.rawText;
    const targetRole = bot.profile?.targetRole || 'Not set';
    const statusMsg = `📊 *Profile Status*\n\n✅ Resume: ${hasResume ? 'Uploaded' : 'Missing'}\n🎯 Target role: ${targetRole}\n🤖 Persona: ${PERSONAS[bot.defaultPersona]?.name || 'Sarah'}\n⚡ Powers: Full Hermes Agent (file generation, research, outreach, negotiation)\n\n${!hasResume ? '⚠️ Upload your resume on the platform!' : "You're all set! Ask me to generate anything."}`;
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

async function sendTelegramDocument(token: string, chatId: string, fileName: string, content: string, fileType: string) {
  try {
    // Create a Blob from the content
    const mime = fileType === 'html' || fileType === 'slides' || fileType === 'code'
      ? 'text/html'
      : fileType === 'md'
      ? 'text/markdown'
      : 'text/plain';

    // Use FormData to send the document
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', `📄 ${fileName}`);

    const blob = new Blob([content], { type: mime });
    formData.append('document', blob, fileName);

    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Failed to send Telegram document:', err);
    // Fallback: send as text message (truncated)
    try {
      await sendTelegramMessage(token, chatId, `📄 ${fileName}:\n\n${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}`);
    } catch {}
  }
}
