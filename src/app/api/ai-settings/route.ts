/**
 * /api/ai-settings
 *
 * GET: return current AI provider config (mask sensitive fields)
 * PATCH: update the AI provider config (write to .z-ai-config file)
 *
 * The config is stored at /etc/.z-ai-config (system-level, read-only for the app)
 * or ./z-ai-config (project-level, writable).
 *
 * For this sandbox, we read from /etc/.z-ai-config and write to ./z-ai-config
 * (project-level override). The SDK checks project dir first, then home, then system.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 10;

const SYSTEM_CONFIG_PATH = '/etc/.z-ai-config';
const PROJECT_CONFIG_PATH = join(process.cwd(), '.z-ai-config');
const HOME_CONFIG_PATH = join(process.env.HOME || '/home/z', '.z-ai-config');

interface AIConfig {
  baseUrl?: string;
  apiKey?: string;
  chatId?: string;
  userId?: string;
  token?: string;
}

async function readConfig(): Promise<{ config: AIConfig; source: string }> {
  // Check project-level first, then home, then system
  const paths = [
    { path: PROJECT_CONFIG_PATH, source: 'project' },
    { path: HOME_CONFIG_PATH, source: 'home' },
    { path: SYSTEM_CONFIG_PATH, source: 'system' },
  ];

  for (const { path, source } of paths) {
    try {
      if (existsSync(path)) {
        const raw = await readFile(path, 'utf-8');
        const config = JSON.parse(raw);
        return { config, source };
      }
    } catch {
      // Continue to next path
    }
  }

  return { config: {}, source: 'none' };
}

// GET — return current config with masked sensitive fields
export async function GET() {
  try {
    const { config, source } = await readConfig();

    // Mask sensitive fields for display
    const masked: AIConfig = {
      baseUrl: config.baseUrl || '',
      apiKey: config.apiKey ? maskString(config.apiKey) : '',
      chatId: config.chatId || '',
      userId: config.userId || '',
      token: config.token ? maskString(config.token) : '',
    };

    // Determine provider from baseUrl
    const provider = detectProvider(config.baseUrl || '');

    return NextResponse.json({
      config: masked,
      hasApiKey: !!config.apiKey,
      hasToken: !!config.token,
      source,
      provider,
      modelUsed: 'glm-4.6', // default model used by the SDK
    });
  } catch (err: any) {
    console.error('AI settings GET error:', err);
    return NextResponse.json(
      { error: 'Failed to read AI settings.', detail: err?.message },
      { status: 500 }
    );
  }
}

// PATCH — update the AI provider config
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { config: newConfig, action } = body;

    if (action === 'test') {
      // Test the current config by making a simple API call
      return testConnection();
    }

    if (!newConfig) {
      return NextResponse.json({ error: 'No config provided.' }, { status: 400 });
    }

    // Read existing config (from any source)
    const { config: existing } = await readConfig();

    // Merge: only update fields that are provided and not masked
    const merged: AIConfig = {
      baseUrl: newConfig.baseUrl || existing.baseUrl,
      apiKey: unmaskOrKeep(newConfig.apiKey, existing.apiKey),
      chatId: newConfig.chatId || existing.chatId,
      userId: newConfig.userId || existing.userId,
      token: unmaskOrKeep(newConfig.token, existing.token),
    };

    // Write to project-level config
    await mkdir(process.cwd(), { recursive: true });
    await writeFile(PROJECT_CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');

    return NextResponse.json({
      ok: true,
      message: 'AI provider settings updated. The changes will take effect on the next API call.',
      provider: detectProvider(merged.baseUrl || ''),
    });
  } catch (err: any) {
    console.error('AI settings PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update AI settings.', detail: err?.message },
      { status: 500 }
    );
  }
}

async function testConnection() {
  try {
    // Dynamically import the SDK to test the connection
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'user', content: 'Reply with exactly: OK' },
      ],
      thinking: { type: 'disabled' },
    });

    const reply = completion.choices?.[0]?.message?.content || '';
    return NextResponse.json({
      ok: true,
      reply: reply.substring(0, 100),
      message: 'Connection successful! The AI provider is working.',
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message || 'Connection failed',
      message: 'Failed to connect to the AI provider. Check your baseUrl and apiKey.',
    }, { status: 502 });
  }
}

function detectProvider(baseUrl: string): string {
  if (!baseUrl) return 'unknown';
  const url = baseUrl.toLowerCase();
  if (url.includes('z.ai') || url.includes('chatglm')) return 'Z.ai GLM';
  if (url.includes('openai.com')) return 'OpenAI';
  if (url.includes('anthropic.com')) return 'Anthropic';
  if (url.includes('googleapis.com') || url.includes('gemini')) return 'Google Gemini';
  if (url.includes('cohere.ai')) return 'Cohere';
  if (url.includes('mistral.ai')) return 'Mistral AI';
  if (url.includes('together.ai')) return 'Together AI';
  if (url.includes('groq.com')) return 'Groq';
  if (url.includes('fireworks.ai')) return 'Fireworks AI';
  if (url.includes('deepseek.com')) return 'DeepSeek';
  if (url.includes('perplexity.ai')) return 'Perplexity';
  return 'Custom';
}

function maskString(s: string): string {
  if (!s || s.length <= 8) return '••••••••';
  return s.substring(0, 4) + '••••••••' + s.substring(s.length - 4);
}

function unmaskOrKeep(newValue: string | undefined, existingValue: string | undefined): string | undefined {
  // If the new value contains •••• (masked), keep the existing value
  if (!newValue || newValue.includes('••••')) return existingValue;
  return newValue;
}
